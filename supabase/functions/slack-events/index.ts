import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

Deno.serve(async (req) => {
  const body = await req.json();

  // 1. Handle Slack URL verification challenge
  if (body.type === 'url_verification') {
    return new Response(JSON.stringify({ challenge: body.challenge }), {
      headers: { 'Content-Type': 'application/json' }
    });
  }

  // 2. Handle events
  if (body.type === 'event_callback') {
    const event = body.event;
    
    // Process message events
    if (event.type === 'message' && !event.bot_id && event.text) {
      await handleSlackMessage(body.team_id, event);
    }
  }

  return new Response('ok', { status: 200 });
});

async function handleSlackMessage(teamId: string, event: any) {
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  );

  // 1. Get the connection for this team
  const { data: connection } = await supabase
    .from('slack_connections')
    .select('*')
    .eq('slack_team_id', teamId)
    .single();

  if (!connection || !connection.is_active) return;

  // 2. Upsert contact (use Slack user ID)
  const { data: contact } = await supabase
    .from('contacts')
    .upsert({
      workspace_id: connection.workspace_id,
      external_id: `slack_${event.user}`,
      name: `Slack User ${event.user}`, // Slack doesn't provide name in event usually
      channel: 'slack'
    }, { onConflict: 'workspace_id,external_id' })
    .select()
    .single();

  // 3. Upsert conversation (Slack channel + user = session)
  const { data: conversation } = await supabase
    .from('conversations')
    .upsert({
      workspace_id: connection.workspace_id,
      agent_id: connection.agent_id,
      contact_id: contact.id,
      channel: 'slack',
      session_id: `slack_${event.channel}_${event.user}`,
      channel_metadata: {
        channel_id: event.channel,
        team_id: teamId,
        slack_user_id: event.user,
        slack_connection_id: connection.id
      },
      status: 'open'
    }, { onConflict: 'workspace_id,session_id' })
    .select()
    .single();

  // 4. Insert message
  await supabase.from('messages').insert({
    workspace_id: connection.workspace_id,
    conversation_id: conversation.id,
    contact_id: contact.id,
    content: event.text,
    channel: 'slack',
    direction: 'inbound',
    external_id: event.client_msg_id || event.ts,
    metadata: { slack_ts: event.ts }
  });
}
