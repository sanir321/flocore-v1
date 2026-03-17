import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'

export function useWorkspace() {
    const queryClient = useQueryClient()

    const query = useQuery({
        queryKey: ['workspace'],
        queryFn: async () => {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) return null

            const { data: workspace, error } = await supabase
                .from('workspaces')
                .select('*')
                .eq('owner_id', user.id)
                .single()

            if (error && error.code !== 'PGRST116') throw error
            if (!workspace) return null

            return {
                ...workspace,
                user: {
                    id: user.id,
                    email: user.email
                }
            }
        }
    })

    const updateEscalation = useMutation({
        mutationFn: async ({ workspaceId, enabled }: { workspaceId: string; enabled: boolean }) => {
            const { data, error } = await supabase
                .from('workspaces')
                .update({ escalation_enabled: enabled })
                .eq('id', workspaceId)
                .select()
                .single()

            if (error) throw error
            return data
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['workspace'] })
        }
    })

    return {
        ...query,
        updateEscalation
    }
}
