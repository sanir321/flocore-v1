import { supabase } from '@/lib/supabase'

export interface SendMessageParams {
    workspaceId: string
    conversationId: string
    message: string
    customerPhone: string
}

export const api = {
    /**
     * Sends a message via the send-message Edge Function
     */
    sendMessage: async ({ workspaceId, conversationId, message, customerPhone }: SendMessageParams) => {
        try {
            const { data, error } = await supabase.functions.invoke('send-message', {
                body: {
                    workspace_id: workspaceId,
                    conversation_id: conversationId,
                    message,
                    customer_phone: customerPhone
                }
            })

            if (error) throw error
            return { data, error: null }
        } catch (err: any) {
            console.error('Error sending message:', err)
            return { data: null, error: err }
        }
    },

    /**
     * Scrapes website content via scrape-website Edge Function
     */
    scrapeWebsite: async ({ url }: { url: string }) => {
        try {
            const { data, error } = await supabase.functions.invoke('scrape-website', {
                body: { url }
            })
            if (error) throw error
            return { data, error: null }
        } catch (err: any) {
            return { data: null, error: err }
        }
    },

    /**
     * Performs calendar actions via calendar-tools Edge Function
     */
    calendarAction: async (body: any) => {
        try {
            const { data, error } = await supabase.functions.invoke('calendar-tools', {
                body
            })
            if (error) throw error
            return { data, error: null }
        } catch (err: any) {
            return { data: null, error: err }
        }
    }
}
