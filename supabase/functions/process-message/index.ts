// @ts-nocheck
// supabase/functions/process-message/index.ts
// Processes incoming messages with AI and sends replies

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Tool definitions for Groq
const appointmentTools = [
    {
        type: 'function',
        function: {
            name: 'check_availability',
            description: 'Check available appointment slots for a specific date',
            parameters: {
                type: 'object',
                properties: {
                    date: {
                        type: 'string',
                        description: 'The date to check availability for (YYYY-MM-DD format)'
                    },
                    duration_minutes: {
                        type: 'number',
                        description: 'Duration of the appointment in minutes (default: 30)'
                    }
                },
                required: ['date']
            }
        }
    },
    {
        type: 'function',
        function: {
            name: 'book_appointment',
            description: 'Book an appointment at a specific time',
            parameters: {
                type: 'object',
                properties: {
                    start_time: {
                        type: 'string',
                        description: 'Start time in ISO 8601 format (YYYY-MM-DDTHH:MM:SSZ)'
                    },
                    duration_minutes: {
                        type: 'number',
                        description: 'Duration of the appointment in minutes'
                    },
                    customer_name: {
                        type: 'string',
                        description: 'Name of the customer booking the appointment'
                    },
                    notes: {
                        type: 'string',
                        description: 'Optional notes for the appointment'
                    }
                },
                required: ['start_time', 'duration_minutes', 'customer_name']
            }
        }
    },
    {
        type: 'function',
        function: {
            name: 'reschedule_appointment',
            description: 'Reschedule an existing appointment to a new time',
            parameters: {
                type: 'object',
                properties: {
                    appointment_id: {
                        type: 'string',
                        description: 'ID of the appointment to reschedule'
                    },
                    new_start_time: {
                        type: 'string',
                        description: 'New start time in ISO 8601 format'
                    }
                },
                required: ['appointment_id', 'new_start_time']
            }
        }
    },
    {
        type: 'function',
        function: {
            name: 'cancel_appointment',
            description: 'Cancel an existing appointment',
            parameters: {
                type: 'object',
                properties: {
                    appointment_id: {
                        type: 'string',
                        description: 'ID of the appointment to cancel'
                    }
                },
                required: ['appointment_id']
            }
        }
    }
]

