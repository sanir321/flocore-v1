import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'

export function useWhatsAppConnection(workspaceId: string | undefined) {
    return useQuery({
        queryKey: ['whatsapp_connection', workspaceId],
        queryFn: async () => {
            if (!workspaceId) return null
            const { data, error } = await supabase
                .from('whatsapp_connections')
                .select('*')
                .eq('workspace_id', workspaceId)
                .single()

            if (error && error.code !== 'PGRST116') throw error
            return data
        },
        enabled: !!workspaceId
    })
}
