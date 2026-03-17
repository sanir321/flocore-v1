// @ts-nocheck
// supabase/functions/process-message/index.ts
// Processes incoming messages with AI and sends replies

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { sendReply } from '../_shared/reply-router.ts'

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// ... unchanged tool definitions ...

Deno.serve(async (req: Request) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const groqApiKey = Deno.env.get('GROQ_API_KEY')!

    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    let workspace_id = 'unknown'

    try {
        const body = await req.json()
        workspace_id = body.workspace_id || workspace_id
        const { conversation_id, message_content, customer_phone, contact_name } = body

        console.log(`[Process] Starting for conversation: ${conversation_id}`)

        // 1. CHECK IF CONVERSATION IS ASSIGNED TO HUMAN
        const { data: conversation, error: convError } = await supabase
            .from('conversations')
            .select('assigned_to_human, escalated, status, contact_id, channel, channel_metadata')
            .eq('id', conversation_id)
            .single()

        if (convError) throw convError

        if (conversation.assigned_to_human) {
            console.log('[Process] Conversation assigned to human - skipping AI')
            return new Response(JSON.stringify({ skipped: true, reason: 'assigned_to_human' }), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            })
        }

        // 1.1 CHECK ESCALATION RULES
        const { data: escalationCheck } = await supabase.rpc('should_escalate_message', {
            p_workspace_id: workspace_id,
            p_message_content: message_content
        })

        if (escalationCheck?.should_escalate) {
            console.log(`[Process] Escalating due to keywords: ${escalationCheck.reason}`)
            await handleEscalation(supabase, workspace_id, conversation_id, conversation.contact_id, { phone: customer_phone, name: contact_name }, escalationCheck.reason)
            
            return new Response(JSON.stringify({ 
                success: true, 
                escalated: true, 
                reason: escalationCheck.reason,
                reply: "I understand this is important. Connecting you with a member of our team now." 
            }), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            })
        }


        // 2. FETCH AGENT CONFIGURATION
        const { data: agent } = await supabase
            .from('agents')
            .select('id, system_prompt, use_cases, services, config, business_hours')
            .eq('workspace_id', workspace_id)
            .eq('active', true)
            .single()

        if (!agent) {
            console.error('[Process] No active agent found')
            return new Response(JSON.stringify({ error: 'No active agent' }), {
                status: 400,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            })
        }

        // Update conversation with agent_id if not already set
        await supabase
            .from('conversations')
            .update({ agent_id: agent.id })
            .eq('id', conversation_id)
            .is('agent_id', null)

        // 4. FETCH KNOWLEDGE BASE (Vector Search)
        console.log('[Process] Generating embedding for query...')
        
        let knowledgeContext = ''
        try {
            // @ts-ignore: Supabase AI is available in the Edge Runtime
            const model = new Supabase.ai.Session('gte-small')
            const queryEmbedding = await model.run(message_content, {
                mean_pool: true,
                normalize: true,
            })

            const { data: wikiItems, error: wikiError } = await supabase.rpc('match_knowledge_base', {
                query_embedding: queryEmbedding,
                match_threshold: 0.5,
                match_count: 5,
                p_workspace_id: workspace_id,
                p_agent_id: agent.id
            })

            if (wikiError) {
              console.warn('[Process] Vector search failed, falling back to recent items:', wikiError.message)
              // Fallback to recent items if vector search fails
              const { data: fallbackItems } = await supabase
                  .from('knowledge_base')
                  .select('title, content, category')
                  .eq('workspace_id', workspace_id)
                  .order('updated_at', { ascending: false })
                  .limit(3)
              
              knowledgeContext = fallbackItems?.map(item => `### ${item.title}\n${item.content}`).join('\n\n') || ''
            } else {
              knowledgeContext = wikiItems?.map((item: any) => `### ${item.title}\n${item.content}`).join('\n\n') || ''
              console.log(`[Process] Found ${wikiItems?.length || 0} relevant knowledge base items via vector search.`)
            }
        } catch (searchError: any) {
            console.error('[Process] Vector search fatal error:', searchError.message)
            // Final fallback
            const { data: fallbackItems } = await supabase
                .from('knowledge_base')
                .select('title, content, category')
                .eq('workspace_id', workspace_id)
                .order('updated_at', { ascending: false })
                .limit(3)
            
            knowledgeContext = fallbackItems?.map(item => `### ${item.title}\n${item.content}`).join('\n\n') || ''
        }

        // 5. FETCH CONVERSATION HISTORY
        const { data: recentMessages } = await supabase
            .from('messages')
            .select('content, sender, created_at')
            .eq('conversation_id', conversation_id)
            .order('created_at', { ascending: true })
            .limit(20)

        const conversationHistory = recentMessages?.map(msg => ({
            role: msg.sender === 'customer' ? 'user' : 'assistant',
            content: msg.content
        })) || []

        // 6. BUILD SYSTEM PROMPT
        const isAppointmentAgent = agent.use_cases?.includes('appointments') || agent.type === 'appointment'

        // Agent-type specific behavioral defaults (can be overridden by user prompt)
        const typeGuidelines = {
            support: "Focus on helpfulness, empathy, and active listening. Escalate if technical issues persist.",
            appointment: "Focus on checking availability and scheduling efficiently using tools.",
            sales: "Focus on understanding needs, highlighting benefits, and qualifying leads."
        }[agent.type as 'support' | 'appointment' | 'sales'] || "Be a helpful professional assistant."

        const currentDate = new Date().toISOString().split('T')[0]
        const currentTime = new Date().toLocaleTimeString('en-US', { hour12: true })

        const servicesList = agent.services?.length
            ? agent.services.map((s: any) => `- ${s.name} (${s.duration} mins)`).join('\n')
            : '- Standard Appointment (30 mins)'

        // PRIORITIZE: User prompt (agent.system_prompt) is the core.
        // Guidelines and rules are supplementary.
        const systemPrompt = `
# Role & Primary Instructions
${agent.system_prompt || 'You are a helpful AI assistant.'}

# Behavioral Guidelines
- Type: ${agent.type || 'general'}
- Style: ${typeGuidelines}

# Context
- Date: ${currentDate}
- Time: ${currentTime}
- Customer: ${contact_name || 'Customer'} (${customer_phone})

# Available Services
${servicesList}

${knowledgeContext ? `# Knowledge Base\n${knowledgeContext}` : ''}

