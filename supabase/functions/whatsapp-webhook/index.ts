// supabase/functions/whatsapp-webhook/index.ts
// Receives incoming WhatsApp messages from Twilio and processes them

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

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

        // 4. Find or create contact
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
                console.error('Error creating contact:', contactError)
                throw contactError
            }
            contact = newContact
        }

        console.log(`[Webhook] Contact ID: ${contact.id}`)

        // 5. Find or create conversation
        let { data: conversation } = await supabase
            .from('conversations')
            .select('id, assigned_to_human, status, escalated')
            .eq('workspace_id', workspace_id)
            .eq('contact_id', contact.id)
            .eq('channel', 'whatsapp')
            .or('status.eq.open,status.eq.followup')
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
                    status: 'open',
                    escalated: false,
                    assigned_to_human: false
                })
                .select()
                .single()

            if (convError) {
                console.error('Error creating conversation:', convError)
                throw convError
            }
            conversation = newConversation
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
            throw msgError
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

    } catch (error) {
        console.error('[Webhook] Fatal error:', error)

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
