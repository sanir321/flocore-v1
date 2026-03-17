import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

Deno.serve(async (req) => {
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  );

  const workspaceId = 'e4358e43-f356-44a3-816a-3a456972258a';
  const testMessage = `🔔 *System Heartbeat Test*\n\nTime: ${new Date().toISOString()}\nStatus: Manual Test Triggered\nBot Handle: @Openstyrer_bot`;

  console.log(`[Direct Test] Starting alert for workspace: ${workspaceId}`);
  
  const { data: settings } = await supabase
    .from('notification_settings')
    .select('telegram_chat_id')
    .eq('workspace_id', workspaceId)
    .single();

  if (!settings?.telegram_chat_id) {
      return new Response("No chat_id found", { status: 400 });
  }

  const { data: connection } = await supabase
    .from('telegram_connections')
    .select('bot_token')
    .eq('workspace_id', workspaceId)
    .eq('is_active', true)
    .limit(1)
    .maybeSingle();

  if (!connection?.bot_token) {
      return new Response("No bot_token found", { status: 400 });
  }

  console.log(`[Direct Test] Sending to Chat: ${settings.telegram_chat_id} using Token: ...${connection.bot_token.slice(-6)}`);

  try {
    const res = await fetch(`https://api.telegram.org/bot${connection.bot_token}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: settings.telegram_chat_id,
          text: testMessage,
          parse_mode: 'Markdown'
        })
      });
      
      const data = await res.json();
      console.log(`[Direct Test] API Result:`, JSON.stringify(data));
      return new Response(JSON.stringify(data), { headers: { 'Content-Type': 'application/json' } });
  } catch (err: any) {
      console.error(`[Direct Test] Fetch Exception:`, err.message);
      return new Response(err.message, { status: 500 });
  }
});
