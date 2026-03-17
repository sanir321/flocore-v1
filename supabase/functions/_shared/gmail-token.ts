import { SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2';

export async function getValidAccessToken(
  supabase: SupabaseClient,
  connectionId: string,
  currentToken: string,
  refreshToken: string,
  tokenExpiry: string
): Promise<{ token?: string, error?: string, refreshed?: boolean }> {
  const now = new Date();
  const expiry = new Date(tokenExpiry);

  // If token is still valid (with 5 min buffer), return it
  if (expiry.getTime() - now.getTime() > 5 * 60 * 1000) {
    return { token: currentToken };
  }

  // Token expired — refresh it
  try {
    const res = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: Deno.env.get('GOOGLE_CLIENT_ID')!,
        client_secret: Deno.env.get('GOOGLE_CLIENT_SECRET')!,
        refresh_token: refreshToken,
        grant_type: 'refresh_token'
      })
    });

    const tokens = await res.json();

    if (!tokens.access_token) {
      return { error: 'Refresh failed: ' + JSON.stringify(tokens) };
    }

    const newExpiry = new Date(Date.now() + tokens.expires_in * 1000).toISOString();

    // Save new access token to DB
    const { error: dbErr } = await supabase
      .from('gmail_connections')
      .update({
        access_token: tokens.access_token,
        token_expiry: newExpiry
      })
      .eq('id', connectionId);

    if (dbErr) return { error: 'DB update failed: ' + dbErr.message };

    return { token: tokens.access_token, refreshed: true };
  } catch (e: any) {
    return { error: 'Exception: ' + e.message };
  }
}
