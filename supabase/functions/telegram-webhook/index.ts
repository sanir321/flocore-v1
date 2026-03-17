import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

Deno.serve(async (req) => {
  const body = await req.json();

  if (!body.message) return new Response('ok', { status: 200 });

  const message = body.message;
  const chat = message.chat;
  const from = message.from;
  const text = message.text;

  if (!text) return new Response('ok', { status: 200 });

  // 1. Get bot token from header (set your webhook to something like .../telegram-webhook?token=BOT_TOKEN)
  const url = new URL(req.url);
  const token = url.searchParams.get('token');
  if (!token) return new Response('Unauthorized', { status: 401 });

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  );

  // 2. Find connection by token
  const { data: connection } = await supabase
    .from('telegram_connections')
    .select('*')
    .eq('bot_token', token)
    .single();

  if (!connection || !connection.is_active) return new Response('ok', { status: 200 });

  // 3. Upsert contact
  const { data: contact } = await supabase
    .from('contacts')
    .upsert({
      workspace_id: connection.workspace_id,
      external_id: `telegram_${from.id}`,
      name: `${from.first_name || ''} ${from.last_name || ''}`.trim() || from.username || `User ${from.id}`,
      channel: 'telegram'
    }, { onConflict: 'workspace_id,external_id' })
    .select()
    .single();

  // 4. Upsert conversation
  const { data: conversation } = await supabase
    .from('conversations')
    .upsert({
      workspace_id: connection.workspace_id,
      agent_id: connection.agent_id,
      contact_id: contact.id,
      channel: 'telegram',
      session_id: `telegram_${chat.id}`,
      channel_metadata: {
        chat_id: chat.id,
        telegram_user_id: from.id,
        telegram_connection_id: connection.id
      },
      status: 'open'
    }, { onConflict: 'workspace_id,session_id' })
    .select()
    .single();

  // 5. Insert message
  await supabase.from('messages').insert({
    workspace_id: connection.workspace_id,
    conversation_id: conversation.id,
    contact_id: contact.id,
    content: text,
    channel: 'telegram',
    direction: 'inbound',
    external_id: `tg_${message.message_id}`,
    metadata: { telegram_message_id: message.message_id }
  });

  return new Response('ok', { status: 200 });
});
