// @ts-nocheck
// supabase/functions/whatsapp-webhook/index.ts
// Meta WhatsApp Cloud API Webhook — receives incoming messages
// NOTE: WhatsApp channel is NOT currently in use - this webhook gracefully handles being disabled

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

// Environment variables - validated at request time, not module load
const getEnv = (key: string): string | undefined => Deno.env.get(key)

serve(async (req: Request) => {
    // ─── Validate Environment Variables ───────────────────────────────
    const verifyToken = getEnv('META_WEBHOOK_VERIFY_TOKEN')
    const metaToken = getEnv('META_WHATSAPP_TOKEN')
    const groqApiKey = getEnv('GROQ_API_KEY')
    const supabaseUrl = getEnv('SUPABASE_URL')
    const supabaseServiceKey = getEnv('SUPABASE_SERVICE_ROLE_KEY')

    // If WhatsApp is not configured, return a graceful disabled response
    if (!verifyToken || !metaToken || !groqApiKey || !supabaseUrl || !supabaseServiceKey) {
        console.log('[Webhook] WhatsApp integration is disabled. Missing required environment variables.')
        return new Response(JSON.stringify({
            status: 'disabled',
            message: 'WhatsApp webhook is not configured. This channel is currently unused.'
        }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
        })
    }

    // Create Supabase client inside the handler to ensure env vars are available
    const supabase = createClient(supabaseUrl, supabaseServiceKey)
    const url = new URL(req.url)

    // ─── GET: Webhook Verification ───────────────────────────────
    if (req.method === 'GET') {
        const mode = url.searchParams.get('hub.mode')
        const token = url.searchParams.get('hub.verify_token')
        const challenge = url.searchParams.get('hub.challenge')

        if (mode === 'subscribe' && token === verifyToken) {
            console.log('[Webhook] Verification successful')
            return new Response(challenge, { status: 200 })
        }
        return new Response('Forbidden', { status: 403 })
    }

    // ─── POST: Incoming Messages ─────────────────────────────────
    if (req.method === 'POST') {
        // Step 1: Parse body, then return 200 IMMEDIATELY
        let body: any
        try {
            body = await req.json()
        } catch {
            return new Response(JSON.stringify({ status: 'ok' }), { status: 200 })
        }

        // Fire-and-forget: process asynchronously after returning 200
        // Deno doesn't cancel the isolate until all promises settle
        const processPromise = processWebhook(body, supabase, metaToken, groqApiKey).catch(err => {
            console.error('[Webhook] Async processing error:', err)
        })

        // Return 200 immediately — Meta requires this within 3 seconds
        // We hold the connection open via EdgeRuntime.waitUntil if available,
        // otherwise we rely on Deno's implicit promise tracking
        try {
            // @ts-ignore — Supabase Edge Functions support this
            EdgeRuntime.waitUntil(processPromise)
        } catch {
            // Fallback: Deno will keep the isolate alive until processPromise settles
        }

        return new Response(JSON.stringify({ status: 'ok' }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
        })
    }

    return new Response('Method not allowed', { status: 405 })
})

// ─────────────────────────────────────────────────────────────────
// Async processing pipeline — runs AFTER 200 is returned to Meta
// ─────────────────────────────────────────────────────────────────
async function processWebhook(body: any, supabase: any, metaToken: string, groqApiKey: string): Promise<void> {
    if (body.object !== 'whatsapp_business_account') {
        console.log('[Webhook] Not a WhatsApp event, ignoring')
        return
    }

    for (const entry of body.entry || []) {
        for (const change of entry.changes || []) {
            const value = change.value
            if (!value?.messages?.length) continue

            // Step 3: Extract metadata
            const phoneNumberId = value.metadata?.phone_number_id
            if (!phoneNumberId) {
                console.error('[Webhook] No phone_number_id in metadata')
                continue
            }

            for (const msg of value.messages) {
                try {
                    await processMessage(supabase, phoneNumberId, value, msg, metaToken, groqApiKey)
                } catch (err: any) {
                    console.error(`[Webhook] Failed to process message ${msg.id}:`, err.message)
                }
            }
        }
    }
}

