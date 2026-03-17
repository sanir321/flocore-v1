import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Slack, CheckCircle2, AlertCircle, ExternalLink, Loader2, ArrowLeft, Trash2 } from 'lucide-react'
import { NavLink, useSearchParams } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { useWorkspace } from '@/hooks/queries/useWorkspace'
import { useToast } from '@/hooks/use-toast'

import { SLACK_AUTH_URL, SLACK_CLIENT_BASE } from '@/lib/constants'

interface SlackConnection {
    id: string;
    slack_team_id: string;
    slack_team_name: string | null;
    access_token: string;
    bot_user_id: string;
    workspace_id: string;
    agent_id: string;
    connected_at: string | null;
    created_at: string | null;
    is_active: boolean | null;
    incoming_webhook_url: string | null;
}

export default function SlackSettingsPage() {
    const { data: workspace } = useWorkspace()
    const [searchParams] = useSearchParams()
    const { toast } = useToast()
    const [loading, setLoading] = useState(true)
    const [connection, setConnection] = useState<SlackConnection | null>(null)
    const [connecting, setConnecting] = useState(false)

    useEffect(() => {
        if (workspace?.id) {
            fetchConnection()
        }
    }, [workspace?.id])

    useEffect(() => {
        const error = searchParams.get('error')
        const connected = searchParams.get('connected')

        if (error) {
            toast({
                title: "Connection Failed",
                description: "There was an error connecting to Slack. Please try again.",
                variant: "destructive"
            })
        }

        if (connected === 'slack') {
            toast({
                title: "Slack Connected",
                description: "Your agent is now active on your Slack workspace.",
            })
        }
    }, [searchParams])

    const fetchConnection = async () => {
        try {
            if (!workspace?.id) return

            const { data, error } = await supabase
                .from('slack_connections')
                .select('*')
                .eq('workspace_id', workspace.id)
                .maybeSingle()
            
            if (error) throw error
            setConnection(data)
        } catch (err) {
            // Error ignored
        } finally {
            setLoading(false)
        }
    }

    const handleConnect = async () => {
        setConnecting(true)
        try {

            if (!workspace?.id) return

            // Get the first active agent for this workspace to link the connection
            const { data: agents } = await supabase
                .from('agents')
                .select('id')
                .eq('workspace_id', workspace.id)
                .eq('active', true)
                .limit(1)

            if (!agents || agents.length === 0) {
                toast({
                    title: "No Active Agent",
                    description: "Please create and activate an agent first.",
                    variant: "destructive"
                })
                return
            }

            const agentId = agents[0].id
            const { data: { user } } = await supabase.auth.getUser()
            
            const state = btoa(JSON.stringify({
                workspaceId: workspace?.id,
                agentId: agentId,
                userId: user?.id
            }))

            const clientId = 'YOUR_SLACK_CLIENT_ID' // This should be in env or fetched
            const redirectUri = `${window.location.origin}/supabase/functions/slack-oauth`
            const slackUrl = `${SLACK_AUTH_URL}?client_id=${clientId}&scope=chat:write,commands,incoming-webhook&user_scope=&state=${state}&redirect_uri=${encodeURIComponent(redirectUri)}`
            
            window.location.href = slackUrl
        } catch (err) {
            toast({
                title: "Error",
                description: "Failed to initiate Slack OAuth.",
                variant: "destructive"
            })
        } finally {
            setConnecting(false)
        }
    }

    const handleDisconnect = async () => {
        if (!confirm('Are you sure you want to disconnect Slack? Your agent will stop responding to Slack messages.')) return

        if (!workspace?.id) return

        try {
            const { error } = await supabase
                .from('slack_connections')
                .delete()
                .eq('workspace_id', workspace.id)

            if (error) throw error
            
            setConnection(null)
            toast({
                title: "Disconnected",
                description: "Slack has been disconnected successfully."
            })
        } catch (err) {
            toast({
                title: "Error",
                description: "Failed to disconnect Slack.",
                variant: "destructive"
            })
        }
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center p-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        )
    }

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            <div className="flex items-center gap-4 mb-6">
                <Button variant="outline" size="icon" asChild>
                    <NavLink to="/settings/channels">
                        <ArrowLeft className="h-4 w-4" />
                    </NavLink>
                </Button>
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Slack Integration</h1>
                    <p className="text-muted-foreground text-sm">Deploy your AI agent to your Slack workspaces.</p>
                </div>
            </div>

            <Card className="border-none shadow-sm overflow-hidden">
                <CardHeader className="bg-slate-50 border-b">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-lg bg-[#4A154B] flex items-center justify-center">
                                <Slack className="h-6 w-6 text-white" />
                            </div>
                            <div>
                                <CardTitle>Slack Connection</CardTitle>
                                <CardDescription>
                                    {connection ? `Connected to ${connection.slack_team_name}` : 'Not connected'}
                                </CardDescription>
                            </div>
                        </div>
                        {connection && (
                            <Badge variant="default" className="bg-emerald-500 hover:bg-emerald-600">
                                <CheckCircle2 className="h-3 w-3 mr-1" />
                                Active
                            </Badge>
                        )}
                    </div>
                </CardHeader>
                <CardContent className="pt-6">
                    {connection ? (
                        <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="p-4 rounded-lg border bg-slate-50/50">
                                    <p className="text-xs font-medium text-muted-foreground uppercase mb-1">Workspace ID</p>
                                    <p className="font-mono text-sm">{connection.slack_team_id}</p>
                                </div>
                                <div className="p-4 rounded-lg border bg-slate-50/50">
                                    <p className="text-xs font-medium text-muted-foreground uppercase mb-1">Bot User ID</p>
                                    <p className="font-mono text-sm">{connection.bot_user_id}</p>
                                </div>
                            </div>

                            <Alert className="bg-blue-50 border-blue-100 text-blue-800">
                                <AlertCircle className="h-4 w-4 text-blue-600" />
                                <AlertTitle>Setup Complete</AlertTitle>
                                <AlertDescription className="text-blue-700/80">
                                    Your agent is now active. You can add it to any channel using <code className="bg-blue-100 px-1 rounded">/invite @YourBotName</code>.
                                </AlertDescription>
                            </Alert>
                        </div>
                    ) : (
                        <div className="text-center py-8">
                            <div className="mx-auto w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4">
                                <Slack className="h-8 w-8 text-slate-400" />
                            </div>
                            <h3 className="text-lg font-medium mb-2">Connect Your Workspace</h3>
                            <p className="text-muted-foreground max-w-sm mx-auto mb-6">
                                Connect to Slack to allow your AI agent to respond to messages and respond to commands in your workspaces.
                            </p>
                            <Button onClick={handleConnect} disabled={connecting} size="lg" className="bg-[#4A154B] hover:bg-[#3d113d] text-white">
                                {connecting ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Slack className="h-4 w-4 mr-2" />}
                                Add to Slack
                            </Button>
                        </div>
                    )}
                </CardContent>
                {connection && (
                    <CardFooter className="bg-slate-50 border-t justify-between py-4">
                        <Button variant="outline" size="sm" onClick={() => window.open(`${SLACK_CLIENT_BASE}/${connection.slack_team_id}`, '_blank')}>
                            <ExternalLink className="h-4 w-4 mr-2" />
                            Open Slack
                        </Button>
                        <Button variant="destructive" size="sm" onClick={handleDisconnect}>
                            <Trash2 className="h-4 w-4 mr-2" />
                            Disconnect
                        </Button>
                    </CardFooter>
                )}
            </Card>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card className="border shadow-none">
                    <CardHeader>
                        <CardTitle className="text-lg">Event Webhook</CardTitle>
                        <CardDescription>Use this URL in your Slack App settings under "Event Subscriptions".</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="flex gap-2">
                            <code className="flex-1 bg-slate-100 p-2 rounded text-xs break-all border">
                                {`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/slack-events`}
                            </code>
                            <Button variant="outline" size="sm" onClick={() => {
                                navigator.clipboard.writeText(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/slack-events`)
                                toast({ title: "Copied!", description: "Webhook URL copied to clipboard." })
                            }}>
                                Copy
                            </Button>
                        </div>
                    </CardContent>
                </Card>

                <Card className="border shadow-none">
                    <CardHeader>
                        <CardTitle className="text-lg">Capabilities</CardTitle>
                        <CardDescription>What your agent can do in Slack.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-2">
                        <div className="flex items-center gap-2 text-sm">
                            <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                            <span>Respond to Direct Messages</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                            <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                            <span>Participate in Channel Threads</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                            <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                            <span>Handle Slash Commands (Coming soon)</span>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
