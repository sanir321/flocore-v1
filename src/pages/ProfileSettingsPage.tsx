import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useToast } from '@/hooks/use-toast'
import { Save, Copy, Check } from 'lucide-react'

interface UserProfile {
    email: string
    id: string
}

interface Workspace {
    id: string
    name: string
    industry: string | null
    timezone: string | null
    created_at: string
}

export default function ProfileSettingsPage() {
    const [user, setUser] = useState<UserProfile | null>(null)
    const [workspace, setWorkspace] = useState<Workspace | null>(null)
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [copiedId, setCopiedId] = useState<string | null>(null)
    const { toast } = useToast()

    useEffect(() => {
        const fetchData = async () => {
            const { data: { user: authUser } } = await supabase.auth.getUser()
            if (!authUser) {
                setLoading(false)
                return
            }

            setUser({
                email: authUser.email || '',
                id: authUser.id
            })

            const { data: workspaceData } = await supabase
                .from('workspaces')
                .select('*')
                .eq('owner_id', authUser.id)
                .single()

            if (workspaceData) {
                setWorkspace(workspaceData as Workspace)
            }

            setLoading(false)
        }

        fetchData()
    }, [])

    const handleSave = async () => {
        if (!workspace) return
        setSaving(true)

        try {
            const { error } = await supabase
                .from('workspaces')
                .update({
                    name: workspace.name,
                    industry: workspace.industry,
                    timezone: workspace.timezone
                })
                .eq('id', workspace.id)

            if (error) throw error

            toast({ title: "Success", description: "Profile saved successfully." })
        } catch (error: any) {
            toast({ title: "Error", description: error.message, variant: "destructive" })
        } finally {
            setSaving(false)
        }
    }

    const copyToClipboard = (text: string, label: string) => {
        navigator.clipboard.writeText(text)
        setCopiedId(label)
        setTimeout(() => setCopiedId(null), 2000)
        toast({ title: "Copied", description: `${label} copied to clipboard.` })
    }

    if (loading) {
        return (
            <div className="flex h-full items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
        )
    }

    return (
        <div className="p-6 max-w-2xl">
            <div className="mb-6">
                <h1 className="text-xl font-semibold">Profile</h1>
                <p className="text-sm text-muted-foreground mt-1">Manage your account and workspace details</p>
            </div>

            {/* User Account Section */}
            <div className="rounded-xl border bg-card p-6 mb-6">
                <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-4">Account</h2>

                <div className="space-y-4">
                    <div className="space-y-2">
                        <Label className="text-xs uppercase tracking-wider text-muted-foreground">Email</Label>
                        <Input
                            value={user?.email || ''}
                            disabled
                            className="rounded-xl bg-muted"
                        />
                        <p className="text-xs text-muted-foreground">Email cannot be changed</p>
                    </div>

                    <div className="space-y-2">
                        <Label className="text-xs uppercase tracking-wider text-muted-foreground">User ID</Label>
                        <div className="flex gap-2">
                            <Input
                                value={user?.id || ''}
                                disabled
                                className="rounded-xl bg-muted font-mono text-xs"
                            />
                            <Button
                                variant="outline"
                                size="icon"
                                onClick={() => copyToClipboard(user?.id || '', 'User ID')}
                                className="flex-none"
                            >
                                {copiedId === 'User ID' ? <Check className="h-4 w-4 text-emerald-500" /> : <Copy className="h-4 w-4" />}
                            </Button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Workspace Section */}
            {workspace && (
                <div className="rounded-xl border bg-card p-6 mb-6">
                    <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-4">Workspace</h2>

                    <div className="space-y-4">
                        <div className="space-y-2">
                            <Label className="text-xs uppercase tracking-wider text-muted-foreground">Workspace ID</Label>
                            <div className="flex gap-2">
                                <Input
                                    value={workspace.id}
                                    disabled
                                    className="rounded-xl bg-muted font-mono text-xs"
                                />
                                <Button
                                    variant="outline"
                                    size="icon"
                                    onClick={() => copyToClipboard(workspace.id, 'Workspace ID')}
                                    className="flex-none"
                                >
                                    {copiedId === 'Workspace ID' ? <Check className="h-4 w-4 text-emerald-500" /> : <Copy className="h-4 w-4" />}
                                </Button>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label className="text-xs uppercase tracking-wider text-muted-foreground">Workspace Name</Label>
                            <Input
                                value={workspace.name || ''}
                                onChange={(e) => setWorkspace(prev => prev ? { ...prev, name: e.target.value } : null)}
                                className="rounded-xl"
                                placeholder="My Workspace"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label className="text-xs uppercase tracking-wider text-muted-foreground">Industry</Label>
                            <Input
                                value={workspace.industry || ''}
                                onChange={(e) => setWorkspace(prev => prev ? { ...prev, industry: e.target.value } : null)}
                                className="rounded-xl"
                                placeholder="Salon, Clinic, Retail, etc."
                            />
                        </div>

                        <div className="space-y-2">
                            <Label className="text-xs uppercase tracking-wider text-muted-foreground">Timezone</Label>
                            <select
                                className="flex h-10 w-full rounded-xl border border-input bg-background px-3 py-2 text-sm"
                                value={workspace.timezone || 'Asia/Kolkata'}
                                onChange={(e) => setWorkspace(prev => prev ? { ...prev, timezone: e.target.value } : null)}
                            >
                                <option value="Asia/Kolkata">Asia/Kolkata (IST)</option>
                                <option value="America/New_York">America/New_York (EST)</option>
                                <option value="America/Los_Angeles">America/Los_Angeles (PST)</option>
                                <option value="Europe/London">Europe/London (GMT)</option>
                                <option value="Europe/Paris">Europe/Paris (CET)</option>
                                <option value="Asia/Dubai">Asia/Dubai (GST)</option>
                                <option value="Asia/Singapore">Asia/Singapore (SGT)</option>
                            </select>
                        </div>

                        <div className="space-y-2">
                            <Label className="text-xs uppercase tracking-wider text-muted-foreground">Created</Label>
                            <Input
                                value={new Date(workspace.created_at).toLocaleDateString('en-US', {
                                    year: 'numeric',
                                    month: 'long',
                                    day: 'numeric'
                                })}
                                disabled
                                className="rounded-xl bg-muted"
                            />
                        </div>
                    </div>
                </div>
            )}

            {/* Save Button */}
            <Button onClick={handleSave} disabled={saving} className="w-full rounded-xl">
                <Save className="h-4 w-4 mr-2" />
                {saving ? "Saving..." : "Save Changes"}
            </Button>
        </div>
    )
}
