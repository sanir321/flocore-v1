// @ts-nocheck
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

// Tool definitions for Groq (Ported from process-message)
const appointmentTools = [
  {
    type: "function",
    function: {
      name: "check_availability",
      description: "Check available appointment slots for a specific date",
      parameters: {
        type: "object",
        properties: {
          date: {
            type: "string",
            description: "The date to check availability for (YYYY-MM-DD format)",
          },
          duration_minutes: {
            type: "number",
            description: "Duration of the appointment in minutes (default: 30)",
          },
        },
        required: ["date"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "book_appointment",
      description: "Book an appointment at a specific time",
      parameters: {
        type: "object",
        properties: {
          start_time: {
            type: "string",
            description: "Start time in ISO 8601 format (YYYY-MM-DDTHH:MM:SSZ)",
          },
          duration_minutes: {
            type: "number",
            description: "Duration of the appointment in minutes",
          },
          customer_name: {
            type: "string",
            description: "Name of the customer booking the appointment",
          },
          notes: {
            type: "string",
            description: "Optional notes for the appointment",
          },
        },
        required: ["start_time", "duration_minutes", "customer_name"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "reschedule_appointment",
      description: "Reschedule an existing appointment to a new time",
      parameters: {
        type: "object",
        properties: {
          appointment_id: {
            type: "string",
            description: "ID of the appointment to reschedule",
          },
          new_start_time: {
            type: "string",
            description: "New start time in ISO 8601 format",
          },
        },
        required: ["appointment_id", "new_start_time"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "update_contact_info",
      description: "Update customer contact details (email, phone, name)",
      parameters: {
        type: "object",
        properties: {
          email: { type: "string", description: "Customer's email address" },
          name: { type: "string", description: "Customer's full name" },
          phone: { type: "string", description: "Customer's phone number" },
        },
        required: [],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "escalate_to_human",
      description: "Escalate the conversation to a human agent",
      parameters: {
        type: "object",
        properties: {
          reason: { type: "string", description: "Reason for escalation" },
        },
        required: ["reason"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "cancel_appointment",
      description: "Cancel an existing appointment",
      parameters: {
        type: "object",
        properties: {
          appointment_id: {
            type: "string",
            description: "ID of the appointment to cancel",
          },
        },
        required: ["appointment_id"],
      },
    },
  },
];
// --- Types & Interfaces ---
interface GroqPayload {
  model: string;
  messages: Array<{ role: string; content: string | null; tool_calls?: any[] }>;
  temperature: number;
  max_tokens: number;
  tools?: typeof appointmentTools;
  tool_choice?: string;
  response_format?: { type: string };
}

interface CalendarConnection {
  access_token: string;
  calendar_id: string;
}

interface AgentConfig {
  tone?: string;
  use_emojis?: boolean;
  greeting?: string;
}

interface Agent {
  id: string;
  system_prompt?: string;
  use_cases?: string[];
  services?: Array<{ name: string; duration: number }>;
  config?: AgentConfig;
  business_hours?: Record<string, { open: string; close: string; closed: boolean }>;
}

// --- Main Handler ---

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const groqApiKey = Deno.env.get("GROQ_API_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // 1. Verify JWT
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "No authorization header" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const token = authHeader.replace("Bearer ", "");
    const {
      data: { user },
      error: authError,
    } = await createClient(supabaseUrl, (Deno as any).env.get("SUPABASE_ANON_KEY")!).auth.getUser(token);

    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized", details: authError }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // 2. Get request body
    const { message, conversationId, workspaceId } = await req.json();

    if (!message || !conversationId || !workspaceId) {
      return new Response(JSON.stringify({ error: "Missing required fields" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // 3. Verify user has access to workspace
    const { data: workspace, error: workspaceError } = await supabase
      .from("workspaces")
      .select("id")
      .eq("id", workspaceId)
      .eq("user_id", user.id)
      .single();

    if (workspaceError || !workspace) {
      return new Response(JSON.stringify({ error: "Workspace not found or access denied" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // 4. Fetch Conversation & Agent Info
    const { data: conversation, error: convError } = await supabase
      .from("conversations")
      .select("*, contacts(*)")
      .eq("id", conversationId)
      .single();

    if (convError || !conversation) {
      throw new Error("Conversation not found");
    }

    const { data: agent } = await supabase
      .from("agents")
      .select("*")
      .eq("workspace_id", workspaceId)
      .eq("active", true)
      .single() as { data: Agent | null };

    if (!agent) {
      throw new Error("No active agent found for this workspace");
    }

    // 5. Fetch Knowledge Base & History (Vector Search)
    console.log("[Chat] Generating embedding for query...");
    
    let knowledgeContext = "";
    try {
        // @ts-ignore: Supabase AI is available in the Edge Runtime
        const model = new Supabase.ai.Session("gte-small");
        const queryEmbedding = await model.run(message, {
            mean_pool: true,
            normalize: true,
        });

        const { data: wikiItems, error: wikiError } = await supabase.rpc("match_knowledge_base", {
            query_embedding: queryEmbedding,
            match_threshold: 0.5,
            match_count: 5,
            p_workspace_id: workspaceId,
            p_agent_id: agent.id
        });

        if (wikiError) {
          console.warn("[Chat] Vector search failed, falling back to recent items:", wikiError.message);
          // Fallback to recent items if vector search fails
          const { data: fallbackItems } = await supabase
              .from("knowledge_base")
              .select("title, content, category")
              .eq("workspace_id", workspaceId)
              .order("updated_at", { ascending: false })
              .limit(3);
          
          knowledgeContext = fallbackItems?.map(item => `### ${item.title}${item.category ? ` (${item.category})` : ""}\n${item.content}`).join("\n\n") || "";
        } else {
          knowledgeContext = wikiItems?.map((item: any) => `### ${item.title}\n${item.content}`).join("\n\n") || "";
          console.log(`[Chat] Found ${wikiItems?.length || 0} relevant knowledge base items via vector search.`);
        }
    } catch (searchError: any) {
        console.error("[Chat] Vector search fatal error:", searchError.message);
        // Final fallback
        const { data: fallbackItems } = await supabase
            .from("knowledge_base")
            .select("title, content, category")
            .eq("workspace_id", workspaceId)
            .order("updated_at", { ascending: false })
            .limit(3);
        
        knowledgeContext = fallbackItems?.map(item => `### ${item.title}${item.category ? ` (${item.category})` : ""}\n${item.content}`).join("\n\n") || "";
    }

    const { data: recentMessages } = await supabase
      .from("messages")
      .select("content, sender, created_at")
      .eq("conversation_id", conversationId)
      .order("created_at", { ascending: true })
      .limit(20);

    const conversationHistory: Array<{ role: "user" | "assistant"; content: string }> =
      recentMessages?.map((msg) => ({
        role: msg.sender === "customer" ? ("user" as const) : ("assistant" as const),
        content: msg.content,
      })) || [];

    // 6. Build System Prompt
    const isAppointmentAgent = agent.use_cases?.includes("appointments") || false;
    const currentDate = new Date().toISOString().split("T")[0];
    const currentTime = new Date().toLocaleTimeString("en-US", { hour12: true });

    const servicesList = agent.services?.length
      ? (agent.services as Array<{ name: string; duration: number }>).map((s) => `- ${s.name} (${s.duration} mins)`).join("\n")
      : "- Standard Appointment (30 mins)";

    const tone = agent.config?.tone || "friendly";
    const useEmojis = agent.config?.use_emojis !== false;
    const greeting = agent.config?.greeting || "I'm here to help.";

    const systemPrompt = `${agent.system_prompt || "You are a helpful AI assistant."}

Current Date: ${currentDate}
Current Time: ${currentTime}
Customer Name: ${conversation.contacts?.name || "Customer"}
Customer Phone: ${conversation.contacts?.phone || "Unknown"}

## Business Configuration
Services Available:
${servicesList}

## Personality & Style
- Tone: ${tone}
- Emojis: ${useEmojis ? "Allowed" : "Forbidden"}
- Greeting Pattern: "${greeting}"

${
  knowledgeContext
    ? `## Knowledge Base\nUse the following verified business information to answer questions. Only use this information. Do not invent facts not present here.\n\n${knowledgeContext}`
    : ""
}

## Guidelines
- Be natural and human-like. Avoid robotic questionnaires.
- Bundle questions together.
- If a tool returns an error, do NOT mention technical details. Say "I'm having trouble accessing the schedule right now."
- If the user provides contact details, ALWAYS use \`update_contact_info\`.
- If the user request human help, use \`escalate_to_human\`.
${
  isAppointmentAgent
    ? "- Use tools to check availability and book appointments. ALWAYS check availability first."
    : ""
}

## Output Format
You MUST respond with a valid JSON object.
Schema:
{
  "reply": "your message to the customer here",
  "intent": "pricing | support | onboarding | appointment | escalation | general",
  "sentiment": "positive | neutral | negative | frustrated",
  "should_escalate": false,
  "confidence": 0.95,
  "language": "en"
}
`;

    // 7. Call Groq API with Tool Handling
    const groqPayload: GroqPayload = {
      model: "llama-3.3-70b-versatile",
      messages: [{ role: "system", content: systemPrompt }, ...conversationHistory, { role: "user", content: message }],
      temperature: 0.3,
      max_tokens: 500,
    };

    if (isAppointmentAgent) {
      groqPayload.tools = appointmentTools;
      groqPayload.tool_choice = "auto";
    } else {
      groqPayload.response_format = { type: "json_object" };
    }

    let groqResponse = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${groqApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(groqPayload),
    });

    if (!groqResponse.ok) {
      throw new Error(`Groq API error: ${await groqResponse.text()}`);
    }

    let groqData = await groqResponse.json();
    let assistantMessage = groqData.choices[0].message;

    // Handle Tool Calls
    if (assistantMessage.tool_calls?.length > 0) {
      const toolResults = [];
      for (const toolCall of assistantMessage.tool_calls) {
        const functionName = toolCall.function.name;
        const functionArgs = JSON.parse(toolCall.function.arguments);

        let result;
        try {
          if (functionName === "check_availability") {
            result = await executeCheckAvailability(supabase, workspaceId, agent, functionArgs);
          } else if (functionName === "book_appointment") {
            result = await executeBookAppointment(supabase, workspaceId, conversation.contact_id, functionArgs);
          } else if (functionName === "reschedule_appointment") {
            result = await executeRescheduleAppointment(supabase, workspaceId, functionArgs);
          } else if (functionName === "cancel_appointment") {
            result = await executeCancelAppointment(supabase, workspaceId, functionArgs);
          } else if (functionName === "update_contact_info") {
            result = await executeUpdateContact(supabase, conversation.contact_id, functionArgs);
          } else if (functionName === "escalate_to_human") {
            result = await executeEscalateToHuman(supabase, workspaceId, conversationId, conversation.contact_id, functionArgs.reason);
          } else {
            result = { error: `Unknown tool: ${functionName}` };
          }
        } catch (error) {
          const e = error as Error;
          result = { error: e.message };
        }

        toolResults.push({
          tool_call_id: toolCall.id,
          role: "tool",
          content: JSON.stringify(result),
        });
      }

      // Final Groq call with tool results
      groqResponse = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${groqApiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "llama-3.3-70b-versatile",
          messages: [
            { role: "system", content: systemPrompt },
            ...conversationHistory,
            assistantMessage,
            ...toolResults,
          ],
          temperature: 0.3,
          max_tokens: 500,
          response_format: { type: "json_object" },
        }),
      });

      if (!groqResponse.ok) throw new Error("Groq final response error");
      groqData = await groqResponse.json();
      assistantMessage = groqData.choices[0].message;
    }

    // 8. Parse and Respond
    const responseData = JSON.parse(assistantMessage.content || "{}");
    const reply = responseData.reply || assistantMessage.content;

    // Log Interaction
    await supabase.from("ai_interactions").insert({
      workspace_id: workspaceId,
      conversation_id: conversationId,
      input_tokens: groqData.usage?.prompt_tokens || 0,
      output_tokens: groqData.usage?.completion_tokens || 0,
      model: "llama-3.3-70b-versatile",
      tool_calls: assistantMessage.tool_calls?.map((t: { function: { name: string } }) => t.function.name) || [],
      metadata: responseData,
    });

    // Store message in DB
    await supabase.from("messages").insert({
      conversation_id: conversationId,
      content: reply,
      sender: "ai",
    });

    return new Response(JSON.stringify({ reply, ...responseData }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    const e = error as Error;
    console.error("Error in chat-ai:", e);
    return new Response(JSON.stringify({ error: e.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

// --- Helper Functions (Ported from process-message) ---
async function executeCheckAvailability(supabase: any, workspace_id: string, agent: Agent, args: { date: string; duration_minutes?: number }) {
  const { date, duration_minutes = 30 } = args;
  const { data: calendar } = await supabase.from("calendar_connections").select("*").eq("workspace_id", workspace_id).single();
  if (!calendar) return { error: "Calendar not connected" };

  const startOfDay = `${date}T00:00:00Z`;
  const endOfDay = `${date}T23:59:59Z`;

  const res = await fetch(`https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendar.calendar_id)}/events?timeMin=${encodeURIComponent(startOfDay)}&timeMax=${encodeURIComponent(endOfDay)}&singleEvents=true`, {
    headers: { Authorization: `Bearer ${calendar.access_token}` },
  });
  if (!res.ok) return { error: "Failed to fetch calendar" };

  const data = await res.json();
  const busySlots = data.items?.map((e: { start?: { dateTime?: string; date?: string }; end?: { dateTime?: string; date?: string } }) => ({ start: e.start?.dateTime || e.start?.date, end: e.end?.dateTime || e.end?.date })) || [];

  const dayOfWeek = new Date(date).toLocaleDateString("en-US", { weekday: "long" }).toLowerCase();
  const schedule = agent.business_hours?.[dayOfWeek] || { open: "09:00", close: "17:00", closed: false };

  if (schedule.closed) return { available_slots: [], message: `Closed on ${dayOfWeek}s` };

  const openHour = parseInt(schedule.open.split(":")[0]);
  const closeHour = parseInt(schedule.close.split(":")[0]);
  const availableSlots = [];

  for (let h = openHour; h < closeHour; h++) {
    for (let m = 0; m < 60; m += 30) {
      const start = new Date(`${date}T${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:00Z`);
      const end = new Date(start.getTime() + duration_minutes * 60000);
      if (end > new Date(`${date}T${schedule.close}:00Z`)) break;

      const isBusy = busySlots.some((b: { start: string; end: string }) => {
        const bStart = new Date(b.start).getTime();
        const bEnd = new Date(b.end).getTime();
        return start.getTime() < bEnd && end.getTime() > bStart;
      });

      if (!isBusy) availableSlots.push({ start: start.toISOString(), end: end.toISOString() });
    }
  }

  return { available_slots: availableSlots.slice(0, 10), business_hours: `${schedule.open} - ${schedule.close}` };
}

async function executeBookAppointment(supabase: any, workspace_id: string, contact_id: string, args: { start_time: string; duration_minutes: number; customer_name: string; notes?: string }) {
  const { start_time, duration_minutes, customer_name, notes } = args;
  const { data: calendar } = await supabase.from("calendar_connections").select("*").eq("workspace_id", workspace_id).single();
  if (!calendar) return { error: "Calendar not connected" };

  const startDate = new Date(start_time);
  const endDate = new Date(startDate.getTime() + duration_minutes * 60000);

  const res = await fetch(`https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendar.calendar_id)}/events`, {
    method: "POST",
    headers: { Authorization: `Bearer ${calendar.access_token}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      summary: `Appointment with ${customer_name}`,
      description: notes || "Booked via AI",
      start: { dateTime: startDate.toISOString() },
      end: { dateTime: endDate.toISOString() },
    }),
  });

  if (!res.ok) return { error: "Failed to book calendar" };
  const event = await res.json();

  const { data: appointment } = await supabase.from("appointments").insert({
    workspace_id,
    contact_id,
    title: `Appointment with ${customer_name}`,
    start_time: startDate.toISOString(),
    end_time: endDate.toISOString(),
    status: "confirmed",
    google_event_id: event.id,
    booked_by: "ai",
    notes,
    metadata: { duration_minutes },
  }).select().single();

  return { success: true, appointment_id: appointment.id };
}

async function executeRescheduleAppointment(supabase: any, workspace_id: string, args: { appointment_id: string; new_start_time: string }) {
  const { appointment_id, new_start_time } = args;
  const { data: appt } = await supabase.from("appointments").select("*").eq("id", appointment_id).single();
  if (!appt) return { error: "Appointment not found" };

  const duration = appt.metadata?.duration_minutes || 30;
  const start = new Date(new_start_time);
  const end = new Date(start.getTime() + duration * 60000);

  await supabase.from("appointments").update({ start_time: start.toISOString(), end_time: end.toISOString(), status: "rescheduled" }).eq("id", appointment_id);
  return { success: true, new_time: start.toISOString() };
}

async function executeCancelAppointment(supabase: any, workspace_id: string, args: { appointment_id: string }) {
  const { appointment_id } = args;
  await supabase.from("appointments").update({ status: "cancelled" }).eq("id", appointment_id).eq("workspace_id", workspace_id);
  return { success: true };
}

async function executeUpdateContact(supabase: any, contact_id: string, args: { email?: string; name?: string; phone?: string }) {
  await supabase.from("contacts").update(args).eq("id", contact_id);
  return { success: true };
}

async function executeEscalateToHuman(supabase: any, workspace_id: string, conversation_id: string, contact_id: string, reason: string) {
  await supabase.from("conversations").update({ escalated: true, escalation_reason: reason, status: "todo", escalated_at: new Date().toISOString() }).eq("id", conversation_id);
  await supabase.from("messages").insert({ conversation_id, sender: "system", content: `⚠️ System Alert: AI initiated escalation. Reason: ${reason}` });
  return { success: true };
}