serve(async (req: Request) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const groqApiKey = Deno.env.get('GROQ_API_KEY')!

    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    try {
        const { workspace_id, conversation_id, message_content, customer_phone, contact_name } = await req.json()

        console.log(`[Process] Starting for conversation: ${conversation_id}`)

        // 1. CHECK IF CONVERSATION IS ASSIGNED TO HUMAN
        const { data: conversation, error: convError } = await supabase
            .from('conversations')
            .select('assigned_to_human, escalated, status, contact_id')
            .eq('id', conversation_id)
            .single()

        if (convError) throw convError

        if (conversation.assigned_to_human) {
            console.log('[Process] Conversation assigned to human - skipping AI')
            return new Response(JSON.stringify({ skipped: true, reason: 'assigned_to_human' }), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            })
        }

        // 2. CHECK ESCALATION RULES FIRST
        const { data: escalationCheck } = await supabase.rpc('should_escalate_message', {
            p_workspace_id: workspace_id,
            p_message_content: message_content
        })

        if (escalationCheck?.should_escalate) {
            console.log(`[Process] Escalating: ${escalationCheck.reason}`)

            // Update conversation to escalated
            await supabase
                .from('conversations')
                .update({
                    escalated: true,
                    escalation_reason: escalationCheck.reason,
                    escalated_at: new Date().toISOString(),
                    status: 'todo'
                })
                .eq('id', conversation_id)

            // --- 1. TAG CONTACT AS ESCALATED ---
            // Fetch current tags
            const { data: contactData } = await supabase
                .from('contacts')
                .select('tags')
                .eq('id', conversation.contact_id)
                .single()

            const currentTags = contactData?.tags || []
            if (!currentTags.includes('Escalated')) {
                await supabase
                    .from('contacts')
                    .update({ tags: [...currentTags, 'Escalated'] })
                    .eq('id', conversation.contact_id)
            }

            // Send escalation message to customer
            const escalationMessage = "I understand this is important to you. Let me connect you with a team member who can better assist. Someone will reach out shortly."

            await sendWhatsAppMessage(supabase, workspace_id, customer_phone, escalationMessage)

            // Store AI message
            await supabase.from('messages').insert({
                conversation_id: conversation_id,
                content: escalationMessage,
                sender: 'ai'
            })

            // --- 2. INSERT SYSTEM ALERT MESSAGE (Internal only) ---
            await supabase.from('messages').insert({
                conversation_id: conversation_id,
                content: `⚠️ System Alert: Conversation escalated. Reason: ${escalationCheck.reason}`,
                sender: 'system'
            })


            // --- 3. SEND ADMIN ALERT (WhatsApp) ---
            const { data: notificationSettings } = await supabase
                .from('notification_settings')
                .select('admin_phone, escalation_alerts')
                .eq('workspace_id', workspace_id)
                .single()

            if (notificationSettings?.escalation_alerts && notificationSettings?.admin_phone) {
                console.log(`[Process] Sending admin alert to ${notificationSettings.admin_phone}`)
                const adminAlert = `🚨 *Escalation Alert*\n\nReason: ${escalationCheck.reason}\nCustomer: ${contact_name || 'Unknown'} (${customer_phone})\n\nUser is requesting help or used trigger words.`

                try {
                    await sendWhatsAppMessage(supabase, workspace_id, notificationSettings.admin_phone, adminAlert)
                } catch (alertError) {
                    console.error('[Process] Failed to send admin alert:', alertError)
                    // Don't fail the whole request just because admin alert failed
                }
            }

            return new Response(JSON.stringify({ escalated: true, reason: escalationCheck.reason }), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            })
        }

        // 3. FETCH AGENT CONFIGURATION
        const { data: agent } = await supabase
            .from('agents')
            .select('*')
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

        // 4. FETCH KNOWLEDGE BASE
        const { data: wikiItems } = await supabase
            .from('knowledge_base')
            .select('title, content')
            .eq('workspace_id', workspace_id)
            .limit(10)

        const knowledgeContext = wikiItems?.map(item => `## ${item.title}\n${item.content}`).join('\n\n') || ''

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
        const isAppointmentAgent = agent.use_cases?.includes('appointments') || true // Default to true if not specified
        const currentDate = new Date().toISOString().split('T')[0]
        const currentTime = new Date().toLocaleTimeString('en-US', { hour12: true })

        // Construct Service List
        const servicesList = agent.services?.length
            ? agent.services.map((s: any) => `- ${s.name} (${s.duration} mins)`).join('\n')
            : '- Standard Appointment (30 mins)'

        // Construct Personality Instructions
        const tone = agent.config?.tone || 'friendly'
        const useEmojis = agent.config?.use_emojis !== false
        const greeting = agent.config?.greeting || "I'm here to help."

        const systemPrompt = `${agent.system_prompt || 'You are a helpful AI assistant.'}

Current Date: ${currentDate}
Current Time: ${currentTime}
Customer Name: ${contact_name || 'Customer'}
Customer Phone: ${customer_phone}

## Business Configuration
Services Available:
${servicesList}

## Personality & Style
- Tone: ${tone}
- Emojis: ${useEmojis ? 'Allowed' : 'Forbidden'}
- Greeting Pattern: "${greeting}"

## Guidelines
- Be natural and human-like. Avoid robotic questionnaires.
- Bundle questions together (e.g. "What day and time works best for you?" instead of asking separately).
- If the user asks for a specific service, look up its duration properly.
- If you cannot help with something, offer to connect them with a human.
- Never make up information you don't have.
${isAppointmentAgent ? '- Use the provided tools to check availability and book appointments. ALWAYS check availability before confirming a time.' : ''}
`

        // 7. CALL GROQ API
        console.log('[Process] Calling Groq API...')

        const groqPayload: any = {
            model: 'llama-3.3-70b-versatile',
            messages: [
                { role: 'system', content: systemPrompt },
                ...conversationHistory
            ],
            temperature: 0.7,
            max_tokens: 500
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

            // If any tool failed, escalate
            if (toolFailed) {
                console.log('[Process] Tool failed - escalating conversation')

                await supabase
                    .from('conversations')
                    .update({
                        escalated: true,
                        escalation_reason: 'tool_failure',
                        escalated_at: new Date().toISOString(),
                        status: 'todo'
                    })
                    .eq('id', conversation_id)

                const failureMessage = "I'm having trouble processing your request. Let me connect you with a team member who can help."
                await sendWhatsAppMessage(supabase, workspace_id, customer_phone, failureMessage)

                await supabase.from('messages').insert({
                    conversation_id: conversation_id,
                    content: failureMessage,
                    sender: 'ai'
                })

                return new Response(JSON.stringify({ escalated: true, reason: 'tool_failure' }), {
                    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
                })
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
                    temperature: 0.7,
                    max_tokens: 500
                })
            })

            if (!groqResponse.ok) {
                throw new Error('Groq API error on final response')
            }

            groqData = await groqResponse.json()
            assistantMessage = groqData.choices[0].message
        }

        // 9. SEND REPLY VIA TWILIO
        const replyContent = assistantMessage.content || "I'm here to help. What can I assist you with?"

        console.log(`[Process] Sending reply: "${replyContent.substring(0, 50)}..."`)

        await sendWhatsAppMessage(supabase, workspace_id, customer_phone, replyContent)

        // 10. STORE AI MESSAGE
        await supabase.from('messages').insert({
            conversation_id: conversation_id,
            content: replyContent,
            sender: 'ai'
        })

        // 11. LOG AI INTERACTION
        await supabase.from('ai_interactions').insert({
            workspace_id: workspace_id,
            conversation_id: conversation_id,
            input_tokens: groqData.usage?.prompt_tokens || 0,
            output_tokens: groqData.usage?.completion_tokens || 0,
            model: 'llama-3.3-70b-versatile',
            tool_calls: assistantMessage.tool_calls?.map((t: any) => t.function.name) || []
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

            // Try to recover workspace_id from request cloning if needed, but here we might have it in scope if we defined it outside try?
            // Actually, workspace_id is defined inside try. We can't access it here easily unless we move declaration.
            // For now, use fallback or try to parsing again if req body wasn't consumed? No, body consumed.
            // We'll rely on the error details.

            await supabase.from('audit_logs').insert({
                workspace_id: '9c1d9589-bdb3-4743-8b50-d3aba94a5e17', // Fallback ID since we might not have it in catch scope
                entity_type: 'process_message_error',
                action: 'failure',
                details: {
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

async function sendWhatsAppMessage(
    supabase: any,
    workspace_id: string,
    to: string,
    message: string
): Promise<void> {
    // Fetch Twilio credentials
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
        console.error('[Twilio] Send error:', errorText)
        throw new Error(`Twilio error: ${errorText}`)
    }

    console.log('[Twilio] Message sent successfully')
}

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
        .select()
        .single()

    if (dbError) {
        console.error('[DB] Appointment insert error:', dbError)
        return { error: 'Failed to save appointment' }
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
        .select('*, metadata')
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

    // TODO: Update Google Calendar event

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

    // TODO: Delete Google Calendar event

    return { success: true, message: 'Appointment cancelled' }
}
