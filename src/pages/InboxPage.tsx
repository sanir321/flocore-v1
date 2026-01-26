import { useState, useEffect, useMemo, useRef } from 'react'
import { useDebounce } from '@/hooks/useDebounce'
import { useWorkspace } from '@/context/WorkspaceContext'
import { supabase } from '@/lib/supabase'
import { cn } from '@/lib/utils'
import { formatDistanceToNow, format } from 'date-fns'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
    MessageSquare,
    Search,
    Send,
    Inbox,
    PanelLeft,
    X,
} from 'lucide-react'
import {
    sendEscalationNotification,
    sendMessageNotification
} from '@/lib/notifications'
import { api } from '@/lib/api'
import FlowCoreLoader from '@/components/ui/FlowCoreLoader'
// Removed specific UI imports to avoid build errors
// Dropped DropdownMenu and Badge in favor of lucide-icons and standard spans to avoid missing dep errors

// --- INTERFACES ---
interface Contact {
    id: string
    name: string | null
    phone: string
    email?: string | null
    channel?: string | null
    tags?: string[] | null
}

// --- REFACTOR: Use DB status values internally ---
interface Conversation {
    id: string
    status: 'todo' | 'follow_up' | 'done' // Matches DB constraints
    escalated: boolean
    assigned_to_human: boolean
    last_message_at: string
    unread_count: number
    contact: Contact
    messages?: { content: string }[]
}

interface Message {
    id: string
    content: string
    sender: 'human' | 'ai' | 'customer' | 'system' | string
    created_at: string | null
}

