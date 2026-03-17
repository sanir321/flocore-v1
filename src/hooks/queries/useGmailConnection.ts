import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import type { Database } from '@/types/database.types'

export type GmailConnection = Database['public']['Tables']['gmail_connections']['Row']

export function useGmailConnection(workspaceId: string | undefined) {
    return useQuery({
        queryKey: ['gmail_connection', workspaceId],
        queryFn: async () => {
            if (!workspaceId) return null
            const { data, error } = await supabase
                .from('gmail_connections')
                .select('*')
                .eq('workspace_id', workspaceId)
                .single()

            if (error && error.code !== 'PGRST116') throw error
            return data
        },
        enabled: !!workspaceId
    })
}
