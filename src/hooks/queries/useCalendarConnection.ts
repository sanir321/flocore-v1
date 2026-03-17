import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'

export function useCalendarConnection(workspaceId: string | undefined) {
    return useQuery({
        queryKey: ['calendar_connection', workspaceId],
        queryFn: async () => {
            if (!workspaceId) return null
            const { data, error } = await supabase
                .from('calendar_connections')
                .select('*')
                .eq('workspace_id', workspaceId)
                .single()

            if (error && error.code !== 'PGRST116') throw error
            return data
        },
        enabled: !!workspaceId
    })
}
