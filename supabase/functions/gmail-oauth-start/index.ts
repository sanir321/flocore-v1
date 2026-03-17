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

  // 1. Verify user JWT (passed as query param or header since this is a redirect link)
  const url = new URL(req.url);
  const jwt = url.searchParams.get('token');
  const agentId = url.searchParams.get('agentId');
  
  if (!jwt || !agentId) {
    return new Response('Missing token or agentId', { status: 400 });
  }

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_ANON_KEY')!,
    { global: { headers: { Authorization: `Bearer ${jwt}` } } }
  );

  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) return new Response('Unauthorized', { status: 401 });

  // 3. Build state param — encode userId + agentId so callback knows who this is
  const state = btoa(JSON.stringify({ userId: user.id, agentId }));

  // 4. Build Google OAuth URL
  const params = new URLSearchParams({
    client_id: Deno.env.get('GOOGLE_CLIENT_ID')!,
    redirect_uri: Deno.env.get('GOOGLE_REDIRECT_URI')!,
    response_type: 'code',
    scope: [
      'https://www.googleapis.com/auth/gmail.readonly',
      'https://www.googleapis.com/auth/gmail.send',
      'https://www.googleapis.com/auth/gmail.modify',
      'https://www.googleapis.com/auth/userinfo.email'
    ].join(' '),
    access_type: 'offline',      // CRITICAL: gets refresh_token
    prompt: 'consent',           // CRITICAL: forces refresh_token every time
    state
  });

  const googleAuthUrl = `https://accounts.google.com/o/oauth2/v2/auth?${params}`;

  // 5. Redirect user to Google
  return Response.redirect(googleAuthUrl, 302);
});
