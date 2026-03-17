import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

Deno.serve(async (req) => {
  const url = new URL(req.url);
  const code = url.searchParams.get('code');
  const state = url.searchParams.get('state');

  const platformUrl = Deno.env.get('PLATFORM_URL')!;

  if (!code || !state) {
    return Response.redirect(`${platformUrl}/settings/channels?error=slack_missing_params`, 302);
  }

  // 1. Decode state to get userId + agentId
  let userId: string, agentId: string;
  try {
    const decoded = JSON.parse(atob(state));
    userId = decoded.userId;
    agentId = decoded.agentId;
  } catch {
    return Response.redirect(`${platformUrl}/settings/channels?error=invalid_state`, 302);
  }

  // 2. Exchange code for access token
  const tokenRes = await fetch('https://slack.com/api/oauth.v2.access', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      code,
      client_id: Deno.env.get('SLACK_CLIENT_ID')!,
      client_secret: Deno.env.get('SLACK_CLIENT_SECRET')!,
      redirect_uri: Deno.env.get('SLACK_REDIRECT_URI')!
    })
  });

  const data = await tokenRes.json();
  if (!data.ok) {
    console.error('Slack OAuth Error:', data.error);
    return Response.redirect(`${platformUrl}/settings/channels?error=slack_auth_failed`, 302);
  }

  // 3. Save to slack_connections
  const supabaseAdmin = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  );

  const { data: agent } = await supabaseAdmin
    .from('agents')
    .select('workspace_id')
    .eq('id', agentId)
    .single();

  if (!agent) {
    return Response.redirect(`${platformUrl}/settings/channels?error=agent_not_found`, 302);
  }

  await supabaseAdmin
    .from('slack_connections')
    .upsert({
      workspace_id: agent.workspace_id,
      agent_id: agentId,
      slack_team_id: data.team.id,
      slack_team_name: data.team.name,
      bot_user_id: data.bot_user_id,
      access_token: data.access_token,
      incoming_webhook_url: data.incoming_webhook?.url,
      is_active: true
    }, { onConflict: 'workspace_id,agent_id' });

  return Response.redirect(`${platformUrl}/settings/channels?connected=slack`, 302);
});
