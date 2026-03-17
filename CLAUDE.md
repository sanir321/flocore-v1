# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

FlowCore AI is a B2B SaaS platform for deploying and managing AI employees. It features:
- **Agent Hub**: LLM-powered chat agents (Groq/Llama 3.3)
- **Unified Inbox**: Multi-channel customer communication (Gmail, Slack, Telegram, Webchat, WhatsApp)
- **Knowledge Base**: RAG-powered agent knowledge
- **Escalation System**: Automated human handoff with keyword detection

## Commands

```bash
# Development
npm run dev          # Start Vite dev server

# Build & Lint
npm run build        # TypeScript compile + Vite build
npm run lint         # Run ESLint
npm run preview      # Preview production build locally
```

No test suite is currently configured.

## Architecture

### Frontend (React + Vite)
- **Entry**: `src/main.tsx` → `src/App.tsx` (React Router with lazy-loaded pages)
- **Auth**: Supabase Auth via `src/hooks/useAuth.ts`
- **State**: React Query (`@tanstack/react-query`) for server state, React context for workspace
- **Styling**: Tailwind CSS 4 with custom components in `src/components/ui/`
- **Path Alias**: `@/` maps to `src/`

### Backend (Supabase)
- **Database**: PostgreSQL with Row Level Security (RLS)
- **Edge Functions**: Deno runtime for webhooks and AI processing
- **Realtime**: Supabase Realtime subscriptions for live updates

### Key Data Flow

```
Customer Message → Webhook → messages table → DB Trigger → message_processing_queue
                                                                    ↓
                                             queue-worker Edge Function → Groq API
                                                                    ↓
                                             reply-router → Channel API → Customer
```

### Directory Structure

```
src/
├── components/         # UI components (auth/, inbox/, ui/, onboarding/)
├── context/            # React contexts (WorkspaceContext)
├── hooks/              # Custom hooks
│   └── queries/        # React Query hooks for data fetching
├── layouts/            # AppLayout for authenticated routes
├── lib/                # Utilities (api.ts, supabase.ts, notifications.ts)
├── pages/              # Route components
└── types/              # TypeScript types (database.types.ts is auto-generated)

supabase/
├── functions/          # Deno Edge Functions
│   ├── _shared/        # Shared utilities (reply-router.ts, gmail-token.ts)
│   ├── queue-worker/   # Core AI processing (invoked by pg_cron or manually)
│   ├── *-webhook/      # Channel-specific incoming webhooks
│   └── *-oauth-*/      # OAuth flows (Gmail, Slack)
└── migrations/         # SQL migrations (run via Supabase SQL Editor)
```

## Critical Files

| File | Purpose |
|------|---------|
| `supabase/functions/queue-worker/index.ts` | Core AI logic: Groq API calls, escalation handling, message processing |
| `supabase/functions/_shared/reply-router.ts` | Routes outgoing messages to channel APIs (WhatsApp, Gmail, Slack, Telegram) |
| `supabase/migrations/20260126_message_queue.sql` | Queue system with triggers and RPC functions |
| `src/types/database.types.ts` | Auto-generated Supabase database types |
| `src/hooks/queries/*.ts` | React Query hooks for data fetching |

## Environment Variables

Required (see `.env.example`):
- `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY` - Frontend Supabase connection
- `SUPABASE_SERVICE_ROLE_KEY` - Edge function admin access
- `GROQ_API_KEY` - LLM inference
- `META_WHATSAPP_TOKEN`, `META_WHATSAPP_PHONE_ID` - WhatsApp channel (optional)
- `META_WEBHOOK_VERIFY_TOKEN` - WhatsApp webhook verification

## Important Patterns

### Escalation System
- Keywords in `should_escalate_message()` RPC trigger human handoff
- Sets `assigned_to_human = true` on conversation to pause AI
- See `20260118_escalation_function.sql` and `20260315130000_fix_escalation_word_boundary.sql`

### Message Queue
- DB trigger `enqueue_customer_message()` auto-queues customer messages
- `claim_queue_items()` uses `SKIP LOCKED` for concurrent worker safety
- Queue worker groups messages by `conversation_id` to prevent duplicate replies

### Channel Metadata
Each conversation stores `channel_metadata` JSON with channel-specific fields:
- Gmail: `gmail_connection_id`, `thread_id`, `sender_email`, `subject`
- Slack: `slack_connection_id`, `channel_id`, `thread_ts`
- Telegram: `telegram_connection_id`, `chat_id`
- Webchat: No external routing needed

### Supabase Edge Functions
- Import from `https://esm.sh/@supabase/supabase-js@2` and `https://deno.land/std@0.168.0/`
- Use `Deno.env.get()` for environment variables
- Import shared code from `../_shared/module.ts`
- Deploy via `supabase functions deploy <function-name>`

## Database Schema Notes

- All tables are workspace-scoped via `workspace_id` UUID
- `conversations.assigned_to_human = true` means AI should NOT respond
- `messages.sender` can be: `customer`, `ai`, `agent`, `system`
- `knowledge_base` items are truncated to 1000 chars each in queue-worker to prevent context overflow