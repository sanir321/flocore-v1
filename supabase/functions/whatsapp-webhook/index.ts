// @ts-nocheck
// supabase/functions/whatsapp-webhook/index.ts
// HARDENED VERSION: Receives incoming WhatsApp messages with signature validation

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-twilio-signature',
}

// Twilio signature validation
async function validateTwilioSignature(
    req: Request,
    authToken: string
): Promise<boolean> {
    const signature = req.headers.get('x-twilio-signature')
    if (!signature) {
        console.warn('[Webhook] Missing X-Twilio-Signature header')
        return false
    }

    // Get the full URL that Twilio called
    const url = req.url

    // Get the form data as sorted key-value pairs
    const formData = await req.clone().formData()
    const params: Record<string, string> = {}
    formData.forEach((value, key) => {
        params[key] = value.toString()
    })

    // Sort keys and concatenate
    const sortedKeys = Object.keys(params).sort()
    let dataString = url
    for (const key of sortedKeys) {
        dataString += key + params[key]
    }

    // Create HMAC-SHA1 signature
    const encoder = new TextEncoder()
    const key = await crypto.subtle.importKey(
        'raw',
        encoder.encode(authToken),
        { name: 'HMAC', hash: 'SHA-1' },
        false,
        ['sign']
    )
    const signatureBytes = await crypto.subtle.sign('HMAC', key, encoder.encode(dataString))
    const expectedSignature = btoa(String.fromCharCode(...new Uint8Array(signatureBytes)))

    return signature === expectedSignature
}

