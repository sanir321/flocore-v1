// @ts-nocheck
// supabase/functions/whatsapp-webhook/index.ts
// Receives incoming WhatsApp messages from Twilio and processes them

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req: Request) => {
    // Handle CORS preflight
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    try {
        // 1. Get workspace_id from URL params
        const url = new URL(req.url)
        const workspace_id = url.searchParams.get('workspace_id')

        if (!workspace_id) {
            console.error('Missing workspace_id parameter')
            return new Response('Missing workspace_id', { status: 400 })
        }

        // 2. Parse Twilio webhook data
        const formData = await req.formData()
        const from = formData.get('From') as string // Format: whatsapp:+919876543210
        const body = formData.get('Body') as string
        const messageSid = formData.get('MessageSid') as string
        const mediaUrl = formData.get('MediaUrl0') as string | null

        console.log(`[Webhook] Received message from ${from}: "${body}"`)

        if (!from || !body) {
            console.error('Missing From or Body in webhook')
            return new Response('Missing required fields', { status: 400 })
        }

        // Extract phone number (remove 'whatsapp:' prefix)
        const phoneNumber = from.replace('whatsapp:', '')

        // 3. Initialize Supabase with SERVICE ROLE KEY (for backend operations)
        const supabaseUrl = Deno.env.get('SUPABASE_URL')!
        const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

        const supabase = createClient(supabaseUrl, supabaseServiceKey)

        // 3.5 Check connection status and mark as connected if needed (Verification Step)
        // This is a "heartbeat" check - if we receive a message, the webhook is working.
        const { error: connectionError } = await supabase
            .from('whatsapp_connections')
            .update({ connected: true })
            .eq('workspace_id', workspace_id)
            .eq('connected', false) // Only update if currently marked as false/pending

        if (connectionError) {
            console.error('[Webhook] Failed to update connection status:', connectionError)
        } else {
            console.log('[Webhook] Connection verified (received message)')
        }

        // 4. Find or create contact
        let { data: contact } = await supabase
            .from('contacts')
            .select('id, name')
            .eq('workspace_id', workspace_id)
            .eq('phone', phoneNumber)
            .single()

        console.log(`[Webhook] Step 4 - Contact Check: ${contact ? 'Found' : 'Not Found'}`)

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
                console.error('Error creating contact:', contactError)
                // Log granular error
                await supabase.from('audit_logs').insert({
                    workspace_id: workspace_id,
                    resource_type: 'webhook_debug',
                    action: 'contact_creation_failed',
                    metadata: { error: contactError }
                })
                throw contactError
            }
            contact = newContact
            console.log(`[Webhook] Step 4 - New Contact Created: ${contact.id}`)
        }

        console.log(`[Webhook] Contact ID: ${contact.id}`)

        // 5. Find or create conversation
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

        console.log(`[Webhook] Step 5 - Conversation Check: ${conversation ? 'Found' : 'Not Found'}`)

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
                console.error('Error creating conversation:', convError)
                await supabase.from('audit_logs').insert({
                    workspace_id: workspace_id,
                    resource_type: 'webhook_debug',
                    action: 'conversation_creation_failed',
                    metadata: { error: convError }
                })
                throw convError
            }
            conversation = newConversation
            console.log(`[Webhook] Step 5 - New Conversation Created: ${conversation.id}`)
        }

        console.log(`[Webhook] Conversation ID: ${conversation.id}`)

        // 6. Store customer message with idempotency check
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
            console.error('Error storing message:', msgError)
            await supabase.from('audit_logs').insert({
                workspace_id: workspace_id,
                resource_type: 'webhook_debug',
                action: 'message_storage_failed',
                metadata: { error: msgError }
            })
            throw msgError
        } else {
            console.log('[Webhook] Step 6 - Message stored successfully')
            // Log success to audit for visibility
            await supabase.from('audit_logs').insert({
                workspace_id: workspace_id,
                resource_type: 'webhook_debug',
                action: 'message_stored',
                metadata: { conversation_id: conversation.id, message_id: messageSid }
            })
        }

        // 7. Update conversation.last_message_at
        await supabase
            .from('conversations')
            .update({ last_message_at: new Date().toISOString() })
            .eq('id', conversation.id)

        // 8. If NOT assigned to human, trigger AI processing
        if (!conversation.assigned_to_human) {
            console.log('[Webhook] Triggering process-message...')

            const processResponse = await fetch(
                `${supabaseUrl}/functions/v1/process-message`,
                {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${supabaseServiceKey}`
                    },
                    body: JSON.stringify({
                        workspace_id: workspace_id,
                        conversation_id: conversation.id,
                        message_content: body,
                        customer_phone: phoneNumber,
                        contact_name: contact.name
                    })
                }
            )

            if (!processResponse.ok) {
                const errorText = await processResponse.text()
                console.error('Error calling process-message:', errorText)
                // Don't throw - we still want to acknowledge the webhook
            } else {
                console.log('[Webhook] process-message triggered successfully')
            }
        } else {
            console.log('[Webhook] Conversation assigned to human - skipping AI')
        }

        // 9. Return empty TwiML response (Twilio expects this)
        const twiml = '<?xml version="1.0" encoding="UTF-8"?><Response></Response>'

        return new Response(twiml, {
            status: 200,
            headers: {
                ...corsHeaders,
                'Content-Type': 'text/xml'
            }
        })

    } catch (error: any) {
        console.error('[Webhook] Fatal error:', error)

        // Log to audit_logs for debugging
        try {
            const supabaseUrl = Deno.env.get('SUPABASE_URL')!
            const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
            const supabase = createClient(supabaseUrl, supabaseServiceKey)

            // Extract workspace_id from URL if possible, or use fallback
            let workspace_id = 'unknown'
            try {
                const url = new URL(req.url)
                workspace_id = url.searchParams.get('workspace_id') || 'unknown'
            } catch { }

            await supabase.from('audit_logs').insert({
                workspace_id: workspace_id !== 'unknown' ? workspace_id : '9c1d9589-bdb3-4743-8b50-d3aba94a5e17', // Use valid ID if unknown so insert doesn't fail on FK
                resource_type: 'webhook_error',
                action: 'failure',
                metadata: {
                    error_message: error?.message || String(error),
                    error_stack: error?.stack,
                    timestamp: new Date().toISOString()
                }
            })
        } catch (logError) {
            console.error('Failed to log error to audit_logs:', logError)
        }

        // Return empty TwiML even on error (prevents Twilio retries)
        const twiml = '<?xml version="1.0" encoding="UTF-8"?><Response></Response>'
        return new Response(twiml, {
            status: 200,
            headers: {
                ...corsHeaders,
                'Content-Type': 'text/xml'
            }
        })
    }
})
