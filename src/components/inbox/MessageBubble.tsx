import { format } from 'date-fns'
import { cn } from '@/lib/utils'

export interface Message {
    id: string
    content: string
    sender: 'human' | 'ai' | 'customer' | 'system' | string
    created_at: string | null
    status?: 'sending' | 'sent' | 'delivered' | 'read' | 'failed'
    read_at?: string | null
}

interface MessageBubbleProps {
    message: Message
}

export const MessageBubble = ({ message }: MessageBubbleProps) => {
    const isMe = message.sender === 'human'
    const isAI = message.sender === 'ai'
    const isSystem = message.sender === 'system'

    if (isSystem) return (
        <div className="flex justify-center my-4">
            <span className="text-[10px] font-mono text-muted-foreground bg-secondary px-3 py-1 rounded-full border border-border/50">
                {message.content}
            </span>
        </div>
    )

    return (
        <div className={cn("flex flex-col max-w-[80%]", (isMe || isAI) ? "ml-auto items-end" : "mr-auto items-start")}>
            <div className={cn(
                "rounded-xl px-4 py-2 text-xs shadow-sm relative group transition-all",
                (isMe || isAI)
                    ? (isAI
                        ? "bg-indigo-50 text-indigo-900 border border-indigo-100 rounded-tr-sm"
                        : "bg-primary text-primary-foreground rounded-br-sm shadow-primary/10")
                    : "bg-white text-foreground border border-border rounded-bl-sm"
            )}>
                {isAI && <p className="text-[8px] font-bold text-indigo-400 mb-0.5 uppercase tracking-wider">AI Assistant</p>}
                <p className="leading-relaxed whitespace-pre-wrap">{message.content}</p>

                <div className={cn(
                    "items-center gap-1 absolute -bottom-4 transition-opacity flex",
                    (isMe || isAI) ? "right-0" : "left-0 opacity-0 group-hover:opacity-100"
                )}>
                    <span className="text-[9px] whitespace-nowrap text-muted-foreground mr-1">
                        {format(new Date(message.created_at || new Date()), 'h:mm a')}
                    </span>
                    {isMe && (
                        <span className="text-muted-foreground/80 flex items-center">
                            {message.status === 'sending' && <div className="w-2 h-2 rounded-full border border-current border-t-transparent animate-spin" />}
                            {message.status !== 'sending' && (
                                <span className={cn("text-[9px] tracking-tighter", message.status === 'read' ? "text-blue-500 font-bold" : "")}>
                                    {message.status === 'read' ? '✓✓' : '✓'}
                                </span>
                            )}
                        </span>
                    )}
                </div>
            </div>
        </div>
    )
}
