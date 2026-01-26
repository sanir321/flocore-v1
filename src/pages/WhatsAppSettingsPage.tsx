import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useToast } from '@/hooks/use-toast'
import { CheckCircle, XCircle, Copy, MessageSquare, RefreshCw, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'

interface WhatsAppConnection {
    workspace_id: string
    connected: boolean | null
    mode: string | null
    twilio_account_sid: string | null
    twilio_auth_token: string | null
    twilio_phone_number: string | null
    webhook_url: string | null
}

export default function WhatsAppSettingsPage() {
    const [connection, setConnection] = useState<WhatsAppConnection | null>(null)
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [workspaceId, setWorkspaceId] = useState<string | null>(null)
    const [isPending, setIsPending] = useState(false)
    const [configStatus, setConfigStatus] = useState<'idle' | 'configuring' | 'success' | 'error'>('idle')
    const { toast } = useToast()

    const [formData, setFormData] = useState({
        mode: 'sandbox',
        twilio_account_sid: '',
        twilio_auth_token: '',
        twilio_phone_number: ''
    })

    const webhookUrl = workspaceId
        ? `https://wfseydnisxyizuczfpey.supabase.co/functions/v1/whatsapp-webhook?workspace_id=${workspaceId}`
        : ''

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
                .from('whatsapp_connections')
                .select('*')
                .eq('workspace_id', workspace.id)
                .single()

            if (data) {
                setConnection(data as unknown as WhatsAppConnection)
                setFormData({
                    mode: data.mode || 'sandbox',
                    twilio_account_sid: data.twilio_account_sid || '',
                    twilio_auth_token: data.twilio_auth_token || '',
                    twilio_phone_number: data.twilio_phone_number || ''
                })
            }
            setLoading(false)
        }

        fetchConnection()
    }, [])

    useEffect(() => {
        if (!workspaceId) return

        // Realtime subscription for connection status
        const channel = supabase.channel('whatsapp_status')
            .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'whatsapp_connections', filter: `workspace_id=eq.${workspaceId}` }, (payload) => {
                if (payload.new.connected) {
                    setConnection(payload.new as WhatsAppConnection)
                    setIsPending(false)
                    toast({
                        title: "Connected!",
                        description: "We successfully received a message from your WhatsApp number.",
                        variant: "default"
                    })
                }
            })
            .subscribe()

        return () => {
            supabase.removeChannel(channel)
        }
    }, [workspaceId])

    const handleSave = async () => {
        if (!workspaceId) return
        setSaving(true)

        try {
            // If we are saving, we assume we need to verify connection again (unless already connected and just changing mode)
            // But for simplicity, if it's Sandbox, force re-verification flow if not connected.
            const isVerificationNeeded = formData.mode === 'sandbox' && !connection?.connected

            const payload = {
                workspace_id: workspaceId,
                mode: formData.mode,
                twilio_account_sid: formData.twilio_account_sid,
                twilio_auth_token: formData.twilio_auth_token,
                twilio_phone_number: formData.twilio_phone_number,
                webhook_url: webhookUrl,
                connected: connection?.connected || false
            }

            if (connection) {
                await supabase
                    .from('whatsapp_connections')
                    .update(payload)
                    .eq('workspace_id', workspaceId)
            } else {
                await supabase
                    .from('whatsapp_connections')
                    .insert(payload)
            }

            // AUTO-CONFIGURATION FOR PRODUCTION
            if (formData.mode === 'production' && payload.twilio_account_sid && payload.twilio_auth_token) {
                setConfigStatus('configuring')
                toast({ title: "Configuring Twilio...", description: "Automatically updating webhook settings..." })

                const { data: configData, error: configError } = await supabase.functions.invoke('configure-twilio-webhook', {
                    body: {
                        workspace_id: workspaceId,
                        account_sid: payload.twilio_account_sid,
                        auth_token: payload.twilio_auth_token,
                        phone_number: payload.twilio_phone_number
                    }
                })

                if (configError || configData?.error) {
                    console.error('Config failed:', configError || configData?.error)
                    setConfigStatus('error')
                    toast({
                        title: "Twilio Auto-Config Failed",
                        description: "Could not automatically set webhook. Please copy it manually below.",
                        variant: "destructive"
                    })
                } else {
                    setConfigStatus('success')
                    toast({
                        title: "Configuration Complete",
                        description: "Twilio webhook has been automatically updated!",
                        variant: "default"
                    })
                }
            }

            // Update local state
            setConnection({ ...payload, connected: payload.connected } as WhatsAppConnection)
            if (isVerificationNeeded && payload.twilio_account_sid && payload.twilio_auth_token) {
                setIsPending(true)
            }

            toast({
                title: "Settings Saved",
                description: isVerificationNeeded ? "Waiting for test message to verify connection..." : "WhatsApp settings saved successfully."
            })

        } catch (error: any) {
            toast({
                title: "Error",
                description: error.message,
                variant: "destructive"
            })
        } finally {
            setSaving(false)
        }
    }

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text)
        toast({
            title: "Copied",
            description: "Webhook URL copied to clipboard."
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
                    <MessageSquare className="h-7 w-7" />
                </div>
                <div>
                    <h1 className="text-3xl font-semibold tracking-tight text-foreground">WhatsApp Integration</h1>
                    <p className="text-muted-foreground text-base mt-2">Connect your Twilio account to send and receive messages.</p>
                </div>
            </div>

            {/* Connection Status */}
            <div className={cn(
                "rounded-xl border p-5 flex items-center gap-5 transition-all duration-300",
                connection?.connected
                    ? "bg-slate-50/50 border-slate-200"
                    : isPending
                        ? "bg-white border-foreground/20"
                        : "bg-white border-border hover:border-foreground/20"
            )}>
                <div className={cn(
                    "w-12 h-12 rounded-full flex items-center justify-center shadow-sm border",
                    connection?.connected ? "bg-white text-emerald-500" : isPending ? "bg-slate-50 text-foreground" : "bg-slate-50 text-muted-foreground"
                )}>
                    {connection?.connected ? (
                        <CheckCircle className="h-5 w-5" />
                    ) : isPending ? (
                        <RefreshCw className="h-5 w-5 animate-spin" />
                    ) : (
                        <XCircle className="h-5 w-5" />
                    )}
                </div>
                <div>
                    <div className="flex items-center gap-2">
                        <p className="font-semibold text-sm text-foreground">
                            {connection?.connected
                                ? 'WhatsApp Connected'
                                : isPending
                                    ? 'Connection Pending'
                                    : 'Not Connected'}
                        </p>
                        {isPending && (
                            <span className="px-2 py-0.5 rounded-full bg-slate-100 text-foreground/70 text-[10px] font-medium uppercase tracking-wider border">
                                Listening
                            </span>
                        )}
                    </div>

                    <p className="text-xs text-muted-foreground mt-0.5">
                        {connection?.connected
                            ? 'Your agent is active and listening for messages.'
                            : isPending
                                ? 'Credentials saved. Waiting for a message to verify connection...'
                                : 'Configure your credentials below to enable messaging.'}
                    </p>
                </div>
            </div>

            <div className="grid gap-6">
                {/* Twilio Credentials */}
                <Card className="rounded-xl border shadow-none">
                    <CardHeader>
                        <CardTitle className="text-base font-medium">Twilio Configuration</CardTitle>
                        <CardDescription className="text-xs">
                            Enter your Twilio API credentials. You can find these in your Twilio Console.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-5">
                        <div className="space-y-3">
                            <Label>Mode</Label>
                            <div className="grid grid-cols-2 gap-4">
                                <label className={cn(
                                    "flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all hover:bg-muted/50",
                                    formData.mode === 'sandbox' ? "border-primary bg-primary/5 ring-1 ring-primary/20" : "bg-card"
                                )}>
                                    <input
                                        type="radio"
                                        name="mode"
                                        value="sandbox"
                                        checked={formData.mode === 'sandbox'}
                                        onChange={(e) => setFormData(prev => ({ ...prev, mode: e.target.value }))}
                                        className="sr-only"
                                    />
                                    <div className={cn("w-4 h-4 rounded-full border border-primary flex items-center justify-center",
                                        formData.mode === 'sandbox' && "bg-primary text-white"
                                    )}>
                                        {formData.mode === 'sandbox' && <div className="w-1.5 h-1.5 bg-white rounded-full" />}
                                    </div>
                                    <div>
                                        <div className="font-medium text-sm">Sandbox</div>
                                        <div className="text-[10px] text-muted-foreground">For testing</div>
                                    </div>
                                </label>

                                <label className={cn(
                                    "flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all hover:bg-muted/50",
                                    formData.mode === 'production' ? "border-primary bg-primary/5 ring-1 ring-primary/20" : "bg-card"
                                )}>
                                    <input
                                        type="radio"
                                        name="mode"
                                        value="production"
                                        checked={formData.mode === 'production'}
                                        onChange={(e) => setFormData(prev => ({ ...prev, mode: e.target.value }))}
                                        className="sr-only"
                                    />
                                    <div className={cn("w-4 h-4 rounded-full border border-primary flex items-center justify-center",
                                        formData.mode === 'production' && "bg-primary text-white"
                                    )}>
                                        {formData.mode === 'production' && <div className="w-1.5 h-1.5 bg-white rounded-full" />}
                                    </div>
                                    <div>
                                        <div className="font-medium text-sm">Production</div>
                                        <div className="text-[10px] text-muted-foreground">Live traffic</div>
                                    </div>
                                </label>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="account_sid">Account SID</Label>
                            <Input
                                id="account_sid"
                                placeholder="AC..."
                                value={formData.twilio_account_sid}
                                onChange={(e) => setFormData(prev => ({ ...prev, twilio_account_sid: e.target.value }))}
                                className="font-mono text-sm"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="auth_token">Auth Token</Label>
                            <Input
                                id="auth_token"
                                type="password"
                                placeholder="••••••••••••••••••••••••"
                                value={formData.twilio_auth_token}
                                onChange={(e) => setFormData(prev => ({ ...prev, twilio_auth_token: e.target.value }))}
                                className="font-mono text-sm"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="phone_number">WhatsApp Number</Label>
                            <Input
                                id="phone_number"
                                placeholder="+14155238886"
                                value={formData.twilio_phone_number}
                                onChange={(e) => setFormData(prev => ({ ...prev, twilio_phone_number: e.target.value }))}
                                className="font-mono text-sm"
                            />
                            <p className="text-[11px] text-muted-foreground">
                                Use <code className="bg-muted px-1 py-0.5 rounded">+14155238886</code> for Sandbox.
                            </p>
                        </div>

                        <div className="pt-4 border-t mt-4">
                            <Button onClick={handleSave} disabled={saving} className="w-full bg-foreground text-background hover:bg-foreground/90 h-10">
                                {saving ? (
                                    <>
                                        <div className="mr-2 h-3 w-3 animate-spin rounded-full border-2 border-background border-t-transparent" />
                                        Saving Connection...
                                    </>
                                ) : "Save Configuration"}
                            </Button>
                        </div>
                    </CardContent>
                </Card>

                {/* Webhook & Instructions - Only show if credentials exist */}
                {(formData.twilio_account_sid && formData.twilio_auth_token) && (
                    <div className="grid md:grid-cols-1 gap-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
                        <Card className={cn(
                            "rounded-xl border shadow-none transition-colors duration-500",
                            configStatus === 'success' ? "bg-slate-50/50" : "bg-white"
                        )}>
                            <CardHeader>
                                <CardTitle className="text-base font-medium text-foreground">
                                    {configStatus === 'success' ? "Webhook Configured ✓" : "Webhook Configuration"}
                                </CardTitle>
                                <CardDescription className="text-xs">
                                    {configStatus === 'success'
                                        ? "Your Twilio number is automatically routed to this URL."
                                        : "Required to receive messages. Copy this to Twilio."
                                    }
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-4">
                                    <div className="flex gap-2">
                                        <Input value={webhookUrl} readOnly className="font-mono text-xs bg-slate-50 border-slate-200" />
                                        <Button variant="outline" size="icon" onClick={() => copyToClipboard(webhookUrl)} className="shrink-0 bg-white border-slate-200 hover:bg-slate-50">
                                            {configStatus === 'success' ? <CheckCircle className="h-4 w-4 text-emerald-500" /> : <Copy className="h-4 w-4 text-muted-foreground" />}
                                        </Button>
                                    </div>

                                    {configStatus === 'configuring' && (
                                        <div className="flex items-center gap-2 text-xs text-muted-foreground animate-pulse">
                                            <Loader2 className="h-3 w-3 animate-spin" />
                                            Automatically configuring Twilio...
                                        </div>
                                    )}

                                    {formData.mode === 'sandbox' && (
                                        <div className="rounded-lg bg-slate-50 p-4 border border-slate-100 text-sm space-y-3">
                                            <div className="font-semibold text-foreground flex items-center gap-2">
                                                <Loader2 className={cn("h-4 w-4", !connection?.connected && "animate-spin text-muted-foreground")} />
                                                Next Steps:
                                            </div>
                                            <ol className="list-decimal list-inside space-y-2 text-muted-foreground text-xs">
                                                <li>Open <a href="https://console.twilio.com/us1/develop/sms/try-it-out/whatsapp-learn" target="_blank" rel="noreferrer" className="underline hover:text-foreground">Twilio Sandbox Settings</a>.</li>
                                                <li>Paste the Webhook URL above into the <strong>"When a message comes in"</strong> field.</li>
                                                <li>Send the <strong>join code</strong> from your phone to the Sandbox number.</li>
                                                <li>Then send any message (e.g. "Hi") to verify the connection.</li>
                                            </ol>
                                        </div>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                )}
            </div>
        </div>
    )
}
