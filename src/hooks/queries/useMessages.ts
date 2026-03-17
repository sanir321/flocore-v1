import { useState, useEffect } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import type { Tables } from '@/types/database.types'

export type Message = Tables<'messages'>

export function useMessages(conversationId: string | undefined) {
    const queryClient = useQueryClient()
    const [isAiThinking, setIsAiThinking] = useState(false)

    useEffect(() => {
        if (!conversationId) return

        const channel = supabase
            .channel(`messages-realtime-${conversationId}`)
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'messages',
                    filter: `conversation_id=eq.${conversationId}`
                },
                (payload) => {
                    const newMessage = payload.new as Message
                    
                    // Update cache
                    queryClient.setQueryData(['messages', conversationId], (old: Message[] | undefined) => {
                        if (!old) return [newMessage]
                        if (old.find(m => m.id === newMessage.id)) return old
                        return [...old, newMessage]
                    })

                    // Also invalidate conversations to update the sidebar preview and timestamps
                    queryClient.invalidateQueries({ queryKey: ['conversations'] })

                    if (newMessage.sender === 'ai' || newMessage.sender === 'system') {
                        setIsAiThinking(false)
                    }
                    if (newMessage.sender === 'customer') {
                        setIsAiThinking(true)
                    }
                }
            )
            .on(
                'postgres_changes',
                {
                    event: 'UPDATE',
                    schema: 'public',
                    table: 'messages',
                    filter: `conversation_id=eq.${conversationId}`
                },
                (payload) => {
                    const updatedMessage = payload.new as Message
                    queryClient.setQueryData(['messages', conversationId], (old: Message[] | undefined) => {
                        if (!old) return [updatedMessage]
                        return old.map(m => m.id === updatedMessage.id ? updatedMessage : m)
                    })

                    if (updatedMessage.sender === 'ai') {
                        setIsAiThinking(false)
                    }
                }
            )
            .subscribe()

        return () => {
            supabase.removeChannel(channel)
        }
    }, [conversationId, queryClient])

    const query = useQuery({
        queryKey: ['messages', conversationId],
        queryFn: async () => {
            if (!conversationId) return []
            
            const { data, error } = await supabase
                .from('messages')
                .select('*')
                .eq('conversation_id', conversationId)
                .order('created_at', { ascending: true })

            if (error) throw error
            return data as Message[]
        },
        enabled: !!conversationId
    })

    // Map-like helper for components expecting the old format (Map<string, Message>)
    const messagesMap = new Map<string, Message>()
    query.data?.forEach(m => messagesMap.set(m.id, m))

    const addOptimisticMessage = (content: string) => {
        const tempId = `temp_${Date.now()}`
        const tempMsg: Message = {
            id: tempId,
            content,
            sender: 'human',
            created_at: new Date().toISOString(),
            status: 'sending',
            conversation_id: conversationId || ''
        } as unknown as Message

        queryClient.setQueryData(['messages', conversationId], (old: Message[] | undefined) => {
            return [...(old || []), tempMsg]
        })

        return tempId
    }

    const confirmMessageSent = (tempId: string, realMessage: Message) => {
        queryClient.setQueryData(['messages', conversationId], (old: Message[] | undefined) => {
            if (!old) return [realMessage]
            return old.map(m => m.id === tempId ? realMessage : m)
        })
    }

    const markMessageFailed = (tempId: string) => {
        queryClient.setQueryData(['messages', conversationId], (old: Message[] | undefined) => {
            if (!old) return []
            return old.map(m => m.id === tempId ? { ...m, status: 'failed' } as Message : m)
        })
    }

    const updateLocalMessagesRead = (ids: string[]) => {
        queryClient.setQueryData(['messages', conversationId], (old: Message[] | undefined) => {
            if (!old) return []
            return old.map(m => ids.includes(m.id) ? { ...m, status: 'read' } as Message : m)
        })
    }

    return {
        ...query,
        messages: messagesMap,
        isAiThinking,
        setIsAiThinking,
        addOptimisticMessage,
        confirmMessageSent,
        markMessageFailed,
        updateLocalMessagesRead
    }
}
