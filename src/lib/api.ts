import { supabase } from '@/lib/supabase'

export interface SendMessageParams {
    workspaceId: string
    conversationId: string
    message: string
}

export const api = {
    /**
     * Sends a message via the multi-channel send-message Edge Function
     */
    sendMessage: async ({ workspaceId, conversationId, message }: SendMessageParams) => {
        try {
            const { data, error } = await supabase.functions.invoke('send-message', {
                body: { workspaceId, conversationId, message }
            })
            if (error) throw error
            return { data, error: null }
        } catch (err: any) {
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
    },

    /**
     * Generates an AI reply using the chat-ai Edge Function (authenticated)
     */
    generateAiReply: async ({ 
        workspaceId, 
        conversationId, 
        message 
    }: { 
        workspaceId: string, 
        conversationId: string, 
        message: string 
    }) => {
        try {
            const { data, error } = await supabase.functions.invoke('chat-ai', {
                body: { workspaceId, conversationId, message }
            })
            if (error) throw error
            return { data, error: null }
        } catch (err: any) {
            return { data: null, error: err }
        }
    }
}
