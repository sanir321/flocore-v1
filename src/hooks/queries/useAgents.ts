import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import type { Tables, TablesInsert, TablesUpdate } from '@/types/database.types'
import { useEffect } from 'react'

export type Agent = Tables<'agents'>

export function useAgents(workspaceId: string | undefined) {
    const queryClient = useQueryClient()

    useEffect(() => {
        if (!workspaceId) return

        const channel = supabase
            .channel('agents-changes')
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'agents',
                    filter: `workspace_id=eq.${workspaceId}`
                },
                () => {
                    queryClient.invalidateQueries({ queryKey: ['agents', workspaceId] })
                }
            )
            .subscribe()

        return () => {
            supabase.removeChannel(channel)
        }
    }, [workspaceId, queryClient])

    const query = useQuery({
        queryKey: ['agents', workspaceId],
        queryFn: async () => {
            if (!workspaceId) return []
            const { data, error } = await supabase
                .from('agents')
                .select('*')
                .eq('workspace_id', workspaceId)
                .order('name')

            if (error) throw error
            return data as Agent[]
        },
        enabled: !!workspaceId
    })

    const createAgent = useMutation({
        mutationFn: async (newAgent: Omit<TablesInsert<'agents'>, 'workspace_id'>) => {
            if (!workspaceId) throw new Error('Workspace ID is required')
            const { data, error } = await supabase
                .from('agents')
                .insert({ ...newAgent, workspace_id: workspaceId })
                .select()
                .single()

            if (error) throw error
            return data
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['agents', workspaceId] })
        }
    })

    const updateAgent = useMutation({
        mutationFn: async ({ id, ...updates }: TablesUpdate<'agents'> & { id: string }) => {
            const { data, error } = await supabase
                .from('agents')
                .update(updates)
                .eq('id', id)
                .select()
                .single()
            if (error) throw error
            return data
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['agents', workspaceId] })
        }
    })

    const deleteAgent = useMutation({
        mutationFn: async (id: string) => {
            const { error } = await supabase
                .from('agents')
                .delete()
                .eq('id', id)
            if (error) throw error
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['agents', workspaceId] })
        }
    })

    return {
        ...query,
        createAgent,
        updateAgent,
        deleteAgent
    }
}