async function processMessage(
    supabase: any,
    phoneNumberId: string,
    value: any,
    msg: any,
    metaToken: string,
    groqApiKey: string
): Promise<void> {
    const fromPhone = msg.from
    const messageId = msg.id // wamid.xxx
    const customerName = value.contacts?.[0]?.profile?.name || 'Customer'

    console.log(`[Webhook] Processing message ${messageId} from ${fromPhone}`)

    // Step 4: DEDUPLICATION — check if wamid already exists
    const { data: existingMsg } = await supabase
        .from('messages')
        .select('id')
        .eq('provider_message_id', messageId)
        .maybeSingle()

    if (existingMsg) {
        console.log(`[Webhook] Duplicate wamid ${messageId} — skipping`)
        return
    }

    // Step 5: Look up workspace by phone_number_id
    const { data: connection } = await supabase
        .from('whatsapp_connections')
        .select('workspace_id')
        .eq('phone_number_id', phoneNumberId)
        .eq('connected', true)
        .maybeSingle()

    if (!connection) {
        console.error(`[Webhook] No workspace found for phone_number_id: ${phoneNumberId}`)
        // Log to audit
        await supabase.from('audit_logs').insert({
            action: 'webhook_no_workspace',
            metadata: { phone_number_id: phoneNumberId, from: fromPhone }
        }).catch(() => { }) // best-effort
        return
    }

    const workspaceId = connection.workspace_id

    // Step 6: Rate limiting check
    const isRateLimited = await checkRateLimit(supabase, fromPhone)
    if (isRateLimited) {
        console.log(`[Webhook] Rate limited: ${fromPhone}`)
        return
    }

    // Step 7: Look up or create contact
    let { data: contact } = await supabase
        .from('contacts')
        .select('id')
        .eq('workspace_id', workspaceId)
        .eq('phone', fromPhone)
        .maybeSingle()

    if (!contact) {
        const { data: newContact } = await supabase
            .from('contacts')
            .insert({
                workspace_id: workspaceId,
                phone: fromPhone,
                name: customerName,
                channel: 'whatsapp'
            })
            .select('id')
            .single()
        contact = newContact
    }

    if (!contact) {
        console.error('[Webhook] Failed to create contact')
        return
    }

    // Step 8: Look up or create conversation
    let { data: conversation } = await supabase
        .from('conversations')
        .select('id')
        .eq('workspace_id', workspaceId)
        .eq('contact_id', contact.id)
        .in('status', ['todo', 'doing'])
        .maybeSingle()

    if (!conversation) {
        const { data: newConv } = await supabase
            .from('conversations')
            .insert({
                workspace_id: workspaceId,
                contact_id: contact.id,
                channel: 'whatsapp',
                status: 'todo',
                unread_count: 1
            })
            .select('id')
            .single()
        conversation = newConv
    } else {
        // Bump unread count and last_message_at
        await supabase
            .from('conversations')
            .update({
                last_message_at: new Date().toISOString(),
                unread_count: (conversation as any).unread_count ? (conversation as any).unread_count + 1 : 1
            })
            .eq('id', conversation.id)
    }

    if (!conversation) {
        console.error('[Webhook] Failed to create conversation')
        return
    }

    // Step 9: Handle message type
    let messageContent = ''
    const messageType = msg.type

    if (messageType === 'text') {
        messageContent = msg.text?.body || ''
    } else if (messageType === 'audio' && msg.audio?.id) {
        // Voice note transcription
        messageContent = await transcribeVoiceNote(msg.audio.id, metaToken, groqApiKey)
    } else if (messageType === 'image') {
        messageContent = '[Image received]'
    } else if (messageType === 'document') {
        messageContent = '[Document received]'
    } else {
        messageContent = `[Unsupported message type: ${messageType}]`
    }

    if (!messageContent) {
        console.warn('[Webhook] Empty message content — skipping')
        return
    }

    // Step 10: Insert incoming message
    // The DB trigger enqueue_customer_message() will auto-insert into
    // message_processing_queue when sender = 'customer'
    const { error: insertError } = await supabase.from('messages').insert({
        conversation_id: conversation.id,
        content: messageContent,
        sender: 'customer',
        provider_message_id: messageId,
        metadata: {
            type: messageType,
            phone_number_id: phoneNumberId
        }
    })

    if (insertError) {
        console.error('[Webhook] Message insert error:', insertError)
        return
    }

    console.log(`[Webhook] Message inserted for conversation ${conversation.id}`)
    // Step 11 & 12: The DB trigger handles enqueue automatically.
    // The queue-worker picks it up via pg_cron or manual invocation.
}

