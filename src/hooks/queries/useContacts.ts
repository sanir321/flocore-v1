import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { useWorkspace } from '@/hooks/queries/useWorkspace'

interface Contact {
    id: string
    name: string | null
    phone: string
    email: string | null
    channel: string | null
    tags: string[] | null
    metadata: any | null
    created_at: string | null
    workspace_id: string
}

export function useContacts() {
    const { data: workspace } = useWorkspace()
    const queryClient = useQueryClient()

    const query = useQuery({
        queryKey: ['contacts', workspace?.id],
        queryFn: async () => {
            if (!workspace?.id) return []

            const { data, error } = await supabase
                .from('contacts')
                .select('id, name, phone, email, channel, tags, metadata, created_at, workspace_id')
                .eq('workspace_id', workspace.id)
                .order('created_at', { ascending: false })

            if (error) throw error
            return (data || []) as Contact[]
        },
        enabled: !!workspace?.id,
    })

    const upsertMutation = useMutation({
        mutationFn: async (payload: Partial<Contact> & { id?: string }) => {
            if (!workspace?.id) throw new Error('No workspace context')
            
            if (payload.id) {
                const { id, ...rest } = payload
                const { error } = await supabase.from('contacts').update(rest).eq('id', id)
                if (error) throw error
            } else {
                if (!payload.phone) throw new Error('Phone is required')
                const { error } = await supabase.from('contacts').insert({
                    name: payload.name ?? null,
                    phone: payload.phone,
                    email: payload.email ?? null,
                    channel: payload.channel ?? null,
                    tags: payload.tags ?? null,
                    metadata: payload.metadata ?? null,
                    workspace_id: workspace.id,
                })
                if (error) throw error
            }
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['contacts', workspace?.id] })
        },
    })

    return {
        contacts: query.data || [],
        isLoading: query.isLoading,
        error: query.error,
        refetch: query.refetch,
        upsertContact: upsertMutation.mutateAsync,
        isSaving: upsertMutation.isPending,
    }
}
