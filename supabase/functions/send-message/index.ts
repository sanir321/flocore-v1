// @ts-nocheck
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";
import { sendReply } from "../_shared/reply-router.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "No authorization header" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await createClient(
      supabaseUrl, 
      Deno.env.get("SUPABASE_ANON_KEY")!
    ).auth.getUser(token);

    if (authError || !user) {
      console.error("[Auth Error]:", authError);
      console.error("[User Error]: user is", user);
      return new Response(JSON.stringify({ error: "Unauthorized", details: authError }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { workspaceId, conversationId, message } = await req.json();

    if (!workspaceId || !conversationId || !message) {
      return new Response(JSON.stringify({ error: "Missing required fields" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: workspace } = await supabase
      .from("workspaces")
      .select("id")
      .eq("id", workspaceId)
      .eq("user_id", user.id)
      .single();

    if (!workspace) {
      return new Response(JSON.stringify({ error: "Workspace access denied" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: conversation } = await supabase
      .from("conversations")
      .select("*, contacts(*)")
      .eq("id", conversationId)
      .single();

    if (!conversation) {
      return new Response(JSON.stringify({ error: "Conversation not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const replyMeta = {
      ...conversation.channel_metadata,
      workspace_id: workspaceId,
      phone: conversation.contacts?.phone || null,
      sender_email: conversation.contacts?.email || null
    };

    console.log(`[Send Message] Prepared replyMeta:`, JSON.stringify(replyMeta, null, 2));

    await sendReply(conversation.channel, replyMeta, message, supabase);

    console.log(`[Send Message] sendReply call completed for channel: ${conversation.channel}`);

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error: any) {
    console.error("Error in send-message:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
