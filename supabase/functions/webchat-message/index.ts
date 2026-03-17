import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

Deno.serve(async (req) => {
  const { action, agentId, visitorId, content, sessionId } = await req.json();

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  );

  // 1. Get workspace_id from agent
  const { data: agent } = await supabase
    .from('agents')
    .select('workspace_id')
    .eq('id', agentId)
    .single();

  if (!agent) return new Response('Agent not found', { status: 404 });

  // 2. Upsert contact (anonymous visitor)
  const { data: contact } = await supabase
    .from('contacts')
    .upsert({
      workspace_id: agent.workspace_id,
      external_id: `webchat_${visitorId}`,
      name: `Visitor ${visitorId.substring(0, 5)}`,
      channel: 'webchat'
    }, { onConflict: 'workspace_id,external_id' })
    .select()
    .single();

  // 3. Upsert conversation
  const { data: conversation } = await supabase
    .from('conversations')
    .upsert({
      workspace_id: agent.workspace_id,
      agent_id: agentId,
      contact_id: contact.id,
      channel: 'webchat',
      session_id: sessionId,
      status: 'open'
    }, { onConflict: 'workspace_id,session_id' })
    .select()
    .single();

  // 4. Insert message
  const { data: message, error } = await supabase.from('messages').insert({
    workspace_id: agent.workspace_id,
    conversation_id: conversation.id,
    contact_id: contact.id,
    content: content,
    channel: 'webchat',
    direction: 'inbound'
  }).select().single();

  if (error) return new Response(error.message, { status: 500 });

  return new Response(JSON.stringify(message), {
    headers: { 'Content-Type': 'application/json' }
  });
});