// ─────────────────────────────────────────────────────────────────
// Voice Note Transcription via Groq Whisper
// ─────────────────────────────────────────────────────────────────
async function transcribeVoiceNote(mediaId: string, metaToken: string, groqApiKey: string): Promise<string> {
    try {
        console.log(`[Audio] Fetching media URL for ID: ${mediaId}`)

        // 1. Get media download URL from Meta
        const mediaRes = await fetch(`https://graph.facebook.com/v18.0/${mediaId}`, {
            headers: { 'Authorization': `Bearer ${metaToken}` }
        })
        if (!mediaRes.ok) throw new Error(`Meta media API error: ${await mediaRes.text()}`)
        const mediaData = await mediaRes.json()

        // 2. Download audio binary
        const downloadRes = await fetch(mediaData.url, {
            headers: { 'Authorization': `Bearer ${metaToken}` }
        })
        if (!downloadRes.ok) throw new Error('Failed to download audio')
        const audioBlob = await downloadRes.blob()

        console.log(`[Audio] Downloaded ${audioBlob.size} bytes, sending to Groq Whisper`)

        // 3. Transcribe with Groq Whisper
        const formData = new FormData()
        formData.append('file', audioBlob, 'audio.ogg')
        formData.append('model', 'whisper-large-v3-turbo')
        formData.append('response_format', 'json')

        const groqRes = await fetch('https://api.groq.com/openai/v1/audio/transcriptions', {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${groqApiKey}` },
            body: formData
        })

        if (!groqRes.ok) throw new Error(`Groq Whisper error: ${await groqRes.text()}`)
        const transcription = await groqRes.json()

        console.log(`[Audio] Transcription: "${transcription.text}"`)
        return `[Voice Note] ${transcription.text}`
    } catch (err: any) {
        console.error('[Audio] Transcription failed:', err.message)
        return '[Voice note received — transcription failed]'
    }
}

// ─────────────────────────────────────────────────────────────────
// Rate Limiting (per phone number, 30 msgs / 60s window)
// ─────────────────────────────────────────────────────────────────
async function checkRateLimit(supabase: any, phone: string): Promise<boolean> {
    try {
        const now = new Date()
        const windowMs = 60_000 // 60 seconds
        const maxRequests = 30

        const { data: existing } = await supabase
            .from('rate_limits')
            .select('request_count, window_start')
            .eq('identifier', phone)
            .maybeSingle()

        if (!existing) {
            // First message from this phone — create entry
            await supabase.from('rate_limits').insert({
                identifier: phone,
                request_count: 1,
                window_start: now.toISOString()
            })
            return false
        }

        const windowStart = new Date(existing.window_start)
        const elapsed = now.getTime() - windowStart.getTime()

        if (elapsed > windowMs) {
            // Window expired — reset
            await supabase
                .from('rate_limits')
                .update({ request_count: 1, window_start: now.toISOString() })
                .eq('identifier', phone)
            return false
        }

        if (existing.request_count >= maxRequests) {
            return true // Rate limited
        }

        // Increment counter
        await supabase
            .from('rate_limits')
            .update({ request_count: existing.request_count + 1 })
            .eq('identifier', phone)
        return false
    } catch (err: any) {
        console.error('[RateLimit] Error:', err.message)
        return false // Fail open — don't block messages on rate limit errors
    }
}
