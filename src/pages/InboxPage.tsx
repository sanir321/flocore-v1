import { useEffect, useState, useMemo } from 'react'
import { supabase } from '@/lib/supabase'
import { cn } from '@/lib/utils'
import { formatDistanceToNow, isToday, isYesterday, format } from 'date-fns'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
    MessageSquare,
    Search,
    User,
    Send,
    Inbox,
    CheckCircle,
    Clock,
    Check,
    Archive,
    PanelLeft,
    X,
} from 'lucide-react'
import {
    sendEscalationNotification,
    sendMessageNotification
} from '@/lib/notifications'
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

interface Conversation {
    id: string
    status: 'open' | 'followup' | 'closed'
    escalated: boolean
    assigned_to_human: boolean
    last_message_at: string
    unread_count: number
    contact: Contact
    messages?: { content: string }[] // For preview fetching
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
    const [loading, setLoading] = useState(true)
    const [workspaceId, setWorkspaceId] = useState<string | null>(null)

    const [searchQuery, setSearchQuery] = useState('')
    const [activeSidebarFilter, setActiveSidebarFilter] = useState<'all' | 'mine'>('all')
    const [isAiThinking, setIsAiThinking] = useState(false)
    const [isInboxExpanded, setIsInboxExpanded] = useState(true)

