import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import type { Tables, TablesUpdate } from '@/types/database.types'
import { useEffect } from 'react'

export type Wiki = Tables<'agent_wiki'>

export function useAgentWiki(workspaceId: string | undefined) {
    const queryClient = useQueryClient()

    useEffect(() => {
        if (!workspaceId) return

        const channel = supabase
            .channel('agent-wiki-changes')
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'agent_wiki',
                    filter: `workspace_id=eq.${workspaceId}`
                },
                () => {
                    queryClient.invalidateQueries({ queryKey: ['agent_wiki', workspaceId] })
                }
            )
            .subscribe()

        return () => {
            supabase.removeChannel(channel)
        }
    }, [workspaceId, queryClient])

    const query = useQuery({
        queryKey: ['agent_wiki', workspaceId],
        queryFn: async () => {
            if (!workspaceId) return null
            const { data, error } = await supabase
                .from('agent_wiki')
                .select('*')
                .eq('workspace_id', workspaceId)
                .single()

            if (error && error.code !== 'PGRST116') throw error
            return data as Wiki | null
        },
        enabled: !!workspaceId
    })

    const updateWiki = useMutation({
        mutationFn: async (updates: TablesUpdate<'agent_wiki'>) => {
            if (!workspaceId) throw new Error('Workspace ID is required')
            const { data, error } = await supabase
                .from('agent_wiki')
                .update(updates)
                .eq('workspace_id', workspaceId)
                .select()
                .single()
            if (error) throw error
            return data
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['agent_wiki', workspaceId] })
        }
    })


    return {
        ...query,
        updateWiki
    }
}

