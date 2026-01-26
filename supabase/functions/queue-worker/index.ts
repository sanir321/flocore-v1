// @ts-nocheck
// supabase/functions/queue-worker/index.ts
// Processes pending messages from the queue with retry logic

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req: Request) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const groqApiKey = Deno.env.get('GROQ_API_KEY')!

    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    try {
        console.log('[Queue Worker] Starting batch processing...')

        // Claim a batch of queue items
        const { data: queueItems, error: claimError } = await supabase.rpc('claim_queue_items', {
            p_batch_size: 5
        })

        if (claimError) {
            console.error('[Queue Worker] Error claiming items:', claimError)
            throw claimError
        }

        if (!queueItems || queueItems.length === 0) {
            console.log('[Queue Worker] No pending items')
            return new Response(JSON.stringify({ processed: 0 }), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            })
        }

        console.log(`[Queue Worker] Processing ${queueItems.length} items`)

        let processed = 0
        let failed = 0

        for (const item of queueItems) {
            try {
                await processQueueItem(supabase, groqApiKey, item)
                await supabase.rpc('complete_queue_item', { p_queue_id: item.id })
                processed++
                console.log(`[Queue Worker] Completed: ${item.message_id}`)
            } catch (error: any) {
                console.error(`[Queue Worker] Failed: ${item.message_id}`, error.message)
                await supabase.rpc('fail_queue_item', {
                    p_queue_id: item.id,
                    p_error: error.message || String(error)
                })
                failed++
            }
        }

        console.log(`[Queue Worker] Batch complete: ${processed} success, ${failed} failed`)

        return new Response(JSON.stringify({ processed, failed }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })

    } catch (error: any) {
        console.error('[Queue Worker] Fatal error:', error)
        return new Response(JSON.stringify({ error: error.message }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })
    }
})

async function processQueueItem(
    supabase: any,
    groqApiKey: string,
    item: any
): Promise<void> {
    const { conversation_id, workspace_id, message_id } = item

    console.log(`[Process] Starting for conversation: ${conversation_id}`)

    // 1. Fetch conversation state (FRESH read to prevent race conditions)
    const { data: conversation, error: convError } = await supabase
        .from('conversations')
        .select('assigned_to_human, escalated, status, contact_id')
        .eq('id', conversation_id)
        .single()

    if (convError) throw convError

    // CRITICAL: Double-check assigned_to_human
    if (conversation.assigned_to_human) {
        console.log('[Process] Conversation assigned to human - skipping AI')
        return // Exit gracefully, mark as completed
    }

    // 2. Fetch the message content
    const { data: message } = await supabase
        .from('messages')
        .select('content')
        .eq('id', message_id)
        .single()

    if (!message) throw new Error('Message not found')

    const messageContent = message.content

    // 3. Check for customer phone
    const { data: contact } = await supabase
        .from('contacts')
        .select('phone, name')
        .eq('id', conversation.contact_id)
        .single()

    if (!contact) throw new Error('Contact not found')

    // 4. Check escalation rules
    const { data: escalationCheck } = await supabase.rpc('should_escalate_message', {
        p_workspace_id: workspace_id,
        p_message_content: messageContent
    })

    if (escalationCheck?.should_escalate) {
        console.log(`[Process] Escalating: ${escalationCheck.reason}`)
        await handleEscalation(supabase, workspace_id, conversation_id, conversation.contact_id, contact, escalationCheck.reason)
        return
    }

    // 5. Fetch agent configuration
    const { data: agent } = await supabase
        .from('agents')
        .select('*')
        .eq('workspace_id', workspace_id)
        .eq('active', true)
        .single()

    if (!agent) {
        console.error('[Process] No active agent found')
        throw new Error('No active agent configured')
    }

    // 6. Fetch conversation history
    const { data: recentMessages } = await supabase
        .from('messages')
        .select('content, sender, created_at')
        .eq('conversation_id', conversation_id)
        .order('created_at', { ascending: true })
        .limit(20)

    const conversationHistory = recentMessages?.map((msg: any) => ({
        role: msg.sender === 'customer' ? 'user' : 'assistant',
        content: msg.content
    })) || []

    // 7. Build system prompt
    const currentDate = new Date().toISOString().split('T')[0]
    const systemPrompt = `${agent.system_prompt || 'You are a helpful AI assistant.'}

Current Date: ${currentDate}
Customer Name: ${contact.name || 'Customer'}
Customer Phone: ${contact.phone}

## Guidelines
- Be natural and human-like.
- If you cannot help with something, offer to connect them with a human.
- Never make up information you don't have.`

    // 8. Call Groq API with retry
    let aiResponse: string | null = null
    for (let attempt = 1; attempt <= 3; attempt++) {
        try {
            aiResponse = await callGroqWithRetry(groqApiKey, systemPrompt, conversationHistory)
            break
        } catch (error: any) {
            console.warn(`[Process] Groq attempt ${attempt} failed:`, error.message)
            if (attempt === 3) {
                // Final failure - escalate
                console.log('[Process] LLM failed 3 times - escalating')
                await handleEscalation(supabase, workspace_id, conversation_id, conversation.contact_id, contact, 'llm_failure')
                return
            }
            await new Promise(resolve => setTimeout(resolve, 1000 * attempt)) // Backoff
        }
    }

    if (!aiResponse) {
        throw new Error('Failed to get AI response')
    }

    // 9. Send reply via WhatsApp
    await sendWhatsAppMessage(supabase, workspace_id, contact.phone, aiResponse)

    // 10. Store AI message
    await supabase.from('messages').insert({
        conversation_id: conversation_id,
        content: aiResponse,
        sender: 'ai'
    })

    // 11. Log interaction
    await supabase.from('ai_interactions').insert({
        workspace_id: workspace_id,
        conversation_id: conversation_id,
        model: 'llama-3.3-70b-versatile'
    })

    console.log('[Process] Complete!')
}

