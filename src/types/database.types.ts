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
  __InternalSupabase: {
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      agent_wiki: {
        Row: {
          business_info: string | null
          conflict_handling: string | null
          embedding: string | null
          faqs: string | null
          procedures: string | null
          updated_at: string | null
          workspace_id: string
        }
        Insert: {
          business_info?: string | null
          conflict_handling?: string | null
          embedding?: string | null
          faqs?: string | null
          procedures?: string | null
          updated_at?: string | null
          workspace_id: string
        }
        Update: {
          business_info?: string | null
          conflict_handling?: string | null
          embedding?: string | null
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
          ip_address: unknown
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
          ip_address?: unknown
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
          ip_address?: unknown
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
          external_id: string | null
          id: string
          metadata: Json | null
          name: string | null
          phone: string
          source: string | null
          tags: string[] | null
          updated_at: string | null
          workspace_id: string
        }
        Insert: {
          channel?: string | null
          created_at?: string | null
          email?: string | null
          external_id?: string | null
          id?: string
          metadata?: Json | null
          name?: string | null
          phone: string
          source?: string | null
          tags?: string[] | null
          updated_at?: string | null
          workspace_id: string
        }
        Update: {
          channel?: string | null
          created_at?: string | null
          email?: string | null
          external_id?: string | null
          id?: string
          metadata?: Json | null
          name?: string | null
          phone?: string
          source?: string | null
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
          agent_id: string | null
          assigned_at: string | null
          assigned_to_human: boolean | null
          assigned_to_user_id: string | null
          channel: string
          channel_metadata: Json | null
          contact_id: string
          created_at: string | null
          escalated: boolean | null
          escalated_at: string | null
          escalation_reason: string | null
          id: string
          last_message_at: string | null
          session_id: string | null
          status: string | null
          unread_count: number | null
          updated_at: string | null
          workspace_id: string
        }
        Insert: {
          agent_id?: string | null
          assigned_at?: string | null
          assigned_to_human?: boolean | null
          assigned_to_user_id?: string | null
          channel: string
          channel_metadata?: Json | null
          contact_id: string
          created_at?: string | null
          escalated?: boolean | null
          escalated_at?: string | null
          escalation_reason?: string | null
          id?: string
          last_message_at?: string | null
          session_id?: string | null
          status?: string | null
          unread_count?: number | null
          updated_at?: string | null
          workspace_id: string
        }
        Update: {
          agent_id?: string | null
          assigned_at?: string | null
          assigned_to_human?: boolean | null
          assigned_to_user_id?: string | null
          channel?: string
          channel_metadata?: Json | null
          contact_id?: string
          created_at?: string | null
          escalated?: boolean | null
          escalated_at?: string | null
          escalation_reason?: string | null
          id?: string
          last_message_at?: string | null
          session_id?: string | null
          status?: string | null
          unread_count?: number | null
          updated_at?: string | null
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "conversations_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "agents"
            referencedColumns: ["id"]
          },
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
      gmail_connections: {
        Row: {
          access_token: string
          agent_id: string
          connected_at: string | null
          created_at: string | null
          gmail_address: string
          history_id: string | null
          id: string
          is_active: boolean | null
          last_polled_at: string | null
          refresh_token: string
          token_expiry: string
          workspace_id: string
        }
        Insert: {
          access_token: string
          agent_id: string
          connected_at?: string | null
          created_at?: string | null
          gmail_address: string
          history_id?: string | null
          id?: string
          is_active?: boolean | null
          last_polled_at?: string | null
          refresh_token: string
          token_expiry: string
          workspace_id: string
        }
        Update: {
          access_token?: string
          agent_id?: string
          connected_at?: string | null
          created_at?: string | null
          gmail_address?: string
          history_id?: string | null
          id?: string
          is_active?: boolean | null
          last_polled_at?: string | null
          refresh_token?: string
          token_expiry?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "gmail_connections_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "agents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "gmail_connections_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      knowledge_base: {
        Row: {
          agent_id: string | null
          content: string | null
          created_at: string | null
          embedding: string | null
          id: string
          last_scraped_at: string | null
          source_url: string | null
          title: string
          workspace_id: string
        }
        Insert: {
          agent_id?: string | null
          content?: string | null
          created_at?: string | null
          embedding?: string | null
          id?: string
          last_scraped_at?: string | null
          source_url?: string | null
          title: string
          workspace_id: string
        }
        Update: {
          agent_id?: string | null
          content?: string | null
          created_at?: string | null
          embedding?: string | null
          id?: string
          last_scraped_at?: string | null
          source_url?: string | null
          title?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "knowledge_base_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "agents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "knowledge_base_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      message_processing_queue: {
        Row: {
          attempts: number | null
          conversation_id: string
          created_at: string | null
          id: string
          last_error: string | null
          max_attempts: number | null
          message_id: string
          next_retry_at: string | null
          processed_at: string | null
          status: string
          workspace_id: string
        }
        Insert: {
          attempts?: number | null
          conversation_id: string
          created_at?: string | null
          id?: string
          last_error?: string | null
          max_attempts?: number | null
          message_id: string
          next_retry_at?: string | null
          processed_at?: string | null
          status?: string
          workspace_id: string
        }
        Update: {
          attempts?: number | null
          conversation_id?: string
          created_at?: string | null
          id?: string
          last_error?: string | null
          max_attempts?: number | null
          message_id?: string
          next_retry_at?: string | null
          processed_at?: string | null
          status?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "message_processing_queue_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "message_processing_queue_message_id_fkey"
            columns: ["message_id"]
            isOneToOne: true
            referencedRelation: "messages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "message_processing_queue_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      messages: {
        Row: {
          channel: string
          content: string
          conversation_id: string
          created_at: string | null
          direction: string | null
          external_id: string | null
          id: string
          media_type: string | null
          media_url: string | null
          metadata: Json | null
          provider_message_id: string | null
          read_at: string | null
          sender: string
          sentiment_score: number | null
          status: string | null
          topic_detected: string | null
        }
        Insert: {
          channel?: string
          content: string
          conversation_id: string
          created_at?: string | null
          direction?: string | null
          external_id?: string | null
          id?: string
          media_type?: string | null
          media_url?: string | null
          metadata?: Json | null
          provider_message_id?: string | null
          read_at?: string | null
          sender: string
          sentiment_score?: number | null
          status?: string | null
          topic_detected?: string | null
        }
        Update: {
          channel?: string
          content?: string
          conversation_id?: string
          created_at?: string | null
          direction?: string | null
          external_id?: string | null
          id?: string
          media_type?: string | null
          media_url?: string | null
          metadata?: Json | null
          provider_message_id?: string | null
          read_at?: string | null
          sender?: string
          sentiment_score?: number | null
          status?: string | null
          topic_detected?: string | null
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
          booking_confirmations: boolean | null
          created_at: string | null
          escalation_alerts: boolean | null
          escalation_popups: boolean | null
          mention_notifications: boolean | null
          new_message_alerts: boolean | null
          updated_at: string | null
          workspace_id: string
        }
        Insert: {
          admin_phone?: string | null
          booking_confirmations?: boolean | null
          created_at?: string | null
          escalation_alerts?: boolean | null
          escalation_popups?: boolean | null
          mention_notifications?: boolean | null
          new_message_alerts?: boolean | null
          updated_at?: string | null
          workspace_id: string
        }
        Update: {
          admin_phone?: string | null
          booking_confirmations?: boolean | null
          created_at?: string | null
          escalation_alerts?: boolean | null
          escalation_popups?: boolean | null
          mention_notifications?: boolean | null
          new_message_alerts?: boolean | null
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
      rate_limits: {
        Row: {
          identifier: string
          request_count: number
          window_start: string
        }
        Insert: {
          identifier: string
          request_count?: number
          window_start?: string
        }
        Update: {
          identifier?: string
          request_count?: number
          window_start?: string
        }
        Relationships: []
      }
      slack_connections: {
        Row: {
          access_token: string
          agent_id: string
          bot_user_id: string
          connected_at: string | null
          created_at: string | null
          id: string
          incoming_webhook_url: string | null
          is_active: boolean | null
          slack_team_id: string
          slack_team_name: string | null
          workspace_id: string
        }
        Insert: {
          access_token: string
          agent_id: string
          bot_user_id: string
          connected_at?: string | null
          created_at?: string | null
          id?: string
          incoming_webhook_url?: string | null
          is_active?: boolean | null
          slack_team_id: string
          slack_team_name?: string | null
          workspace_id: string
        }
        Update: {
          access_token?: string
          agent_id?: string
          bot_user_id?: string
          connected_at?: string | null
          created_at?: string | null
          id?: string
          incoming_webhook_url?: string | null
          is_active?: boolean | null
          slack_team_id?: string
          slack_team_name?: string | null
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "slack_connections_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "agents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "slack_connections_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      system_config: {
        Row: {
          key: string
          value: string | null
        }
        Insert: {
          key: string
          value?: string | null
        }
        Update: {
          key?: string
          value?: string | null
        }
        Relationships: []
      }
      telegram_connections: {
        Row: {
          agent_id: string
          bot_token: string
          bot_username: string | null
          created_at: string | null
          id: string
          is_active: boolean | null
          workspace_id: string
        }
        Insert: {
          agent_id: string
          bot_token: string
          bot_username?: string | null
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          workspace_id: string
        }
        Update: {
          agent_id?: string
          bot_token?: string
          bot_username?: string | null
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "telegram_connections_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "agents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "telegram_connections_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      webchat_settings: {
        Row: {
          agent_id: string
          created_at: string | null
          domain_whitelist: string[] | null
          id: string
          is_active: boolean | null
          primary_color: string | null
          welcome_message: string | null
          widget_title: string | null
          workspace_id: string
        }
        Insert: {
          agent_id: string
          created_at?: string | null
          domain_whitelist?: string[] | null
          id?: string
          is_active?: boolean | null
          primary_color?: string | null
          welcome_message?: string | null
          widget_title?: string | null
          workspace_id: string
        }
        Update: {
          agent_id?: string
          created_at?: string | null
          domain_whitelist?: string[] | null
          id?: string
          is_active?: boolean | null
          primary_color?: string | null
          welcome_message?: string | null
          widget_title?: string | null
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "webchat_settings_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "agents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "webchat_settings_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      whatsapp_connections: {
        Row: {
          connected: boolean | null
          created_at: string | null
          instance_id: string | null
          instance_name: string | null
          last_message_at: string | null
          metadata: Json | null
          owner_jid: string | null
          phone_number_id: string | null
          profile_name: string | null
          profile_picture_url: string | null
          updated_at: string | null
          verified_at: string | null
          webhook_url: string | null
          workspace_id: string
        }
        Insert: {
          connected?: boolean | null
          created_at?: string | null
          instance_id?: string | null
          instance_name?: string | null
          last_message_at?: string | null
          metadata?: Json | null
          owner_jid?: string | null
          phone_number_id?: string | null
          profile_name?: string | null
          profile_picture_url?: string | null
          updated_at?: string | null
          verified_at?: string | null
          webhook_url?: string | null
          workspace_id: string
        }
        Update: {
          connected?: boolean | null
          created_at?: string | null
          instance_id?: string | null
          instance_name?: string | null
          last_message_at?: string | null
          metadata?: Json | null
          owner_jid?: string | null
          phone_number_id?: string | null
          profile_name?: string | null
          profile_picture_url?: string | null
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
          escalation_enabled: boolean | null
          id: string
          industry: string | null
          name: string
          owner_id: string
          slug: string | null
          timezone: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          escalation_enabled?: boolean | null
          id?: string
          industry?: string | null
          name: string
          owner_id: string
          slug?: string | null
          timezone?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          escalation_enabled?: boolean | null
          id?: string
          industry?: string | null
          name?: string
          owner_id?: string
          slug?: string | null
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
      claim_queue_items: {
        Args: { p_batch_size?: number }
        Returns: {
          attempts: number | null
          conversation_id: string
          created_at: string | null
          id: string
          last_error: string | null
          max_attempts: number | null
          message_id: string
          next_retry_at: string | null
          processed_at: string | null
          status: string
          workspace_id: string
        }[]
        SetofOptions: {
          from: "*"
          to: "message_processing_queue"
          isOneToOne: false
          isSetofReturn: true
        }
      }
      clean_expired_rate_limits: { Args: never; Returns: undefined }
      complete_queue_item: { Args: { p_queue_id: string }; Returns: undefined }
      fail_queue_item: {
        Args: { p_error: string; p_queue_id: string }
        Returns: undefined
      }
      get_dashboard_metrics: { Args: { p_workspace_id: string }; Returns: Json }
      initialize_workspace: {
        Args: {
          p_appointments_enabled: boolean
          p_support_enabled: boolean
          p_workspace_id: string
        }
        Returns: Json
      }
      invoke_generate_embeddings: {
        Args: { p_payload: Json }
        Returns: undefined
      }
      mark_conversation_read: {
        Args: { conversation_id: string }
        Returns: undefined
      }
      match_knowledge_base:
        | {
            Args: {
              match_count: number
              match_threshold: number
              p_workspace_id: string
              query_embedding: string
            }
            Returns: {
              category: string
              content: string
              id: string
              similarity: number
              title: string
            }[]
          }
        | {
            Args: {
              match_count: number
              match_threshold: number
              p_agent_id?: string
              p_workspace_id: string
              query_embedding: string
            }
            Returns: {
              content: string
              id: string
              similarity: number
              title: string
            }[]
          }
      should_escalate_message: {
        Args: { p_message_content: string; p_workspace_id: string }
        Returns: {
          matched_keywords: string[]
          reason: string
          should_escalate: boolean
        }[]
      }
      user_has_workspace_access: {
        Args: { p_workspace_id: string }
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

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
