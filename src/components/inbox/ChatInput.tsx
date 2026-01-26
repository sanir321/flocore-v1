import { Button } from '@/components/ui/button'
import { Send } from 'lucide-react'
import { useState, useRef, useEffect } from 'react'

interface ChatInputProps {
    onSend: (message: string) => void
    onTyping: (isTyping: boolean) => void
    disabled: boolean
    placeholder?: string
}

export const ChatInput = ({ onSend, onTyping, disabled, placeholder = "Type a message..." }: ChatInputProps) => {
    const [value, setValue] = useState('')
    const textareaRef = useRef<HTMLTextAreaElement>(null)
    const typingTimeoutRef = useRef<any>(null)

    // Auto-resize logic
    useEffect(() => {
        if (textareaRef.current) {
            textareaRef.current.style.height = 'inherit'
            const scrollHeight = textareaRef.current.scrollHeight
            textareaRef.current.style.height = `${Math.min(scrollHeight, 120)}px`
        }
    }, [value])

    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault()
            handleSend()
        }
    }

    const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        setValue(e.target.value)

        // Handle Typing Indicator
        onTyping(true)
        if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current)
        typingTimeoutRef.current = setTimeout(() => {
            onTyping(false)
        }, 2000)
    }

    const handleSend = () => {
        if (!value.trim() || disabled) return
        onSend(value)
        setValue('')
        onTyping(false)
        if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current)
    }

    return (
        <div className="relative flex items-end gap-2 max-w-4xl mx-auto min-h-[40px]">
            <div className="relative flex-1">
                <textarea
                    ref={textareaRef}
                    value={value}
                    onChange={handleChange}
                    disabled={disabled}
                    onKeyDown={handleKeyDown}
                    placeholder={placeholder}
                    rows={1}
                    className="w-full resize-none py-2.5 pl-4 pr-12 rounded-2xl border border-border/60 focus:outline-none focus:ring-1 focus:ring-primary/20 bg-slate-50 focus:bg-white transition-all shadow-sm text-xs disabled:opacity-50 disabled:cursor-not-allowed no-scrollbar"
                />
                <Button
                    size="icon"
                    className="absolute right-1.5 bottom-1.5 h-7 w-7 rounded-full bg-primary hover:bg-primary/90 text-primary-foreground shadow-sm transition-transform hover:scale-105 disabled:opacity-30 flex-none"
                    onClick={handleSend}
                    disabled={!value.trim() || disabled}
                >
                    <Send className="h-3 w-3" />
                </Button>
            </div>
        </div>
    )
}
