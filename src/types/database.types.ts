export type Json =
    | string
    | number
    | boolean
    | null
    | { [key: string]: Json | undefined }
    | Json[]

export type Database = {
    // Allows to automatically instantiate createClient with right options
    // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)

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
                    business_hours: Json | null
                    config: Json | null
                    created_at: string | null
                    id: string
                    model: string | null
                    name: string
                    services: Json | null
                    system_prompt: string
                    type: string
                    updated_at: string | null
                    use_cases: string[] | null
                    workspace_id: string
                }
                Insert: {
                    active?: boolean | null
                    business_hours?: Json | null
                    config?: Json | null
                    created_at?: string | null
                    id?: string
                    model?: string | null
                    name: string
                    services?: Json | null
                    system_prompt: string
                    type: string
                    updated_at?: string | null
                    use_cases?: string[] | null
                    workspace_id: string
                }
                Update: {
                    active?: boolean | null
                    business_hours?: Json | null
                    config?: Json | null
                    created_at?: string | null
                    id?: string
                    model?: string | null
                    name?: string
                    services?: Json | null
                    system_prompt?: string
                    type?: string
                    updated_at?: string | null
                    use_cases?: string[] | null
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
                    conversation_id: string | null
                    created_at: string | null
                    id: string
                    input_tokens: number | null
                    model: string | null
                    output_tokens: number | null
                    tool_calls: string[] | null
                    workspace_id: string
                }
                Insert: {
                    conversation_id?: string | null
                    created_at?: string | null
                    id?: string
                    input_tokens?: number | null
                    model?: string | null
                    output_tokens?: number | null
                    tool_calls?: string[] | null
                    workspace_id: string
                }
                Update: {
                    conversation_id?: string | null
                    created_at?: string | null
                    id?: string
                    input_tokens?: number | null
                    model?: string | null
                    output_tokens?: number | null
                    tool_calls?: string[] | null
                    workspace_id?: string
                }
                Relationships: [
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
                    booked_by: string | null
                    contact_id: string | null
                    created_at: string | null
                    end_time: string
                    google_event_id: string | null
                    id: string
                    metadata: Json | null
                    notes: string | null
                    start_time: string
                    status: string | null
                    title: string
                    updated_at: string | null
                    workspace_id: string
                }
                Insert: {
                    booked_by?: string | null
                    contact_id?: string | null
                    created_at?: string | null
                    end_time: string
                    google_event_id?: string | null
                    id?: string
                    metadata?: Json | null
                    notes?: string | null
                    start_time: string
                    status?: string | null
                    title: string
                    updated_at?: string | null
                    workspace_id: string
                }
                Update: {
                    booked_by?: string | null
                    contact_id?: string | null
                    created_at?: string | null
                    end_time?: string
                    google_event_id?: string | null
                    id?: string
                    metadata?: Json | null
                    notes?: string | null
                    start_time?: string
                    status?: string | null
                    title?: string
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
                    actor_id: string | null
                    created_at: string | null
                    details: Json | null
                    entity_id: string | null
                    entity_type: string
                    id: string
                    workspace_id: string
                }
                Insert: {
                    action: string
                    actor_id?: string | null
                    created_at?: string | null
                    details?: Json | null
                    entity_id?: string | null
                    entity_type: string
                    id?: string
                    workspace_id: string
                }
                Update: {
                    action?: string
                    actor_id?: string | null
                    created_at?: string | null
                    details?: Json | null
                    entity_id?: string | null
                    entity_type?: string
                    id?: string
                    workspace_id?: string
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
                    calendar_id: string | null
                    created_at: string | null
                    expires_at: number | null
                    id: string
                    provider: string
                    refresh_token: string | null
                    updated_at: string | null
                    workspace_id: string
                }
                Insert: {
                    access_token?: string | null
                    calendar_id?: string | null
                    created_at?: string | null
                    expires_at?: number | null
                    id?: string
                    provider: string
                    refresh_token?: string | null
                    updated_at?: string | null
                    workspace_id: string
                }
                Update: {
                    access_token?: string | null
                    calendar_id?: string | null
                    created_at?: string | null
                    expires_at?: number | null
                    id?: string
                    provider?: string
                    refresh_token?: string | null
                    updated_at?: string | null
                    workspace_id?: string
                }
                Relationships: [
                    {
                        foreignKeyName: "calendar_connections_workspace_id_fkey"
                        columns: ["workspace_id"]
                        isOneToOne: false
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
                    assigned_to_human: boolean | null
                    channel: string | null
                    contact_id: string
                    created_at: string | null
                    escalated: boolean | null
                    escalated_at: string | null
                    escalation_reason: string | null
                    id: string
                    last_message_at: string | null
                    last_read_at: string | null
                    status: string | null
                    unread_count: number | null
                    updated_at: string | null
                    workspace_id: string
                }
                Insert: {
                    assigned_to_human?: boolean | null
                    channel?: string | null
                    contact_id: string
                    created_at?: string | null
                    escalated?: boolean | null
                    escalated_at?: string | null
                    escalation_reason?: string | null
                    id?: string
                    last_message_at?: string | null
                    last_read_at?: string | null
                    status?: string | null
                    unread_count?: number | null
                    updated_at?: string | null
                    workspace_id: string
                }
                Update: {
                    assigned_to_human?: boolean | null
                    channel?: string | null
                    contact_id?: string
                    created_at?: string | null
                    escalated?: boolean | null
                    escalated_at?: string | null
                    escalation_reason?: string | null
                    id?: string
                    last_message_at?: string | null
                    last_read_at?: string | null
                    status?: string | null
                    unread_count?: number | null
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
            knowledge_base: {
                Row: {
                    content: string
                    created_at: string | null
                    id: string
                    title: string
                    workspace_id: string
                }
                Insert: {
                    content: string
                    created_at?: string | null
                    id?: string
                    title: string
                    workspace_id: string
                }
                Update: {
                    content?: string
                    created_at?: string | null
                    id?: string
                    title?: string
                    workspace_id?: string
                }
                Relationships: [
                    {
                        foreignKeyName: "knowledge_base_workspace_id_fkey"
                        columns: ["workspace_id"]
                        isOneToOne: false
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
                    metadata: Json | null
                    provider_message_id: string | null
                    read_at: string | null
                    sender: string
                }
                Insert: {
                    content: string
                    conversation_id: string
                    created_at?: string | null
                    id?: string
                    metadata?: Json | null
                    provider_message_id?: string | null
                    read_at?: string | null
                    sender: string
                }
                Update: {
                    content?: string
                    conversation_id?: string
                    created_at?: string | null
                    id?: string
                    metadata?: Json | null
                    provider_message_id?: string | null
                    read_at?: string | null
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
            notification_settings: {
                Row: {
                    admin_phone: string | null
                    created_at: string | null
                    escalation_alerts: boolean | null
                    updated_at: string | null
                    workspace_id: string
                }
                Insert: {
                    admin_phone?: string | null
                    created_at?: string | null
                    escalation_alerts?: boolean | null
                    updated_at?: string | null
                    workspace_id: string
                }
                Update: {
                    admin_phone?: string | null
                    created_at?: string | null
                    escalation_alerts?: boolean | null
                    updated_at?: string | null
                    workspace_id?: string
                }
                Relationships: [
                    {
                        foreignKeyName: "notification_settings_workspace_id_fkey"
                        columns: ["workspace_id"]
                        isOneToOne: true
                        referencedRelation: "workspaces"
                        referencedColumns: ["id"]
                    },
                ]
            }
            whatsapp_connections: {
                Row: {
                    connected: boolean | null
                    created_at: string | null
                    id: string
                    mode: string | null
                    twilio_account_sid: string | null
                    twilio_auth_token: string | null
                    twilio_phone_number: string | null
                    updated_at: string | null
                    webhook_url: string | null
                    workspace_id: string
                }
                Insert: {
                    connected?: boolean | null
                    created_at?: string | null
                    id?: string
                    mode?: string | null
                    twilio_account_sid?: string | null
                    twilio_auth_token?: string | null
                    twilio_phone_number?: string | null
                    updated_at?: string | null
                    webhook_url?: string | null
                    workspace_id: string
                }
                Update: {
                    connected?: boolean | null
                    created_at?: string | null
                    id?: string
                    mode?: string | null
                    twilio_account_sid?: string | null
                    twilio_auth_token?: string | null
                    twilio_phone_number?: string | null
                    updated_at?: string | null
                    webhook_url?: string | null
                    workspace_id?: string
                }
                Relationships: [
                    {
                        foreignKeyName: "whatsapp_connections_workspace_id_fkey"
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
                    name: string
                    owner_id: string
                    settings: Json | null
                    slug: string
                    updated_at: string | null
                }
                Insert: {
                    created_at?: string | null
                    id?: string
                    name: string
                    owner_id: string
                    settings?: Json | null
                    slug: string
                    updated_at?: string | null
                }
                Update: {
                    created_at?: string | null
                    id?: string
                    name?: string
                    owner_id?: string
                    settings?: Json | null
                    slug?: string
                    updated_at?: string | null
                }
                Relationships: []
            }
        }
        Views: {
            [_ in never]: never
        }
        Functions: {
            should_escalate_message: {
                Args: {
                    p_workspace_id: string
                    p_message_content: string
                }
                Returns: Json
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

type PublicSchema = Database[Extract<keyof Database, "public">]

export type Tables<
    PublicTableNameOrOptions extends
    | keyof (PublicSchema["Tables"] & PublicSchema["Views"])
    | { schema: keyof Database },
    TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
        Database[PublicTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
    ? (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
        Database[PublicTableNameOrOptions["schema"]]["Views"])[TableName] extends {
            Row: infer R
        }
    ? R
    : never
    : PublicTableNameOrOptions extends keyof (PublicSchema["Tables"] &
        PublicSchema["Views"])
    ? (PublicSchema["Tables"] &
        PublicSchema["Views"])[PublicTableNameOrOptions] extends {
            Row: infer R
        }
    ? R
    : never
    : never

export type TablesInsert<
    PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
    TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
    ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
        Insert: infer I
    }
    ? I
    : never
    : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Insert: infer I
    }
    ? I
    : never
    : never

export type TablesUpdate<
    PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
    TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
    ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
        Update: infer U
    }
    ? U
    : never
    : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Update: infer U
    }
    ? U
    : never
    : never

export type Enums<
    PublicEnumNameOrOptions extends
    | keyof PublicSchema["Enums"]
    | { schema: keyof Database },
    EnumName extends PublicEnumNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = PublicEnumNameOrOptions extends { schema: keyof Database }
    ? Database[PublicEnumNameOrOptions["schema"]]["Enums"][EnumName]
    : PublicEnumNameOrOptions extends keyof PublicSchema["Enums"]
    ? PublicSchema["Enums"][PublicEnumNameOrOptions]
    : never

export type CompositeTypes<
    PublicCompositeTypeNameOrOptions extends
    | keyof PublicSchema["CompositeTypes"]
    | { schema: keyof Database },
    CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
        schema: keyof Database
    }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
    ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
    : PublicCompositeTypeNameOrOptions extends keyof PublicSchema["CompositeTypes"]
    ? PublicSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never