serve(async (req: Request) => {
    // Handle CORS preflight
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    // Early validation of required environment variables
    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
    const twilioAuthToken = Deno.env.get('TWILIO_AUTH_TOKEN')

    if (!supabaseUrl || !supabaseServiceKey) {
        console.error('[Webhook] Missing Supabase environment variables')
        return new Response('Server configuration error', { status: 500 })
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    try {
        // 1. Get workspace_id from URL params
        const url = new URL(req.url)
        const workspace_id = url.searchParams.get('workspace_id')

        if (!workspace_id) {
            console.error('[Webhook] Missing workspace_id parameter')
            return new Response('Missing workspace_id', { status: 400 })
        }

        // 2. SECURITY: Validate Twilio Signature (if auth token configured)
        if (twilioAuthToken) {
            const isValid = await validateTwilioSignature(req.clone(), twilioAuthToken)
            if (!isValid) {
                console.error('[Webhook] Invalid Twilio signature - possible spoofing attempt')
                await supabase.from('audit_logs').insert({
                    workspace_id: workspace_id,
                    entity_type: 'security',
                    action: 'invalid_webhook_signature',
                    details: { url: req.url, headers: Object.fromEntries(req.headers) }
                })
                return new Response('Forbidden', { status: 403, headers: corsHeaders })
            }
            console.log('[Webhook] Twilio signature validated successfully')
        } else {
            console.warn('[Webhook] TWILIO_AUTH_TOKEN not set - skipping signature validation')
        }

        // 3. Parse Twilio webhook data
        const formData = await req.formData()
        const from = formData.get('From') as string
        const body = formData.get('Body') as string
        const messageSid = formData.get('MessageSid') as string
        const mediaUrl = formData.get('MediaUrl0') as string | null

        console.log(`[Webhook] Received message from ${from}: "${body?.substring(0, 50)}..."`)

        if (!from || !body) {
            console.error('[Webhook] Missing From or Body in webhook')
            return new Response('Missing required fields', { status: 400 })
        }

        // Extract phone number (remove 'whatsapp:' prefix)
        const phoneNumber = from.replace('whatsapp:', '')

        // 4. Connection heartbeat
        await supabase
            .from('whatsapp_connections')
            .update({ connected: true })
            .eq('workspace_id', workspace_id)
            .eq('connected', false)

        // 5. Find or create contact
        let { data: contact } = await supabase
            .from('contacts')
            .select('id, name')
            .eq('workspace_id', workspace_id)
            .eq('phone', phoneNumber)
            .single()

        if (!contact) {
            const { data: newContact, error: contactError } = await supabase
                .from('contacts')
                .insert({
                    workspace_id: workspace_id,
                    phone: phoneNumber,
                    name: null,
                    source: 'whatsapp'
                })
                .select()
                .single()

            if (contactError) {
                console.error('[Webhook] Error creating contact:', contactError)
                throw contactError
            }
            contact = newContact
            console.log(`[Webhook] New Contact Created: ${contact.id}`)
        }

        // 6. Find or create conversation
        let { data: conversation } = await supabase
            .from('conversations')
            .select('id, assigned_to_human, status, escalated')
            .eq('workspace_id', workspace_id)
            .eq('contact_id', contact.id)
            .eq('channel', 'whatsapp')
            .or('status.eq.todo,status.eq.follow_up')
            .order('created_at', { ascending: false })
            .limit(1)
            .single()

        if (!conversation) {
            const { data: newConversation, error: convError } = await supabase
                .from('conversations')
                .insert({
                    workspace_id: workspace_id,
                    contact_id: contact.id,
                    channel: 'whatsapp',
                    status: 'todo',
                    escalated: false,
                    assigned_to_human: false
                })
                .select()
                .single()

            if (convError) {
                console.error('[Webhook] Error creating conversation:', convError)
                throw convError
            }
            conversation = newConversation
            console.log(`[Webhook] New Conversation Created: ${conversation.id}`)
        }

        // 7. Store customer message with idempotency
        const { error: msgError } = await supabase
            .from('messages')
            .upsert({
                conversation_id: conversation.id,
                content: body,
                sender: 'customer',
                provider_message_id: messageSid,
                metadata: mediaUrl ? { media_url: mediaUrl } : null
            }, {
                onConflict: 'conversation_id,provider_message_id'
            })

        if (msgError) {
            console.error('[Webhook] Error storing message:', msgError)
            throw msgError
        }

        console.log('[Webhook] Message stored successfully')

        // 8. Update conversation metadata
        await supabase
            .from('conversations')
            .update({
                last_message_at: new Date().toISOString(),
                unread_count: (conversation as any).unread_count ? (conversation as any).unread_count + 1 : 1
            })
            .eq('id', conversation.id)

        // 9. AI Processing is now handled by the queue system
        // The trigger on messages table will automatically enqueue if assigned_to_human=false
        console.log('[Webhook] Message enqueued for processing via trigger')

        // 10. Return TwiML response
        const twiml = '<?xml version="1.0" encoding="UTF-8"?><Response></Response>'
        return new Response(twiml, {
            status: 200,
            headers: { ...corsHeaders, 'Content-Type': 'text/xml' }
        })

    } catch (error: any) {
        console.error('[Webhook] Fatal error:', error)

        try {
            let workspace_id = 'unknown'
            try {
                const url = new URL(req.url)
                workspace_id = url.searchParams.get('workspace_id') || 'unknown'
            } catch { }

            await supabase.from('audit_logs').insert({
                workspace_id: workspace_id !== 'unknown' ? workspace_id : '9c1d9589-bdb3-4743-8b50-d3aba94a5e17',
                entity_type: 'webhook_error',
                action: 'failure',
                details: {
                    error_message: error?.message || String(error),
                    error_stack: error?.stack,
                    timestamp: new Date().toISOString()
                }
            })
        } catch (logError) {
            console.error('[Webhook] Failed to log error:', logError)
        }

        // Still return 200 to prevent Twilio retries
        const twiml = '<?xml version="1.0" encoding="UTF-8"?><Response></Response>'
        return new Response(twiml, {
            status: 200,
            headers: { ...corsHeaders, 'Content-Type': 'text/xml' }
        })
    }
})