# Operational Rules
1. Respond ONLY with valid JSON.
2. If tool fails, be polite and ask for contact details to follow up manually.
3. Use 'update_contact_info' to capture name/email/phone.
4. Use 'escalate_to_human' if explicitly requested.

# Sentiment & Escalation Policy
You must monitor user sentiment. Set "should_escalate": true if:
- User expresses frustration (anger, impatience, repeat failure).
- Complex request outside your knowledge base or tool capabilities.
- Direct request for a human or manager.
- Sentiment is consistently negative.

JSON Output Schema:
{
  "reply": "your message",
  "intent": "pricing | support | appointment | escalation | other",
  "sentiment": "positive | neutral | negative",
  "should_escalate": boolean,
  "confidence": number,
  "language": "string"
}
`


        // 7. CALL GROQ API
        console.log('[Process] Calling Groq API...')

        const groqPayload: any = {
            model: 'llama-3.3-70b-versatile',
            messages: [
                { role: 'system', content: systemPrompt },
                ...conversationHistory
            ],
            temperature: 0.3,
            max_tokens: 500
        }

        // Only add JSON mode when NOT using tools (they are incompatible)
        if (!isAppointmentAgent) {
            groqPayload.response_format = { type: 'json_object' }
        }

        // Only add tools for appointment agents
        if (isAppointmentAgent) {
            groqPayload.tools = appointmentTools
            groqPayload.tool_choice = 'auto'
        }

        let groqResponse = await fetch('https://api.groq.com/openai/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${groqApiKey}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(groqPayload)
        })

        if (!groqResponse.ok) {
            const errorText = await groqResponse.text()
            console.error('[Process] Groq API error:', errorText)
            throw new Error(`Groq API error: ${errorText}`)
        }

        let groqData = await groqResponse.json()
        let assistantMessage = groqData.choices[0].message

        // 8. HANDLE TOOL CALLS
        if (assistantMessage.tool_calls && assistantMessage.tool_calls.length > 0) {
            console.log('[Process] Handling tool calls:', assistantMessage.tool_calls.length)

            const toolResults = []
            let toolFailed = false

            for (const toolCall of assistantMessage.tool_calls) {
                const functionName = toolCall.function.name
                const functionArgs = JSON.parse(toolCall.function.arguments)

                console.log(`[Process] Executing tool: ${functionName}`)

                try {
                    let result

                    if (functionName === 'check_availability') {
                        result = await executeCheckAvailability(supabase, workspace_id, agent, functionArgs)
                    } else if (functionName === 'book_appointment') {
                        result = await executeBookAppointment(supabase, workspace_id, conversation.contact_id, functionArgs)
                    } else if (functionName === 'reschedule_appointment') {
                        result = await executeRescheduleAppointment(supabase, workspace_id, functionArgs)
                    } else if (functionName === 'cancel_appointment') {
                        result = await executeCancelAppointment(supabase, workspace_id, functionArgs)
                    } else if (functionName === 'update_contact_info') {
                        result = await executeUpdateContact(supabase, conversation.contact_id, functionArgs)
                    } else if (functionName === 'escalate_to_human') {
                        result = await executeEscalateToHuman(supabase, workspace_id, conversation_id, conversation.contact_id, functionArgs.reason)
                    } else {
                        result = { error: `Unknown tool: ${functionName}` }
                        toolFailed = true
                    }

                    toolResults.push({
                        tool_call_id: toolCall.id,
                        role: 'tool',
                        content: JSON.stringify(result)
                    })

                    if (result.error) {
                        toolFailed = true
                    }
                } catch (error) {
                    console.error(`[Process] Tool ${functionName} failed:`, error)
                    toolResults.push({
                        tool_call_id: toolCall.id,
                        role: 'tool',
                        content: JSON.stringify({ error: error.message })
                    })
                    toolFailed = true
                }
            }

            // If any tool failed, we DO NOT escalate immediately.
            // Instead, we let the AI see the error and explain it to the user.
            // Only escalate if it's a critical system failure, but for tool errors (like "Calendar not connected"),
            // the AI should be able to say "I'm sorry, I can't check the calendar right now."
            if (toolFailed) {
                console.warn('[Process] Some tools failed, but continuing conversation so AI can explain.')
                // We simply continue. The 'content' of the tool result will contain the error JSON.
                // The AI will see `{"error": "Calendar not connected"}` and generate a response.
            }


            // Get final response with tool results
            groqResponse = await fetch('https://api.groq.com/openai/v1/chat/completions', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${groqApiKey}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    model: 'llama-3.3-70b-versatile',
                    messages: [
                        { role: 'system', content: systemPrompt },
                        ...conversationHistory,
                        assistantMessage,
                        ...toolResults
                    ],
                    temperature: 0.3,
                    max_tokens: 500,
                    response_format: { type: 'json_object' }
                })
            })

            if (!groqResponse.ok) {
                throw new Error('Groq API error on final response')
            }

            groqData = await groqResponse.json()
            assistantMessage = groqData.choices[0].message
        }

        // 9. PARSE STRUCTURED JSON RESPONSE
        const rawContent = assistantMessage.content || ''
        let replyContent: string
        let intent = 'general'
        let sentiment = 'neutral'
        let shouldEscalate = false
        let confidence = 0.5
        let language = 'en'

        try {
            const parsed = JSON.parse(rawContent)
            replyContent = parsed.reply || rawContent
            intent = parsed.intent || 'general'
            sentiment = parsed.sentiment || 'neutral'
            shouldEscalate = parsed.should_escalate === true
            confidence = typeof parsed.confidence === 'number' ? parsed.confidence : 0.5
            language = parsed.language || 'en'
        } catch {
            // Model didn't return valid JSON — use raw text as reply
            console.warn('[Process] JSON parse failed — using raw text as reply')
            replyContent = rawContent || "I'm here to help. What can I assist you with?"
        }

        // Handle AI-requested escalation
        if (shouldEscalate) {
            console.log('[Process] AI flagged for escalation')
            await handleEscalation(supabase, workspace_id, conversation_id, conversation.contact_id, { phone: customer_phone, name: contact_name }, `AI escalation: intent=${intent}`)
        }

        // Update contact sentiment if negative/frustrated
        if (sentiment === 'frustrated' || sentiment === 'negative') {
            await supabase
                .from('contacts')
                .update({ metadata: { last_sentiment: sentiment } })
                .eq('id', conversation.contact_id)
                .catch((err: any) => console.warn('[Process] Sentiment update failed:', err.message))
        }

        const replyMetadata = {
            workspace_id,
            phone: customer_phone,
            ...conversation.channel_metadata
        }
        await sendReply(conversation.channel, replyMetadata, replyContent, supabase)

        // 10. STORE AI MESSAGE
        await supabase.from('messages').insert({
            conversation_id: conversation_id,
            content: replyContent,
            sender: 'ai'
        })

        // 11. LOG AI INTERACTION with structured fields
        await supabase.from('ai_interactions').insert({
            workspace_id: workspace_id,
            conversation_id: conversation_id,
            input_tokens: groqData.usage?.prompt_tokens || 0,
            output_tokens: groqData.usage?.completion_tokens || 0,
            model: 'llama-3.3-70b-versatile',
            tool_calls: assistantMessage.tool_calls?.map((t: any) => t.function.name) || [],
            metadata: { intent, sentiment, confidence, language, should_escalate: shouldEscalate }
        })

        console.log('[Process] Complete!')

        return new Response(JSON.stringify({ success: true, reply: replyContent }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })

    } catch (error: any) {
        console.error('[Process] Fatal error:', error)

            // Log to audit_logs
            try {
                const supabaseUrl = Deno.env.get('SUPABASE_URL')!
                const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
                const supabase = createClient(supabaseUrl, supabaseServiceKey)

                await supabase.from('audit_logs').insert({
                    workspace_id: workspace_id,
                    resource_type: 'process_message_error',
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

// ============ HELPER FUNCTIONS ============


async function executeCheckAvailability(
    supabase: any,
    workspace_id: string,
    agent: any,
    args: { date: string; duration_minutes?: number }
): Promise<any> {
    const { date, duration_minutes = 30 } = args

    // Fetch calendar connection
    const { data: calendar } = await supabase
        .from('calendar_connections')
        .select('access_token, calendar_id')
        .eq('workspace_id', workspace_id)
        .single()

    if (!calendar) {
        return { error: 'Calendar not connected' }
    }

    // Get events for the day
    const startOfDay = `${date}T00:00:00Z`
    const endOfDay = `${date}T23:59:59Z`

    const response = await fetch(
        `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendar.calendar_id)}/events?` +
        `timeMin=${encodeURIComponent(startOfDay)}&timeMax=${encodeURIComponent(endOfDay)}&singleEvents=true`,
        {
            headers: { 'Authorization': `Bearer ${calendar.access_token}` }
        }
    )

    if (!response.ok) {
        const error = await response.text()
        console.error('[Calendar] Error:', error)
        return { error: 'Failed to fetch calendar' }
    }

    const data = await response.json()
    const busySlots = data.items?.map((event: any) => ({
        start: event.start?.dateTime || event.start?.date,
        end: event.end?.dateTime || event.end?.date,
        summary: event.summary
    })) || []

    // Dynamic Business Hours Logic
    const dayOfWeek = new Date(date).toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase()

    // Default to 9-5 if no config
    const defaultHours = { open: '09:00', close: '17:00', closed: false }
    const schedule = agent.business_hours?.[dayOfWeek] || defaultHours

    if (schedule.closed) {
        return {
            date: date,
            available_slots: [],
            message: `We are closed on ${dayOfWeek}s.`,
            total_available: 0
        }
    }

    const openHour = parseInt(schedule.open.split(':')[0])
    const openMin = parseInt(schedule.open.split(':')[1] || '0')
    const closeHour = parseInt(schedule.close.split(':')[0])
    const closeMin = parseInt(schedule.close.split(':')[1] || '0')

    const availableSlots = []

    // Iterate from Open to Close
    // We'll use a simple loop incrementing by 30 mins (or logic could be better)
    // For simplicity, sticking to 30 min slots but bounded by dynamic hours

    let currentHour = openHour
    let currentMin = openMin

    while (currentHour < closeHour || (currentHour === closeHour && currentMin < closeMin)) {
        // Construct slot start
        const slotStartStr = `${date}T${String(currentHour).padStart(2, '0')}:${String(currentMin).padStart(2, '0')}:00`
        const slotStartDate = new Date(slotStartStr + 'Z') // Assume UTC for simplicity or handle timezone properly? 
        // Note: The code assumes date is YYYY-MM-DD and we are blindly appending T..Z.
        // This effectively treats the business hours as UTC.
        // In reality, we should respect timezone (e.g. Asia/Kolkata).
        // BUT for now, to keep it consistent with previous logic, we simply construct ISO strings.

        const slotEndDate = new Date(slotStartDate.getTime() + duration_minutes * 60000)
        const slotEndStr = slotEndDate.toISOString()

        // Check if slot exceeds closing time
        const closingDate = new Date(`${date}T${String(closeHour).padStart(2, '0')}:${String(closeMin).padStart(2, '0')}:00Z`)
        if (slotEndDate > closingDate) {
            // Move to next slot?? No, break functionality
            // But let's just break for this day
            break
        }

        // Check overlaps
        const isAvailable = !busySlots.some((busy: any) => {
            const busyStart = new Date(busy.start).getTime()
            const busyEnd = new Date(busy.end).getTime()
            const start = slotStartDate.getTime()
            const end = slotEndDate.getTime()
            return start < busyEnd && end > busyStart
        })

        if (isAvailable) {
            availableSlots.push({
                start: slotStartStr,
                end: slotEndStr.replace('Z', '').split('.')[0]
            })
        }

        // Increment by 30 mins
        currentMin += 30
        if (currentMin >= 60) {
            currentHour += 1
            currentMin -= 60
        }
    }

    return {
        date: date,
        available_slots: availableSlots.slice(0, 10), // Return up to 10
        total_available: availableSlots.length,
        business_hours: `${schedule.open} - ${schedule.close}`
    }
}

async function executeBookAppointment(
    supabase: any,
    workspace_id: string,
    contact_id: string,
    args: { start_time: string; duration_minutes: number; customer_name: string; notes?: string }
): Promise<any> {
    const { start_time, duration_minutes, customer_name, notes } = args

    // Fetch calendar connection
    const { data: calendar } = await supabase
        .from('calendar_connections')
        .select('access_token, calendar_id')
        .eq('workspace_id', workspace_id)
        .single()

    if (!calendar) {
        return { error: 'Calendar not connected' }
    }

    // Calculate end time
    const startDate = new Date(start_time)
    const endDate = new Date(startDate.getTime() + duration_minutes * 60000)

    // Create Google Calendar event
    const eventResponse = await fetch(
        `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendar.calendar_id)}/events`,
        {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${calendar.access_token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                summary: `Appointment with ${customer_name}`,
                description: notes || 'Booked via WhatsApp',
                start: { dateTime: startDate.toISOString() },
                end: { dateTime: endDate.toISOString() }
            })
        }
    )

    if (!eventResponse.ok) {
        const error = await eventResponse.text()
        console.error('[Calendar] Create event error:', error)
        return { error: 'Failed to create calendar event' }
    }

    const eventData = await eventResponse.json()

    // Store in database
    const { data: appointment, error: dbError } = await supabase
        .from('appointments')
        .insert({
            workspace_id: workspace_id,
            contact_id: contact_id,
            title: `Appointment with ${customer_name}`,
            start_time: startDate.toISOString(),
            end_time: endDate.toISOString(),
            status: 'confirmed',
            google_event_id: eventData.id,
            booked_by: 'ai',
            notes: notes,
            metadata: { duration_minutes }
        })
        .select('id')
        .single()

    if (dbError) {
        console.error('[DB] Appointment insert error:', dbError)
        return { error: 'Failed to save appointment' }
    }

    // Send Admin Notification (WhatsApp)
    const { data: notificationSettings } = await supabase
        .from('notification_settings')
        .select('admin_phone, booking_alerts')
        .eq('workspace_id', workspace_id)
        .single()

    if (notificationSettings?.booking_alerts && notificationSettings?.admin_phone) {
        console.log(`[Process] Sending booking alert to ${notificationSettings.admin_phone}`)
        const adminAlert = `📅 *New Appointment Booked*\n\nCustomer: ${customer_name}\nTime: ${startDate.toLocaleDateString()} at ${startDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}\nNotes: ${notes || 'None'}`

        try {
            const alertMetadata = { workspace_id, phone: notificationSettings.admin_phone }
            await sendReply('whatsapp', alertMetadata, adminAlert, supabase)
        } catch (alertError) {
            console.error('[Process] Failed to send booking alert:', alertError)
        }
    }

    return {
        success: true,
        appointment_id: appointment.id,
        confirmation: `Appointment confirmed for ${startDate.toLocaleDateString()} at ${startDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
    }
}

