import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

Deno.serve(async (req) => {
  const url = new URL(req.url);
  const code = url.searchParams.get('code');
  const state = url.searchParams.get('state');
  const error = url.searchParams.get('error');

  const platformUrl = Deno.env.get('PLATFORM_URL')!;

  // 1. Handle user denial
  if (error || !code || !state) {
    return Response.redirect(`${platformUrl}/settings/channels?error=gmail_denied`, 302);
  }

  // 2. Decode state to get userId + agentId
  let userId: string, agentId: string;
  try {
    const decoded = JSON.parse(atob(state));
    userId = decoded.userId;
    agentId = decoded.agentId;
  } catch {
    return Response.redirect(`${platformUrl}/settings/channels?error=invalid_state`, 302);
  }

  // 3. Exchange code for tokens
  const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      code,
      client_id: Deno.env.get('GOOGLE_CLIENT_ID')!,
      client_secret: Deno.env.get('GOOGLE_CLIENT_SECRET')!,
      redirect_uri: Deno.env.get('GOOGLE_REDIRECT_URI')!,
      grant_type: 'authorization_code'
    })
  });

  const tokens = await tokenRes.json();

  if (!tokens.access_token || !tokens.refresh_token) {
    // refresh_token missing = user already connected before without prompt:consent
    return Response.redirect(`${platformUrl}/settings/channels?error=no_refresh_token`, 302);
  }

  // 4. Get user's Gmail address
  const profileRes = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
    headers: { Authorization: `Bearer ${tokens.access_token}` }
  });
  const profile = await profileRes.json();
  const gmailAddress = profile.email;

  // 5. Get initial historyId from Gmail (used for polling later)
  const historyRes = await fetch(
    'https://gmail.googleapis.com/gmail/v1/users/me/profile',
    { headers: { Authorization: `Bearer ${tokens.access_token}` } }
  );
  const gmailProfile = await historyRes.json();
  const historyId = gmailProfile.historyId;

  // 6. Calculate token expiry time
  const tokenExpiry = new Date(Date.now() + tokens.expires_in * 1000).toISOString();

  // 7. Save to gmail_connections using service role
  const supabaseAdmin = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  );

  // Get workspace_id from agent
  const { data: agent } = await supabaseAdmin
    .from('agents')
    .select('workspace_id')
    .eq('id', agentId)
    .single();

  if (!agent) {
    return Response.redirect(`${platformUrl}/settings/channels?error=agent_not_found`, 302);
  }

  const { error: dbError } = await supabaseAdmin
    .from('gmail_connections')
    .upsert({
      workspace_id: agent.workspace_id,
      agent_id: agentId,
      gmail_address: gmailAddress,
      access_token: tokens.access_token,
      refresh_token: tokens.refresh_token,
      token_expiry: tokenExpiry,
      history_id: historyId,
      is_active: true,
      connected_at: new Date().toISOString()
    }, { onConflict: 'workspace_id,agent_id' });

  if (dbError) {
    console.error('Database Error:', dbError);
    return Response.redirect(`${platformUrl}/settings/channels?error=db_error`, 302);
  }

  // 8. Redirect back to platform with success
  return Response.redirect(`${platformUrl}/settings/channels?connected=gmail`, 302);
});
