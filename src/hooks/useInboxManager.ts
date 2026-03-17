import { useState, useEffect, useMemo, useRef } from 'react'
import { useWorkspace } from '@/hooks/queries/useWorkspace'
import { useConversations } from '@/hooks/queries/useConversations'
import { useAgents } from '@/hooks/queries/useAgents'
import { useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { useDebounce } from '@/hooks/useDebounce'
import { sendEscalationNotification, requestNotificationPermission } from '@/lib/notifications'
import { api } from '@/lib/api'
import { useMessages } from '@/hooks/queries/useMessages'
import { useTypingIndicator } from '@/hooks/useTypingIndicator'

// --- INTERFACES ---
export interface Contact {
    id: string
    name: string | null
    phone: string
    email?: string | null
    channel?: string | null
    tags?: string[] | null
}

export interface Agent {
    id: string
    name: string
    type: string
}

export interface Conversation {
    id: string
    status: 'todo' | 'follow_up' | 'done'
    escalated: boolean
    assigned_to_human: boolean
    last_message_at: string
    unread_count: number
    contact: Contact
    messages?: { content: string }[]
    agent_id?: string | null
    agent?: Agent | null
    channel?: 'whatsapp' | 'gmail' | 'slack' | 'telegram' | 'webchat' | null
}

export function useInboxManager() {
    const { data: workspace } = useWorkspace()
    const workspaceId = workspace?.id
    const queryClient = useQueryClient()

    const { data: convsData, isLoading: conversationsLoading } = useConversations(workspaceId)
    const { data: agentsData, isLoading: agentsLoading } = useAgents(workspaceId)

    const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null)
    const [searchQuery, setSearchQuery] = useState('')
    const debouncedSearchQuery = useDebounce(searchQuery, 300)
    const [activeSidebarFilter, setActiveSidebarFilter] = useState<'all' | 'mine'>('all')
    const [selectedAgentFilter, setSelectedAgentFilter] = useState<string | null>(null)
    const [isTakingControl, setIsTakingControl] = useState(false)

    const conversations = (convsData as unknown as Conversation[]) || []
    const agents = (agentsData as unknown as Agent[]) || []

    const {
        messages,
        isAiThinking,
        addOptimisticMessage,
        confirmMessageSent,
        markMessageFailed,
        updateLocalMessagesRead
    } = useMessages(selectedConversation?.id)

    const {
        sendTyping,
        broadcastReadReceipt,
        getTypingMessage
    } = useTypingIndicator(selectedConversation?.id)

    // Sync ref for effect cleanup if needed
    const selectedConversationRef = useRef<Conversation | null>(null)
    useEffect(() => {
        selectedConversationRef.current = selectedConversation
    }, [selectedConversation])

    // Notifications & Permissions
    useEffect(() => {
        if (!workspaceId || !conversations.length) return
        const unreadEscalated = conversations.filter(c => c.escalated && c.unread_count > 0)
        unreadEscalated.forEach(conv => {
            sendEscalationNotification(conv.contact?.name || 'Customer', conv.id)
        })
        requestNotificationPermission()
    }, [workspaceId, conversations])

    // Read Receipt Logic
    useEffect(() => {
        if (!selectedConversation || messages.size === 0) return

        const unreadIds = Array.from(messages.values())
            .filter(m => m.sender !== 'human' && m.status !== 'read')
            .map(m => m.id)

        if (unreadIds.length > 0) {
            const timer = setTimeout(async () => {
                const { error } = await supabase.from('messages')
                    .update({ status: 'read', read_at: new Date().toISOString() })
                    .in('id', unreadIds)

                if (!error) {
                    broadcastReadReceipt(unreadIds)
                    updateLocalMessagesRead(unreadIds)
                    if (selectedConversation.unread_count > 0) {
                        supabase.from('conversations')
                            .update({ unread_count: 0, last_read_at: new Date().toISOString() })
                            .eq('id', selectedConversation.id)
                            .then()
                    }
                }
            }, 1000)
            return () => clearTimeout(timer)
        }
    }, [messages, selectedConversation?.id])

    // Handlers
    const handleSendMessage = async (content: string) => {
        if (!selectedConversation || !workspaceId) return
        if (!selectedConversation.assigned_to_human) return

        const tempId = addOptimisticMessage(content)
        const { data: sentData, error } = await supabase.from('messages').insert({
            conversation_id: selectedConversation.id,
            content,
            sender: 'human',
            status: 'sent'
        }).select().single()

        if (error) {
            markMessageFailed(tempId)
        } else {
            confirmMessageSent(tempId, sentData)
        }

        await api.sendMessage({
            workspaceId,
            conversationId: selectedConversation.id,
            message: content
        })

        if (selectedConversation.status === 'done') {
            updateStatus(selectedConversation.id, 'todo')
        }
    }

    async function updateStatus(id: string, newStatus: 'todo' | 'follow_up' | 'done', resetUnread = false) {
        const updates: any = { status: newStatus }
        if (resetUnread) {
            updates.unread_count = 0
            updates.last_read_at = new Date().toISOString()
        }
        if (newStatus === 'done') {
            updates.assigned_to_human = false
        }

        const { error } = await supabase.from('conversations').update(updates).eq('id', id)
        
        if (!error) {
            queryClient.invalidateQueries({ queryKey: ['conversations', workspaceId] })
            if (selectedConversation?.id === id) {
                setSelectedConversation(prev => prev ? { ...prev, ...updates } : null)
            }
        }
    }

    const toggleHumanTakeover = async (active?: boolean) => {
        if (!selectedConversation || isTakingControl) return
        setIsTakingControl(true)

        const newAssignedToHuman = typeof active === 'boolean' ? !active : !selectedConversation.assigned_to_human
        setSelectedConversation(prev => prev ? { ...prev, assigned_to_human: newAssignedToHuman } : null)

        const { error } = await supabase.from('conversations')
            .update({ assigned_to_human: newAssignedToHuman })
            .eq('id', selectedConversation.id)

        if (error) {
            setSelectedConversation(prev => prev ? { ...prev, assigned_to_human: !newAssignedToHuman } : null)
        } else {
            queryClient.invalidateQueries({ queryKey: ['conversations', workspaceId] })
        }
        setIsTakingControl(false)
    }

    const filteredConversations = useMemo(() => {
        return conversations.filter(c => {
            if (selectedAgentFilter && c.agent_id !== selectedAgentFilter) return false
            if (debouncedSearchQuery) {
                const q = debouncedSearchQuery.toLowerCase()
                return (c.contact?.name?.toLowerCase().includes(q) || c.contact?.phone?.includes(q))
            }
            if (activeSidebarFilter === 'mine') return c.assigned_to_human || c.escalated
            return true
        })
    }, [conversations, debouncedSearchQuery, activeSidebarFilter, selectedAgentFilter])

    return {
        workspace,
        conversations,
        filteredConversations,
        selectedConversation,
        setSelectedConversation,
        agents,
        isLoading: conversationsLoading || agentsLoading,
        searchQuery,
        setSearchQuery,
        activeSidebarFilter,
        setActiveSidebarFilter,
        selectedAgentFilter,
        setSelectedAgentFilter,
        isTakingControl,
        handleSendMessage,
        updateStatus,
        toggleHumanTakeover,
        messages,
        isAiThinking,
        sendTyping,
        getTypingMessage
    }
}
