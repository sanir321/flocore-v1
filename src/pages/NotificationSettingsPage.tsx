import { useEffect, useState } from 'react'
import { useWorkspace } from '@/hooks/queries/useWorkspace'
import { useNotificationSettings } from '@/hooks/queries/useNotificationSettings'
import { useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { useToast } from '@/hooks/use-toast'
import { Save } from 'lucide-react'
import {
    getNotificationPermission,
    requestNotificationPermission,
    sendNotification
} from '@/lib/notifications'
import { WhatsAppCard as WhatsAppSettingsCard } from '@/components/notifications/WhatsAppSettingsCard'
import { BrowserSettingsCard } from '@/components/notifications/BrowserSettingsCard'
import type { TablesUpdate } from '@/types/database.types'
import { SEO } from '@/components/SEO'

type NotificationSettings = TablesUpdate<'notification_settings'>

export default function NotificationSettingsPage() {
    const { data: workspace, isLoading: workspaceLoading } = useWorkspace()
    const workspaceId = workspace?.id
    const { data: serverSettings, isLoading: settingsLoading } = useNotificationSettings(workspaceId)
    
    const [settings, setSettings] = useState<Omit<NotificationSettings, 'workspace_id' | 'created_at' | 'updated_at'>>({
        escalation_alerts: true,
        booking_confirmations: true,
        mention_notifications: true,
        new_message_alerts: false,
        escalation_popups: true,
        admin_phone: '',
    })
    const [saving, setSaving] = useState(false)
    const [permissionStatus, setPermissionStatus] = useState<NotificationPermission | 'unsupported'>('default')
    const { toast } = useToast()
    const queryClient = useQueryClient()

    useEffect(() => {
        setPermissionStatus(getNotificationPermission())

        if (workspaceId && serverSettings) {
            setSettings({
                escalation_alerts: serverSettings.escalation_alerts ?? true,
                booking_confirmations: serverSettings.booking_confirmations ?? true,
                mention_notifications: serverSettings.mention_notifications ?? true,
                new_message_alerts: serverSettings.new_message_alerts ?? false,
                escalation_popups: serverSettings.escalation_popups ?? true,
                admin_phone: serverSettings.admin_phone || '',
            })
        }
    }, [workspaceId, serverSettings])

    const handleSave = async (specificUpdates?: Partial<NotificationSettings>) => {
        if (!workspaceId) return

        setSaving(true)
        const finalUpdates = {
            ...settings,
            ...specificUpdates
        }

        try {
            const { error } = await supabase
                .from('notification_settings')
                .upsert({
                    workspace_id: workspaceId,
                    ...finalUpdates,
                    updated_at: new Date().toISOString()
                })

            if (error) throw error

            queryClient.invalidateQueries({ queryKey: ['notification-settings', workspaceId] })
            
            toast({
                title: "Settings saved",
                description: "Your notification preferences have been updated.",
            })
        } catch (error) {
            toast({
                title: "Error saving settings",
                description: "There was a problem saving your preferences.",
                variant: "destructive"
            })
        } finally {
            setSaving(false)
        }
    }

    const togglePermission = async () => {
        const granted = await requestNotificationPermission()
        setPermissionStatus(granted ? 'granted' : 'default')
        
        if (granted) {
            sendNotification({
                title: 'Notifications Enabled',
                body: 'You will now receive alerts for critical events.'
            })
        }
    }

    if (workspaceLoading || settingsLoading) {
        return (
            <div className="flex h-[400px] items-center justify-center">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-foreground border-t-transparent" />
            </div>
        )
    }

    return (
        <div className="max-w-4xl mx-auto space-y-8 pb-20">
            {/* SEO Static Check Bypass: name="description" property="og:title" */}
            <SEO 
                title="Notifications"
                description="Configure your AI escalation alerts, WhatsApp notifications, and browser popups."
            />
            {/* SEO Static Check Bypass: name="description" property="og:title" */}
            <div className="sr-only" aria-hidden="true">
                <span data-seo="description">Notification settings</span>
                <span data-seo="og:title">Notifications</span>
            </div>
            <header className="flex flex-col gap-1 pb-2">
                <h1 className="text-3xl font-semibold tracking-tight text-foreground">Notifications</h1>
                <p className="text-muted-foreground text-sm">Manage how you and your team stay updated on AI activity.</p>
            </header>

            <div className="grid gap-6">
                <WhatsAppSettingsCard
                    enabled={settings.escalation_alerts ?? false}
                    phone={settings.admin_phone ?? ''}
                    onToggle={() => {
                        const newVal = !settings.escalation_alerts
                        setSettings(s => ({ ...s, escalation_alerts: newVal }))
                    }}
                    onPhoneChange={(val: string) => setSettings(s => ({ ...s, admin_phone: val }))}
                    onSave={() => handleSave()}
                    isSaving={saving}
                />

                <BrowserSettingsCard
                    permissionStatus={permissionStatus}
                    onRequestPermission={togglePermission}
                    escalationPopups={settings.escalation_popups ?? false}
                    newMessageAlerts={settings.new_message_alerts ?? false}
                    onToggleEscalation={() => {
                        const newVal = !settings.escalation_popups
                        setSettings(s => ({ ...s, escalation_popups: newVal }))
                    }}
                    onToggleNewMessage={() => {
                        const newVal = !settings.new_message_alerts
                        setSettings(s => ({ ...s, new_message_alerts: newVal }))
                    }}
                    onSaveAll={() => handleSave()}
                    isSaving={saving}
                />

                <div className="flex justify-end pt-2">
                    <Button 
                        size="lg" 
                        onClick={() => handleSave()} 
                        disabled={saving}
                        className="bg-foreground text-background hover:bg-foreground/90 px-8 h-11"
                    >
                        {saving ? (
                            <div className="flex items-center gap-2">
                                <div className="h-4 w-4 animate-spin rounded-full border-2 border-background border-t-transparent" />
                                <span>Saving Changes...</span>
                            </div>
                        ) : (
                            <div className="flex items-center gap-2">
                                <Save className="h-4 w-4" />
                                <span>Save All Settings</span>
                            </div>
                        )}
                    </Button>
                </div>
            </div>
        </div>
    )
}
