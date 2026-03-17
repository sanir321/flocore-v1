import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

Deno.serve(async (req) => {
  // CORS Handling
  if (req.method === 'OPTIONS') {
    return new Response('ok', {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
      }
    });
  }

  // 1. Verify user JWT
  const authHeader = req.headers.get('Authorization');
  if (!authHeader) return new Response('Unauthorized', { status: 401 });

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_ANON_KEY')!,
    { global: { headers: { Authorization: authHeader } } }
  );

  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) return new Response('Unauthorized', { status: 401 });

  // 2. Get agentId from body
  const { agentId } = await req.json();
  if (!agentId) return new Response('agentId required', { status: 400 });

  const supabaseAdmin = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  );

  // 3. Get connection and revoke Google token
  const { data: connection } = await supabaseAdmin
    .from('gmail_connections')
    .select('*')
    .eq('agent_id', agentId)
    .single();

  if (connection) {
      // Revoke access token
      await fetch(`https://oauth2.googleapis.com/revoke?token=${connection.access_token}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
      });
  }

  // 4. Set is_active = false in gmail_connections
  await supabaseAdmin
    .from('gmail_connections')
    .update({ is_active: false })
    .eq('agent_id', agentId);

  return new Response(JSON.stringify({ success: true }), {
    headers: { 'Content-Type': 'application/json' }
  });
});
