import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { useToast } from '@/hooks/use-toast'
import { Save, Bell, AlertTriangle, Calendar, AtSign, CheckCircle, XCircle, AlertCircle } from 'lucide-react'
import { cn } from '@/lib/utils'
import {
    isNotificationSupported,
    getNotificationPermission,
    requestNotificationPermission,
    sendNotification
} from '@/lib/notifications'

interface NotificationSettings {
    escalation_alerts: boolean
    booking_confirmations: boolean
    mention_notifications: boolean
    new_message_alerts: boolean
}

export default function NotificationSettingsPage() {
    const [settings, setSettings] = useState<NotificationSettings>({
        escalation_alerts: true,
        booking_confirmations: true,
        mention_notifications: true,
        new_message_alerts: false
    })
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [workspaceId, setWorkspaceId] = useState<string | null>(null)
    const [permissionStatus, setPermissionStatus] = useState<NotificationPermission | 'unsupported'>('default')
    const { toast } = useToast()

    useEffect(() => {
        // Check notification permission
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

                const saved = localStorage.getItem(`notification_settings_${workspace.id}`)
                if (saved) {
                    setSettings(JSON.parse(saved))
                }
            }

            setLoading(false)
        }

        fetchSettings()
    }, [])

    const handleRequestPermission = async () => {
        const granted = await requestNotificationPermission()
        setPermissionStatus(getNotificationPermission())

        if (granted) {
            toast({ title: "Success", description: "Notifications enabled!" })
            // Send a test notification
            sendNotification({
                title: '🎉 Notifications Enabled!',
                body: 'You will now receive alerts for important events.',
            })
        } else {
            toast({
                title: "Permission Denied",
                description: "Please enable notifications in your browser settings.",
                variant: "destructive"
            })
        }
    }

    const handleSave = async () => {
        if (!workspaceId) return
        setSaving(true)

        try {
            localStorage.setItem(`notification_settings_${workspaceId}`, JSON.stringify(settings))
            toast({ title: "Success", description: "Notification preferences saved." })
        } catch (error: any) {
            toast({ title: "Error", description: error.message, variant: "destructive" })
        } finally {
            setSaving(false)
        }
    }

    const handleTestNotification = () => {
        if (permissionStatus !== 'granted') {
            toast({
                title: "Permission Required",
                description: "Please enable notifications first.",
                variant: "destructive"
            })
            return
        }

        sendNotification({
            title: '🧪 Test Notification',
            body: 'This is a test notification from Flowcore AI.',
        })

        toast({ title: "Sent!", description: "Check your notification panel." })
    }

    const toggleSetting = (key: keyof NotificationSettings) => {
        setSettings(prev => ({ ...prev, [key]: !prev[key] }))
    }

    if (loading) {
        return (
            <div className="flex h-full items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
        )
    }

    const notificationOptions = [
        {
            key: 'escalation_alerts' as const,
            icon: AlertTriangle,
            title: 'Escalation Alerts',
            description: 'Get notified when the AI agent escalates a conversation to you',
            iconColor: 'text-orange-500',
            bgColor: 'bg-orange-100'
        },
        {
            key: 'booking_confirmations' as const,
            icon: Calendar,
            title: 'Booking Confirmations',
            description: 'Get notified when a new appointment is booked',
            iconColor: 'text-blue-500',
            bgColor: 'bg-blue-100'
        },
        {
            key: 'mention_notifications' as const,
            icon: AtSign,
            title: 'Mentions & Notes',
            description: 'Get notified when you are mentioned in a note or conversation',
            iconColor: 'text-purple-500',
            bgColor: 'bg-purple-100'
        },
        {
            key: 'new_message_alerts' as const,
            icon: Bell,
            title: 'New Message Alerts',
            description: 'Get notified for every new customer message (can be noisy)',
            iconColor: 'text-emerald-500',
            bgColor: 'bg-emerald-100'
        }
    ]

    return (
        <div className="p-6 max-w-2xl">
            <div className="mb-6">
                <h1 className="text-xl font-semibold">Notifications</h1>
                <p className="text-sm text-muted-foreground mt-1">Choose what notifications you want to receive</p>
            </div>

            {/* Permission Status Banner */}
            <div className={cn(
                "rounded-xl border p-4 mb-6 flex items-center gap-4",
                permissionStatus === 'granted' && "bg-emerald-50 border-emerald-200",
                permissionStatus === 'denied' && "bg-red-50 border-red-200",
                permissionStatus === 'default' && "bg-amber-50 border-amber-200",
                permissionStatus === 'unsupported' && "bg-muted border-muted"
            )}>
                <div className={cn(
                    "w-10 h-10 rounded-xl flex items-center justify-center",
                    permissionStatus === 'granted' && "bg-emerald-100",
                    permissionStatus === 'denied' && "bg-red-100",
                    permissionStatus === 'default' && "bg-amber-100",
                    permissionStatus === 'unsupported' && "bg-muted"
                )}>
                    {permissionStatus === 'granted' && <CheckCircle className="h-5 w-5 text-emerald-600" />}
                    {permissionStatus === 'denied' && <XCircle className="h-5 w-5 text-red-600" />}
                    {permissionStatus === 'default' && <AlertCircle className="h-5 w-5 text-amber-600" />}
                    {permissionStatus === 'unsupported' && <Bell className="h-5 w-5 text-muted-foreground" />}
                </div>

                <div className="flex-1">
                    <div className="font-medium text-sm">
                        {permissionStatus === 'granted' && 'Notifications Enabled'}
                        {permissionStatus === 'denied' && 'Notifications Blocked'}
                        {permissionStatus === 'default' && 'Enable Notifications'}
                        {permissionStatus === 'unsupported' && 'Not Supported'}
                    </div>
                    <div className="text-xs text-muted-foreground">
                        {permissionStatus === 'granted' && 'You will receive browser notifications for enabled events.'}
                        {permissionStatus === 'denied' && 'Please enable notifications in your browser settings.'}
                        {permissionStatus === 'default' && 'Allow browser notifications to receive alerts.'}
                        {permissionStatus === 'unsupported' && 'Your browser does not support notifications.'}
                    </div>
                </div>

                {permissionStatus === 'default' && (
                    <Button onClick={handleRequestPermission} size="sm" className="rounded-xl">
                        Enable
                    </Button>
                )}

                {permissionStatus === 'granted' && (
                    <Button onClick={handleTestNotification} variant="outline" size="sm" className="rounded-xl">
                        Test
                    </Button>
                )}
            </div>

            {/* Notification Options */}
            <div className="rounded-xl border bg-card divide-y">
                {notificationOptions.map((option) => (
                    <div
                        key={option.key}
                        className={cn(
                            "p-4 flex items-center gap-4 transition-colors",
                            permissionStatus === 'granted'
                                ? "hover:bg-muted/50 cursor-pointer"
                                : "opacity-50 cursor-not-allowed"
                        )}
                        onClick={() => permissionStatus === 'granted' && toggleSetting(option.key)}
                    >
                        <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center", option.bgColor)}>
                            <option.icon className={cn("h-5 w-5", option.iconColor)} />
                        </div>

                        <div className="flex-1">
                            <div className="font-medium text-sm">{option.title}</div>
                            <div className="text-xs text-muted-foreground">{option.description}</div>
                        </div>

                        {/* Toggle Switch */}
                        <button
                            disabled={permissionStatus !== 'granted'}
                            onClick={(e) => {
                                e.stopPropagation()
                                if (permissionStatus === 'granted') toggleSetting(option.key)
                            }}
                            className={cn(
                                "relative w-11 h-6 rounded-full transition-colors duration-200",
                                settings[option.key] && permissionStatus === 'granted' ? "bg-emerald-500" : "bg-muted",
                                permissionStatus !== 'granted' && "opacity-50"
                            )}
                        >
                            <div className={cn(
                                "absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow-sm transition-transform duration-200",
                                settings[option.key] && "translate-x-5"
                            )} />
                        </button>
                    </div>
                ))}
            </div>

            {/* Save Button */}
            <Button
                onClick={handleSave}
                disabled={saving || permissionStatus !== 'granted'}
                className="w-full mt-6 rounded-xl"
            >
                <Save className="h-4 w-4 mr-2" />
                {saving ? "Saving..." : "Save Preferences"}
            </Button>
        </div>
    )
}
