export type Json =
    | string
    | number
    | boolean
    | null
    | { [key: string]: Json | undefined }
    | Json[]

export type Database = {
    public: {
        Tables: {
            agent_wiki: {
                Row: {
                    business_info: string | null
                    conflict_handling: string | null
                    faqs: string | null
                    procedures: string | null
                    updated_at: string | null
                    workspace_id: string
                }
                Insert: {
                    business_info?: string | null
                    conflict_handling?: string | null
                    faqs?: string | null
                    procedures?: string | null
                    updated_at?: string | null
                    workspace_id: string
                }
                Update: {
                    business_info?: string | null
                    conflict_handling?: string | null
                    faqs?: string | null
                    procedures?: string | null
                    updated_at?: string | null
                    workspace_id?: string
                }
                Relationships: [
                    {
                        foreignKeyName: "agent_wiki_workspace_id_fkey"
                        columns: ["workspace_id"]
                        isOneToOne: true
                        referencedRelation: "workspaces"
                        referencedColumns: ["id"]
                    },
                ]
            }
            agents: {
                Row: {
                    active: boolean | null
                    created_at: string | null
                    id: string
                    model: string | null
                    name: string
                    system_prompt: string
                    type: string
                    updated_at: string | null
                    workspace_id: string
                }
                Insert: {
                    active?: boolean | null
                    created_at?: string | null
                    id?: string
                    model?: string | null
                    name: string
                    system_prompt: string
                    type: string
                    updated_at?: string | null
                    workspace_id: string
                }
                Update: {
                    active?: boolean | null
                    created_at?: string | null
                    id?: string
                    model?: string | null
                    name?: string
                    system_prompt?: string
                    type?: string
                    updated_at?: string | null
                    workspace_id?: string
                }
                Relationships: [
                    {
                        foreignKeyName: "agents_workspace_id_fkey"
                        columns: ["workspace_id"]
                        isOneToOne: false
                        referencedRelation: "workspaces"
                        referencedColumns: ["id"]
                    },
                ]
            }
            ai_interactions: {
                Row: {
                    agent_id: string | null
                    completion_tokens: number | null
                    conversation_id: string | null
                    created_at: string | null
                    escalated: boolean | null
                    id: string
                    latency_ms: number | null
                    model: string | null
                    prompt_tokens: number | null
                    tool_calls: Json | null
                    total_tokens: number | null
                    workspace_id: string
                }
                Insert: {
                    agent_id?: string | null
                    completion_tokens?: number | null
                    conversation_id?: string | null
                    created_at?: string | null
                    escalated?: boolean | null
                    id?: string
                    latency_ms?: number | null
                    model?: string | null
                    prompt_tokens?: number | null
                    tool_calls?: Json | null
                    total_tokens?: number | null
                    workspace_id: string
                }
                Update: {
                    agent_id?: string | null
                    completion_tokens?: number | null
                    conversation_id?: string | null
                    created_at?: string | null
                    escalated?: boolean | null
                    id?: string
                    latency_ms?: number | null
                    model?: string | null
                    prompt_tokens?: number | null
                    tool_calls?: Json | null
                    total_tokens?: number | null
                    workspace_id?: string
                }
                Relationships: [
                    {
                        foreignKeyName: "ai_interactions_agent_id_fkey"
                        columns: ["agent_id"]
                        isOneToOne: false
                        referencedRelation: "agents"
                        referencedColumns: ["id"]
                    },
                    {
                        foreignKeyName: "ai_interactions_conversation_id_fkey"
                        columns: ["conversation_id"]
                        isOneToOne: false
                        referencedRelation: "conversations"
                        referencedColumns: ["id"]
                    },
                    {
                        foreignKeyName: "ai_interactions_workspace_id_fkey"
                        columns: ["workspace_id"]
                        isOneToOne: false
                        referencedRelation: "workspaces"
                        referencedColumns: ["id"]
                    },
                ]
            }
            appointments: {
                Row: {
                    booked_by: string
                    contact_id: string
                    conversation_id: string | null
                    created_at: string | null
                    end_time: string
                    google_event_id: string | null
                    id: string
                    metadata: Json | null
                    notes: string | null
                    start_time: string
                    status: string | null
                    title: string | null
                    updated_at: string | null
                    workspace_id: string
                }
                Insert: {
                    booked_by: string
                    contact_id: string
                    conversation_id?: string | null
                    created_at?: string | null
                    end_time: string
                    google_event_id?: string | null
                    id?: string
                    metadata?: Json | null
                    notes?: string | null
                    start_time: string
                    status?: string | null
                    title?: string | null
                    updated_at?: string | null
                    workspace_id: string
                }
                Update: {
                    booked_by?: string
                    contact_id?: string
                    conversation_id?: string | null
                    created_at?: string | null
                    end_time?: string
                    google_event_id?: string | null
                    id?: string
                    metadata?: Json | null
                    notes?: string | null
                    start_time?: string
                    status?: string | null
                    title?: string | null
                    updated_at?: string | null
                    workspace_id?: string
                }
                Relationships: [
                    {
                        foreignKeyName: "appointments_contact_id_fkey"
                        columns: ["contact_id"]
                        isOneToOne: false
                        referencedRelation: "contacts"
                        referencedColumns: ["id"]
                    },
                    {
                        foreignKeyName: "appointments_conversation_id_fkey"
                        columns: ["conversation_id"]
                        isOneToOne: false
                        referencedRelation: "conversations"
                        referencedColumns: ["id"]
                    },
                    {
                        foreignKeyName: "appointments_workspace_id_fkey"
                        columns: ["workspace_id"]
                        isOneToOne: false
                        referencedRelation: "workspaces"
                        referencedColumns: ["id"]
                    },
                ]
            }
            audit_logs: {
                Row: {
                    action: string
                    created_at: string | null
                    id: string
                    ip_address: unknown | null
                    metadata: Json | null
                    resource_id: string | null
                    resource_type: string | null
                    user_id: string | null
                    workspace_id: string | null
                }
                Insert: {
                    action: string
                    created_at?: string | null
                    id?: string
                    ip_address?: unknown | null
                    metadata?: Json | null
                    resource_id?: string | null
                    resource_type?: string | null
                    user_id?: string | null
                    workspace_id?: string | null
                }
                Update: {
                    action?: string
                    created_at?: string | null
                    id?: string
                    ip_address?: unknown | null
                    metadata?: Json | null
                    resource_id?: string | null
                    resource_type?: string | null
                    user_id?: string | null
                    workspace_id?: string | null
                }
                Relationships: [
                    {
                        foreignKeyName: "audit_logs_workspace_id_fkey"
                        columns: ["workspace_id"]
                        isOneToOne: false
                        referencedRelation: "workspaces"
                        referencedColumns: ["id"]
                    },
                ]
            }
            calendar_connections: {
                Row: {
                    access_token: string | null
                    calendar_email: string | null
                    calendar_id: string | null
                    connected: boolean | null
                    created_at: string | null
                    last_sync_at: string | null
                    provider: string | null
                    refresh_token: string | null
                    sync_errors: string | null
                    token_expires_at: string | null
                    updated_at: string | null
                    workspace_id: string
                }
                Insert: {
                    access_token?: string | null
                    calendar_email?: string | null
                    calendar_id?: string | null
                    connected?: boolean | null
                    created_at?: string | null
                    last_sync_at?: string | null
                    provider?: string | null
                    refresh_token?: string | null
                    sync_errors?: string | null
                    token_expires_at?: string | null
                    updated_at?: string | null
                    workspace_id: string
                }
                Update: {
                    access_token?: string | null
                    calendar_email?: string | null
                    calendar_id?: string | null
                    connected?: boolean | null
                    created_at?: string | null
                    last_sync_at?: string | null
                    provider?: string | null
                    refresh_token?: string | null
                    sync_errors?: string | null
                    token_expires_at?: string | null
                    updated_at?: string | null
                    workspace_id?: string
                }
                Relationships: [
                    {
                        foreignKeyName: "calendar_connections_workspace_id_fkey"
                        columns: ["workspace_id"]
                        isOneToOne: true
                        referencedRelation: "workspaces"
                        referencedColumns: ["id"]
                    },
                ]
            }
            contacts: {
                Row: {
                    channel: string | null
                    created_at: string | null
                    email: string | null
                    id: string
                    metadata: Json | null
                    name: string | null
                    phone: string
                    tags: string[] | null
                    updated_at: string | null
                    workspace_id: string
                }
                Insert: {
                    channel?: string | null
                    created_at?: string | null
                    email?: string | null
                    id?: string
                    metadata?: Json | null
                    name?: string | null
                    phone: string
                    tags?: string[] | null
                    updated_at?: string | null
                    workspace_id: string
                }
                Update: {
                    channel?: string | null
                    created_at?: string | null
                    email?: string | null
                    id?: string
                    metadata?: Json | null
                    name?: string | null
                    phone?: string
                    tags?: string[] | null
                    updated_at?: string | null
                    workspace_id?: string
                }
                Relationships: [
                    {
                        foreignKeyName: "contacts_workspace_id_fkey"
                        columns: ["workspace_id"]
                        isOneToOne: false
                        referencedRelation: "workspaces"
                        referencedColumns: ["id"]
                    },
                ]
            }
            conversations: {
                Row: {
                    assigned_at: string | null
                    assigned_to_human: boolean | null
                    assigned_to_user_id: string | null
                    channel: string
                    contact_id: string
                    created_at: string | null
                    escalated: boolean | null
                    escalated_at: string | null
                    escalation_reason: string | null
                    id: string
                    last_message_at: string | null
                    status: string | null
                    updated_at: string | null
                    workspace_id: string
                }
                Insert: {
                    assigned_at?: string | null
                    assigned_to_human?: boolean | null
                    assigned_to_user_id?: string | null
                    channel: string
                    contact_id: string
                    created_at?: string | null
                    escalated?: boolean | null
                    escalated_at?: string | null
                    escalation_reason?: string | null
                    id?: string
                    last_message_at?: string | null
                    status?: string | null
                    updated_at?: string | null
                    workspace_id: string
                }
                Update: {
                    assigned_at?: string | null
                    assigned_to_human?: boolean | null
                    assigned_to_user_id?: string | null
                    channel?: string
                    contact_id?: string
                    created_at?: string | null
                    escalated?: boolean | null
                    escalated_at?: string | null
                    escalation_reason?: string | null
                    id?: string
                    last_message_at?: string | null
                    status?: string | null
                    updated_at?: string | null
                    workspace_id?: string
                }
                Relationships: [
                    {
                        foreignKeyName: "conversations_contact_id_fkey"
                        columns: ["contact_id"]
                        isOneToOne: false
                        referencedRelation: "contacts"
                        referencedColumns: ["id"]
                    },
                    {
                        foreignKeyName: "conversations_workspace_id_fkey"
                        columns: ["workspace_id"]
                        isOneToOne: false
                        referencedRelation: "workspaces"
                        referencedColumns: ["id"]
                    },
                ]
            }
            escalation_rules: {
                Row: {
                    angry_language: boolean | null
                    custom_keywords: string[] | null
                    pricing_dispute: boolean | null
                    talk_to_human: boolean | null
                    updated_at: string | null
                    workspace_id: string
                }
                Insert: {
                    angry_language?: boolean | null
                    custom_keywords?: string[] | null
                    pricing_dispute?: boolean | null
                    talk_to_human?: boolean | null
                    updated_at?: string | null
                    workspace_id: string
                }
                Update: {
                    angry_language?: boolean | null
                    custom_keywords?: string[] | null
                    pricing_dispute?: boolean | null
                    talk_to_human?: boolean | null
                    updated_at?: string | null
                    workspace_id?: string
                }
                Relationships: [
                    {
                        foreignKeyName: "escalation_rules_workspace_id_fkey"
                        columns: ["workspace_id"]
                        isOneToOne: true
                        referencedRelation: "workspaces"
                        referencedColumns: ["id"]
                    },
                ]
            }
            messages: {
                Row: {
                    content: string
                    conversation_id: string
                    created_at: string | null
                    id: string
                    media_type: string | null
                    media_url: string | null
                    metadata: Json | null
                    sender: string
                }
                Insert: {
                    content: string
                    conversation_id: string
                    created_at?: string | null
                    id?: string
                    media_type?: string | null
                    media_url?: string | null
                    metadata?: Json | null
                    sender: string
                }
                Update: {
                    content?: string
                    conversation_id?: string
                    created_at?: string | null
                    id?: string
                    media_type?: string | null
                    media_url?: string | null
                    metadata?: Json | null
                    sender?: string
                }
                Relationships: [
                    {
                        foreignKeyName: "messages_conversation_id_fkey"
                        columns: ["conversation_id"]
                        isOneToOne: false
                        referencedRelation: "conversations"
                        referencedColumns: ["id"]
                    },
                ]
            }
            whatsapp_connections: {
                Row: {
                    connected: boolean | null
                    created_at: string | null
                    last_message_at: string | null
                    metadata: Json | null
                    mode: string | null
                    twilio_account_sid: string | null
                    twilio_auth_token: string | null
                    twilio_phone_number: string | null
                    updated_at: string | null
                    verified_at: string | null
                    webhook_url: string | null
                    workspace_id: string
                }
                Insert: {
                    connected?: boolean | null
                    created_at?: string | null
                    last_message_at?: string | null
                    metadata?: Json | null
                    mode?: string | null
                    twilio_account_sid?: string | null
                    twilio_auth_token?: string | null
                    twilio_phone_number?: string | null
                    updated_at?: string | null
                    verified_at?: string | null
                    webhook_url?: string | null
                    workspace_id: string
                }
                Update: {
                    connected?: boolean | null
                    created_at?: string | null
                    last_message_at?: string | null
                    metadata?: Json | null
                    mode?: string | null
                    twilio_account_sid?: string | null
                    twilio_auth_token?: string | null
                    twilio_phone_number?: string | null
                    updated_at?: string | null
                    verified_at?: string | null
                    webhook_url?: string | null
                    workspace_id?: string
                }
                Relationships: [
                    {
                        foreignKeyName: "whatsapp_connections_workspace_id_fkey"
                        columns: ["workspace_id"]
                        isOneToOne: true
                        referencedRelation: "workspaces"
                        referencedColumns: ["id"]
                    },
                ]
            }
            workspace_flags: {
                Row: {
                    calendar_connected: boolean | null
                    instructions_seen: boolean | null
                    onboarding_completed: boolean | null
                    updated_at: string | null
                    whatsapp_connected: boolean | null
                    workspace_id: string
                }
                Insert: {
                    calendar_connected?: boolean | null
                    instructions_seen?: boolean | null
                    onboarding_completed?: boolean | null
                    updated_at?: string | null
                    whatsapp_connected?: boolean | null
                    workspace_id: string
                }
                Update: {
                    calendar_connected?: boolean | null
                    instructions_seen?: boolean | null
                    onboarding_completed?: boolean | null
                    updated_at?: string | null
                    whatsapp_connected?: boolean | null
                    workspace_id?: string
                }
                Relationships: [
                    {
                        foreignKeyName: "workspace_flags_workspace_id_fkey"
                        columns: ["workspace_id"]
                        isOneToOne: true
                        referencedRelation: "workspaces"
                        referencedColumns: ["id"]
                    },
                ]
            }
            workspace_members: {
                Row: {
                    created_at: string | null
                    id: string
                    role: string | null
                    user_id: string
                    workspace_id: string
                }
                Insert: {
                    created_at?: string | null
                    id?: string
                    role?: string | null
                    user_id: string
                    workspace_id: string
                }
                Update: {
                    created_at?: string | null
                    id?: string
                    role?: string | null
                    user_id?: string
                    workspace_id?: string
                }
                Relationships: [
                    {
                        foreignKeyName: "workspace_members_workspace_id_fkey"
                        columns: ["workspace_id"]
                        isOneToOne: false
                        referencedRelation: "workspaces"
                        referencedColumns: ["id"]
                    },
                ]
            }
            workspace_use_cases: {
                Row: {
                    appointments_enabled: boolean | null
                    created_at: string | null
                    support_enabled: boolean | null
                    workspace_id: string
                }
                Insert: {
                    appointments_enabled?: boolean | null
                    created_at?: string | null
                    support_enabled?: boolean | null
                    workspace_id: string
                }
                Update: {
                    appointments_enabled?: boolean | null
                    created_at?: string | null
                    support_enabled?: boolean | null
                    workspace_id?: string
                }
                Relationships: [
                    {
                        foreignKeyName: "workspace_use_cases_workspace_id_fkey"
                        columns: ["workspace_id"]
                        isOneToOne: true
                        referencedRelation: "workspaces"
                        referencedColumns: ["id"]
                    },
                ]
            }
            workspaces: {
                Row: {
                    created_at: string | null
                    id: string
                    industry: string | null
                    name: string
                    owner_id: string
                    timezone: string | null
                    updated_at: string | null
                }
                Insert: {
                    created_at?: string | null
                    id?: string
                    industry?: string | null
                    name: string
                    owner_id: string
                    timezone?: string | null
                    updated_at?: string | null
                }
                Update: {
                    created_at?: string | null
                    id?: string
                    industry?: string | null
                    name?: string
                    owner_id?: string
                    timezone?: string | null
                    updated_at?: string | null
                }
                Relationships: []
            }
        }
        Views: {
            [_ in never]: never
        }
        Functions: {
            get_dashboard_metrics: {
                Args: {
                    p_workspace_id: string
                }
                Returns: Json
            }
            initialize_workspace: {
                Args: {
                    p_workspace_id: string
                    p_support_enabled: boolean
                    p_appointments_enabled: boolean
                }
                Returns: Json
            }
            mark_conversation_read: {
                Args: {
                    conversation_id: string
                }
                Returns: void
            }
            should_escalate_message: {
                Args: {
                    p_workspace_id: string
                    p_message_content: string
                }
                Returns: Json
            }
            user_has_workspace_access: {
                Args: {
                    p_workspace_id: string
                }
                Returns: boolean
            }
        }
        Enums: {
            [_ in never]: never
        }
        CompositeTypes: {
            [_ in never]: never
        }
    }
}
