import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useToast } from '@/hooks/use-toast'
import { Save, Copy, Check, User, Building2 } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

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
                setWorkspace(workspaceData as unknown as Workspace)
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

            toast({ title: "Success", description: "Profile details updated successfully." })
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
            <div className="flex h-64 items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
        )
    }

    return (
        <div className="space-y-10 max-w-4xl">
            <div>
                <h1 className="text-3xl font-semibold tracking-tight text-foreground">Profile & Workspace</h1>
                <p className="text-muted-foreground text-base mt-2">Manage your account credentials and workspace preferences.</p>
            </div>

            {/* User Account Section */}
            <Card className="rounded-xl border shadow-none hover:border-foreground/20 transition-all duration-300">
                <CardHeader className="pb-5">
                    <div className="flex items-center gap-5">
                        <div className="w-14 h-14 rounded-full border bg-slate-50 flex items-center justify-center text-muted-foreground">
                            <User className="h-6 w-6" />
                        </div>
                        <div>
                            <CardTitle className="text-lg font-medium">Account Details</CardTitle>
                            <CardDescription className="text-sm mt-1">Your personal account information.</CardDescription>
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="space-y-6 pt-0">
                    <div className="grid gap-2">
                        <Label htmlFor="email" className="text-xs uppercase tracking-wider text-muted-foreground">Email Address</Label>
                        <Input
                            id="email"
                            value={user?.email || ''}
                            disabled
                            className="bg-slate-50 text-muted-foreground border-slate-200"
                        />
                    </div>

                    <div className="grid gap-2">
                        <Label htmlFor="userId" className="text-xs uppercase tracking-wider text-muted-foreground">User ID</Label>
                        <div className="flex gap-2">
                            <Input
                                id="userId"
                                value={user?.id || ''}
                                disabled
                                className="bg-slate-50 font-mono text-xs text-muted-foreground border-slate-200"
                            />
                            <Button
                                variant="outline"
                                size="icon"
                                onClick={() => copyToClipboard(user?.id || '', 'User ID')}
                                className="flex-none shrink-0 border-slate-200 hover:bg-slate-50"
                            >
                                {copiedId === 'User ID' ? <Check className="h-4 w-4 text-emerald-500" /> : <Copy className="h-4 w-4 text-muted-foreground" />}
                            </Button>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Workspace Section */}
            {workspace && (
                <Card className="rounded-xl border shadow-none hover:border-foreground/20 transition-all duration-300">
                    <CardHeader className="pb-4">
                        <div className="flex items-center gap-4">
                            <div className="w-10 h-10 rounded-full border bg-slate-50 flex items-center justify-center text-muted-foreground">
                                <Building2 className="h-5 w-5" />
                            </div>
                            <div>
                                <CardTitle className="text-base font-medium">Workspace Settings</CardTitle>
                                <CardDescription className="text-xs">Configuration for your primary workspace.</CardDescription>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="space-y-6 pt-0">
                        <div className="grid md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <Label htmlFor="wsName">Workspace Name</Label>
                                <Input
                                    id="wsName"
                                    value={workspace.name || ''}
                                    onChange={(e) => setWorkspace(prev => prev ? { ...prev, name: e.target.value } : null)}
                                    placeholder="e.g. Acme Corp"
                                    className="bg-white"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="industry">Industry</Label>
                                <Input
                                    id="industry"
                                    value={workspace.industry || ''}
                                    onChange={(e) => setWorkspace(prev => prev ? { ...prev, industry: e.target.value } : null)}
                                    placeholder="e.g. Retail, Healthcare"
                                    className="bg-white"
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="timezone">Timezone</Label>
                            <select
                                id="timezone"
                                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
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
                            <p className="text-[10px] text-muted-foreground">Used for scheduling and analytics.</p>
                        </div>

                        <div className="grid gap-2">
                            <Label htmlFor="wsId" className="text-xs uppercase tracking-wider text-muted-foreground">Workspace ID</Label>
                            <div className="flex gap-2">
                                <Input
                                    id="wsId"
                                    value={workspace.id}
                                    disabled
                                    className="bg-slate-50 font-mono text-xs text-muted-foreground border-slate-200"
                                />
                                <Button
                                    variant="outline"
                                    size="icon"
                                    onClick={() => copyToClipboard(workspace.id, 'Workspace ID')}
                                    className="flex-none shrink-0 border-slate-200 hover:bg-slate-50"
                                >
                                    {copiedId === 'Workspace ID' ? <Check className="h-4 w-4 text-emerald-500" /> : <Copy className="h-4 w-4 text-muted-foreground" />}
                                </Button>
                            </div>
                        </div>

                        <div className="pt-4 flex justify-end border-t mt-4">
                            <Button onClick={handleSave} disabled={saving} className="min-w-[120px] bg-foreground text-background hover:bg-foreground/90 h-9 text-xs">
                                {saving ? (
                                    <>
                                        <div className="mr-2 h-3 w-3 animate-spin rounded-full border-2 border-background border-t-transparent" />
                                        Saving...
                                    </>
                                ) : (
                                    <>
                                        <Save className="h-3.5 w-3.5 mr-2" />
                                        Save Changes
                                    </>
                                )}
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    )
}
