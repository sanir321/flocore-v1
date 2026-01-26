import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useToast } from '@/hooks/use-toast'
import { CheckCircle, XCircle, Calendar } from 'lucide-react'
import { useSearchParams } from 'react-router-dom'
import { cn } from '@/lib/utils'

interface CalendarConnection {
    workspace_id: string
    connected: boolean | null
    provider: string | null
    token_expires_at: string | null
}

export default function CalendarSettingsPage() {
    const [connection, setConnection] = useState<CalendarConnection | null>(null)
    const [loading, setLoading] = useState(true)
    const [workspaceId, setWorkspaceId] = useState<string | null>(null)
    const { toast } = useToast()
    const [searchParams] = useSearchParams()

    const oauthUrl = workspaceId
        ? `https://wfseydnisxyizuczfpey.supabase.co/functions/v1/calendar-oauth?workspace_id=${workspaceId}`
        : ''

    useEffect(() => {
        // Check for success message from OAuth callback
        if (searchParams.get('success') === 'true') {
            toast({
                title: "Connected!",
                description: "Google Calendar connected successfully."
            })
        }
    }, [searchParams, toast])

    useEffect(() => {
        const fetchConnection = async () => {
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

            setWorkspaceId(workspace.id)

            const { data } = await supabase
                .from('calendar_connections')
                .select('*')
                .eq('workspace_id', workspace.id)
                .single()

            if (data) {
                setConnection(data as unknown as CalendarConnection)
            }
            setLoading(false)
        }

        fetchConnection()
    }, [])

    const handleDisconnect = async () => {
        if (!workspaceId) return

        await supabase
            .from('calendar_connections')
            .update({ connected: false, access_token: null, refresh_token: null })
            .eq('workspace_id', workspaceId)

        setConnection(prev => prev ? { ...prev, connected: false } : null)
        toast({
            title: "Disconnected",
            description: "Google Calendar has been disconnected."
        })
    }

    if (loading) {
        return (
            <div className="flex h-64 items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
        )
    }

    return (
        <div className="space-y-10 max-w-4xl">
            <div className="flex items-center gap-5 border-b pb-8">
                <div className="w-14 h-14 rounded-full border bg-slate-50 flex items-center justify-center text-muted-foreground">
                    <Calendar className="h-7 w-7" />
                </div>
                <div>
                    <h1 className="text-3xl font-semibold tracking-tight text-foreground">Calendar Integration</h1>
                    <p className="text-muted-foreground text-base mt-2">Sync appointments and manage availability automatically.</p>
                </div>
            </div>

            {/* Connection Status */}
            <div className={cn(
                "rounded-xl border p-5 flex items-center gap-5 transition-colors",
                connection?.connected
                    ? "bg-slate-50/50 border-slate-200"
                    : "bg-white border-border hover:border-foreground/20"
            )}>
                <div className={cn(
                    "w-12 h-12 rounded-full flex items-center justify-center shadow-sm border",
                    connection?.connected ? "bg-white text-emerald-500" : "bg-slate-50 text-muted-foreground"
                )}>
                    {connection?.connected ? (
                        <CheckCircle className="h-5 w-5" />
                    ) : (
                        <XCircle className="h-5 w-5" />
                    )}
                </div>
                <div>
                    <p className="font-semibold text-sm text-foreground">
                        {connection?.connected ? 'Google Calendar Connected' : 'Not Connected'}
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                        {connection?.connected
                            ? `Synced with ${connection.provider}. Appointments will be automatically booked.`
                            : 'Connect to enable AI appointment booking and availability checks.'}
                    </p>
                </div>
            </div>

            <Card className="rounded-xl border shadow-none">
                <CardHeader>
                    <CardTitle className="text-base font-medium">Connection Settings</CardTitle>
                    <CardDescription className="text-xs">Manage your calendar provider connection.</CardDescription>
                </CardHeader>
                <CardContent>
                    {connection?.connected ? (
                        <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg border border-slate-100">
                            <div className="flex items-center gap-4">
                                <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center border shadow-sm">
                                    <Calendar className="h-5 w-5 text-foreground/70" />
                                </div>
                                <div>
                                    <div className="font-medium text-sm text-foreground">Google Calendar</div>
                                    <div className="text-[10px] text-muted-foreground font-mono mt-0.5">
                                        Token Valid Until: {connection.token_expires_at ? new Date(connection.token_expires_at).toLocaleDateString() : 'Unknown'}
                                    </div>
                                </div>
                            </div>
                            <Button variant="outline" size="sm" onClick={handleDisconnect} className="h-8 text-xs border-slate-200 hover:bg-white hover:text-red-600 hover:border-red-100">
                                Disconnect
                            </Button>
                        </div>
                    ) : (
                        <div className="text-center py-10 bg-slate-50/30 rounded-lg border border-dashed">
                            <Button asChild className="h-10 px-6 rounded-full bg-foreground text-background hover:bg-foreground/90 transition-all shadow-sm">
                                <a href={oauthUrl}>
                                    <Calendar className="h-4 w-4 mr-2" />
                                    Connect Google Calendar
                                </a>
                            </Button>
                            <p className="text-[10px] text-muted-foreground mt-4">
                                Redirects to Google to authorize access.
                            </p>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Features Info */}
            <div className="grid md:grid-cols-3 gap-6">
                <Card className="bg-transparent border shadow-none hover:bg-slate-50/50 transition-colors rounded-xl">
                    <CardContent className="pt-6">
                        <div className="font-semibold text-sm mb-2 text-foreground">Availability Check</div>
                        <p className="text-xs text-muted-foreground leading-relaxed">AI checks your calendar slots before offering times to customers.</p>
                    </CardContent>
                </Card>
                <Card className="bg-transparent border shadow-none hover:bg-slate-50/50 transition-colors rounded-xl">
                    <CardContent className="pt-6">
                        <div className="font-semibold text-sm mb-2 text-foreground">Auto-Booking</div>
                        <p className="text-xs text-muted-foreground leading-relaxed">Confirmed appointments are instantly added to your schedule.</p>
                    </CardContent>
                </Card>
                <Card className="bg-transparent border shadow-none hover:bg-slate-50/50 transition-colors rounded-xl">
                    <CardContent className="pt-6">
                        <div className="font-semibold text-sm mb-2 text-foreground">Real-time Sync</div>
                        <p className="text-xs text-muted-foreground leading-relaxed">Changes you make to your calendar are reflected immediately.</p>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
