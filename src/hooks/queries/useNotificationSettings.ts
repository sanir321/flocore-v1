import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'

export function useNotificationSettings(workspaceId: string | undefined) {
    return useQuery({
        queryKey: ['notification_settings', workspaceId],
        queryFn: async () => {
            if (!workspaceId) return null
            const { data, error } = await supabase
                .from('notification_settings')
                .select('*')
                .eq('workspace_id', workspaceId)
                .single()

            if (error && error.code !== 'PGRST116') throw error
            return data
        },
        enabled: !!workspaceId
    })
}
