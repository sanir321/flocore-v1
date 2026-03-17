import { useRef, useEffect } from 'react'
import { cn } from '@/lib/utils'
import { formatDistanceToNow } from 'date-fns'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
    MessageSquare,
    Search,
    Inbox,
    PanelLeft,
    Bot,
    Filter,
    Slack,
    Send,
    Globe,
    Mail,
} from 'lucide-react'
import FlowCoreLoader from '@/components/ui/FlowCoreLoader'

// Imported Components & Hooks
import { MessageBubble } from '@/components/inbox/MessageBubble'
import type { Message } from '@/components/inbox/MessageBubble'
import { ChatInput } from '@/components/inbox/ChatInput'
import { usePresence } from '@/hooks/usePresence'
import { useInboxManager } from '@/hooks/useInboxManager'

export default function InboxPage() {
    const {
        workspace,
        filteredConversations,
        selectedConversation,
        setSelectedConversation,
        agents,
        isLoading,
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
    } = useInboxManager()

    const { isUserOnline } = usePresence(workspace?.id)
    const messagesEndRef = useRef<HTMLDivElement>(null)

    // Scroll Effect
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }, [messages, isAiThinking])

    const renderChannelIcon = (channel: string | null | undefined, size = "h-3 w-3") => {
        switch (channel) {
            case 'whatsapp': return <MessageSquare className={`${size} text-emerald-500`} />
            case 'gmail':
            case 'email': return <Mail className={`${size} text-blue-500`} />
            case 'slack': return <Slack className={`${size} text-teal-500`} />
            case 'telegram': return <Send className={`${size} text-sky-500`} />
            case 'webchat': return <Globe className={`${size} text-slate-500`} />
            default: return <MessageSquare className={`${size} text-muted-foreground`} />
        }
    }

    if (isLoading) return <FlowCoreLoader />

    return (
        <div className="flex h-full bg-background overflow-hidden relative">
            {/* LIST COLUMN */}
            <div className={cn(
                "w-full md:w-[320px] flex-none border-r border-border bg-card/50 backdrop-blur-sm flex flex-col",
                selectedConversation ? "hidden md:flex" : "flex"
            )}>
                <div className="p-3 border-b border-border/40 space-y-3">
                    <h1 className="text-xl font-bold px-1">Inbox</h1>
                    <div className="relative group">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground group-focus-within:text-foreground transition-colors" />
                        <Input
                            id="inbox-search"
                            placeholder="Search messages..."
                            className="pl-9 h-9 text-xs bg-background/50 border-transparent focus:bg-background transition-all rounded-lg"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            aria-label="Search messages"
                        />
                    </div>
                </div>
                <div className="flex items-center gap-2 p-3 px-4 overflow-x-auto no-scrollbar border-b border-border/20">
                    <Button variant={activeSidebarFilter === 'all' ? 'default' : 'ghost'} size="sm" onClick={() => setActiveSidebarFilter('all')} className="rounded-full text-xs h-8 px-4">All</Button>
                    <Button variant={activeSidebarFilter === 'mine' ? 'default' : 'ghost'} size="sm" onClick={() => setActiveSidebarFilter('mine')} className="rounded-full text-xs h-8 px-4">Assigned</Button>

                    {agents.length > 1 && (
                        <div className="ml-auto flex items-center gap-2">
                            <Filter className="h-3 w-3 text-muted-foreground" />
                            <select
                                id="agent-filter-select"
                                className="text-xs bg-transparent border-none focus:ring-0 text-muted-foreground cursor-pointer"
                                value={selectedAgentFilter || ''}
                                onChange={(e) => setSelectedAgentFilter(e.target.value || null)}
                                aria-label="Filter by AI Agent"
                            >
                                <option value="">All Agents</option>
                                {agents.map(agent => (
                                    <option key={agent.id} value={agent.id}>{agent.name}</option>
                                ))}
                            </select>
                        </div>
                    )}
                </div>
                <div className="flex-1 overflow-y-auto p-3 space-y-2">
                    {filteredConversations.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-64 text-center opacity-50">
                            <Inbox className="h-6 w-6 mb-3" />
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
                                aria-label={`Conversation with ${conv.contact.name || conv.contact.phone || conv.contact.email || "Visitor"}`}
                            >
                                <div className="flex justify-between items-center mb-1">
                                    <div className="flex items-center gap-2 overflow-hidden">
                                        <div className="relative">
                                            {renderChannelIcon(conv.channel || conv.contact?.channel)}
                                            {isUserOnline(conv.agent_id || undefined) && (
                                                <span className="absolute -top-1 -right-1 w-2 h-2 bg-emerald-500 border border-white rounded-full pulse-ping" />
                                            )}
                                        </div>
                                        <span className={cn("font-medium text-xs truncate", conv.unread_count > 0 && selectedConversation?.id !== conv.id && "text-foreground font-bold")}>
                                            {conv.contact.name || conv.contact.phone || conv.contact.email || "Visitor"}
                                        </span>
                                    </div>
                                    <span className="text-[9px] text-muted-foreground shrink-0">{conv.last_message_at ? formatDistanceToNow(new Date(conv.last_message_at), { addSuffix: true }) : ''}</span>
                                </div>
                                <div className="flex items-center justify-between gap-2">
                                    <p className="text-[10px] text-muted-foreground line-clamp-1 flex-1">{conv.messages?.[0]?.content || "No preview"}</p>
                                    {conv.agent && (
                                        <span className="flex items-center gap-1 text-[9px] px-1.5 py-0.5 rounded-full bg-slate-100 text-foreground shrink-0 border border-slate-200/50">
                                            <Bot className="h-2.5 w-2.5" />
                                            {conv.agent.name}
                                        </span>
                                    )}
                                </div>
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
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
                                         {renderChannelIcon(selectedConversation.channel || selectedConversation.contact?.channel, "h-4 w-4")}
                                    </div>
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <h2 className="font-semibold text-xs">{selectedConversation.contact.name || selectedConversation.contact.phone || selectedConversation.contact.email}</h2>
                                            {isUserOnline(selectedConversation.agent_id || undefined) && (
                                                <div className="flex items-center gap-1">
                                                    <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
                                                    <span className="text-[9px] text-emerald-500 font-medium">Online</span>
                                                </div>
                                            )}
                                        </div>
                                        <p className="text-[10px] text-muted-foreground">{selectedConversation.assigned_to_human ? 'Manual Mode' : 'AI Active'}</p>
                                    </div>
                                </div>
                            </div>
                            <div className="flex items-center gap-4">
                                <Button size="sm" variant={selectedConversation.status === 'done' ? "outline" : "default"} onClick={() => updateStatus(selectedConversation.id, selectedConversation.status === 'done' ? 'todo' : 'done')} className="h-8 text-xs">{selectedConversation.status === 'done' ? 'Reopen' : 'Resolve'}</Button>

                                <Button
                                    size="sm"
                                    onClick={() => toggleHumanTakeover()}
                                    disabled={isTakingControl}
                                    className={cn("h-8 text-xs transition-all", selectedConversation.assigned_to_human ? "bg-slate-200 text-foreground" : "bg-foreground text-background")}
                                >
                                    {isTakingControl ? 'Switching...' : selectedConversation.assigned_to_human ? 'Resume AI' : 'Take Control'}
                                </Button>
                            </div>
                        </div>

                        {/* Messages */}
                        <div className="flex-1 overflow-y-auto p-4 space-y-4">
                            {Array.from(messages.values()).map((msg) => (
                                <MessageBubble key={msg.id} message={msg as Message} />
                            ))}

                            {getTypingMessage() && (
                                <div className="flex items-center gap-2 px-3 py-2 text-[10px] text-muted-foreground bg-slate-50 border border-slate-100/50 rounded-xl w-fit animate-in fade-in slide-in-from-left-2">
                                    <div className="flex gap-1">
                                        <span className="w-1 h-1 bg-slate-400 rounded-full animate-bounce [animation-delay:-0.3s]" />
                                        <span className="w-1 h-1 bg-slate-400 rounded-full animate-bounce [animation-delay:-0.15s]" />
                                        <span className="w-1 h-1 bg-slate-400 rounded-full animate-bounce" />
                                    </div>
                                    <span>{getTypingMessage()}</span>
                                </div>
                            )}

                            {isAiThinking && !selectedConversation.assigned_to_human && (
                                <div className="flex flex-col items-end ml-auto animate-in fade-in slide-in-from-bottom-2 duration-300">
                                    <div className="bg-slate-50/80 backdrop-blur-sm px-4 py-2.5 rounded-2xl rounded-tr-sm border border-slate-100 flex items-center gap-2 shadow-sm">
                                        <div className="flex gap-1">
                                            <span className="w-1.5 h-1.5 bg-foreground/40 rounded-full animate-bounce [animation-delay:-0.3s]" />
                                            <span className="w-1.5 h-1.5 bg-foreground/40 rounded-full animate-bounce [animation-delay:-0.15s]" />
                                            <span className="w-1.5 h-1.5 bg-foreground/40 rounded-full animate-bounce" />
                                        </div>
                                        <span className="text-[10px] font-bold text-foreground/60 uppercase tracking-tighter">AI Processing</span>
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
                    <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground opacity-30">
                        <MessageSquare className="h-10 w-10 mb-4" />
                        <p>Select a conversation</p>
                    </div>
                )}
            </div>
        </div>
    )
}
