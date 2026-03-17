// @ts-nocheck
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const GOOGLE_CLIENT_ID = Deno.env.get('GOOGLE_CLIENT_ID')!
const GOOGLE_CLIENT_SECRET = Deno.env.get('GOOGLE_CLIENT_SECRET')!
const REDIRECT_URI = Deno.env.get('GOOGLE_REDIRECT_URI') || 'https://wfseydnisxyizuczfpey.supabase.co/functions/v1/calendar-oauth/callback'

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  const url = new URL(req.url)
  const path = url.pathname.split('/').pop()

  try {
    // Start OAuth flow
    if (path === 'authorize' || path === 'calendar-oauth') {
      const workspaceId = url.searchParams.get('workspace_id')
      if (!workspaceId) {
        return new Response('Missing workspace_id', { status: 400 })
      }

      const authUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth')
      authUrl.searchParams.set('client_id', GOOGLE_CLIENT_ID)
      authUrl.searchParams.set('redirect_uri', REDIRECT_URI)
      authUrl.searchParams.set('response_type', 'code')
      authUrl.searchParams.set('scope', 'https://www.googleapis.com/auth/calendar')
      authUrl.searchParams.set('access_type', 'offline')
      authUrl.searchParams.set('prompt', 'consent')
      authUrl.searchParams.set('state', workspaceId)

      return Response.redirect(authUrl.toString(), 302)
    }

    // Handle OAuth callback
    if (path === 'callback') {
      const code = url.searchParams.get('code')
      const workspaceId = url.searchParams.get('state')

      if (!code || !workspaceId) {
        return new Response('Missing code or state', { status: 400 })
      }

      // Exchange code for tokens
      const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          code,
          client_id: GOOGLE_CLIENT_ID,
          client_secret: GOOGLE_CLIENT_SECRET,
          redirect_uri: REDIRECT_URI,
          grant_type: 'authorization_code'
        })
      })

      const tokens = await tokenResponse.json()

      if (tokens.error) {
        console.error('Token error:', tokens)
        return new Response(`OAuth error: ${tokens.error_description}`, { status: 400 })
      }

      // Store tokens in database
      const supabaseUrl = Deno.env.get('SUPABASE_URL')!
      const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
      const supabase = createClient(supabaseUrl, supabaseKey)

      const expiresAt = new Date(Date.now() + tokens.expires_in * 1000).toISOString()

      // Upsert calendar connection
      const { error } = await supabase
        .from('calendar_connections')
        .upsert({
          workspace_id: workspaceId,
          provider: 'google',
          access_token: tokens.access_token,
          refresh_token: tokens.refresh_token,
          token_expires_at: expiresAt,
          connected: true
        }, {
          onConflict: 'workspace_id'
        })

      if (error) {
        console.error('Database error:', error)
        return new Response('Failed to save tokens', { status: 500 })
      }

      // Redirect back to settings
      // We check for a FRONTEND_URL env var, or default to localhost:4173 which the user is using.
      // We also check the Origin header if available, but for redirects from Google, 
      // it's better to rely on a known good URL or environment variable.
      const frontendUrl = Deno.env.get('FRONTEND_URL') || 'http://localhost:4173'
      return Response.redirect(`${frontendUrl}/settings/calendar?success=true`, 302)
    }

    return new Response('Not found', { status: 404 })

  } catch (error: any) {
    console.error('OAuth error:', error)
    return new Response(
      JSON.stringify({ error: error?.message || 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
