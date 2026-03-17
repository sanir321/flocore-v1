# FlowCore AI
**Enterprise Agentic Employee Platform**

FlowCore AI is a comprehensive B2B SaaS platform designed to deploy, manage, and scale AI employees. It integrates advanced LLMs, Voice Agents, and a Unified Inbox to automate complex business workflows while maintaining human oversight.

![FlowCore AI Dashboard](./conduit_agent_hub_1768716482396.png)

## 🚀 Product Overview

FlowCore AI acts as the "Operating System" for your AI workforce. It allows businesses to create specialized agents that handle customer support, appointment scheduling, and lead qualification across multiple channels (WhatsApp, Web, Voice).

### Key Modules

#### 1. Agent Hub
The central command center for managing AI personnel.
-   **Chat Agents:** Text-based agents powered by Llama 3.3 / Mixtral for instant customer support.
-   **Voice Agents (Coming Soon):** Real-time bi-directional voice capabilities.
-   **Tools Configuration:** Granular control over what an agent can do (Book Appointments, Check Availability).

#### 2. Unified Omni-Channel Inbox
A single interface for human-AI collaboration.
-   **Live Monitoring:** Watch AI conversations in real-time.
-   **Smart Handoff:** "Take Over" button instantly pauses AI and allows human intervention.
-   **Escalation System:** Automated detection of frustrated customers with "Escalated" tagging and staff notifications.
-   **WhatsApp Integration:** Native Two-Way integration via Meta WhatsApp Cloud API.

#### 3. Knowledge Base (RAG)
Empower agents with your business data.
-   **Website Scraper:** One-click import of business hours, FAQs, and services from your URL.
-   **Document Upload:** Support for policies and internal procedure documents.
-   **Semantic Search:** AI retrieves the most relevant context before answering.

## 🛠️ Technical Architecture

Designed for security, scalability, and performance.

| Component | Technology | Description |
| :--- | :--- | :--- |
| **Frontend** | React + Vite | Fast, responsive Single Page Application (SPA). |
| **Styling** | Vanilla CSS | Modern, premium UI utilizing native CSS features. |
| **Backend** | Supabase | Postgres Database, Auth, and Realtime Subscriptions. |
| **Compute** | Edge Functions | Low-latency serverless functions for AI logic and webhooks. |
| **AI Inference** | Groq / Ollama | Ultra-fast token generation for near-human latency. |
| **Messaging** | Meta WhatsApp | Official WhatsApp Cloud API integration. |

## 📦 Deployment & Setup

### Prerequisites
-   Node.js 18+
-   Supabase Project
-   Meta WhatsApp Business Account (for official API)
-   Groq API Key (for LLM inference)

### Environment Configuration
Create a `.env` file in the root directory:

```env
VITE_SUPABASE_URL=your_project_url
VITE_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
GROQ_API_KEY=your_groq_key
META_WHATSAPP_TOKEN=your_meta_access_token
META_PHONE_NUMBER_ID=your_phone_id
META_WEBHOOK_VERIFY_TOKEN=your_custom_verify_token
```

### Installation

```bash
# Install dependencies
npm install

# Start local development server
npm run dev
```

### Database Migrations
FlowCore AI manages its own schema. Run the idempotency migration script provided in `migration_idempotency.sql` via the Supabase SQL Editor to set up:
-   `profiles`, `workspaces`, `agents` tables
-   RLS (Row Level Security) policies
-   Storage buckets for Knowledge Base

## 🔒 Security & Compliance

-   **Role-Based Access:** Strict separation between Workspace Owners and Members.
-   **Data Isolation:** All data is strictly scoped to `workspace_id`.
-   **Audit Logs:** Critical actions (Agent changes, Escalations) are logged (Roadmap).

---
*© 2026 FlowCore AI. All Rights Reserved. Proprietary Software.*