    useEffect(() => {
        let workspaceIdLocal: string | null = null

        const fetchConversations = async () => {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) return

            const { data: workspace } = await supabase
                .from('workspaces')
                .select('id')
                .eq('owner_id', user.id)
                .single()

            if (!workspace) {
                setLoading(false)
                return
            }

            workspaceIdLocal = workspace.id
            setWorkspaceId(workspace.id)

            await fetchConversationsList(workspace.id)
            setLoading(false)
        }

        fetchConversations()

        // Realtime Subscriptions
        const channel = supabase
            .channel('inbox-updates')
            // Listen for Conversation updates (unread counts, status, escalation)
            .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'conversations' },
                (payload) => {
                    console.log('[Realtime] Conversation update:', payload)
                    if (workspaceIdLocal) fetchConversationsList(workspaceIdLocal)

                    const newData = payload.new as any

                    // Update selected conversation if it matches
                    if (selectedConversation?.id === newData.id) {
                        setSelectedConversation(prev => ({ ...prev!, ...newData }))
                    }

                    // Escalation Notification Logic
                    const oldData = payload.old as any
                    if (newData.escalated && !oldData.escalated) {
                        const prefs = localStorage.getItem(`notification_settings_${workspaceIdLocal}`)
                        const settings = prefs ? JSON.parse(prefs) : { escalation_alerts: true }
                        if (settings.escalation_alerts) {
                            sendEscalationNotification('Customer', newData.id)
                        }
                    }
                }
            )
            // Listen for INSERT (New conversations)
            .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'conversations' },
                () => { if (workspaceIdLocal) fetchConversationsList(workspaceIdLocal) }
            )
            // Listen for INSERT (New Messages)
            .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' },
                (payload) => {
                    console.log('[Realtime] New message:', payload)
                    if (workspaceIdLocal) fetchConversationsList(workspaceIdLocal)

                    // If message belongs to selected conversation, update messages list
                    const newMessage = payload.new as Message
                    if (selectedConversation && (payload.new as any).conversation_id === selectedConversation.id) {
                        setMessages(prev => {
                            // Dedupe
                            if (prev.find(m => m.id === newMessage.id)) return prev
                            return [...prev, newMessage]
                        })
                        // Stop thinking animation if AI replied
                        if (newMessage.sender === 'ai') setIsAiThinking(false)
                    }

                    // Notification Logic
                    if (newMessage.sender === 'customer') {
                        const prefs = localStorage.getItem(`notification_settings_${workspaceIdLocal}`)
                        const settings = prefs ? JSON.parse(prefs) : { new_message_alerts: true }
                        if (settings.new_message_alerts) {
                            sendMessageNotification('Customer', newMessage.content || 'New message', (payload.new as any).conversation_id)
                        }
                    }
                }
            )
            .subscribe((status) => {
                console.log('[Realtime] Status:', status)
            })

        return () => { supabase.removeChannel(channel) }
    }, [selectedConversation?.id]) // Re-subscribe if selected changes? No, this is global list. 
    // Actually, we shouldn't depend on selectedConversation for the global channel, but we need it for message injection. 
    // Better strategy: Global channel refreshes list. Individual channel (below) handles active chat.
    // However, I merged logic above to ensure list stays fresh. Let's keep it simple.

    // We already have a specific effect for fetching messages below.
    // To avoid race conditions, let's keep the global channel focused on List Updates.

    const fetchConversationsList = async (wsId: string) => {
        const { data } = await supabase
            .from('conversations')
            .select(`
                id, status, escalated, assigned_to_human, last_message_at, unread_count,
                contact:contacts(id, name, phone, email, channel, tags),
                messages(content)
            `)
            .eq('workspace_id', wsId)
            .order('last_message_at', { ascending: false })

        if (data) {
            const mappedData = data.map((c: any) => ({
                ...c,
                status: c.status || 'open'
            }))
            setConversations(mappedData as Conversation[])
        }
    }

    // Fetch Messages when conversation selected
    useEffect(() => {
        if (!selectedConversation) return
        const fetchMessages = async () => {
            const { data } = await supabase
                .from('messages')
                .select('id, content, sender, created_at')
                .eq('conversation_id', selectedConversation.id)
                .order('created_at', { ascending: true })
            if (data) setMessages(data)

            // Mark as read (optimistic + db)
            if (selectedConversation.unread_count > 0) {
                await supabase.rpc('mark_conversation_read', { conversation_id: selectedConversation.id })
                // Update local list to remove badge
                setConversations(prev => prev.map(c => c.id === selectedConversation.id ? { ...c, unread_count: 0 } : c))
            }
        }
        fetchMessages()
    }, [selectedConversation?.id])

    const handleSendMessage = async () => {
        if (!newMessage.trim() || !selectedConversation) return

        const tempId = Math.random().toString()
        const tempMsg: Message = { id: tempId, content: newMessage, sender: 'human', created_at: new Date().toISOString() }
        setMessages(prev => [...prev, tempMsg])
        const messageToSend = newMessage
        setNewMessage('')

        if (!selectedConversation.assigned_to_human && selectedConversation.status === 'open') {
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
            try {
                await fetch(
                    `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/send-message`,
                    {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`
                        },
                        body: JSON.stringify({
                            workspace_id: workspaceId,
                            conversation_id: selectedConversation.id,
                            message: messageToSend,
                            customer_phone: selectedConversation.contact.phone
                        })
                    }
                )
            } catch (err) {
                console.error('Error sending WhatsApp:', err)
            }
        }

        if (selectedConversation.status === 'closed') {
            updateStatus(selectedConversation.id, 'open')
        }
    }

    const updateStatus = async (id: string, newStatus: 'open' | 'followup' | 'closed') => {
        setConversations(prev => prev.map(c => c.id === id ? { ...c, status: newStatus } : c))
        if (selectedConversation?.id === id) setSelectedConversation(prev => prev ? { ...prev, status: newStatus } : null)
        await supabase.from('conversations').update({ status: newStatus }).eq('id', id)
    }

    const toggleHumanTakeover = async () => {
        if (!selectedConversation) return
        const newValue = !selectedConversation.assigned_to_human
        setSelectedConversation(prev => prev ? { ...prev, assigned_to_human: newValue } : null)
        await supabase.from('conversations').update({ assigned_to_human: newValue }).eq('id', selectedConversation.id)
    }

    const isSameDay = (d1: Date, d2: Date) => {
        return d1.getFullYear() === d2.getFullYear() &&
            d1.getMonth() === d2.getMonth() &&
            d1.getDate() === d2.getDate()
    }

    const formatMessageDate = (dateStr: string | null) => {
        if (!dateStr) return 'Unknown'
        const date = new Date(dateStr)
        if (isToday(date)) return 'Today'
        if (isYesterday(date)) return 'Yesterday'
        return format(date, 'MMMM d, yyyy')
    }

    // --- FILTER LOGIC ---
    const filteredConversations = useMemo(() => {
        return conversations.filter(c => {
            if (searchQuery) {
                const q = searchQuery.toLowerCase()
                const name = c.contact?.name?.toLowerCase() || ''
                const phone = c.contact?.phone?.toLowerCase() || ''
                if (!name.includes(q) && !phone.includes(q)) return false
            }

            if (activeSidebarFilter === 'mine') {
                return c.assigned_to_human === true || c.escalated === true
            }

            return true
        })
    }, [conversations, searchQuery, activeSidebarFilter])

    if (loading) return <FlowCoreLoader />

    return (
        <div className="flex h-screen bg-background overflow-hidden font-sans">

            {/* --- COLUMN 1: SIDEBAR (Collapsible) --- */}
            <div className={cn(
                "flex-none border-r flex flex-col bg-card transition-all duration-300 ease-in-out overflow-hidden relative group",
                isInboxExpanded ? "w-64" : "w-[60px]"
            )}>
                {/* Header with Toggle */}
                <div className="p-4 flex items-center justify-between border-b h-[60px]">
                    {isInboxExpanded ? (
                        <div className="flex items-center gap-2 overflow-hidden">
                            <h2 className="font-semibold text-lg truncate">Your Inbox</h2>
                        </div>
                    ) : (
                        <div className="flex justify-center w-full">
                            <div className="h-6 w-6 rounded bg-primary text-white flex items-center justify-center font-bold text-xs">F</div>
                        </div>
                    )}

                    {/* Collapse Button */}
                    <button
                        onClick={() => setIsInboxExpanded(!isInboxExpanded)}
                        className={cn(
                            "absolute right-3 top-3.5 p-1.5 rounded-md text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-all",
                            !isInboxExpanded && "right-1/2 translate-x-1/2 top-3.5"
                        )}
                        title={isInboxExpanded ? "Collapse" : "Expand"}
                    >
                        <PanelLeft className="h-5 w-5" />
                    </button>
                </div>

                <div className="px-3 flex flex-col gap-1 mt-4">
                    <Button
                        variant={activeSidebarFilter === 'all' ? "secondary" : "ghost"}
                        className={cn(
                            "justify-start font-normal transition-all relative",
                            !isInboxExpanded && "justify-center px-0"
                        )}
                        onClick={() => setActiveSidebarFilter('all')}
                        title="All conversations"
                    >
                        <Inbox className={cn("h-4 w-4", isInboxExpanded && "mr-2")} />
                        {isInboxExpanded && "All conversations"}
                        {isInboxExpanded && conversations.some(c => (c.unread_count || 0) > 0) && (
                            <span className="ml-auto text-xs bg-muted px-1.5 py-0.5 rounded-full border">
                                {conversations.reduce((acc, c) => acc + (c.unread_count || 0), 0)}
                            </span>
                        )}
                    </Button>

                    <Button
                        variant={activeSidebarFilter === 'mine' ? "secondary" : "ghost"}
                        className={cn(
                            "justify-start font-normal text-muted-foreground transition-all",
                            !isInboxExpanded && "justify-center px-0"
                        )}
                        onClick={() => setActiveSidebarFilter('mine')}
                        title="Your conversations"
                    >
                        <User className={cn("h-4 w-4", isInboxExpanded && "mr-2")} />
                        {isInboxExpanded && "Your conversations"}
                    </Button>
                </div>

                <div className="mt-auto p-4 border-t">
                    {isInboxExpanded && (
                        <p className="text-xs text-muted-foreground text-center">Data Sync: <span className="text-emerald-500 font-medium">Active</span></p>
                    )}
                </div>
            </div>

            {/* --- MAIN AREA (Header + Content) --- */}
            <div className="flex-1 flex flex-col min-w-0">

                {/* 1. TOP HEADER */}
                <div className="flex-none border-b bg-white h-[60px] flex items-center px-6 justify-between">
                    <div className="flex items-center gap-4">
                        <h1 className="text-lg font-semibold flex items-center gap-2">
                            {activeSidebarFilter === 'all' ? 'All Conversations' : 'My Inbox'}
                        </h1>
                    </div>

                    <div className="relative w-64">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Search..."
                            className="pl-9 h-9"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                </div>

                {/* 2. CONTENT BODY (Split Layout) */}
                <div className="flex-1 flex overflow-hidden">

                    {filteredConversations.length === 0 && !searchQuery ? (
                        <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-slate-50/50">
                            <CheckCircle className="h-10 w-10 text-muted-foreground mb-4" />
                            <h3 className="text-lg font-medium text-slate-900">No conversations</h3>
                        </div>
                    ) : (
                        <>
                            {/* LIST COLUMN (Restored width) */}
                            <div className={cn(
                                "flex-col overflow-auto border-r bg-slate-50/30 transition-all",
                                selectedConversation ? "w-[350px] hidden md:flex" : "flex-1 md:w-[350px]"
                            )}>
                                <div className="divide-y divide-border/40">
                                    {filteredConversations.map(conv => (
                                        <div
                                            key={conv.id}
                                            onClick={() => setSelectedConversation(conv)}
                                            className={cn(
                                                "p-4 cursor-pointer hover:bg-slate-50 transition-colors group relative",
                                                selectedConversation?.id === conv.id ? "bg-blue-50/50" : ""
                                            )}
                                        >
                                            <div className="flex justify-between items-start mb-1">
                                                <span className={cn("font-medium text-sm text-slate-900 truncate pr-2", (conv.unread_count || 0) > 0 && "font-bold")}>
                                                    {conv.contact?.name || conv.contact?.phone}
                                                </span>
                                                <span className="text-[10px] text-muted-foreground whitespace-nowrap">
                                                    {formatDistanceToNow(new Date(conv.last_message_at), { addSuffix: true }).replace('about ', '')}
                                                </span>
                                            </div>

                                            <div className="flex justify-between items-end">
                                                <p className={cn(
                                                    "text-xs line-clamp-2 leading-relaxed text-slate-500 pr-2",
                                                    (conv.unread_count || 0) > 0 && "text-slate-900 font-medium"
                                                )}>
                                                    {conv.messages && conv.messages[0] ? conv.messages[0].content : "No messages yet"}
                                                </p>

                                                {(conv.unread_count || 0) > 0 && (
                                                    <div className="h-5 min-w-[1.25rem] px-1 rounded-full bg-blue-600 text-[10px] font-bold text-white flex items-center justify-center shadow-sm">
                                                        {conv.unread_count}
                                                    </div>
                                                )}
                                            </div>

                                            <div className="mt-2 flex gap-1">
                                                <span className="px-1.5 py-0.5 bg-slate-100 text-[10px] rounded text-slate-600 border border-slate-200">
                                                    WhatsApp
                                                </span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* CHAT COLUMN (Flex Grow - Bigger) */}
                            <div className="flex-1 flex flex-col bg-white min-w-0">
                                {selectedConversation ? (
                                    <>

                                        {/* Chat Header */}
                                        <div className="px-6 py-4 border-b flex items-center justify-between bg-white shadow-sm z-10">
                                            <div className="flex items-center gap-4">
                                                {/* Initials Avatar */}
                                                <div className="h-12 w-12 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white shadow-md">
                                                    <span className="font-bold text-lg">
                                                        {(selectedConversation.contact?.name?.[0] || selectedConversation.contact?.phone?.[0] || '?').toUpperCase()}
                                                    </span>
                                                </div>

                                                <div>
                                                    <div className="flex items-center gap-2">
                                                        <h2 className="font-bold text-slate-900 text-lg">
                                                            {selectedConversation.contact?.name || selectedConversation.contact?.phone}
                                                        </h2>
                                                        {selectedConversation.contact?.tags?.map(tag => (
                                                            <span key={tag} className="px-2 py-0.5 bg-slate-100 text-slate-600 text-[10px] rounded-full font-medium border border-slate-200">
                                                                {tag}
                                                            </span>
                                                        ))}
                                                    </div>

                                                    <div className="flex items-center gap-3 text-xs text-muted-foreground mt-0.5">
                                                        {selectedConversation.contact?.phone && (
                                                            <span className="flex items-center gap-1 bg-slate-50 px-1.5 py-0.5 rounded border border-slate-100">
                                                                <span className="opacity-50">📱</span> {selectedConversation.contact.phone}
                                                            </span>
                                                        )}
                                                        {selectedConversation.contact?.email && (
                                                            <span className="flex items-center gap-1 bg-slate-50 px-1.5 py-0.5 rounded border border-slate-100">
                                                                <span className="opacity-50">📧</span> {selectedConversation.contact.email}
                                                            </span>
                                                        )}
                                                        <span className={cn(
                                                            "flex items-center gap-1 px-1.5 py-0.5 rounded border ml-1",
                                                            selectedConversation.assigned_to_human
                                                                ? "bg-orange-50 border-orange-100 text-orange-700"
                                                                : "bg-emerald-50 border-emerald-100 text-emerald-700"
                                                        )}>
                                                            <div className={cn("h-1.5 w-1.5 rounded-full", selectedConversation.assigned_to_human ? "bg-orange-500" : "bg-emerald-500")}></div>
                                                            {selectedConversation.assigned_to_human ? 'Human Mode' : 'AI Active'}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-1">
                                                <Button
                                                    variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground"
                                                    onClick={() => updateStatus(selectedConversation.id, selectedConversation.status === 'closed' ? 'open' : 'closed')}
                                                    title={selectedConversation.status === 'closed' ? "Reopen" : "Mark as Done"}
                                                >
                                                    {selectedConversation.status === 'closed' ? <Inbox className="h-4 w-4" /> : <Check className="h-4 w-4" />}
                                                </Button>

                                                <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground" onClick={() => updateStatus(selectedConversation.id, 'followup')} title="Follow Up">
                                                    <Clock className="h-4 w-4" />
                                                </Button>

                                                <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground" onClick={() => updateStatus(selectedConversation.id, 'closed')} title="Archive">
                                                    <Archive className="h-4 w-4" />
                                                </Button>

                                                {/* TAKE OVER BUTTON */}
                                                <Button
                                                    variant={selectedConversation.assigned_to_human ? "secondary" : "default"}
                                                    size="sm"
                                                    className={cn(
                                                        "ml-2 rounded-xl text-xs font-medium",
                                                        selectedConversation.assigned_to_human
                                                            ? "bg-orange-100 text-orange-700 hover:bg-orange-200 border border-orange-200"
                                                            : "bg-primary text-primary-foreground"
                                                    )}
                                                    onClick={toggleHumanTakeover}
                                                >
                                                    {selectedConversation.assigned_to_human ? '🙋 Release to AI' : '✋ Take Over'}
                                                </Button>

                                                <div className="w-px h-4 bg-border mx-1"></div>
                                                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setSelectedConversation(null)}><X className="h-4 w-4" /></Button>
                                            </div>
                                        </div>

                                        {/* Messages */}
                                        <div className="flex-1 overflow-auto p-6 space-y-4 bg-slate-50">
                                            {messages.length === 0 && (
                                                <div className="text-center text-xs text-muted-foreground py-10">This conversation is empty.</div>
                                            )}
                                            {messages.map((msg, index) => {
                                                const isOperator = msg.sender === 'human'
                                                const isAI = msg.sender === 'ai'
                                                const isSystem = msg.sender === 'system'
                                                const isCustomer = !isOperator && !isAI && !isSystem

                                                // Date Separator Logic
                                                const showDateSeparator = index === 0 || !isSameDay(new Date(msg.created_at || ''), new Date(messages[index - 1].created_at || ''))

                                                return (
                                                    <div key={msg.id}>
                                                        {showDateSeparator && (
                                                            <div className="text-center my-4">
                                                                <span className="text-[10px] text-muted-foreground bg-slate-100 px-2 py-1 rounded-full uppercase tracking-wider font-medium">
                                                                    {formatMessageDate(msg.created_at)}
                                                                </span>
                                                            </div>
                                                        )}
                                                        <div className={cn(
                                                            "flex w-full mb-4",
                                                            isSystem ? "justify-center" :
                                                                (isOperator || isAI) ? "justify-end" : "justify-start"
                                                        )}>
                                                            <div className={cn(
                                                                "max-w-[80%] px-4 py-3 text-sm shadow-sm border relative group flex flex-col",
                                                                isSystem ? "bg-slate-100 text-slate-500 text-xs rounded-full px-3 py-1 border-transparent mb-2" : "rounded-2xl",

                                                                isOperator ? "bg-blue-600 text-white border-blue-600 rounded-br-sm" : "",
                                                                isAI ? "bg-purple-100 text-purple-900 border-purple-200 rounded-br-sm" : "",
                                                                isCustomer ? "bg-white border-slate-200 text-slate-800 rounded-bl-sm" : ""
                                                            )}>
                                                                {(isAI) && <span className="block text-[10px] font-bold text-purple-600 mb-1 uppercase tracking-wide">AI Assistant</span>}

                                                                <span>{msg.content}</span>

                                                                {/* Timestamp */}
                                                                {msg.created_at && !isSystem && (
                                                                    <span className={cn(
                                                                        "text-[10px] mt-1 block text-right opacity-70",
                                                                        isOperator || isAI ? "text-purple-100/80" : "text-muted-foreground"
                                                                    )}>
                                                                        {format(new Date(msg.created_at), 'h:mm a')}
                                                                    </span>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </div>
                                                )
                                            })}

                                            {/* AI Typing Indicator */}
                                            {isAiThinking && (
                                                <div className="flex w-full justify-end mb-4 animate-in fade-in slide-in-from-bottom-2">
                                                    <div className="bg-purple-50 border border-purple-100 text-purple-400 px-4 py-3 rounded-2xl rounded-br-sm shadow-sm flex items-center gap-1">
                                                        <div className="w-1.5 h-1.5 bg-purple-400 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                                                        <div className="w-1.5 h-1.5 bg-purple-400 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                                                        <div className="w-1.5 h-1.5 bg-purple-400 rounded-full animate-bounce"></div>
                                                    </div>
                                                </div>
                                            )}
                                        </div>

                                        {/* Input Area */}
                                        <div className="p-4 bg-white border-t">
                                            <div className="relative flex items-end gap-2">
                                                <div className="flex-1 relative">
                                                    <Input
                                                        placeholder="Type a reply..."
                                                        className="pr-12 py-6 resize-none"
                                                        value={newMessage}
                                                        onChange={e => setNewMessage(e.target.value)}
                                                        onKeyDown={e => e.key === 'Enter' && !e.shiftKey && handleSendMessage()}
                                                    />
                                                    <Button
                                                        size="icon"
                                                        className="absolute right-1.5 top-1.5 h-9 w-9"
                                                        onClick={handleSendMessage}
                                                        disabled={!newMessage.trim()}
                                                    >
                                                        <Send className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                            </div>
                                        </div>
                                    </>
                                ) : (
                                    // Empty State for Detail Column (when list exists but no selection)
                                    <div className="flex-1 hidden md:flex items-center justify-center bg-slate-50 text-muted-foreground">
                                        <div className="text-center p-8">
                                            <MessageSquare className="h-10 w-10 mx-auto mb-3 opacity-10" />
                                            <p className="text-sm opacity-50">Select a conversation to start chatting</p>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>
    )
}