async function executeRescheduleAppointment(
    supabase: any,
    workspace_id: string,
    args: { appointment_id: string; new_start_time: string }
): Promise<any> {
    const { appointment_id, new_start_time } = args

    // Fetch appointment
    const { data: appointment } = await supabase
        .from('appointments')
        .select('metadata')
        .eq('id', appointment_id)
        .eq('workspace_id', workspace_id)
        .single()

    if (!appointment) {
        return { error: 'Appointment not found' }
    }

    const duration = appointment.metadata?.duration_minutes || 30
    const newStart = new Date(new_start_time)
    const newEnd = new Date(newStart.getTime() + duration * 60000)

    // Update in database
    await supabase
        .from('appointments')
        .update({
            start_time: newStart.toISOString(),
            end_time: newEnd.toISOString(),
            status: 'rescheduled'
        })
        .eq('id', appointment_id)

    return {
        success: true,
        new_time: `${newStart.toLocaleDateString()} at ${newStart.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
    }
}

async function executeCancelAppointment(
    supabase: any,
    workspace_id: string,
    args: { appointment_id: string }
): Promise<any> {
    const { appointment_id } = args

    // Update in database
    const { error } = await supabase
        .from('appointments')
        .update({ status: 'cancelled' })
        .eq('id', appointment_id)
        .eq('workspace_id', workspace_id)

    if (error) {
        return { error: 'Failed to cancel appointment' }
    }

    return { success: true, message: 'Appointment cancelled' }
}

async function executeUpdateContact(
    supabase: any,
    contact_id: string,
    args: { email?: string; name?: string; phone?: string }
): Promise<any> {
    const updates: any = {}
    if (args.email) updates.email = args.email
    if (args.name) updates.name = args.name
    if (args.phone) updates.phone = args.phone

    if (Object.keys(updates).length === 0) return { success: true, message: 'No updates provided' }

    const { error } = await supabase
        .from('contacts')
        .update(updates)
        .eq('id', contact_id)

    if (error) {
        console.error('[DB] Contact update error:', error)
        return { error: 'Failed to update contact info' }
    }

    return { success: true, message: 'Contact details updated' }
}

async function executeEscalateToHuman(
    supabase: any,
    workspace_id: string,
    conversation_id: string,
    contact_id: string,
    reason: string
): Promise<any> {
    // 1. Update conversation
    await supabase
        .from('conversations')
        .update({
            escalated: true,
            assigned_to_human: true,
            escalation_reason: reason,
            escalated_at: new Date().toISOString(),
            status: 'todo'
        })
        .eq('id', conversation_id)

    // 2. Tag Contact
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

    // 3. System Alert
    await supabase.from('messages').insert({
        conversation_id: conversation_id,
        content: `⚠️ System Alert: AI initiated escalation. Reason: ${reason}`,
        sender: 'system'
    })

    return { success: true, message: 'Conversation escalated to human agent' }
}

async function handleEscalation(
    supabase: ReturnType<typeof createClient>,
    workspace_id: string,
    conversation_id: string,
    contact_id: string,
    contact: { phone: string; name: string },
    reason: string
): Promise<void> {
    // 1. Update conversation - SET BOTH FLAGS
    await supabase
        .from('conversations')
        .update({
            escalated: true,
            assigned_to_human: true,
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

    // 3. System Alert
    await supabase.from('messages').insert({
        conversation_id: conversation_id,
        content: `⚠️ System Alert: Conversation escalated. Reason: ${reason}`,
        sender: 'system'
    })

    // 4. Send admin alert if configured
    const { data: notificationSettings } = await supabase
        .from('notification_settings')
        .select('admin_phone, escalation_alerts')
        .eq('workspace_id', workspace_id)
        .single()

    if (notificationSettings?.escalation_alerts && notificationSettings?.admin_phone) {
        const adminAlert = `🚨 *Escalation Alert*\n\nReason: ${reason}\nCustomer: ${contact.name || 'Unknown'} (${contact.phone})`
        try {
            const adminMeta = { workspace_id, phone: notificationSettings.admin_phone }
            await sendReply('whatsapp', adminMeta, adminAlert, supabase)
        } catch (alertError) {
            console.error('[Process] Failed to send admin alert:', alertError)
        }
    }
}
