import { useState, useRef, useEffect } from 'react'
import { supabase } from '@/lib/supabase'

export interface TypingUser {
    user_id: string
    name: string
    timestamp: number
}

export const useTypingIndicator = (conversationId: string | undefined) => {
    const [typingUsers, setTypingUsers] = useState<Map<string, TypingUser>>(new Map())
    const typingChannelRef = useRef<any>(null)
    const [prevConversationId, setPrevConversationId] = useState<string | undefined>(conversationId)

    // Reset typing users when conversationId changes
    if (conversationId !== prevConversationId) {
        setTypingUsers(new Map())
        setPrevConversationId(conversationId)
    }

    useEffect(() => {
        if (!conversationId) {
            if (typingChannelRef.current) {
                supabase.removeChannel(typingChannelRef.current)
                typingChannelRef.current = null
            }
            return
        }

        const channelId = `conversation:${conversationId}`
        const channel = supabase.channel(channelId)
        typingChannelRef.current = channel

        channel
            .on('broadcast', { event: 'typing' }, (payload) => {
                const { user_id, name, is_typing } = payload.payload

                // Ignore placeholder or self (logic can be refined if auth id available)
                if (user_id === 'current_user_placeholder') return

                setTypingUsers(prev => {
                    const newMap = new Map(prev)
                    if (is_typing) {
                        newMap.set(user_id, { user_id, name, timestamp: Date.now() })
                        // Auto-remove after 3s
                        setTimeout(() => {
                            setTypingUsers(curr => {
                                const updated = new Map(curr)
                                if (updated.get(user_id)?.timestamp === newMap.get(user_id)?.timestamp) {
                                    updated.delete(user_id)
                                }
                                return updated
                            })
                        }, 3000)
                    } else {
                        newMap.delete(user_id)
                    }
                    return newMap
                })
            })
            .subscribe()

        return () => {
            if (typingChannelRef.current) supabase.removeChannel(typingChannelRef.current)
        }
    }, [conversationId])

    const sendTyping = async (isTyping: boolean) => {
        if (!conversationId || !typingChannelRef.current) return

        const user = await supabase.auth.getUser()
        const userId = user.data.user?.id || 'anon'
        const userName = user.data.user?.user_metadata?.full_name || 'Agent'

        typingChannelRef.current.send({
            type: 'broadcast',
            event: 'typing',
            payload: { user_id: userId, name: userName, is_typing: isTyping }
        })
    }

    const broadcastReadReceipt = (messageIds: string[]) => {
        if (!conversationId || !typingChannelRef.current) return
        typingChannelRef.current.send({
            type: 'broadcast',
            event: 'read_receipt',
            payload: { message_ids: messageIds }
        })
    }

    const getTypingMessage = () => {
        const users = Array.from(typingUsers.values())
        if (users.length === 0) return ''
        if (users.length === 1) return `${users[0].name} is typing...`
        if (users.length === 2) return `${users[0].name} and ${users[1].name} are typing...`
        return `${users[0].name} and ${users.length - 1} others are typing...`
    }

    return {
        typingUsers,
        sendTyping,
        broadcastReadReceipt,
        getTypingMessage,
        typingChannelRef
    }
}
