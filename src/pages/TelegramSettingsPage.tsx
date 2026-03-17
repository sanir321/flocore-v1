import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Send, CheckCircle2, Loader2, ArrowLeft, Trash2, Info, ShieldCheck } from 'lucide-react'
import { NavLink } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { useWorkspace } from '@/hooks/queries/useWorkspace'
import { useToast } from '@/hooks/use-toast'

import { TELEGRAM_API_BASE } from '@/lib/constants'

export default function TelegramSettingsPage() {
    const { data: workspace } = useWorkspace()
    const { toast } = useToast()
    const [loading, setLoading] = useState(true)
    const [connection, setConnection] = useState<{ bot_username: string, bot_token: string } | null>(null)
    const [botToken, setBotToken] = useState('')
    const [saving, setSaving] = useState(false)

    useEffect(() => {
        if (workspace?.id) {
            fetchConnection()
        }
    }, [workspace?.id])

    const fetchConnection = async () => {
        try {
            if (!workspace?.id) return

            const { data, error } = await supabase
                .from('telegram_connections')
                .select('*')
                .eq('workspace_id', workspace.id)
                .maybeSingle()
            
            if (error) throw error
            if (data) {
                setConnection({
                    bot_username: data.bot_username || '',
                    bot_token: data.bot_token
                })
                setBotToken(data.bot_token)
            } else {
                setConnection(null)
            }
        } catch (err) {
            // Error logged by Supabase if needed
        } finally {
            setLoading(false)
        }
    }

    const handleSave = async () => {
        if (!botToken.trim()) {
            toast({ title: "Validation Error", description: "Bot token is required.", variant: "destructive" })
            return
        }

        setSaving(true)
        try {
            // 1. Verify Bot Token & Get Bot Info
            const botRes = await fetch(`${TELEGRAM_API_BASE}/bot${botToken}/getMe`)
            const botData = await botRes.json()

            if (!botData.ok) {
                toast({ 
                    title: "Invalid Token", 
                    description: "The provided Telegram bot token is invalid.", 
                    variant: "destructive" 
                })
                return
            }

            // 2. Set Webhook
            const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
            const webhookUrl = `${supabaseUrl}/functions/v1/telegram-webhook?token=${botToken}`
            const webhookRes = await fetch(`${TELEGRAM_API_BASE}/bot${botToken}/setWebhook?url=${encodeURIComponent(webhookUrl)}`)
            const webhookData = await webhookRes.json()

            if (!webhookData.ok) {
                console.error('Telegram webhook error:', webhookData)
                toast({ 
                    title: "Webhook Failed", 
                    description: `Failed to set Telegram webhook: ${webhookData.description || 'Unknown error'}`, 
                    variant: "destructive" 
                })
                return
            }

            if (!workspace?.id) {
                toast({ title: "Error", description: "Workspace not found.", variant: "destructive" })
                return
            }

            const workspaceId = workspace.id
            const { data: agents } = await supabase
                .from('agents')
                .select('id')
                .eq('workspace_id', workspaceId)
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

            const { error: dbError } = await supabase
                .from('telegram_connections')
                .upsert({
                    workspace_id: workspaceId,
                    agent_id: agentId,
                    bot_token: botToken,
                    bot_username: botData.result.username,
                    is_active: true,
                }, { onConflict: 'workspace_id,agent_id' })

            if (dbError) throw dbError

            toast({ title: "Success", description: "Telegram bot connected and webhook configured." })
            fetchConnection()
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : "Failed to save Telegram settings.";
            toast({ 
                title: "Error", 
                description: errorMessage, 
                variant: "destructive" 
            })
        } finally {
            setSaving(false)
        }
    }

    const handleDisconnect = async () => {
        if (!confirm('Are you sure? Your bot will stop responding.')) return

        if (!workspace?.id) return

        try {
            const { error } = await supabase
                .from('telegram_connections')
                .delete()
                .eq('workspace_id', workspace.id)

            if (error) throw error
            setConnection(null)
            setBotToken('')
            toast({ title: "Disconnected", description: "Telegram bot disconnected." })
        } catch (err) {
            toast({ title: "Error", description: "Failed to disconnect.", variant: "destructive" })
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
                    <h1 className="text-2xl font-bold tracking-tight">Telegram Bot</h1>
                    <p className="text-muted-foreground text-sm">Automate interactions via the Telegram Bot API.</p>
                </div>
            </div>

            <Card className="border-none shadow-sm overflow-hidden">
                <CardHeader className="bg-slate-50 border-b">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-lg bg-[#0088cc] flex items-center justify-center">
                                <Send className="h-6 w-6 text-white" />
                            </div>
                            <div>
                                <CardTitle>Bot Configuration</CardTitle>
                                <CardDescription>
                                    {connection ? `@${connection.bot_username}` : 'Enter your Telegram Bot Token'}
                                </CardDescription>
                            </div>
                        </div>
                        {connection && (
                            <Badge variant="default" className="bg-emerald-500 hover:bg-emerald-600 border-none">
                                <CheckCircle2 className="h-3 w-3 mr-1" />
                                Online
                            </Badge>
                        )}
                    </div>
                </CardHeader>
                <CardContent className="pt-6 space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="bot-token">Bot API Token</Label>
                        <div className="flex gap-2">
                            <Input 
                                id="bot-token" 
                                type="password" 
                                placeholder="123456789:ABCDefghIJKLmnopQRSTuvwxyz" 
                                value={botToken}
                                onChange={(e) => setBotToken(e.target.value)}
                                className="font-mono bg-white"
                            />
                            {!connection && (
                                <Button onClick={handleSave} disabled={saving}>
                                    {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                                    Connect
                                </Button>
                            )}
                        </div>
                        <p className="text-[11px] text-muted-foreground">
                            Get your token from <a href="https://t.me/botfather" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">@BotFather</a> on Telegram.
                        </p>
                    </div>

                    {connection && (
                        <div className="p-4 rounded-lg bg-emerald-50 border border-emerald-100 flex gap-3">
                            <ShieldCheck className="h-5 w-5 text-emerald-600 mt-0.5" />
                            <div className="text-sm">
                                <p className="font-medium text-emerald-900">Webhook Registered</p>
                                <p className="text-emerald-700/80">Messages sent to your bot are being processed by your AI agent.</p>
                            </div>
                        </div>
                    )}
                </CardContent>
                {connection && (
                    <CardFooter className="bg-slate-50 border-t justify-end py-4">
                        <Button variant="destructive" size="sm" onClick={handleDisconnect}>
                            <Trash2 className="h-4 w-4 mr-2" />
                            Disconnect Bot
                        </Button>
                    </CardFooter>
                )}
            </Card>

            <Card className="border shadow-none">
                <CardHeader className="pb-3">
                    <div className="flex items-center gap-2">
                        <Info className="h-4 w-4 text-blue-500" />
                        <CardTitle className="text-base">How to set up your bot</CardTitle>
                    </div>
                </CardHeader>
                <CardContent className="text-sm space-y-3">
                    <div className="flex gap-3">
                        <div className="w-5 h-5 rounded-full bg-slate-100 flex items-center justify-center text-[10px] font-bold">1</div>
                        <p>Message <a href="https://t.me/botfather" target="_blank" rel="noopener noreferrer" className="text-primary">@BotFather</a> on Telegram and send <code>/newbot</code>.</p>
                    </div>
                    <div className="flex gap-3">
                        <div className="w-5 h-5 rounded-full bg-slate-100 flex items-center justify-center text-[10px] font-bold">2</div>
                        <p>Follow the instructions to name your bot and get the <b>API Token</b>.</p>
                    </div>
                    <div className="flex gap-3">
                        <div className="w-5 h-5 rounded-full bg-slate-100 flex items-center justify-center text-[10px] font-bold">3</div>
                        <p>Paste the token above and click <b>Connect</b>. We'll handle the rest (webhook setup).</p>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
