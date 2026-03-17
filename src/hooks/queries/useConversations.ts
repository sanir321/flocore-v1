import { useEffect } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import type { Tables } from '@/types/database.types'

export type ConversationWithContact = Tables<'conversations'> & {
    channel: string | null
    contact: {
        id: string
        name: string | null
        phone: string
        email?: string | null
        channel?: string | null
        tags?: string[]
    } | null
    message_count?: number
}

export function useConversations(workspaceId: string | undefined, options: { 
    status?: string[], 
    limit?: number,
    escalatedOnly?: boolean,
    since?: string 
} = {}) {
    const queryClient = useQueryClient()

    useEffect(() => {
        if (!workspaceId) return

        const channel = supabase
            .channel(`conversations-realtime-${workspaceId}`)
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'conversations',
                    filter: `workspace_id=eq.${workspaceId}`
                },
                () => {
                    queryClient.invalidateQueries({ queryKey: ['conversations', workspaceId] })
                }
            )
            .subscribe()

        return () => {
            supabase.removeChannel(channel)
        }
    }, [workspaceId, queryClient])

    return useQuery({
        queryKey: ['conversations', workspaceId, options],
        queryFn: async () => {
            if (!workspaceId) return []
            
            let query = supabase
                .from('conversations')
                .select('id, channel, status, escalated, assigned_to_human, last_message_at, unread_count, agent_id, contact:contacts(id, name, phone, email, channel, tags), messages(content), agent:agents(id, name, type)')
                .eq('workspace_id', workspaceId)

            if (options.status && options.status.length > 0) {
                query = query.in('status', options.status)
            }

            if (options.escalatedOnly) {
                query = query.not('escalation_reason', 'is', null)
            }

            if (options.since) {
                query = query.gte('created_at', options.since)
            }

            query = query.order('last_message_at', { ascending: false })

            if (options.limit) {
                query = query.limit(options.limit)
            }

            const { data, error } = await query

            if (error) throw error
            
            return (data || []).map((c: any) => ({
                ...c,
                status: (['todo', 'follow_up', 'done'].includes(c.status) ? c.status : 'todo'),
                messages: c.messages?.[0] ? [c.messages[0]] : [],
                unread_count: c.unread_count || 0,
                agent: c.agent || null
            })) as ConversationWithContact[]
        },
        enabled: !!workspaceId
    })
}
