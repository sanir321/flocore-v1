import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { useToast } from '@/hooks/use-toast'
import { Switch } from '@/components/ui/switch'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Save, Bell, AlertTriangle, Phone, CheckCircle } from 'lucide-react'
import { cn } from '@/lib/utils'
import {
    getNotificationPermission,
    requestNotificationPermission,
    sendNotification
} from '@/lib/notifications'

interface NotificationSettings {
    escalation_alerts: boolean
    booking_confirmations: boolean
    mention_notifications: boolean
    new_message_alerts: boolean
    admin_phone: string
    whatsapp_alerts_enabled: boolean
}

export default function NotificationSettingsPage() {
    const [settings, setSettings] = useState<NotificationSettings>({
        escalation_alerts: true,
        booking_confirmations: true,
        mention_notifications: true,
        new_message_alerts: false,
        admin_phone: '',
        whatsapp_alerts_enabled: true
    })
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [workspaceId, setWorkspaceId] = useState<string | null>(null)
    const [permissionStatus, setPermissionStatus] = useState<NotificationPermission | 'unsupported'>('default')
    const { toast } = useToast()

    useEffect(() => {
        // Check browser permission
        setPermissionStatus(getNotificationPermission())

        const fetchSettings = async () => {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) {
                setLoading(false)
                return
            }

            const { data: workspace } = await supabase
                .from('workspaces')
                .select('id')
                .eq('owner_id', user.id)
                .single()

            if (workspace) {
                setWorkspaceId(workspace.id)

                // 1. Load Local Browser Settings (for UI toggles)
                const localSaved = localStorage.getItem(`notification_settings_${workspace.id}`)
                let localSettings = {}
                if (localSaved) {
                    try {
                        localSettings = JSON.parse(localSaved)
                    } catch (e) {
                        console.error('Failed to parse local settings', e)
                    }
                }

                // 2. Load Server Settings (for WhatsApp Alerts)
                const { data: serverData } = await supabase
                    .from('notification_settings')
                    .select('*')
                    .eq('workspace_id', workspace.id)
                    .single()

                setSettings(prev => ({
                    ...prev,
                    ...localSettings,
                    admin_phone: serverData?.admin_phone || '',
                    whatsapp_alerts_enabled: serverData?.escalation_alerts ?? true
                }))
            }

            setLoading(false)
        }

        fetchSettings()
    }, [])

    const handleRequestPermission = async () => {
        const granted = await requestNotificationPermission()
        setPermissionStatus(getNotificationPermission())

        if (granted) {
            toast({ title: "Success", description: "Browser notifications enabled!" })
            sendNotification({
                title: '🎉 Notifications Enabled!',
                body: 'You will now receive alerts for important events.',
            })
        }
    }

    const handleSave = async () => {
        if (!workspaceId) return
        setSaving(true)

        try {
            // 1. Save Local Settings
            const localData = {
                escalation_alerts: settings.escalation_alerts,
                booking_confirmations: settings.booking_confirmations,
                mention_notifications: settings.mention_notifications,
                new_message_alerts: settings.new_message_alerts
            }
            localStorage.setItem(`notification_settings_${workspaceId}`, JSON.stringify(localData))

            // 2. Save Server Settings
            const serverPayload = {
                workspace_id: workspaceId,
                admin_phone: settings.admin_phone,
                escalation_alerts: settings.whatsapp_alerts_enabled
            }

            const { error } = await supabase
                .from('notification_settings')
                .upsert(serverPayload)

            if (error) throw error

            toast({ title: "Success", description: "All preferences saved successfully." })
        } catch (error) {
            const message = error instanceof Error ? error.message : 'An unknown error occurred'
            toast({ title: "Error", description: message, variant: "destructive" })
        } finally {
            setSaving(false)
        }
    }

    const toggleSetting = (key: keyof NotificationSettings) => {
        setSettings(prev => ({ ...prev, [key]: !prev[key] }))
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
            <div>
                <h1 className="text-3xl font-semibold tracking-tight text-foreground">Notification Preferences</h1>
                <p className="text-muted-foreground text-base mt-2">Customize how and when you receive alerts.</p>
            </div>

            {/* WhatsApp Admin Alerts */}
            <Card className="rounded-xl border shadow-none hover:border-foreground/20 transition-all duration-300">
                <CardHeader className="pb-5">
                    <div className="flex items-center gap-5">
                        <div className="w-14 h-14 rounded-full border bg-slate-50 flex items-center justify-center text-muted-foreground">
                            <Phone className="h-6 w-6" />
                        </div>
                        <div>
                            <CardTitle className="text-lg font-medium text-foreground">WhatsApp Admin Alerts</CardTitle>
                            <CardDescription className="text-sm mt-1">Receive instant high-priority alerts on your personal WhatsApp.</CardDescription>
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="space-y-6 pt-0">
                    <div className="flex items-center justify-between p-4 bg-slate-50/50 rounded-lg border border-slate-100">
                        <Label htmlFor="wa-alerts" className="flex flex-col gap-1 cursor-pointer">
                            <span className="font-medium text-sm">Enable WhatsApp Alerts</span>
                            <span className="text-[11px] text-muted-foreground">The AI will message you directly for critical escalations.</span>
                        </Label>
                        <Switch
                            id="wa-alerts"
                            checked={settings.whatsapp_alerts_enabled}
                            onCheckedChange={() => toggleSetting('whatsapp_alerts_enabled')}
                            className="data-[state=checked]:bg-foreground"
                        />
                    </div>

                    {settings.whatsapp_alerts_enabled && (
                        <div className="animate-in fade-in slide-in-from-top-1 pl-1">
                            <Label className="mb-2 block text-xs font-medium uppercase tracking-wider text-muted-foreground">Your Personal WhatsApp Number</Label>
                            <div className="flex gap-3">
                                <Input
                                    value={settings.admin_phone}
                                    onChange={(e) => setSettings(prev => ({ ...prev, admin_phone: e.target.value }))}
                                    placeholder="+1234567890" // E.164 format
                                    className="max-w-md font-mono text-sm h-9 bg-white"
                                />
                                <Button size="sm" variant="outline" onClick={handleSave} disabled={saving} className="h-9">
                                    Save Number
                                </Button>
                            </div>
                            <p className="text-[10px] text-muted-foreground mt-2 leading-relaxed opacity-80">
                                Must include country code (e.g. +1 or +91).<br />
                                In Sandbox mode, this number must join your sandbox first. In Production, it works instantly.
                            </p>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Browser Notifications */}
            <Card className="rounded-xl border shadow-none hover:border-foreground/20 transition-all duration-300">
                <CardHeader className="pb-4">
                    <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-full border bg-slate-50 flex items-center justify-center text-muted-foreground">
                            <Bell className="h-5 w-5" />
                        </div>
                        <div>
                            <CardTitle className="text-base font-medium text-foreground">Browser Notifications</CardTitle>
                            <CardDescription className="text-xs">Desktop popups when the dashboard is open in another tab.</CardDescription>
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="space-y-6 pt-0">
                    {/* Permission Status */}
                    <div className={cn(
                        "rounded-lg border p-3 flex items-center gap-3 text-xs transition-colors",
                        permissionStatus === 'granted'
                            ? "bg-slate-50/50 border-slate-100 text-muted-foreground"
                            : "bg-amber-50/50 border-amber-100/50 text-amber-800"
                    )}>
                        {permissionStatus === 'granted' ? <CheckCircle className="h-4 w-4 text-emerald-500" /> : <AlertTriangle className="h-4 w-4 text-amber-500" />}
                        <div className="flex-1 font-medium">
                            {permissionStatus === 'granted' ? "Browser permissions granted" : "Browser permissions required"}
                        </div>
                        {permissionStatus !== 'granted' && (
                            <Button size="sm" variant="outline" className="h-7 text-xs bg-white" onClick={handleRequestPermission}>Enable</Button>
                        )}
                    </div>

                    <div className="space-y-5 divide-y divide-border/40">
                        <div className="flex items-center justify-between pt-5 first:pt-0">
                            <div className="space-y-0.5">
                                <Label className="text-sm font-medium">Escalation Popups</Label>
                                <p className="text-[11px] text-muted-foreground">When a user is angry or requests a human.</p>
                            </div>
                            <Switch
                                checked={settings.escalation_alerts}
                                onCheckedChange={() => toggleSetting('escalation_alerts')}
                                disabled={permissionStatus !== 'granted'}
                                className="data-[state=checked]:bg-foreground"
                            />
                        </div>
                        <div className="flex items-center justify-between pt-5">
                            <div className="space-y-0.5">
                                <Label className="text-sm font-medium">New Message Sound</Label>
                                <p className="text-[11px] text-muted-foreground">Play a subtle sound for every new message.</p>
                            </div>
                            <Switch
                                checked={settings.new_message_alerts}
                                onCheckedChange={() => toggleSetting('new_message_alerts')}
                                disabled={permissionStatus !== 'granted'}
                                className="data-[state=checked]:bg-foreground"
                            />
                        </div>
                    </div>

                    <div className="flex justify-end pt-4 border-t mt-4">
                        <Button onClick={handleSave} disabled={saving} className="bg-foreground text-background hover:bg-foreground/90 h-9 text-xs">
                            {saving ? (
                                <>
                                    <div className="mr-2 h-3 w-3 animate-spin rounded-full border-2 border-background border-t-transparent" />
                                    Saving...
                                </>
                            ) : (
                                <>
                                    <Save className="h-3.5 w-3.5 mr-2" />
                                    Save All Preferences
                                </>
                            )}
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
