import { useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import type { Tables } from '@/types/database.types'

export type KnowledgeDoc = Tables<'knowledge_base'>

export function useKnowledgeBase(workspaceId: string | undefined) {
    const queryClient = useQueryClient()

    useEffect(() => {
        if (!workspaceId) return

        const channel = supabase
            .channel(`knowledge-base-realtime-${workspaceId}`)
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'knowledge_base',
                    filter: `workspace_id=eq.${workspaceId}`
                },
                () => {
                    queryClient.invalidateQueries({ queryKey: ['knowledge_base', workspaceId] })
                }
            )
            .subscribe()

        return () => {
            supabase.removeChannel(channel)
        }
    }, [workspaceId, queryClient])

    const query = useQuery({
        queryKey: ['knowledge_base', workspaceId],
        queryFn: async () => {
            if (!workspaceId) return []
            const { data, error } = await supabase
                .from('knowledge_base')
                .select('*')
                .eq('workspace_id', workspaceId)
                .order('created_at', { ascending: false })

            if (error) throw error
            return data as KnowledgeDoc[]
        },
        enabled: !!workspaceId
    })

    const createMutation = useMutation({
        mutationFn: async (doc: Omit<KnowledgeDoc, 'id' | 'created_at' | 'workspace_id'>) => {
            if (!workspaceId) throw new Error('Workspace ID is required')
            const { data, error } = await supabase
                .from('knowledge_base')
                .insert([{ ...doc, workspace_id: workspaceId }])
                .select()
                .single()

            if (error) throw error
            return data as KnowledgeDoc
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['knowledge_base', workspaceId] })
        }
    })

    const updateMutation = useMutation({
        mutationFn: async ({ id, ...doc }: Partial<KnowledgeDoc> & { id: string }) => {
            const { data, error } = await supabase
                .from('knowledge_base')
                .update(doc)
                .eq('id', id)
                .select()
                .single()

            if (error) throw error
            return data as KnowledgeDoc
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['knowledge_base', workspaceId] })
        }
    })

    const deleteMutation = useMutation({
        mutationFn: async (id: string) => {
            const { error } = await supabase
                .from('knowledge_base')
                .delete()
                .eq('id', id)

            if (error) throw error
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['knowledge_base', workspaceId] })
        }
    })

    return {
        ...query,
        createDoc: createMutation.mutateAsync,
        updateDoc: updateMutation.mutateAsync,
        deleteDoc: deleteMutation.mutateAsync,
        isCreating: createMutation.isPending,
        isUpdating: updateMutation.isPending,
        isDeleting: deleteMutation.isPending
    }
}
