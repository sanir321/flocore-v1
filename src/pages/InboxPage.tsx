import { useState, useEffect, useMemo, useRef } from 'react'
import { useDebounce } from '@/hooks/useDebounce'
import { useWorkspace } from '@/context/WorkspaceContext'
import { supabase } from '@/lib/supabase'
import { cn } from '@/lib/utils'
import { formatDistanceToNow } from 'date-fns'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
    MessageSquare,
    Search,
    Inbox,
    PanelLeft,
} from 'lucide-react'
import { sendEscalationNotification } from '@/lib/notifications'
import { api } from '@/lib/api'
import FlowCoreLoader from '@/components/ui/FlowCoreLoader'

// Imported Components & Hooks
import { MessageBubble } from '@/components/inbox/MessageBubble'
import type { Message } from '@/components/inbox/MessageBubble'
import { ChatInput } from '@/components/inbox/ChatInput'
import { useMessages } from '@/hooks/useMessages'
import { useTypingIndicator } from '@/hooks/useTypingIndicator'

// --- INTERFACES (Conversations still managed locally for now as it couples with List View) ---
interface Contact {
    id: string
    name: string | null
    phone: string
    email?: string | null
    channel?: string | null
    tags?: string[] | null
}

interface Conversation {
    id: string
    status: 'todo' | 'follow_up' | 'done'
    escalated: boolean
    assigned_to_human: boolean
    last_message_at: string
    unread_count: number
    contact: Contact
    messages?: { content: string }[]
}