export default function InboxPage() {
    const [conversations, setConversations] = useState<Conversation[]>([])
    const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null)
    const [messages, setMessages] = useState<Message[]>([])
    const [newMessage, setNewMessage] = useState('')
    const { workspace, loading: workspaceLoading } = useWorkspace()

    // Restored missing state
    const [searchQuery, setSearchQuery] = useState('')
    const debouncedSearchQuery = useDebounce(searchQuery, 300)
    const [activeSidebarFilter, setActiveSidebarFilter] = useState<'all' | 'mine'>('all')
    const selectedConversationRef = useRef<Conversation | null>(null)
    const messagesEndRef = useRef<HTMLDivElement>(null)
    const [isAiThinking, setIsAiThinking] = useState(false)

    // Auto-scroll to bottom behavior
    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }

    useEffect(() => {
        scrollToBottom()
    }, [messages, isAiThinking])

    // Keep ref in sync
    useEffect(() => {
        selectedConversationRef.current = selectedConversation
    }, [selectedConversation])

    // Data Fetching & Realtime
    useEffect(() => {
        if (!workspace || workspaceLoading) return

        const fetchConversationsList = async () => {
            const { data } = await supabase
                .from('conversations')
                .select('id, status, escalated, assigned_to_human, last_message_at, unread_count, contact:contacts(id, name, phone, email, channel, tags), messages(content)')
                .eq('workspace_id', workspace.id)
                .order('last_message_at', { ascending: false })

            if (data) {
                const mappedData = data.map((c: any) => ({
                    ...c,
                    // Ensure status is valid, default to todo if null/invalid
                    status: (['todo', 'follow_up', 'done'].includes(c.status) ? c.status : 'todo'),
                    messages: c.messages?.[0] ? [c.messages[0]] : []
                }))
                setConversations(mappedData as Conversation[])
            }
        }

        fetchConversationsList()

        const channel = supabase
            .channel('inbox-updates')
            .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'conversations' },
                (payload) => {
                    fetchConversationsList()
                    const newData = payload.new as any
                    if (selectedConversationRef.current?.id === newData.id) {
                        setSelectedConversation(prev => ({ ...prev!, ...newData }))
                        // If we are looking at it, it should be read
                        if (newData.unread_count > 0) {
                            supabase.from('conversations')
                                .update({ unread_count: 0, last_read_at: new Date().toISOString() } as any)
                                .eq('id', newData.id)
                                .then(({ error }) => {
                                    if (error) console.error("Failed to mark read (RT):", error)
                                })
                        }
                    }

                    if (newData.escalated && !(payload.old as any).escalated) {
                        sendEscalationNotification('Customer', newData.id)
                    }
                }
            )
            .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'conversations' },
                () => fetchConversationsList()
            )
            .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' },
                (payload) => {
                    fetchConversationsList()
                    const newMessage = payload.new as Message
                    if (selectedConversationRef.current?.id === (payload.new as any).conversation_id) {
                        setMessages(prev => {
                            if (prev.find(m => m.id === newMessage.id)) return prev
                            return [...prev, newMessage]
                        })
                        if (newMessage.sender === 'ai') setIsAiThinking(false)
                        // Mark read implicitly if open
                        if (selectedConversationRef.current) {
                            supabase.from('conversations')
                                .update({ unread_count: 0, last_read_at: new Date().toISOString() } as any)
                                .eq('id', selectedConversationRef.current.id)
                                .then()
                        }
                    }
                    if (newMessage.sender === 'customer') {
                        sendMessageNotification('Customer', newMessage.content, (payload.new as any).conversation_id)
                    }
                }
            )
            .subscribe()

        return () => { supabase.removeChannel(channel) }
    }, [workspace, workspaceLoading])

    // --- NEW: Fetch Messages for Selected Conversation ---
    useEffect(() => {
        if (!selectedConversation) {
            setMessages([])
            return
        }

        const fetchMessages = async () => {
            const { data, error } = await supabase
                .from('messages')
                .select('*')
                .eq('conversation_id', selectedConversation.id)
                .order('created_at', { ascending: true })

            if (error) {
                console.error('Error fetching messages:', error)
            } else {
                setMessages(data as Message[])
                // Mark as read on open
                if (selectedConversation.unread_count > 0) {
                    updateStatus(selectedConversation.id, selectedConversation.status, true)
                }
            }
        }

        fetchMessages()
    }, [selectedConversation?.id])

    const handleSendMessage = async () => {
        if (!newMessage.trim() || !selectedConversation || !workspace?.id) return

        // Mark as read immediately when user interacts
        if (selectedConversation.unread_count > 0) {
            updateStatus(selectedConversation.id, selectedConversation.status, true)
        }

        const tempId = Math.random().toString()
        const tempMsg: Message = { id: tempId, content: newMessage, sender: 'human', created_at: new Date().toISOString() }
        setMessages(prev => [...prev, tempMsg])
        const messageToSend = newMessage
        setNewMessage('')

        if (!selectedConversation.assigned_to_human && selectedConversation.status === 'todo') {
            setIsAiThinking(true)
        }

        const { error } = await supabase.from('messages').insert({
            conversation_id: selectedConversation.id,
            content: tempMsg.content,
            sender: 'human'
        })

        if (error) {
            setMessages(prev => prev.filter(m => m.id !== tempId))
            return
        }

        if (selectedConversation.assigned_to_human && selectedConversation.contact?.phone) {
            await api.sendMessage({
                workspaceId: workspace.id,
                conversationId: selectedConversation.id,
                message: messageToSend,
                customerPhone: selectedConversation.contact.phone
            })
        }

        // Reopen if closed/done
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

        const { error } = await supabase.from('conversations').update(updates as any).eq('id', id)
        if (error) console.error("Update Status Failed:", error)
    }


    const toggleHumanTakeover = async () => {
        if (!selectedConversation) return
        const newValue = !selectedConversation.assigned_to_human
        setSelectedConversation(prev => prev ? { ...prev, assigned_to_human: newValue } : null)
        await supabase.from('conversations').update({ assigned_to_human: newValue }).eq('id', selectedConversation.id)
    }

    // --- FILTER LOGIC ---
    const filteredConversations = useMemo(() => {
        return conversations.filter(c => {
            if (debouncedSearchQuery) {
                const q = debouncedSearchQuery.toLowerCase()
                const name = c.contact?.name?.toLowerCase() || ''
                const phone = c.contact?.phone?.toLowerCase() || ''
                if (!name.includes(q) && !phone.includes(q)) return false
            }

            if (activeSidebarFilter === 'mine') {
                return c.assigned_to_human === true || c.escalated === true
            }

            return true
        })
    }, [conversations, debouncedSearchQuery, activeSidebarFilter])

    if (workspaceLoading) return <FlowCoreLoader />

    return (
        <div className="flex h-full bg-background overflow-hidden relative">

            {/* COLUMN 1: INBOX LIST */}
            <div className={cn(
                "w-[320px] flex-none border-r border-border bg-card/50 backdrop-blur-sm flex flex-col transition-all duration-300",
                selectedConversation ? "hidden md:flex" : "flex w-full md:w-[320px]"
            )}>
                {/* Search Header */}
                <div className="p-3 border-b border-border/40">
                    <h1 className="text-lg font-bold tracking-tight mb-3 px-1">Inbox</h1>
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
                    <Button
                        variant={activeSidebarFilter === 'all' ? 'default' : 'ghost'}
                        size="sm"
                        onClick={() => setActiveSidebarFilter('all')}
                        className="rounded-full text-xs h-8 px-4"
                    >
                        All
                    </Button>
                    <Button
                        variant={activeSidebarFilter === 'mine' ? 'default' : 'ghost'}
                        size="sm"
                        onClick={() => setActiveSidebarFilter('mine')}
                        className="rounded-full text-xs h-8 px-4"
                    >
                        Assigned to me
                    </Button>
                </div>

                {/* Conversation List */}
                <div className="flex-1 overflow-y-auto p-3 space-y-2">
                    {workspaceLoading ? (
                        <div className="space-y-3 pt-4">
                            {[1, 2, 3].map(i => <div key={i} className="h-20 bg-muted/50 rounded-xl animate-pulse" />)}
                        </div>
                    ) : filteredConversations.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-64 text-center">
                            <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mb-3">
                                <Inbox className="h-6 w-6 text-muted-foreground" />
                            </div>
                            <p className="text-sm font-medium text-foreground">No conversations found</p>
                            <p className="text-xs text-muted-foreground">Adjust filters or wait for new messages</p>
                        </div>
                    ) : (
                        filteredConversations.map(conv => (
                            <button
                                key={conv.id}
                                onClick={() => {
                                    setSelectedConversation(conv)
                                    if (conv.unread_count > 0) {
                                        updateStatus(conv.id, conv.status, true)
                                    }
                                }}
                                className={cn(
                                    "w-full text-left p-3 rounded-lg transition-all duration-200 border border-transparent group relative hover:shadow-sm",
                                    selectedConversation?.id === conv.id
                                        ? "bg-white shadow-sm border-border/50 ring-1 ring-border/50"
                                        : "hover:bg-white/60"
                                )}
                            >
                                <div className="flex justify-between items-start mb-1">
                                    <div className="flex items-center gap-1.5 min-w-0">
                                        <span className={cn(
                                            "font-medium text-xs text-foreground truncate group-hover:text-primary transition-colors",
                                            conv.unread_count > 0 && "text-primary font-bold"
                                        )}>
                                            {conv.contact?.name || conv.contact?.phone || 'Unknown Contact'}
                                        </span>
                                        {/* OPTIONAL: Visualization of status but keeping clean for now */}
                                    </div>
                                    <span className="text-[9px] text-muted-foreground whitespace-nowrap ml-2">
                                        {conv.last_message_at
                                            ? formatDistanceToNow(new Date(conv.last_message_at), { addSuffix: true }).replace('about ', '')
                                            : ''}
                                    </span>
                                </div>

                                <div className="flex justify-between items-end gap-2">
                                    <p className={cn(
                                        "text-[10px] line-clamp-2 leading-relaxed text-muted-foreground w-full",
                                        conv.unread_count > 0 && "font-medium text-foreground"
                                    )}>
                                        {conv.messages?.[0]?.content || "No preview"}
                                    </p>

                                    {conv.unread_count > 0 && (
                                        <span className="flex-none h-5 min-w-[1.25rem] px-1.5 rounded-full bg-primary text-primary-foreground text-[10px] font-bold flex items-center justify-center shadow-lg shadow-primary/20">
                                            {conv.unread_count}
                                        </span>
                                    )}
                                </div>

                                {conv.status === 'done' && (
                                    <div className="mt-1 flex items-center gap-1">
                                        <div className="w-1.5 h-1.5 rounded-full bg-green-500" />
                                        <span className="text-[9px] text-muted-foreground">Resolved</span>
                                    </div>
                                )}

                                <div className="absolute left-0 bottom-4 w-1 h-8 bg-primary rounded-r-md transition-all duration-300 opacity-0 -translate-x-full group-hover:translate-x-0 group-hover:opacity-100" />
                            </button>
                        ))
                    )}
                </div>
            </div>

            {/* COLUMN 2: CHAT AREA */}
            <div className={cn(
                "flex-1 flex flex-col bg-white/50 backdrop-blur-sm relative",
                selectedConversation ? "flex absolute inset-0 md:static z-20" : "hidden md:flex"
            )}>
                {selectedConversation ? (
                    <>
                        {/* Chat Header */}
                        <div className="flex-none h-14 px-4 border-b border-border/40 flex items-center justify-between bg-white/80 backdrop-blur-md sticky top-0 z-30">
                            <div className="flex items-center gap-3">
                                {/* Mobile Back Button */}
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="md:hidden -ml-2 text-muted-foreground h-8 w-8"
                                    onClick={() => setSelectedConversation(null)}
                                >
                                    <PanelLeft className="h-4 w-4" />
                                </Button>

                                <div className="h-8 w-8 rounded-full bg-gradient-to-tr from-primary to-orange-400 flex items-center justify-center text-white shadow-sm ring-2 ring-background">
                                    <span className="font-bold text-xs">
                                        {(selectedConversation.contact?.name?.[0] || selectedConversation.contact?.phone?.[0] || '?').toUpperCase()}
                                    </span>
                                </div>
                                <div>
                                    <h2 className="font-semibold text-foreground text-xs flex items-center gap-2">
                                        {selectedConversation.contact?.name || selectedConversation.contact?.phone}
                                        {selectedConversation.escalated && (
                                            <span className="text-[9px] bg-red-100 text-red-600 px-1.5 py-0.5 rounded-full border border-red-200 uppercase tracking-wider font-bold">Escalated</span>
                                        )}
                                    </h2>
                                    <p className="text-[10px] text-muted-foreground flex items-center gap-1.5">
                                        <span className={cn(
                                            "w-1.5 h-1.5 rounded-full",
                                            selectedConversation.status === 'done' ? "bg-green-500" : "bg-yellow-400"
                                        )} />
                                        {selectedConversation.status === 'done' ? 'Resolved' : 'Open'}
                                        <span className="text-border">|</span>
                                        {selectedConversation.assigned_to_human ? 'Manual Mode' : 'AI Active'}
                                    </p>
                                </div>
                            </div>

                            <div className="flex items-center gap-2">
                                <Button
                                    size="sm"
                                    variant={selectedConversation.status === 'done' ? "outline" : "default"}
                                    onClick={() => updateStatus(selectedConversation.id, selectedConversation.status === 'done' ? 'todo' : 'done')}
                                    className="h-8 text-xs rounded-lg"
                                >
                                    {selectedConversation.status === 'done' ? 'Reopen' : 'Resolve'}
                                </Button>

                                <Button
                                    size="sm"
                                    onClick={toggleHumanTakeover}
                                    className={cn(
                                        "rounded-lg text-xs font-semibold h-8 shadow-sm transition-all",
                                        selectedConversation.assigned_to_human
                                            ? "bg-secondary text-secondary-foreground hover:bg-secondary/80 border border-border"
                                            : "bg-primary text-primary-foreground hover:bg-primary/90 shadow-primary/25"
                                    )}
                                >
                                    {selectedConversation.assigned_to_human ? 'Resume AI' : 'Take Control'}
                                </Button>

                                <Button variant="ghost" size="icon" onClick={() => setSelectedConversation(null)}>
                                    <X className="h-5 w-5 text-muted-foreground" />
                                </Button>
                            </div>
                        </div>

                        {/* Messages Area */}
                        <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-slate-50/50">
                            {messages.map((msg) => {
                                const isMe = msg.sender === 'human';
                                const isAI = msg.sender === 'ai';
                                const isSystem = msg.sender === 'system';

                                if (isSystem) return (
                                    <div key={msg.id} className="flex justify-center my-4">
                                        <span className="text-[10px] font-mono text-muted-foreground bg-secondary px-3 py-1 rounded-full border border-border/50">
                                            {msg.content}
                                        </span>
                                    </div>
                                );

                                return (
                                    <div key={msg.id} className={cn("flex flex-col max-w-[80%]", (isMe || isAI) ? "ml-auto items-end" : "mr-auto items-start")}>
                                        <div className={cn(
                                            "rounded-xl px-4 py-2 text-xs shadow-sm relative group transition-all",
                                            (isMe || isAI)
                                                ? (isAI
                                                    ? "bg-indigo-50 text-indigo-900 border border-indigo-100 rounded-tr-sm"
                                                    : "bg-primary text-primary-foreground rounded-br-sm shadow-primary/10")
                                                : "bg-white text-foreground border border-border rounded-bl-sm"
                                        )}>
                                            {isAI && <p className="text-[8px] font-bold text-indigo-400 mb-0.5 uppercase tracking-wider">AI Assistant</p>}
                                            <p className="leading-relaxed whitespace-pre-wrap">{msg.content}</p>

                                            <span className={cn(
                                                "text-[9px] absolute -bottom-4 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap text-muted-foreground",
                                                (isMe || isAI) ? "right-0" : "left-0"
                                            )}>
                                                {format(new Date(msg.created_at || new Date()), 'h:mm a')}
                                            </span>
                                        </div>
                                    </div>
                                );
                            })}

                            {isAiThinking && (
                                <div className="flex flex-col max-w-[80%] items-end ml-auto">
                                    <div className="bg-indigo-50 border border-indigo-100 px-4 py-3 rounded-2xl rounded-tr-sm flex items-center gap-1.5">
                                        <div className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-bounce [animation-delay:-0.3s]" />
                                        <div className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-bounce [animation-delay:-0.15s]" />
                                        <div className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-bounce" />
                                    </div>
                                </div>
                            )}
                            <div ref={messagesEndRef} />
                        </div>

                        <div className="p-3 bg-white border-t border-border/40">
                            <div className="relative flex items-center gap-2 max-w-4xl mx-auto">
                                <Input
                                    value={newMessage}
                                    onChange={e => setNewMessage(e.target.value)}
                                    onKeyDown={e => e.key === 'Enter' && !e.shiftKey && handleSendMessage()}
                                    placeholder="Type a message..."
                                    className="h-10 pl-4 pr-10 rounded-full border-border/60 focus:ring-primary/20 bg-slate-50 focus:bg-white transition-all shadow-sm text-xs"
                                />
                                <Button
                                    size="icon"
                                    className="absolute right-1 top-1 h-8 w-8 rounded-full bg-primary hover:bg-primary/90 text-primary-foreground shadow-sm transition-transform hover:scale-105"
                                    onClick={handleSendMessage}
                                    disabled={!newMessage.trim()}
                                >
                                    <Send className="h-3.5 w-3.5" />
                                </Button>
                            </div>
                            <div className="text-center mt-2">
                                <p className="text-[10px] text-muted-foreground">
                                    Press <kbd className="font-sans px-1 py-0.5 bg-muted rounded border border-border">Enter</kbd> to send
                                </p>
                            </div>
                        </div>
                    </>
                ) : (
                    // Empty State
                    <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-grid-small-black/[0.05]">
                        <div className="w-24 h-24 rounded-3xl bg-gradient-to-br from-indigo-50 to-blue-50 flex items-center justify-center mb-6 shadow-sm border border-white">
                            <MessageSquare className="h-10 w-10 text-primary/50" />
                        </div>
                        <h2 className="text-2xl font-bold text-foreground mb-2">Select a conversation</h2>
                        <p className="text-muted-foreground max-w-sm mx-auto">
                            Choose a contact from the list to start chatting or view conversation history.
                        </p>
                    </div>
                )}
            </div>
        </div>
    )
}
