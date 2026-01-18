import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { MessageSquare, AlertTriangle, CheckCircle, Users } from 'lucide-react'

interface DashboardMetrics {
    open_conversations: number
    escalations_today: number
    ai_success_rate: number
    human_load: number
}

export default function DashboardHome() {
    const [metrics, setMetrics] = useState<DashboardMetrics | null>(null)
    const [loading, setLoading] = useState(true)
    const [workspaceId, setWorkspaceId] = useState<string | null>(null)

    const [userName, setUserName] = useState<string>('')

    useEffect(() => {
        const fetchWorkspaceAndMetrics = async () => {
            // Get the user's workspace
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) return

            // Fetch user profile for name
            const { data: profile } = await supabase
                .from('profiles')
                .select('full_name')
                .eq('id', user.id)
                .single()

            if (profile?.full_name) {
                // Get first name
                setUserName(profile.full_name.split(' ')[0])
            }

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

            // Fetch metrics using RPC
            const { data, error } = await supabase.rpc('get_dashboard_metrics', {
                p_workspace_id: workspace.id
            })

            if (!error && data) {
                setMetrics(data as unknown as DashboardMetrics)
            }
            setLoading(false)
        }

        fetchWorkspaceAndMetrics()
    }, [])

    const getGreeting = () => {
        const hour = new Date().getHours()
        if (hour < 12) return 'Good morning'
        if (hour < 18) return 'Good afternoon'
        return 'Good evening'
    }

    if (loading) {
        return (
            <div className="p-8">
                <div className="animate-pulse space-y-4">
                    <div className="h-8 bg-muted rounded w-1/4"></div>
                    <div className="grid grid-cols-4 gap-4">
                        {[1, 2, 3, 4].map(i => (
                            <div key={i} className="h-32 bg-muted rounded"></div>
                        ))}
                    </div>
                </div>
            </div>
        )
    }

    if (!workspaceId) {
        return (
            <div className="p-8">
                <h1 className="text-2xl font-bold mb-4">No Workspace Found</h1>
                <p className="text-muted-foreground mb-6">Please complete onboarding to set up your workspace.</p>
                <a
                    href="/onboarding"
                    className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
                >
                    Start Onboarding →
                </a>
            </div>
        )
    }

    return (
        <div className="p-8">
            <div className="mb-8">
                <h1 className="text-3xl font-bold tracking-tight text-slate-900">
                    {getGreeting()}, {userName || 'there'} 👋
                </h1>
                <p className="text-muted-foreground mt-1">Here's what's happening in your workspace today.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Open Conversations</CardTitle>
                        <MessageSquare className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{metrics?.open_conversations ?? 0}</div>
                        <p className="text-xs text-muted-foreground">Active chats needing attention</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Escalations Today</CardTitle>
                        <AlertTriangle className="h-4 w-4 text-orange-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{metrics?.escalations_today ?? 0}</div>
                        <p className="text-xs text-muted-foreground">Conversations needing human help</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">AI Success Rate</CardTitle>
                        <CheckCircle className="h-4 w-4 text-green-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{metrics?.ai_success_rate ?? 0}%</div>
                        <p className="text-xs text-muted-foreground">Resolved without human</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Human Load</CardTitle>
                        <Users className="h-4 w-4 text-blue-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{metrics?.human_load ?? 0}</div>
                        <p className="text-xs text-muted-foreground">Chats assigned to humans</p>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
