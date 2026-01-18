import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useToast } from '@/hooks/use-toast'
import { CheckCircle, XCircle, ArrowLeft, Calendar } from 'lucide-react'
import { Link, useSearchParams } from 'react-router-dom'

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
        return <div className="p-8">Loading...</div>
    }

    return (
        <div className="p-8 max-w-2xl">
            <Link to="/settings" className="flex items-center gap-2 text-muted-foreground mb-6 hover:text-foreground">
                <ArrowLeft className="h-4 w-4" />
                Back to Settings
            </Link>

            <h1 className="text-2xl font-bold mb-6">Google Calendar Integration</h1>

            {/* Connection Status */}
            <Card className="mb-6">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Calendar className="h-5 w-5" />
                        Status
                        {connection?.connected ? (
                            <CheckCircle className="h-5 w-5 text-green-500" />
                        ) : (
                            <XCircle className="h-5 w-5 text-red-500" />
                        )}
                    </CardTitle>
                    <CardDescription>
                        {connection?.connected
                            ? 'Google Calendar is connected'
                            : 'Connect your Google Calendar to enable appointment booking'}
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {connection?.connected ? (
                        <div className="space-y-4">
                            <p className="text-sm text-muted-foreground">
                                Connected to: <strong>{connection.provider}</strong>
                            </p>
                            {connection.token_expires_at && (
                                <p className="text-sm text-muted-foreground">
                                    Token expires: {new Date(connection.token_expires_at).toLocaleString()}
                                </p>
                            )}
                            <Button variant="destructive" onClick={handleDisconnect}>
                                Disconnect Calendar
                            </Button>
                        </div>
                    ) : (
                        <Button asChild>
                            <a href={oauthUrl}>
                                <Calendar className="h-4 w-4 mr-2" />
                                Connect Google Calendar
                            </a>
                        </Button>
                    )}
                </CardContent>
            </Card>

            {/* How It Works */}
            <Card>
                <CardHeader>
                    <CardTitle>How It Works</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 text-sm">
                    <p>1. Connect your Google Calendar using the button above.</p>
                    <p>2. The AI agent will automatically check your availability when customers ask for appointments.</p>
                    <p>3. Appointments are booked directly to your calendar.</p>
                    <p>4. You can view and manage appointments from the Appointments page.</p>
                </CardContent>
            </Card>
        </div>
    )
}
