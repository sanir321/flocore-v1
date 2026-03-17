import { useEffect } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { subDays } from 'date-fns'
import type { Tables } from '@/types/database.types'

export type ConversationWithContact = Tables<'conversations'> & {
    contact: {
        name: string | null
        phone: string
        tags?: string[]
    } | null
    message_count?: number
}

export function useInsightsData(workspaceId: string | undefined, timeRange: string = '7d') {
    const queryClient = useQueryClient()

    useEffect(() => {
        if (!workspaceId) return

        const channel = supabase
            .channel(`insights-realtime-${workspaceId}`)
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'conversations',
                    filter: `workspace_id=eq.${workspaceId}`
                },
                () => {
                    queryClient.invalidateQueries({ queryKey: ['insights', workspaceId] })
                }
            )
            .subscribe()

        return () => {
            supabase.removeChannel(channel)
        }
    }, [workspaceId, queryClient])

    return useQuery({
        queryKey: ['insights', workspaceId, timeRange],
        queryFn: async () => {
            if (!workspaceId) return null

            const days = parseInt(timeRange) || 7
            const sinceDate = subDays(new Date(), days).toISOString()

            // 1. Fetch Conversations with counts and latest content
            const { data: conversations, error: convError } = await supabase
                .from('conversations')
                .select('*, contact:contacts(name, phone, tags), messages(count, created_at, role)')
                .eq('workspace_id', workspaceId)
                .gte('created_at', sinceDate)
                .order('created_at', { ascending: false })

            if (convError) throw convError

            // 2. Fetch Escalations
            const eb = (conversations || []).filter(c => c.escalated)

            return {
                conversations: (conversations || []).map((c: any) => ({
                    ...c,
                    message_count: c.messages?.[0]?.count || 0,
                    last_message_at: c.messages?.[0]?.created_at || c.created_at
                })) as ConversationWithContact[],
                escalations: eb as ConversationWithContact[]
            }
        },
        enabled: !!workspaceId
    })
}
