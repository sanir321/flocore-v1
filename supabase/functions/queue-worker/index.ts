// @ts-nocheck
// supabase/functions/queue-worker/index.ts
// Processes pending messages from the queue with retry logic

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { sendReply } from '../_shared/reply-router.ts'

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
            p_batch_size: 20
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

        // Group queue items by conversation_id
        const conversationGroups: { [conversationId: string]: any[] } = {};
        for (const item of queueItems) {
            if (!conversationGroups[item.conversation_id]) {
                conversationGroups[item.conversation_id] = [];
            }
            conversationGroups[item.conversation_id].push(item);
        }

        const uniqueConversations = Object.keys(conversationGroups);
        console.log(`[Queue Worker] Grouped into ${uniqueConversations.length} unique conversations`);

        // Process in parallel chunks of 5 (concurrency limiter)
        const CHUNK_SIZE = 5;
        const results = { processed: 0, failed: 0 };

        for (let i = 0; i < uniqueConversations.length; i += CHUNK_SIZE) {
            const chunk = uniqueConversations.slice(i, i + CHUNK_SIZE);
            await Promise.all(chunk.map(async (conversationId: string) => {
                const items = conversationGroups[conversationId];
                // Take the first item to pass down context like workspace_id
                const leadItem = items[0]; 

                try {
                    console.log(`[Queue Worker] Processing conversation ${conversationId} with ${items.length} queued messages`);
                    await processQueueItem(supabase, groqApiKey, leadItem);
                    
                    // Mark all items for this conversation as completed
                    for (const item of items) {
                        await supabase.rpc('complete_queue_item', { p_queue_id: item.id });
                    }
                    results.processed += items.length;
                    console.log(`[Queue Worker] Completed ${items.length} items for conversation ${conversationId}`);
                } catch (error: any) {
                    console.error(`[Queue Worker] Failed for conversation ${conversationId}:`, error.message);
                    // Mark all items for this conversation as failed
                    for (const item of items) {
                        await supabase.rpc('fail_queue_item', {
                            p_queue_id: item.id,
                            p_error: error.message || String(error)
                        });
                    }
                    results.failed += items.length;
                }
            }));
        }

        const { processed, failed } = results

        console.log(`[Queue Worker] Batch complete: ${processed} success, ${failed} failed`)

        return new Response(JSON.stringify({ processed, failed }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })

    } catch (error: any) {
        console.error('[Queue Worker] Fatal error:', error)

        // Log to audit_logs
        try {
            const supabaseUrl = Deno.env.get('SUPABASE_URL')!
            const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
            const supabase = createClient(supabaseUrl, supabaseServiceKey)

            await supabase.from('audit_logs').insert({
                resource_type: 'queue_worker_error',
                action: 'failure',
                metadata: {
                    error_message: error?.message || String(error),
                    error_stack: error?.stack,
                    timestamp: new Date().toISOString()
                }
            })
        } catch (logError) {
            console.error('Failed to log to audit_logs:', logError)
        }

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
        .select('assigned_to_human, escalated, status, contact_id, channel, channel_metadata')
        .eq('id', conversation_id)
        .single()

    if (convError) throw convError

    // Executive Assistant Mode: Skip auto-replies for Gmail
    if (conversation.channel === 'gmail') {
        console.log('[Queue Worker] Gmail message detected - skipping auto-reply (Executive Assistant Mode)');
        return; // Mark as processed but do nothing
    }

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

    // 5. Fetch agent configuration
    const { data: agent } = await supabase
        .from('agents')
        .select('id, system_prompt, type')
        .eq('workspace_id', workspace_id)
        .eq('active', true)
        .single()

    if (!agent) {
        console.error('[Process] No active agent found')
        throw new Error('No active agent configured')
    }

    // 4. Check escalation rules (RPC) - now run on every message if not assigned to human
    const { data: escalationCheck } = await supabase.rpc('should_escalate_message', {
        p_workspace_id: workspace_id,
        p_message_content: messageContent
    });

    if (escalationCheck?.should_escalate) {
        console.log(`[Process] Escalating: ${escalationCheck.reason}`);
        await handleEscalation(supabase, workspace_id, conversation_id, conversation.contact_id, contact, escalationCheck.reason);
        return;
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

    // 6a. Fetch Knowledge Base
    const { data: wikiItems } = await supabase
        .from('knowledge_base')
        .select('title, content, category')
        .eq('workspace_id', workspace_id)
        .order('updated_at', { ascending: false })
        .limit(5)

    const knowledgeContext = wikiItems?.map(item => {
        const truncatedContent = item.content && item.content.length > 1000 
            ? item.content.substring(0, 1000) + '... [Truncated]'
            : item.content;
        return `### ${item.title}${item.category ? ` (${item.category})` : ''}\n${truncatedContent}`;
    }).join('\n\n') || ''

    // 7. Build system prompt
    const currentDate = new Date().toISOString().split('T')[0]

    // Only inject phone if it exists AND looks like a real phone number
    // Reject anything that contains a channel prefix (telegram_, whatsapp_, etc.)
    const isValidPhone = (phone: string | null) => {
        if (!phone) return false;
        if (/^(telegram|whatsapp|webchat|gmail|email|slack)_/i.test(phone)) return false;
        return /^\+?[0-9\s\-().]{7,20}$/.test(phone);
    };

    const phoneContext = isValidPhone(contact.phone)
        ? `\nCustomer Phone: ${contact.phone}`
        : '';

    // Define base guidelines per agent type
    const baseGuidelines = {
        support: `
- Provide helpful and empathetic customer support.
- Be concise and natural.
- If you cannot solve a problem, offer to connect them with a human agent once.`,
        appointment: `
- Help customers check availability and book appointments.
- ALWAYS check availability before confirming a time.
- Be professional and efficient.`,
        sales: `
- Guide customers toward your services and products.
- Answer pricing questions accurately and professionally.
- Be persuasive but polite.`
    }[agent.type as 'support' | 'appointment' | 'sales'] || '- Be a helpful assistant.'

    const systemPrompt = `${agent.system_prompt || 'You are a professional, polite, and empathetic customer support agent.'}

Current Date: ${currentDate}
Customer Name: ${contact.name || 'Customer'}${phoneContext}

${knowledgeContext ? `## Knowledge Base\n${knowledgeContext}` : ''}

## Base Guidelines
${baseGuidelines}

## Critical Technical Rules
- Respond ONLY with valid JSON. No markdown. No conversational text outside the "reply" field.
- Do not reveal internal IDs, system values, or technical identifiers.
- Maintain a warm, professional, and empathetic tone.

## Escalation Policy
Reading user intent and sentiment is CRITICAL. You MUST set "should_escalate": true if:
1. THE USER IS FRUSTRATED: They are using repetitive questions, capital letters for emphasis, or words like "terrible", "bad service", "angry".
2. COMPLEX PROBLEM: The user has a problem you cannot solve with the available knowledge base after 2 attempts.
3. EXPLICIT REQUEST: They ask for a manager, human, or person.
4. NEGATIVE SENTIMENT: If you detect the user is losing patience, escalate gracefully.

Schema:
{
  "reply": "your message to the customer here",
  "intent": "pricing | support | onboarding | appointment | escalation | general",
  "sentiment": "positive | neutral | negative | frustrated",
  "should_escalate": false,
  "confidence": 0.95,
  "language": "en"
}
`


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

    // 9. Parse and Handle AI response
    let replyContent: string
    let intent = 'general'
    let sentiment = 'neutral'
    let shouldEscalate = false
    let confidence = 0.5
    let language = 'en'

    try {
        const parsed = JSON.parse(aiResponse)
        replyContent = parsed.reply || aiResponse
        intent = parsed.intent || 'general'
        sentiment = parsed.sentiment || 'neutral'
        shouldEscalate = parsed.should_escalate === true
        confidence = typeof parsed.confidence === 'number' ? parsed.confidence : 0.5
        language = parsed.language || 'en'
    } catch {
        console.warn('[Process] JSON parse failed — using raw text as reply')
        replyContent = aiResponse || "I'm here to help."
    }

    // Handle AI-requested escalation
    if (shouldEscalate) {
        console.log('[Process] AI flagged for escalation')
        await handleEscalation(supabase, workspace_id, conversation_id, conversation.contact_id, contact, `AI escalation: intent=${intent}`)
    }

    // Update contact sentiment if negative/frustrated
    if (sentiment === 'frustrated' || sentiment === 'negative') {
        await supabase
            .from('contacts')
            .update({ metadata: { last_sentiment: sentiment } })
            .eq('id', conversation.contact_id)
            .catch((err: any) => console.warn('[Process] Sentiment update failed:', err.message))
    }

    // 10. Send reply via appropriate channel
    const allowedChannels = ['gmail', 'slack', 'telegram', 'webchat'];
    if (!conversation.channel || !allowedChannels.includes(conversation.channel)) {
        throw new Error(`Unsupported channel: ${conversation.channel || 'undefined'}`)
    }
    
    const replyMeta = {
        ...conversation.channel_metadata,
        workspace_id,
        phone: contact.phone 
    }
    await sendReply(conversation.channel, replyMeta, replyContent, supabase)

    // 11. Store AI message
    await supabase.from('messages').insert({
        conversation_id: conversation_id,
        content: replyContent,
        sender: 'ai'
    })

    // 12. Log interaction
    await supabase.from('ai_interactions').insert({
        workspace_id: workspace_id,
        conversation_id: conversation_id,
        model: 'llama-3.3-70b-versatile',
        metadata: { intent, sentiment, confidence, language, should_escalate: shouldEscalate }
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
            temperature: 0.3,
            max_tokens: 500,
            response_format: { type: 'json_object' }
        })
    })

    if (!response.ok) {
        const errorText = await response.text()
        throw new Error(`Groq API error: ${errorText}`)
    }

    const data = await response.json()
    const content = data.choices[0]?.message?.content?.trim()
    
    if (!content) {
        throw new Error('LLM returned an empty response')
    }
    
    return content
}

async function handleEscalation(
    supabase: any,
    workspace_id: string,
    conversation_id: string,
    contact_id: string,
    contact: any,
    reason: string
): Promise<void> {
    // 0. Fetch conversation channel info (since it's not passed)
    const { data: conversation } = await supabase
        .from('conversations')
        .select('channel, channel_metadata')
        .eq('id', conversation_id)
        .single()

    if (!conversation) throw new Error('Conversation not found during escalation')
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
    const allowedChannels = ['gmail', 'slack', 'telegram', 'webchat'];
    if (!conversation.channel || !allowedChannels.includes(conversation.channel)) {
        throw new Error(`Unsupported channel: ${conversation.channel || 'undefined'}`)
    }
    
    const fallbackMessage = "I understand this is important. I'm connecting you with a member of our team who can better assist you. Someone will be with you shortly."
    const replyMeta = {
        ...conversation.channel_metadata,
        workspace_id,
        phone: contact.phone
    }
    await sendReply(conversation.channel, replyMeta, fallbackMessage, supabase)

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
        const metaToken = Deno.env.get('META_WHATSAPP_TOKEN')
        const metaPhoneId = Deno.env.get('META_WHATSAPP_PHONE_ID')

        if (metaToken && metaPhoneId) {
            const adminAlert = `🚨 *Escalation Alert*\n\nReason: ${reason}\nCustomer: ${contact.name || 'Unknown'} (${contact.phone})`
            try {
                const adminMeta = { workspace_id, phone: notificationSettings.admin_phone }
                // Use a separate try-catch so one delivery failure doesn't block the whole process
                await sendReply('whatsapp', adminMeta, adminAlert, supabase).catch(err => {
                    console.error('[Queue Worker] Admin alert delivery failed:', err.message)
                })
            } catch (alertError) {
                console.error('[Queue Worker] Failed to send admin alert:', alertError)
            }
        } else {
            console.log('[Queue Worker] Admin alert skipped: WhatsApp credentials missing.')
        }
    }
}
