import { CheckCircle, XCircle } from 'lucide-react'
import { cn } from '@/lib/utils'

interface ConnectionStatusProps {
    isConnected: boolean
}

export function WhatsAppConnectionStatus({ isConnected }: ConnectionStatusProps) {
    return (
        <div className={cn(
            "rounded-xl border p-5 flex items-center gap-5 transition-all duration-300",
            isConnected
                ? "bg-slate-50/50 border-slate-200"
                : "bg-white border-border hover:border-foreground/20"
        )}>
            <div className={cn(
                "w-12 h-12 rounded-full flex items-center justify-center shadow-sm border",
                isConnected
                    ? "bg-white text-emerald-500"
                    : "bg-slate-50 text-muted-foreground"
            )}>
                {isConnected ? (
                    <CheckCircle className="h-5 w-5" />
                ) : (
                    <XCircle className="h-5 w-5" />
                )}
            </div>
            <div className="flex-1">
                <div className="flex items-center gap-2">
                    <p className="font-semibold text-sm text-foreground">
                        {isConnected ? 'WhatsApp Connected' : 'Not Connected'}
                    </p>
                </div>
                <p className="text-xs text-muted-foreground mt-0.5">
                    {isConnected
                        ? 'Your agent is active and listening for messages via Meta Cloud API.'
                        : 'Connect with a Meta API developer account.'}
                </p>
            </div>
        </div>
    )
}
