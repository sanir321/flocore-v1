import { useEffect, useState } from 'react'
import { useWorkspace } from '@/hooks/queries/useWorkspace'
import { useAgents } from '@/hooks/queries/useAgents'
import { useGmailConnection } from '@/hooks/queries/useGmailConnection'
import { useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useToast } from '@/hooks/use-toast'
import {
    CheckCircle,
    XCircle,
    Mail,
    Loader2,
    ShieldCheck,
    LogOut,
    User,
    ExternalLink
} from 'lucide-react'
import { cn } from '@/lib/utils'

export default function GmailSettingsPage() {
    const { data: workspace, isLoading: workspaceLoading } = useWorkspace()
    const workspaceId = workspace?.id

    const { data: agents, isLoading: agentsLoading } = useAgents(workspaceId)
    const agent = agents?.[0]
    const { data: connection, isLoading: connectionLoading } = useGmailConnection(workspaceId)
    
    const [isConnecting, setIsConnecting] = useState(false)
    const [isDisconnecting, setIsDisconnecting] = useState(false)
    const { toast } = useToast()
    const queryClient = useQueryClient()

    // Handle initial connection success/error from URL params
    useEffect(() => {
        const params = new URLSearchParams(window.location.search)
        if (params.get('connected') === 'gmail') {
            toast({ title: "Connected", description: "Gmail successfully connected." })
            window.history.replaceState({}, document.title, window.location.pathname)
            queryClient.invalidateQueries({ queryKey: ['gmail_connection', workspaceId] })
        }
        if (params.get('error')) {
            toast({ 
                title: "Connection Failed", 
                description: params.get('error'), 
                variant: "destructive" 
            })
            window.history.replaceState({}, document.title, window.location.pathname)
        }
    }, [workspaceId, queryClient, toast])

    const handleConnect = async () => {
        if (!agent?.id) {
            toast({ title: "Error", description: "No active agent found for this workspace.", variant: "destructive" })
            return
        }
        
        setIsConnecting(true)
        try {
            const { data: { session } } = await supabase.auth.getSession()
            if (!session) throw new Error('Not authenticated')

            const functionUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/gmail-oauth-start`
            const authUrl = `${functionUrl}?token=${session.access_token}&agentId=${agent.id}`
            
            // Redirect to the Edge Function
            window.location.href = authUrl
        } catch (error: any) {
             toast({ title: "Error", description: error.message, variant: "destructive" })
             setIsConnecting(false)
        }
    }

    const handleDisconnect = async () => {
        if (!agent?.id) return
        setIsDisconnecting(true)
        try {
            const { error } = await supabase.functions.invoke('gmail-disconnect', {
                body: { agentId: agent.id }
            })
            if (error) throw error

            queryClient.invalidateQueries({ queryKey: ['gmail_connection', workspaceId] })
            toast({ title: "Disconnected", description: "Gmail has been disconnected." })
        } catch (error: any) {
            toast({ title: "Error", description: error.message, variant: "destructive" })
        } finally {
            setIsDisconnecting(false)
        }
    }

    if (workspaceLoading || agentsLoading || connectionLoading) {
        return (
            <div className="flex h-64 items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        )
    }

    const isConnected = !!(connection as any)?.is_active

    return (
        <div className="space-y-10 max-w-4xl">
            {/* Header */}
            <div className="flex items-center gap-5 border-b pb-8">
                <div className="w-14 h-14 rounded-full border bg-slate-50 flex items-center justify-center text-muted-foreground">
                    <Mail className="h-7 w-7" />
                </div>
                <div className="flex-1">
                    <h1 className="text-3xl font-semibold tracking-tight text-foreground">Gmail Integration</h1>
                    <p className="text-muted-foreground text-base mt-2">Connect your Gmail to allow the AI to read and reply to emails.</p>
                </div>
            </div>

            {/* Connection Status Card */}
            <div className={cn(
                "rounded-xl border p-5 flex items-center gap-5 transition-all duration-300",
                isConnected ? "bg-slate-50/50 border-slate-200" : "bg-white border-border shadow-sm"
            )}>
                <div className={cn(
                    "w-12 h-12 rounded-full flex items-center justify-center shadow-sm border",
                    isConnected ? "bg-white text-emerald-500" : "bg-slate-50 text-muted-foreground"
                )}>
                    {isConnected ? <CheckCircle className="h-5 w-5" /> : <XCircle className="h-5 w-5" />}
                </div>
                <div className="flex-1">
                    <p className="font-semibold text-sm text-foreground">
                        {isConnected ? 'Gmail Connected' : 'Not Connected'}
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                        {isConnected 
                            ? `Active for ${(connection as any).gmail_address}. AI is polling for new messages.`
                            : 'Connect your business Gmail account to enable email support.'}
                    </p>
                </div>
            </div>

            <div className="grid gap-6">
                {!isConnected ? (
                    <Card className="rounded-xl border shadow-none overflow-hidden underline-offset-4">
                        <CardHeader className="bg-slate-50/50 border-b">
                            <CardTitle className="text-base font-medium flex items-center gap-2">
                                <ShieldCheck className="h-5 w-5 text-primary" />
                                Connect Google Account
                            </CardTitle>
                            <CardDescription className="text-xs">
                                Use the official Google OAuth flow to grant FlowCore permission to manage your emails.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="p-6 space-y-6">
                           <div className="space-y-3">
                               <div className="flex items-start gap-3">
                                   <div className="w-1.5 h-1.5 rounded-full bg-primary mt-1.5 shrink-0" />
                                   <p className="text-xs text-muted-foreground leading-relaxed">
                                       <strong>Read & Reply</strong>: AI can read incoming emails and send responses on your behalf.
                                   </p>
                               </div>
                               <div className="flex items-start gap-3">
                                   <div className="w-1.5 h-1.5 rounded-full bg-primary mt-1.5 shrink-0" />
                                   <p className="text-xs text-muted-foreground leading-relaxed">
                                       <strong>Organization</strong>: AI can mark emails as read and label them for better management.
                                   </p>
                               </div>
                           </div>
                            <Button
                                onClick={handleConnect}
                                disabled={isConnecting}
                                className="w-full bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 h-12 shadow-sm font-medium transition-all"
                            >
                                {isConnecting ? (
                                    <Loader2 className="h-5 w-5 animate-spin mr-2" />
                                ) : (
                                    <img src="https://www.google.com/favicon.ico" className="w-5 h-5 mr-3" alt="Google" />
                                )}
                                Sign in with Google
                            </Button>
                        </CardContent>
                    </Card>
                ) : (
                    <>
                        <Card className="rounded-xl border shadow-none bg-slate-50/50">
                            <CardContent className="p-6">
                                <div className="flex items-center gap-4">
                                    <div className="w-16 h-16 rounded-full bg-white flex items-center justify-center border shadow-sm">
                                        <User className="h-8 w-8 text-slate-400" />
                                    </div>
                                    <div className="flex-1">
                                        <h3 className="font-semibold text-lg text-foreground">
                                           Connected Email
                                        </h3>
                                        <div className="flex items-center gap-2 mt-1 text-muted-foreground">
                                            <Mail className="h-4 w-4" />
                                            <span className="text-sm font-medium">
                                                {(connection as any).gmail_address}
                                            </span>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
                                        <span className="text-xs text-emerald-600 font-medium">Synced</span>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        <div className="flex flex-col gap-3">
                            <Button
                                variant="outline"
                                onClick={handleDisconnect}
                                disabled={isDisconnecting}
                                className="h-12 text-red-600 hover:text-red-700 hover:bg-red-50 border-red-100"
                            >
                                {isDisconnecting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <LogOut className="mr-2 h-5 w-5" />}
                                Disconnect Gmail
                            </Button>
                            <p className="text-[10px] text-center text-muted-foreground">
                                Disconnecting will stop the AI from responding to any further emails from this account.
                            </p>
                        </div>
                    </>
                )}

                <Card className="rounded-xl border shadow-none bg-primary/5 border-primary/10">
                    <CardHeader>
                        <CardTitle className="text-base font-medium text-primary">Email Security</CardTitle>
                    </CardHeader>
                    <CardContent className="text-xs text-primary/80 space-y-3 pb-6">
                        <p>
                            FlowCore uses restricted Gmail API scopes to ensure we only access the messages necessary for your business automation.
                        </p>
                        <div className="flex items-center gap-1 font-medium hover:underline cursor-pointer">
                            Learn more about our data privacy <ExternalLink className="h-3 w-3" />
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