async function callGroqWithRetry(apiKey: string, systemPrompt: string, history: any[]): Promise<string> {
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            model: 'llama-3.3-70b-versatile',
            messages: [
                { role: 'system', content: systemPrompt },
                ...history
            ],
            temperature: 0.7,
            max_tokens: 500
        })
    })

    if (!response.ok) {
        const errorText = await response.text()
        throw new Error(`Groq API error: ${errorText}`)
    }

    const data = await response.json()
    return data.choices[0]?.message?.content || "I'm here to help. What can I assist you with?"
}

async function handleEscalation(
    supabase: any,
    workspace_id: string,
    conversation_id: string,
    contact_id: string,
    contact: any,
    reason: string
): Promise<void> {
    // 1. Update conversation - SET BOTH FLAGS
    await supabase
        .from('conversations')
        .update({
            escalated: true,
            assigned_to_human: true, // CRITICAL FIX: Also set this
            escalation_reason: reason,
            escalated_at: new Date().toISOString(),
            status: 'todo'
        })
        .eq('id', conversation_id)

    // 2. Tag contact
    const { data: contactData } = await supabase
        .from('contacts')
        .select('tags')
        .eq('id', contact_id)
        .single()

    const currentTags = contactData?.tags || []
    if (!currentTags.includes('Escalated')) {
        await supabase
            .from('contacts')
            .update({ tags: [...currentTags, 'Escalated'] })
            .eq('id', contact_id)
    }

    // 3. Send customer notification
    const fallbackMessage = "I understand this is important to you. Let me connect you with a team member who can better assist. Someone will reach out shortly."
    await sendWhatsAppMessage(supabase, workspace_id, contact.phone, fallbackMessage)

    // 4. Store AI message
    await supabase.from('messages').insert({
        conversation_id: conversation_id,
        content: fallbackMessage,
        sender: 'ai'
    })

    // 5. Insert system alert
    await supabase.from('messages').insert({
        conversation_id: conversation_id,
        content: `⚠️ System Alert: Conversation escalated. Reason: ${reason}`,
        sender: 'system'
    })

    // 6. Send admin alert
    const { data: notificationSettings } = await supabase
        .from('notification_settings')
        .select('admin_phone, escalation_alerts')
        .eq('workspace_id', workspace_id)
        .single()

    if (notificationSettings?.escalation_alerts && notificationSettings?.admin_phone) {
        const adminAlert = `🚨 *Escalation Alert*\n\nReason: ${reason}\nCustomer: ${contact.name || 'Unknown'} (${contact.phone})`
        try {
            await sendWhatsAppMessage(supabase, workspace_id, notificationSettings.admin_phone, adminAlert)
        } catch (alertError) {
            console.error('[Process] Failed to send admin alert:', alertError)
        }
    }
}

async function sendWhatsAppMessage(
    supabase: any,
    workspace_id: string,
    to: string,
    message: string
): Promise<void> {
    const { data: whatsapp, error } = await supabase
        .from('whatsapp_connections')
        .select('twilio_account_sid, twilio_auth_token, twilio_phone_number, mode')
        .eq('workspace_id', workspace_id)
        .single()

    if (error || !whatsapp) {
        throw new Error('WhatsApp not connected for this workspace')
    }

    const fromNumber = whatsapp.mode === 'sandbox'
        ? 'whatsapp:+14155238886'
        : `whatsapp:${whatsapp.twilio_phone_number}`

    const toNumber = to.startsWith('whatsapp:') ? to : `whatsapp:${to}`

    const response = await fetch(
        `https://api.twilio.com/2010-04-01/Accounts/${whatsapp.twilio_account_sid}/Messages.json`,
        {
            method: 'POST',
            headers: {
                'Authorization': 'Basic ' + btoa(`${whatsapp.twilio_account_sid}:${whatsapp.twilio_auth_token}`),
                'Content-Type': 'application/x-www-form-urlencoded'
            },
            body: new URLSearchParams({
                From: fromNumber,
                To: toNumber,
                Body: message
            })
        }
    )

    if (!response.ok) {
        const errorText = await response.text()
        throw new Error(`Twilio error: ${errorText}`)
    }

    console.log('[Twilio] Message sent successfully')
}
