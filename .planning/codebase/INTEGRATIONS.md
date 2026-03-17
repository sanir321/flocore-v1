# External Integrations

**Analysis Date:** 2026-03-15

## APIs & External Services

**AI Services:**
- Groq - AI inference API for chat completions and voice transcription
  - SDK/Client: Native fetch API
  - Auth: GROQ_API_KEY environment variable

**Messaging Platforms:**
- WhatsApp Business Cloud API - Messaging platform integration
  - SDK/Client: Native fetch API
  - Auth: META_WHATSAPP_TOKEN, META_WHATSAPP_PHONE_ID, META_WEBHOOK_VERIFY_TOKEN

**Email Services:**
- Gmail API - Email integration for inbox management
  - SDK/Client: Native fetch API
  - Auth: GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GOOGLE_REDIRECT_URI

**Calendar Services:**
- Google Calendar API - Calendar integration for appointment scheduling
  - SDK/Client: Native fetch API
  - Auth: Access tokens stored in database from OAuth flow

**Voice Services:**
- Groq Whisper - Voice note transcription service
  - SDK/Client: Native fetch API
  - Auth: GROQ_API_KEY environment variable

## Data Storage

**Databases:**
- Supabase PostgreSQL
  - Connection: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, SUPABASE_ANON_KEY
  - Client: @supabase/supabase-js

**File Storage:**
- Supabase Storage - File storage service
  - Connection: Same as database connection through Supabase client

**Caching:**
- None detected

## Authentication & Identity

**Auth Provider:**
- Supabase Auth
  - Implementation: Supabase client authentication methods

## Monitoring & Observability

**Error Tracking:**
- None detected

**Logs:**
- Console logging in Edge Functions
- Database audit logs table for tracking events

## CI/CD & Deployment

**Hosting:**
- Supabase - Database, auth, edge functions, and storage
- Vercel/Netlify/Static Hosting - Frontend deployment (inferred)

**CI Pipeline:**
- None detected

## Environment Configuration

**Required env vars:**
- VITE_SUPABASE_URL - Supabase project URL
- VITE_SUPABASE_ANON_KEY - Supabase anon key for client access
- META_WHATSAPP_PHONE_ID - WhatsApp Business phone ID
- META_WHATSAPP_TOKEN - WhatsApp Business access token
- META_WEBHOOK_VERIFY_TOKEN - Token to verify webhook requests
- GROQ_API_KEY - API key for Groq AI services
- GOOGLE_CLIENT_ID - Google OAuth client ID
- GOOGLE_CLIENT_SECRET - Google OAuth client secret
- GOOGLE_REDIRECT_URI - Google OAuth redirect URI
- SUPABASE_SERVICE_ROLE_KEY - Supabase service role key for backend functions

**Secrets location:**
- Environment variables in deployment platform
- Supabase Dashboard for project-level secrets

## Webhooks & Callbacks

**Incoming:**
- `/functions/whatsapp-webhook` - WhatsApp message notifications
- `/functions/gmail-oauth-callback` - Gmail OAuth callback endpoint

**Outgoing:**
- Google APIs (Calendar, Gmail) - API calls for calendar and email operations
- Groq API - AI inference requests
- Meta WhatsApp API - Sending messages and media operations

---

*Integration audit: 2026-03-15*