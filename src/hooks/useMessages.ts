import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import type { Message } from '@/components/inbox/MessageBubble'
import { sendMessageNotification } from '@/lib/notifications'

export const useMessages = (conversationId: string | undefined) => {
    const [messages, setMessages] = useState<Map<string, Message>>(new Map())
    const [isAiThinking, setIsAiThinking] = useState(false)

    // We reuse the typing hook mainly to get access to the shared channel if needed, 
    // or we can invoke broadcasting text from here.
    // Ideally useMessages should manage its own subscription to MESSAGES table, 
    // and rely on hook arguments for outside dependencies.

    useEffect(() => {
        setMessages(new Map()) // Clear immediately to avoid "ghost" messages from previous chat
        if (!conversationId) return

        const fetchMessages = async () => {
            const { data, error } = await supabase
                .from('messages')
                .select('*')
                .eq('conversation_id', conversationId)
                .order('created_at', { ascending: true })

            if (error) {
                console.error('Error fetching messages:', error)
            } else {
                const messageMap = new Map<string, Message>()
                data.forEach((m: any) => messageMap.set(m.id, m))
                setMessages(messageMap)
            }
        }

        fetchMessages()

        const channel = supabase
            .channel(`messages:${conversationId}`)
            .on('postgres_changes', {
                event: 'INSERT',
                schema: 'public',
                table: 'messages',
                filter: `conversation_id=eq.${conversationId}`
            }, (payload) => {
                const newMessage = payload.new as Message

                setMessages(prev => {
                    if (prev.has(newMessage.id)) return prev

                    // Deduplication / Optimistic Swap - Faster iteration
                    let tempIdToDelete = null
                    if (newMessage.sender === 'human') {
                        for (const m of prev.values()) {
                            if (m.id.startsWith('temp_') && m.content === newMessage.content) {
                                tempIdToDelete = m.id
                                break
                            }
                        }
                    }

                    const newMap = new Map(prev)
                    if (tempIdToDelete) {
                        newMap.delete(tempIdToDelete)
                    }
                    newMap.set(newMessage.id, newMessage)
                    return newMap
                })

                if (newMessage.sender === 'ai' || newMessage.sender === 'system') setIsAiThinking(false)
                if (newMessage.sender === 'customer') {
                    setIsAiThinking(true)
                    sendMessageNotification('Customer', newMessage.content, conversationId)
                }
            })
            // Listen for read receipts/updates on messages
            .on('postgres_changes', {
                event: 'UPDATE',
                schema: 'public',
                table: 'messages',
                filter: `conversation_id=eq.${conversationId}`
            }, (payload) => {
                const updatedMsg = payload.new as Message
                if (updatedMsg.sender === 'ai') setIsAiThinking(false)

                setMessages(prev => {
                    const existing = prev.get(updatedMsg.id)
                    if (existing && existing.status === updatedMsg.status && existing.content === updatedMsg.content) {
                        return prev
                    }
                    const newMap = new Map(prev)
                    newMap.set(updatedMsg.id, updatedMsg)
                    return newMap
                })
            })
            .subscribe()

        return () => { supabase.removeChannel(channel) }
    }, [conversationId])


    const addOptimisticMessage = (content: string) => {
        const tempId = `temp_${Date.now()}`
        const tempMsg: Message = {
            id: tempId,
            content,
            sender: 'human',
            created_at: new Date().toISOString(),
            status: 'sending'
        }

        setMessages(prev => {
            const newMap = new Map(prev)
            newMap.set(tempId, tempMsg)
            return newMap
        })

        return tempId
    }

    const confirmMessageSent = (tempId: string, realMessage: Message) => {
        setMessages(prev => {
            const newMap = new Map(prev)
            newMap.delete(tempId)
            newMap.set(realMessage.id, realMessage)
            return newMap
        })
    }

    const markMessageFailed = (tempId: string) => {
        setMessages(prev => {
            const newMap = new Map(prev)
            const m = newMap.get(tempId)
            if (m) newMap.set(tempId, { ...m, status: 'failed' })
            return newMap
        })
    }

    const updateLocalMessagesRead = (ids: string[]) => {
        setMessages(prev => {
            const newMap = new Map(prev)
            let hasChanges = false
            ids.forEach(id => {
                const m = newMap.get(id)
                if (m && m.status !== 'read') {
                    newMap.set(id, { ...m, status: 'read' })
                    hasChanges = true
                }
            })
            return hasChanges ? newMap : prev
        })
    }

    return {
        messages,
        isAiThinking,
        setIsAiThinking,
        addOptimisticMessage,
        confirmMessageSent,
        markMessageFailed,
        updateLocalMessagesRead
    }
}
