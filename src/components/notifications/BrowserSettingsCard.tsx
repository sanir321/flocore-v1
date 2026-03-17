import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Bell, AlertTriangle, CheckCircle, Save } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface BrowserCardProps {
    permissionStatus: NotificationPermission | 'unsupported'
    onRequestPermission: () => void
    escalationPopups: boolean
    newMessageAlerts: boolean
    onToggleEscalation: () => void
    onToggleNewMessage: () => void
    onSaveAll: () => void
    isSaving: boolean
}

export function BrowserSettingsCard({
    permissionStatus,
    onRequestPermission,
    escalationPopups,
    newMessageAlerts,
    onToggleEscalation,
    onToggleNewMessage,
    onSaveAll,
    isSaving
}: BrowserCardProps) {
    return (
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
                        <Button size="sm" variant="outline" className="h-7 text-xs bg-white" onClick={onRequestPermission}>Enable</Button>
                    )}
                </div>

                <div className="space-y-5 divide-y divide-border/40">
                    <div className="flex items-center justify-between pt-5 first:pt-0">
                        <div className="space-y-0.5">
                            <Label className="text-sm font-medium">Escalation Popups</Label>
                            <p className="text-[11px] text-muted-foreground">When a user is angry or requests a human.</p>
                        </div>
                        <Switch
                            checked={escalationPopups}
                            onCheckedChange={onToggleEscalation}
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
                            checked={newMessageAlerts}
                            onCheckedChange={onToggleNewMessage}
                            disabled={permissionStatus !== 'granted'}
                            className="data-[state=checked]:bg-foreground"
                        />
                    </div>
                </div>

                <div className="flex justify-end pt-4 border-t mt-4">
                    <Button onClick={onSaveAll} disabled={isSaving} className="bg-foreground text-background hover:bg-foreground/90 h-9 text-xs">
                        {isSaving ? (
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
    )
}