export default function InboxPage() {
    // --- GLOBAL STATE ---
    const { workspace, loading: workspaceLoading } = useWorkspace()
    const [conversations, setConversations] = useState<Conversation[]>([])
    const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null)

    // --- HOOKS ---
    // Only init hooks if we have a selected conversation
    const {
        messages,
        isAiThinking,
        addOptimisticMessage,
        confirmMessageSent,
        markMessageFailed,
        updateLocalMessagesRead
    } = useMessages(selectedConversation?.id)

    const {
        typingUsers,
        sendTyping,
        broadcastReadReceipt
    } = useTypingIndicator(selectedConversation?.id)

    // --- LOCAL STATE ---
    const [searchQuery, setSearchQuery] = useState('')
    const debouncedSearchQuery = useDebounce(searchQuery, 300)
    const [activeSidebarFilter, setActiveSidebarFilter] = useState<'all' | 'mine'>('all')
    const selectedConversationRef = useRef<Conversation | null>(null)
    const messagesEndRef = useRef<HTMLDivElement>(null)

    // Sync Ref (Critical for cleanup logic)
    useEffect(() => {
        selectedConversationRef.current = selectedConversation
    }, [selectedConversation])

    // --- AUTO-RETURN TO AI LOGIC ---
    // When a human leaves a chat (switches or navigates away), it automatically returns to AI
    useEffect(() => {
        const conversationIdAtStart = selectedConversation?.id

        return () => {
            if (conversationIdAtStart) {
                // If the conversation we are leaving was assigned to a human, revert it to AI
                // We use the Ref to check the LATEST state of assigned_to_human before leaving
                if (
                    selectedConversationRef.current?.id === conversationIdAtStart &&
                    selectedConversationRef.current.assigned_to_human
                ) {
                    console.log(`[Auto-AI] Reverting conversation ${conversationIdAtStart} to AI Active`)
                    supabase.from('conversations')
                        .update({ assigned_to_human: false } as any)
                        .eq('id', conversationIdAtStart)
                        .then(({ error }) => {
                            if (error) console.error('[Auto-AI] Failed to revert:', error)
                        })
                }
            }
        }
    }, [selectedConversation?.id])

    // Scroll Effect
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }, [messages, isAiThinking])

    // --- CONVERSATION LIST LOGIC ---
    useEffect(() => {
        if (!workspace || workspaceLoading) return

        const fetchConversationsList = async () => {
            const { data, error } = await supabase
                .from('conversations')
                .select('id, status, escalated, assigned_to_human, last_message_at, unread_count, contact:contacts(id, name, phone, email, channel, tags), messages(content)')
                .eq('workspace_id', workspace.id)
                .order('last_message_at', { ascending: false })

            if (data && !error) {
                const mappedData = data.map((c: any) => ({
                    ...c,
                    status: (['todo', 'follow_up', 'done'].includes(c.status) ? c.status : 'todo'),
                    messages: c.messages?.[0] ? [c.messages[0]] : [],
                    unread_count: (selectedConversationRef.current?.id === c.id) ? 0 : (c.unread_count || 0)
                }))
                setConversations(mappedData as Conversation[])
            }
        }
        fetchConversationsList()

        const channel = supabase
            .channel('inbox-list-updates')
            .on('postgres_changes', {
                event: '*',
                schema: 'public',
                table: 'conversations',
                filter: `workspace_id=eq.${workspace.id}`
            },
                (payload) => {
                    if (payload.eventType === 'INSERT') {
                        // New conversation, safer to just re-fetch to get joins
                        fetchConversationsList()
                    } else if (payload.eventType === 'UPDATE') {
                        const updated = payload.new as any

                        setConversations(prev => {
                            const index = prev.findIndex(c => c.id === updated.id)
                            if (index === -1) return prev // Should not happen with filter

                            const newConversations = [...prev]
                            const old = newConversations[index]

                            // Merge updated fields, preserving joined data (contact, messages)
                            newConversations[index] = {
                                ...old,
                                ...updated,
                                // Enforce unread_count override for selected
                                unread_count: (selectedConversationRef.current?.id === updated.id) ? 0 : updated.unread_count
                            }

                            // Sort by last_message_at if it changed
                            if (updated.last_message_at !== old.last_message_at) {
                                return newConversations.sort((a, b) =>
                                    new Date(b.last_message_at).getTime() - new Date(a.last_message_at).getTime()
                                )
                            }

                            return newConversations
                        })

                        // Handle Live Updates for Selected
                        if (selectedConversationRef.current?.id === updated.id) {
                            setSelectedConversation(prev => prev ? { ...prev, ...updated, unread_count: 0 } : null)

                            // Auto-mark as read if we are looking at it
                            if (updated.unread_count > 0) {
                                supabase.from('conversations')
                                    .update({ unread_count: 0, last_read_at: new Date().toISOString() } as any)
                                    .eq('id', updated.id)
                                    .then()
                            }
                        }

                        // Escalation Notification
                        if (updated.escalated && !(payload.old as any).escalated) {
                            sendEscalationNotification(updated.contact?.name || 'Customer', updated.id)
                        }
                    } else if (payload.eventType === 'DELETE') {
                        setConversations(prev => prev.filter(c => c.id !== payload.old.id))
                        if (selectedConversationRef.current?.id === payload.old.id) {
                            setSelectedConversation(null)
                        }
                    }
                }
            )
            .subscribe()

        return () => { supabase.removeChannel(channel) }
    }, [workspace?.id, workspaceLoading])

    // --- READ RECEIPT TRIGGER ---
    useEffect(() => {
        if (!selectedConversation || messages.size === 0) return

        const unreadIds = Array.from(messages.values())
            .filter(m => m.sender !== 'human' && m.status !== 'read')
            .map(m => m.id)

        if (unreadIds.length > 0) {
            const timer = setTimeout(async () => {
                const { error } = await supabase.from('messages')
                    .update({ status: 'read', read_at: new Date().toISOString() } as any)
                    .in('id', unreadIds)

                if (!error) {
                    broadcastReadReceipt(unreadIds)
                    updateLocalMessagesRead(unreadIds)

                    // Clear conversation unread
                    if (selectedConversation.unread_count > 0) {
                        supabase.from('conversations')
                            .update({ unread_count: 0, last_read_at: new Date().toISOString() } as any)
                            .eq('id', selectedConversation.id)
                            .then()
                    }
                }
            }, 1000)
            return () => clearTimeout(timer)
        }
    }, [messages, selectedConversation?.id])


    // --- HANDLERS ---
    const handleSendMessage = async (content: string) => {
        if (!selectedConversation || !workspace?.id) return

        // Guard: Logic should prevent sending if not human, but double check
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
            return
        }

        confirmMessageSent(tempId, sentData as Message)

        // API Send (WhatsApp)
        if (selectedConversation.contact?.phone) {
            await api.sendMessage({
                workspaceId: workspace.id,
                conversationId: selectedConversation.id,
                message: content,
                customerPhone: selectedConversation.contact.phone
            })
        }

        if (selectedConversation.status === 'done') {
            updateStatus(selectedConversation.id, 'todo')
        }
    }

    const updateStatus = async (id: string, newStatus: 'todo' | 'follow_up' | 'done', resetUnread = false) => {
        const updates: any = { status: newStatus }
        if (resetUnread) {
            updates.unread_count = 0
            updates.last_read_at = new Date().toISOString()
        }
        setConversations(prev => prev.map(c => c.id === id ? { ...c, status: newStatus, ...(resetUnread ? { unread_count: 0 } : {}) } : c))
        if (selectedConversation?.id === id) setSelectedConversation(prev => prev ? { ...prev, status: newStatus, ...(resetUnread ? { unread_count: 0 } : {}) } : null)
        await supabase.from('conversations').update(updates).eq('id', id)
    }

    const [isTakingControl, setIsTakingControl] = useState(false)

    const toggleHumanTakeover = async (active?: boolean) => {
        if (!selectedConversation || isTakingControl) return

        setIsTakingControl(true)

        // If 'active' is provided (from Switch), that refers to AI Mode.
        // assigned_to_human is the opposite of AI Mode Active.
        const newAssignedToHuman = typeof active === 'boolean' ? !active : !selectedConversation.assigned_to_human

        // Optimistic Update
        setSelectedConversation(prev => prev ? { ...prev, assigned_to_human: newAssignedToHuman } : null)
        setConversations(prev => prev.map(c => c.id === selectedConversation.id ? { ...c, assigned_to_human: newAssignedToHuman } : c))

        // Server Update
        const { error } = await supabase.from('conversations').update({ assigned_to_human: newAssignedToHuman }).eq('id', selectedConversation.id)

        if (error) {
            console.error('[Takeover] Failed to update:', error)
            // Rollback optimistic update
            setSelectedConversation(prev => prev ? { ...prev, assigned_to_human: !newAssignedToHuman } : null)
            setConversations(prev => prev.map(c => c.id === selectedConversation.id ? { ...c, assigned_to_human: !newAssignedToHuman } : c))
        }

        setIsTakingControl(false)
    }

    const filteredConversations = useMemo(() => {
        return conversations.filter(c => {
            if (debouncedSearchQuery) {
                const q = debouncedSearchQuery.toLowerCase()
                return (c.contact?.name?.toLowerCase().includes(q) || c.contact?.phone?.includes(q))
            }
            if (activeSidebarFilter === 'mine') return c.assigned_to_human || c.escalated
            return true
        })
    }, [conversations, debouncedSearchQuery, activeSidebarFilter])

    if (workspaceLoading) return <FlowCoreLoader />

    return (
        <div className="flex h-full bg-background overflow-hidden relative">
            {/* LIST COLUMN */}
            <div className={cn(
                "w-full md:w-[320px] flex-none border-r border-border bg-card/50 backdrop-blur-sm flex flex-col",
                selectedConversation ? "hidden md:flex" : "flex"
            )}>
                {/* Search Header */}
                <div className="p-2 border-b border-border/40">
                    <div className="relative group">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground group-focus-within:text-primary transition-colors" />
                        <Input
                            placeholder="Search messages..."
                            className="pl-9 h-9 text-xs bg-background/50 border-transparent focus:bg-background focus:ring-1 focus:ring-primary/20 transition-all rounded-lg"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                </div>
                {/* Filters */}
                <div className="flex items-center gap-2 p-3 px-4 overflow-x-auto no-scrollbar border-b border-border/20">
                    <Button variant={activeSidebarFilter === 'all' ? 'default' : 'ghost'} size="sm" onClick={() => setActiveSidebarFilter('all')} className="rounded-full text-xs h-8 px-4">All</Button>
                    <Button variant={activeSidebarFilter === 'mine' ? 'default' : 'ghost'} size="sm" onClick={() => setActiveSidebarFilter('mine')} className="rounded-full text-xs h-8 px-4">Assigned to me</Button>
                </div>
                {/* List */}
                <div className="flex-1 overflow-y-auto p-3 space-y-2">
                    {filteredConversations.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-64 text-center">
                            <Inbox className="h-6 w-6 text-muted-foreground mb-3" />
                            <p className="text-sm font-medium">No conversations</p>
                        </div>
                    ) : (
                        filteredConversations.map(conv => (
                            <button
                                key={conv.id}
                                onClick={() => {
                                    setSelectedConversation(conv)
                                    if (conv.unread_count > 0) updateStatus(conv.id, conv.status, true)
                                }}
                                className={cn(
                                    "w-full text-left p-3 rounded-lg transition-all border border-transparent hover:bg-white/60",
                                    selectedConversation?.id === conv.id && "bg-white shadow-sm ring-1 ring-border/50"
                                )}
                            >
                                <div className="flex justify-between mb-1">
                                    <span className={cn("font-medium text-xs truncate", conv.unread_count > 0 && selectedConversation?.id !== conv.id && "text-primary font-bold")}>{conv.contact.name || conv.contact.phone}</span>
                                    <span className="text-[9px] text-muted-foreground">{conv.last_message_at ? formatDistanceToNow(new Date(conv.last_message_at), { addSuffix: true }) : ''}</span>
                                </div>
                                <p className="text-[10px] text-muted-foreground line-clamp-2">{conv.messages?.[0]?.content || "No preview"}</p>
                            </button>
                        ))
                    )}
                </div>
            </div>

            {/* CHAT COLUMN */}
            <div className={cn(
                "flex-1 flex flex-col bg-white/50 backdrop-blur-sm relative h-full overflow-hidden",
                selectedConversation ? "flex absolute inset-0 md:static z-20" : "hidden md:flex"
            )}>
                {selectedConversation ? (
                    <>
                        {/* Header */}
                        <div className="flex-none h-14 px-4 border-b border-border/40 flex items-center justify-between bg-white/80 backdrop-blur-md sticky top-0 z-30">
                            <div className="flex items-center gap-3">
                                <Button variant="ghost" size="icon" className="md:hidden" onClick={() => setSelectedConversation(null)}><PanelLeft className="h-4 w-4" /></Button>
                                <div>
                                    <h2 className="font-semibold text-xs">{selectedConversation.contact.name || selectedConversation.contact.phone}</h2>
                                    <p className="text-[10px] text-muted-foreground">{selectedConversation.assigned_to_human ? 'Manual Mode' : 'AI Active'}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-4">
                                <Button size="sm" variant={selectedConversation.status === 'done' ? "outline" : "default"} onClick={() => updateStatus(selectedConversation.id, selectedConversation.status === 'done' ? 'todo' : 'done')} className="h-8 text-xs">{selectedConversation.status === 'done' ? 'Reopen' : 'Resolve'}</Button>

                                <Button
                                    size="sm"
                                    onClick={() => toggleHumanTakeover()}
                                    disabled={isTakingControl}
                                    className={cn("h-8 text-xs transition-all", selectedConversation.assigned_to_human ? "bg-secondary text-secondary-foreground" : "bg-primary text-primary-foreground")}
                                >
                                    {isTakingControl ? 'Switching...' : selectedConversation.assigned_to_human ? 'Resume AI' : 'Take Control'}
                                </Button>
                            </div>
                        </div>

                        {/* Messages */}
                        <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-slate-50/50">
                            {Array.from(messages.values()).map(msg => (
                                <MessageBubble key={msg.id} message={msg} />
                            ))}

                            {/* Typing Indicator */}
                            {Array.from(typingUsers.values()).length > 0 && (
                                <div className="flex items-center gap-2 px-3 py-2 text-xs text-muted-foreground bg-white/50 rounded-xl w-fit">
                                    <span className="animate-pulse">...</span>
                                    <span>{Array.from(typingUsers.values())[0].name} is typing...</span>
                                </div>
                            )}

                            {isAiThinking && !selectedConversation.assigned_to_human && (
                                <div className="flex flex-col items-end ml-auto animate-in fade-in slide-in-from-bottom-2 duration-300">
                                    <div className="bg-indigo-50/80 backdrop-blur-sm px-4 py-2.5 rounded-2xl rounded-tr-sm border border-indigo-100 flex items-center gap-2 shadow-sm">
                                        <div className="flex gap-1">
                                            <span className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce [animation-delay:-0.3s]" />
                                            <span className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce [animation-delay:-0.15s]" />
                                            <span className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce" />
                                        </div>
                                        <span className="text-[10px] font-bold text-indigo-500 uppercase tracking-tighter">AI Processing</span>
                                    </div>
                                </div>
                            )}
                            <div ref={messagesEndRef} />
                        </div>

                        {/* Input Area */}
                        <div className="p-3 bg-white border-t border-border/40 relative">
                            <ChatInput
                                onSend={handleSendMessage}
                                onTyping={(isTyping) => sendTyping(isTyping)}
                                disabled={!selectedConversation.assigned_to_human}
                                placeholder={!selectedConversation.assigned_to_human ? "Take control to reply..." : "Type a message..."}
                            />
                        </div>
                    </>
                ) : (
                    <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground">
                        <MessageSquare className="h-10 w-10 mb-4 opacity-20" />
                        <p>Select a conversation</p>
                    </div>
                )}
            </div>
        </div>
    )
}
