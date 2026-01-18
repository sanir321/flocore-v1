import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useToast } from '@/hooks/use-toast'
import { CheckCircle, XCircle, ArrowLeft, Copy } from 'lucide-react'
import { Link } from 'react-router-dom'

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

    const handleSave = async () => {
        if (!workspaceId) return
        setSaving(true)

        try {
            const payload = {
                workspace_id: workspaceId,
                mode: formData.mode,
                twilio_account_sid: formData.twilio_account_sid,
                twilio_auth_token: formData.twilio_auth_token,
                twilio_phone_number: formData.twilio_phone_number,
                webhook_url: webhookUrl,
                connected: !!(formData.twilio_account_sid && formData.twilio_auth_token && formData.twilio_phone_number)
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

            toast({
                title: "Success",
                description: "WhatsApp settings saved successfully."
            })

            // Refresh connection status
            const { data } = await supabase
                .from('whatsapp_connections')
                .select('*')
                .eq('workspace_id', workspaceId)
                .single()

            if (data) setConnection(data as unknown as WhatsAppConnection)

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
        return <div className="p-8">Loading...</div>
    }

    return (
        <div className="p-8 max-w-2xl">
            <Link to="/settings" className="flex items-center gap-2 text-muted-foreground mb-6 hover:text-foreground">
                <ArrowLeft className="h-4 w-4" />
                Back to Settings
            </Link>

            <h1 className="text-2xl font-bold mb-6">WhatsApp Integration</h1>

            {/* Connection Status */}
            <Card className="mb-6">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        Status
                        {connection?.connected ? (
                            <CheckCircle className="h-5 w-5 text-green-500" />
                        ) : (
                            <XCircle className="h-5 w-5 text-red-500" />
                        )}
                    </CardTitle>
                    <CardDescription>
                        {connection?.connected ? 'WhatsApp is connected and ready' : 'WhatsApp is not connected'}
                    </CardDescription>
                </CardHeader>
            </Card>

            {/* Webhook URL */}
            <Card className="mb-6">
                <CardHeader>
                    <CardTitle>Webhook URL</CardTitle>
                    <CardDescription>
                        Configure this URL in your Twilio Console under WhatsApp Sandbox Settings.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="flex gap-2">
                        <Input value={webhookUrl} readOnly className="font-mono text-sm" />
                        <Button variant="outline" size="icon" onClick={() => copyToClipboard(webhookUrl)}>
                            <Copy className="h-4 w-4" />
                        </Button>
                    </div>
                </CardContent>
            </Card>

            {/* Twilio Credentials */}
            <Card>
                <CardHeader>
                    <CardTitle>Twilio Credentials</CardTitle>
                    <CardDescription>
                        Enter your Twilio Account SID, Auth Token, and WhatsApp number.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="space-y-2">
                        <Label>Mode</Label>
                        <div className="flex gap-4">
                            <label className="flex items-center gap-2">
                                <input
                                    type="radio"
                                    name="mode"
                                    value="sandbox"
                                    checked={formData.mode === 'sandbox'}
                                    onChange={(e) => setFormData(prev => ({ ...prev, mode: e.target.value }))}
                                />
                                Sandbox (Testing)
                            </label>
                            <label className="flex items-center gap-2">
                                <input
                                    type="radio"
                                    name="mode"
                                    value="production"
                                    checked={formData.mode === 'production'}
                                    onChange={(e) => setFormData(prev => ({ ...prev, mode: e.target.value }))}
                                />
                                Production
                            </label>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="account_sid">Account SID</Label>
                        <Input
                            id="account_sid"
                            placeholder="ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
                            value={formData.twilio_account_sid}
                            onChange={(e) => setFormData(prev => ({ ...prev, twilio_account_sid: e.target.value }))}
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="auth_token">Auth Token</Label>
                        <Input
                            id="auth_token"
                            type="password"
                            placeholder="Your Twilio Auth Token"
                            value={formData.twilio_auth_token}
                            onChange={(e) => setFormData(prev => ({ ...prev, twilio_auth_token: e.target.value }))}
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="phone_number">WhatsApp Number</Label>
                        <Input
                            id="phone_number"
                            placeholder="+14155238886"
                            value={formData.twilio_phone_number}
                            onChange={(e) => setFormData(prev => ({ ...prev, twilio_phone_number: e.target.value }))}
                        />
                        <p className="text-xs text-muted-foreground">
                            For sandbox: Use +14155238886. For production: Your registered WhatsApp number.
                        </p>
                    </div>

                    <Button onClick={handleSave} disabled={saving} className="w-full">
                        {saving ? "Saving..." : "Save Settings"}
                    </Button>
                </CardContent>
            </Card>

            {/* Sandbox Instructions */}
            {formData.mode === 'sandbox' && (
                <Card className="mt-6">
                    <CardHeader>
                        <CardTitle>Sandbox Setup Instructions</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3 text-sm">
                        <p>1. Go to <a href="https://console.twilio.com/us1/develop/sms/try-it-out/whatsapp-learn" target="_blank" className="text-primary underline">Twilio WhatsApp Sandbox</a></p>
                        <p>2. Send the join code from your phone to +14155238886</p>
                        <p>3. Copy your Account SID and Auth Token from Twilio Console</p>
                        <p>4. Set the webhook URL above in "Sandbox Configuration" → "When a message comes in"</p>
                    </CardContent>
                </Card>
            )}
        </div>
    )
}
