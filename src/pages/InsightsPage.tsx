import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts'
import { ChevronDown, BarChart3, Info, Download, ChevronLeft, ChevronRight } from 'lucide-react'
import type { Tables } from '@/types/database.types'
import { format, subDays, startOfDay, getDay, getHours } from 'date-fns'
import FlowCoreLoader from '@/components/ui/FlowCoreLoader'
import { cn } from '@/lib/utils'

type ConversationWithContact = Tables<'conversations'> & {
    contact: {
        name: string | null
        phone: string
        tags?: string[]
    } | null
    message_count?: number
}

export default function InsightsPage() {
    const [loading, setLoading] = useState(true)
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const [timeRange] = useState('7d')

    // Data
    const [conversations, setConversations] = useState<ConversationWithContact[]>([])
    const [escalations, setEscalations] = useState<ConversationWithContact[]>([])

    // Derived Stats
    const [metrics, setMetrics] = useState({
        inboxTodoCount: 0,
        aiAutomationRate: 0,
        volumeData: [] as any[],
        aiTrendData: [] as any[]
    })

    const [escalationMetrics, setEscalationMetrics] = useState({
        volumeTrend: [] as any[],
        byTopic: [] as any[],
        heatmap: [] as any[]
    })

    // Conversation Stats
    const [convStats, setConvStats] = useState({
        total: 0,
        replyRate: 0,
        satisfaction: 0,
        tasksDetected: 0
    })

    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true)
                const { data: { user } } = await supabase.auth.getUser()
                if (!user) return

                const workspaceId = await getWorkspaceId(user.id)
                if (!workspaceId) {
                    setLoading(false)
                    return
                }

                const thirtyDaysAgo = subDays(new Date(), 30).toISOString()

                // 1. Fetch Conversations
                const { data: convsData } = await supabase
                    .from('conversations')
                    .select('*, contact:contacts(name, phone, tags), messages(count)')
                    .eq('workspace_id', workspaceId)
                    .gte('created_at', thirtyDaysAgo)
                    .order('created_at', { ascending: true })

                if (convsData) {
                    const typedData = convsData.map((c: any) => ({
                        ...c,
                        message_count: c.messages?.[0]?.count || 0
                    }))
                    setConversations(typedData)
                    processMetrics(typedData)

                    // Process Conversation Stats (Real)
                    const total = typedData.length

                    // Reply Rate: Convs with more than 1 message (assuming inbound + reply)
                    const repliedConvs = typedData.filter((c: any) => c.message_count > 1).length
                    const replyRate = total > 0 ? (repliedConvs / total) * 100 : 0

                    // Satisfaction: Inverse of escalation rate (Mock proxy)
                    const escalatedCount = typedData.filter((c: any) => c.escalated).length
                    const satisfaction = total > 0 ? 100 - ((escalatedCount / total) * 100) : 100

                    setConvStats({
                        total,
                        replyRate: parseFloat(replyRate.toFixed(1)),
                        satisfaction: parseFloat(satisfaction.toFixed(1)),
                        tasksDetected: 0 // No task detection logic yet
                    })
                }

                // 2. Fetch Escalations
                const { data: escData } = await supabase
                    .from('conversations')
                    .select('*, contact:contacts(name, phone)')
                    .eq('workspace_id', workspaceId)
                    .eq('escalated', true)
                    .gte('created_at', thirtyDaysAgo)
                    .order('escalated_at', { ascending: false })

                if (escData) {
                    const typedEsc = escData as ConversationWithContact[]
                    setEscalations(typedEsc)
                    processEscalationMetrics(typedEsc)
                }

            } catch (error) {
                console.error('Failed to load insights:', error)
            } finally {
                setLoading(false)
            }
        }

        fetchData()
    }, [timeRange])

    const getWorkspaceId = async (userId: string) => {
        const { data } = await supabase.from('workspaces').select('id').eq('owner_id', userId).single()
        return data?.id
    }

    const processMetrics = (data: ConversationWithContact[]) => {
        const openCount = data.filter(c => c.status === 'open' || c.status === 'followup').length
        const total = data.length
        const humanAssigned = data.filter(c => c.assigned_to_human).length
        const aiRate = total > 0 ? ((total - humanAssigned) / total) * 100 : 0
        const days = 7
        const volumeTrend = []
        const aiTrend = []
        for (let i = days - 1; i >= 0; i--) {
            const date = subDays(new Date(), i)
            const dateStr = format(date, 'MMM dd')
            const dayStart = startOfDay(date).getTime()
            const dayEnd = dayStart + 86400000
            const dailyConvs = data.filter(c => {
                const cTime = new Date(c.created_at || '').getTime()
                return cTime >= dayStart && cTime < dayEnd
            })
            volumeTrend.push({ name: dateStr, value: dailyConvs.length })
            const dailyTotal = dailyConvs.length
            const dailyHuman = dailyConvs.filter(c => c.assigned_to_human).length
            const dailyAiRate = dailyTotal > 0 ? ((dailyTotal - dailyHuman) / dailyTotal) * 100 : 0
            aiTrend.push({ name: dateStr, value: parseFloat(dailyAiRate.toFixed(1)) })
        }
        setMetrics({ inboxTodoCount: openCount, aiAutomationRate: parseFloat(aiRate.toFixed(1)), volumeData: volumeTrend, aiTrendData: aiTrend })
    }

    const processEscalationMetrics = (data: ConversationWithContact[]) => {
        const days = 7
        const volumeTrend = []
        for (let i = days - 1; i >= 0; i--) {
            const date = subDays(new Date(), i)
            const dateStr = format(date, 'MMM dd')
            const dayStart = startOfDay(date).getTime()
            const dayEnd = dayStart + 86400000
            const dailyCount = data.filter(c => {
                const cTime = new Date(c.escalated_at || c.created_at || '').getTime()
                return cTime >= dayStart && cTime < dayEnd
            }).length
            volumeTrend.push({ name: dateStr, value: dailyCount })
        }

        const topicMap: Record<string, number> = {}
        data.forEach(c => {
            const reason = c.escalation_reason || 'Unknown'
            topicMap[reason] = (topicMap[reason] || 0) + 1
        })
        const byTopic = Object.entries(topicMap).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value).slice(0, 5)

        const grid = Array(6).fill(0).map(() => Array(7).fill(0))
        data.forEach(c => {
            const date = new Date(c.escalated_at || c.created_at || '')
            const dayIndex = getDay(date)
            const hour = getHours(date)
            let slotIndex = 0
            if (hour >= 9 && hour < 13) slotIndex = 0
            else if (hour >= 13 && hour < 17) slotIndex = 1
            else if (hour >= 17 && hour < 21) slotIndex = 2
            else if (hour >= 21 || hour < 1) slotIndex = 3
            else if (hour >= 1 && hour < 5) slotIndex = 4
            else if (hour >= 5 && hour < 9) slotIndex = 5
            grid[slotIndex][dayIndex]++
        })
        setEscalationMetrics({ volumeTrend, byTopic, heatmap: grid })
    }

    if (loading) return <FlowCoreLoader fullScreen={false} />

    return (
        <div className="flex flex-col h-full bg-white overflow-y-auto">
            <div className="px-8 py-6 max-w-[1600px] mx-auto w-full space-y-6">

                {/* Header Section */}
                <div>
                    <h1 className="text-2xl font-semibold tracking-tight text-foreground">Insights</h1>
                </div>

                {/* Tabs Navigation */}
                <Tabs defaultValue="trends" className="space-y-6">
                    <TabsList className="bg-transparent border-b w-full justify-start h-auto p-0 space-x-8 rounded-none">
                        {['Trends', 'Escalations', 'Conversations'].map(tab => (
                            <TabsTrigger
                                key={tab}
                                value={tab.toLowerCase()}
                                className="rounded-none border-b-2 border-transparent data-[state=active]:border-black data-[state=active]:shadow-none px-0 py-3 text-sm font-medium text-muted-foreground data-[state=active]:text-foreground transition-none"
                            >
                                {tab}
                            </TabsTrigger>
                        ))}
                    </TabsList>

                    {/* Filters Row */}
                    <div className="flex flex-wrap items-center gap-3">
                        <Button variant="outline" size="sm" className="bg-white border-slate-200 text-sm font-normal h-9 px-3">
                            Last 7 days <ChevronDown className="ml-2 h-3 w-3 opacity-50" />
                        </Button>
                        <span className="text-sm text-muted-foreground">compared to</span>
                        <Button variant="outline" size="sm" className="bg-white border-slate-200 text-sm font-normal h-9 px-3 text-muted-foreground">
                            Previous period <ChevronDown className="ml-2 h-3 w-3 opacity-50" />
                        </Button>
                        <span className="text-sm text-muted-foreground ml-2">for</span>
                        <Button variant="outline" size="sm" className="bg-white border-slate-200 text-sm font-normal h-9 px-3">
                            All inboxes <ChevronDown className="ml-2 h-3 w-3 opacity-50" />
                        </Button>
                    </div>

                    {/* TRENDS DASHBOARD */}
                    <TabsContent value="trends" className="space-y-6 animate-in fade-in slide-in-from-bottom-2">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <Card className="rounded-xl border shadow-sm h-[320px] flex flex-col">
                                <CardHeader className="pb-2">
                                    <div className="flex items-center gap-2">
                                        <CardTitle className="text-base font-medium">Inbox todo count</CardTitle>
                                        <Info className="h-4 w-4 text-muted-foreground/50" />
                                        <span className="bg-slate-100 text-slate-600 text-xs px-2 py-0.5 rounded-full font-mono">
                                            {metrics.inboxTodoCount}
                                        </span>
                                    </div>
                                    <div className="flex items-baseline gap-2 mt-1">
                                        <span className="text-2xl font-semibold">{metrics.inboxTodoCount}</span>
                                        <span className="text-sm text-muted-foreground">0 previous period</span>
                                    </div>
                                </CardHeader>
                                <CardContent className="flex-1 flex flex-col justify-end pb-2 px-0">
                                    <div className="h-[200px] w-full">
                                        <ResponsiveContainer width="100%" height="100%">
                                            <AreaChart data={metrics.volumeData}>
                                                <defs>
                                                    <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                                                        <stop offset="5%" stopColor="#e2e8f0" stopOpacity={0.8} />
                                                        <stop offset="95%" stopColor="#e2e8f0" stopOpacity={0} />
                                                    </linearGradient>
                                                </defs>
                                                <XAxis dataKey="name" axisLine={{ stroke: '#f1f5f9' }} tickLine={false} fontSize={11} stroke="#94a3b8" tickMargin={10} />
                                                <Tooltip cursor={false} content={<CustomTooltip />} />
                                                <Area type="monotone" dataKey="value" stroke="#cbd5e1" strokeWidth={2} fill="url(#colorValue)" />
                                            </AreaChart>
                                        </ResponsiveContainer>
                                    </div>
                                </CardContent>
                            </Card>

                            <Card className="rounded-xl border shadow-sm h-[320px] flex flex-col">
                                <CardHeader className="pb-2">
                                    <div className="flex items-center gap-2">
                                        <CardTitle className="text-base font-medium">AI automation rate</CardTitle>
                                        <Info className="h-4 w-4 text-muted-foreground/50" />
                                        <span className="bg-slate-100 text-slate-600 text-xs px-2 py-0.5 rounded-full font-mono">
                                            {metrics.aiAutomationRate}%
                                        </span>
                                    </div>
                                    <div className="flex items-baseline gap-2 mt-1">
                                        <span className="text-2xl font-semibold">{metrics.aiAutomationRate}%</span>
                                        <span className="text-sm text-muted-foreground">0.0% previous period</span>
                                    </div>
                                </CardHeader>
                                <CardContent className="flex-1 flex flex-col justify-end pb-2 px-0">
                                    <div className="h-[150px] w-full relative">
                                        <ResponsiveContainer width="100%" height="100%">
                                            <AreaChart data={metrics.aiTrendData}>
                                                <defs>
                                                    <linearGradient id="colorAi" x1="0" y1="0" x2="0" y2="1">
                                                        <stop offset="5%" stopColor="#dbeafe" stopOpacity={0.8} />
                                                        <stop offset="95%" stopColor="#dbeafe" stopOpacity={0} />
                                                    </linearGradient>
                                                </defs>
                                                <XAxis dataKey="name" axisLine={{ stroke: '#f1f5f9' }} tickLine={false} fontSize={11} stroke="#94a3b8" tickMargin={10} />
                                                <Tooltip cursor={false} content={<PercentageTooltip />} />
                                                <Area type="monotone" dataKey="value" stroke="#93c5fd" strokeWidth={2} fill="url(#colorAi)" />
                                            </AreaChart>
                                        </ResponsiveContainer>
                                    </div>
                                </CardContent>
                            </Card>

                            <Card className="rounded-xl border shadow-sm h-[320px] flex flex-col bg-white">
                                <CardHeader className="pb-2">
                                    <CardTitle className="text-base font-medium">Copilot actions</CardTitle>
                                </CardHeader>
                                <CardContent className="flex-1 flex items-center justify-center">
                                    <div className="border-2 border-dashed border-slate-100 rounded-lg w-full h-[200px] flex flex-col items-center justify-center">
                                        <BarChart3 className="h-6 w-6 text-slate-300 mb-3" />
                                        <p className="text-sm font-medium text-slate-500">No data to show</p>
                                        <p className="text-xs text-slate-400 mt-1">Please check back later</p>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    </TabsContent>

                    {/* ESCALATIONS DASHBOARD */}
                    <TabsContent value="escalations" className="space-y-6 animate-in fade-in slide-in-from-bottom-2">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* ... (Same as before) ... */}
                            <Card className="rounded-xl border shadow-sm h-[320px] flex flex-col bg-white">
                                <CardHeader className="pb-2">
                                    <CardTitle className="text-base font-medium">Escalations</CardTitle>
                                </CardHeader>
                                <CardContent className="flex-1 flex items-center justify-center">
                                    {escalations.length === 0 ? (
                                        <div className="border-2 border-dashed border-slate-100 rounded-lg w-full h-[200px] flex flex-col items-center justify-center">
                                            <BarChart3 className="h-6 w-6 text-slate-300 mb-3" />
                                            <p className="text-sm font-medium text-slate-500">No data to show</p>
                                            <p className="text-xs text-slate-400 mt-1">Please check back later</p>
                                        </div>
                                    ) : (
                                        <div className="w-full h-full overflow-hidden relative">
                                            <div className="absolute inset-0 overflow-y-auto">
                                                <table className="w-full text-xs">
                                                    <tbody className="divide-y">
                                                        {escalations.slice(0, 5).map(e => (
                                                            <tr key={e.id}>
                                                                <td className="py-2 px-1 font-medium truncate max-w-[120px]">{e.escalation_reason}</td>
                                                                <td className="py-2 px-1 text-slate-500">{(e.contact as any)?.name}</td>
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                </table>
                                            </div>
                                        </div>
                                    )}
                                </CardContent>
                            </Card>

                            <Card className="rounded-xl border shadow-sm h-[320px] flex flex-col bg-white">
                                <CardHeader className="pb-2">
                                    <div className="flex items-center gap-2">
                                        <CardTitle className="text-base font-medium">Escalations by message topic</CardTitle>
                                        <Info className="h-4 w-4 text-muted-foreground/50" />
                                    </div>
                                </CardHeader>
                                <CardContent className="flex-1 flex flex-col justify-center">
                                    {escalationMetrics.byTopic.length === 0 ? (
                                        <div className="border-2 border-dashed border-slate-100 rounded-lg w-full h-[200px] flex flex-col items-center justify-center">
                                            <BarChart3 className="h-6 w-6 text-slate-300 mb-3" />
                                            <p className="text-sm font-medium text-slate-500">No data to show</p>
                                        </div>
                                    ) : (
                                        <div className="h-[200px] w-full">
                                            <ResponsiveContainer width="100%" height="100%">
                                                <BarChart layout="vertical" data={escalationMetrics.byTopic}>
                                                    <XAxis type="number" hide />
                                                    <YAxis dataKey="name" type="category" width={100} tick={{ fontSize: 10 }} />
                                                    <Tooltip cursor={{ fill: 'transparent' }} contentStyle={{ fontSize: '11px' }} />
                                                    <Bar dataKey="value" fill="#3b82f6" radius={[0, 4, 4, 0]} barSize={20} />
                                                </BarChart>
                                            </ResponsiveContainer>
                                        </div>
                                    )}
                                </CardContent>
                            </Card>

                            <Card className="rounded-xl border shadow-sm h-[320px] flex flex-col">
                                <CardHeader className="pb-2">
                                    <div className="flex items-center gap-2">
                                        <CardTitle className="text-base font-medium">Escalations volume trend</CardTitle>
                                        <Info className="h-4 w-4 text-muted-foreground/50" />
                                        <span className="bg-slate-100 text-slate-600 text-xs px-2 py-0.5 rounded-full font-mono">
                                            {escalationMetrics.volumeTrend.reduce((acc, curr) => acc + curr.value, 0)}
                                        </span>
                                    </div>
                                    <div className="flex items-baseline gap-2 mt-1">
                                        <span className="text-2xl font-semibold">
                                            {escalationMetrics.volumeTrend.reduce((acc, curr) => acc + curr.value, 0)}
                                        </span>
                                        <span className="text-sm text-muted-foreground">0 previous period</span>
                                    </div>
                                </CardHeader>
                                <CardContent className="flex-1 flex flex-col justify-end pb-2 px-0">
                                    <div className="h-[200px] w-full">
                                        <ResponsiveContainer width="100%" height="100%">
                                            <AreaChart data={escalationMetrics.volumeTrend}>
                                                <defs>
                                                    <linearGradient id="colorEsc" x1="0" y1="0" x2="0" y2="1">
                                                        <stop offset="5%" stopColor="#f87171" stopOpacity={0.8} />
                                                        <stop offset="95%" stopColor="#f87171" stopOpacity={0} />
                                                    </linearGradient>
                                                </defs>
                                                <XAxis dataKey="name" axisLine={{ stroke: '#f1f5f9' }} tickLine={false} fontSize={11} stroke="#94a3b8" tickMargin={10} />
                                                <Tooltip cursor={false} content={<CustomTooltip />} />
                                                <Area type="monotone" dataKey="value" stroke="#fda4af" strokeWidth={2} fill="url(#colorEsc)" />
                                            </AreaChart>
                                        </ResponsiveContainer>
                                    </div>
                                </CardContent>
                            </Card>

                            <Card className="rounded-xl border shadow-sm h-[320px] flex flex-col bg-white">
                                <CardHeader className="pb-2 border-b border-transparent">
                                    <div className="flex justify-between items-center">
                                        <div className="flex items-center gap-2">
                                            <CardTitle className="text-base font-medium">Escalations heatmap</CardTitle>
                                            <Info className="h-4 w-4 text-muted-foreground/50" />
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-8 gap-1 mt-4 text-[10px] text-slate-400 uppercase font-medium text-center">
                                        <div>Time</div>
                                        <div>Sun</div>
                                        <div>Mon</div>
                                        <div>Tue</div>
                                        <div>Wed</div>
                                        <div>Thu</div>
                                        <div>Fri</div>
                                        <div>Sat</div>
                                    </div>
                                </CardHeader>
                                <CardContent className="flex-1 p-2 pt-0 overflow-hidden">
                                    <div className="grid grid-rows-6 gap-1 h-full">
                                        {[
                                            '9 AM - 1 PM',
                                            '1 PM - 5 PM',
                                            '5 PM - 9 PM',
                                            '9 PM - 1 AM',
                                            '1 AM - 5 AM',
                                            '5 AM - 9 AM'
                                        ].map((label, rowIndex) => (
                                            <div key={label} className="grid grid-cols-8 gap-1 items-center h-8">
                                                <div className="text-[10px] text-slate-500 font-medium whitespace-nowrap leading-none text-right pr-2">
                                                    {label.replace(' - ', '-').replace(' AM', 'am').replace(' PM', 'pm')}
                                                </div>
                                                {escalationMetrics.heatmap[rowIndex]?.map((count: number, colIndex: number) => (
                                                    <div
                                                        key={`${rowIndex}-${colIndex}`}
                                                        className={cn(
                                                            "h-full w-full rounded-sm transition-all text-[0px] flex items-center justify-center hover:scale-110 cursor-pointer",
                                                            count === 0 ? "bg-slate-50 hover:bg-slate-100" :
                                                                count < 3 ? "bg-blue-100 ring-1 ring-blue-200" :
                                                                    count < 5 ? "bg-blue-300 ring-1 ring-blue-400" :
                                                                        "bg-blue-600 ring-1 ring-blue-700"
                                                        )}
                                                        title={`${count} escalations`}
                                                    >
                                                        {count > 0 && <span className="text-[8px] text-blue-900 font-bold">{count}</span>}
                                                    </div>
                                                ))}
                                            </div>
                                        ))}
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    </TabsContent>

                    {/* CONVERSATIONS TAB (New Design) */}
                    <TabsContent value="conversations" className="space-y-6 animate-in fade-in slide-in-from-bottom-2">

                        {/* 1. Stats Row */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                            {[
                                { label: 'Total Conversations', value: convStats.total, unit: '' },
                                { label: 'Reply rate', value: convStats.replyRate, unit: '%' },
                                { label: 'Satisfaction rate', value: convStats.satisfaction, unit: '%' },
                                { label: 'Tasks detected', value: convStats.tasksDetected, unit: '' }
                            ].map((stat, i) => (
                                <Card key={i} className="rounded-xl border shadow-sm">
                                    <CardContent className="p-6">
                                        <div className="flex items-center gap-2 mb-2">
                                            <p className="text-sm font-medium text-slate-900">{stat.label}</p>
                                            <Info className="h-4 w-4 text-muted-foreground/50" />
                                            <span className="text-xs bg-slate-100 px-1.5 rounded text-slate-500">0%</span>
                                        </div>
                                        <div className="flex items-end gap-1">
                                            <h3 className="text-4xl font-normal tracking-tight">{stat.value}{stat.unit}</h3>
                                        </div>
                                        <p className="text-sm text-muted-foreground mt-2">0 previous period</p>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>

                        {/* 2. Conversations Table */}
                        <Card className="rounded-xl border shadow-sm">
                            <CardHeader className="bg-white border-b py-4">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <CardTitle className="text-base font-semibold">Conversations</CardTitle>
                                        <Info className="h-4 w-4 text-muted-foreground/50" />
                                        <Button variant="ghost" size="icon" className="h-6 w-6">
                                            <Download className="h-4 w-4 text-slate-400" />
                                        </Button>
                                    </div>
                                </div>
                                {/* Header Filters (Mock) */}
                                <div className="flex items-center gap-4 mt-4 text-xs font-medium text-muted-foreground overflow-x-auto pb-1">
                                    {['Contact', 'Inbox', 'CX Score', 'Messages', 'AI %', 'Escalations', 'Tasks', 'Tags', 'Last Message'].map(col => (
                                        <div key={col} className={cn(
                                            "whitespace-nowrap cursor-pointer hover:text-foreground flex items-center gap-1",
                                            col === 'Contact' && "flex-1 min-w-[150px]",
                                            col === 'Last Message' && "justify-end flex-1"
                                        )}>
                                            {col} {col === 'Last Message' && <ChevronDown className="h-3 w-3 inline" />}
                                        </div>
                                    ))}
                                </div>
                            </CardHeader>
                            <CardContent className="p-0">
                                {conversations.length === 0 ? (
                                    <div className="p-16 text-center">
                                        <p className="text-muted-foreground">No conversations found for the selected criteria.</p>
                                    </div>
                                ) : (
                                    <div className="divide-y relative min-h-[300px]">
                                        {conversations.slice(0, 10).map(conv => (
                                            <div key={conv.id} className="flex items-center gap-4 px-6 py-4 hover:bg-slate-50 transition-colors text-sm">

                                                {/* Contact */}
                                                <div className="flex-1 min-w-[150px]">
                                                    <div className="font-medium text-slate-900">{(conv.contact as any)?.name || 'Unknown'}</div>
                                                    <div className="text-xs text-slate-500">{(conv.contact as any)?.phone}</div>
                                                </div>

                                                {/* Inbox */}
                                                <div className="w-24 capitalize text-slate-600">{conv.channel || 'Whatsapp'}</div>

                                                {/* CX Score */}
                                                <div className="w-20 text-slate-400">-</div>

                                                {/* Messages */}
                                                <div className="w-20 text-slate-600">
                                                    {(conv as any).message_count || 0}
                                                </div>

                                                {/* AI % */}
                                                <div className="w-16 text-slate-600">
                                                    {conv.assigned_to_human ? '20%' : '100%'}
                                                </div>

                                                {/* Escalations */}
                                                <div className="w-24">
                                                    {conv.escalated ? (
                                                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-800">
                                                            Yes
                                                        </span>
                                                    ) : (
                                                        <span className="text-slate-400">-</span>
                                                    )}
                                                </div>

                                                {/* Tasks */}
                                                <div className="w-16 text-slate-400">-</div>

                                                {/* Tags */}
                                                <div className="w-32">
                                                    {/* Mock Tags */}
                                                    {conv.escalated && <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-orange-100 text-orange-800 border border-orange-200">Issue</span>}
                                                </div>

                                                {/* Last Message */}
                                                <div className="flex-1 text-right text-slate-500 text-xs">
                                                    {conv.last_message_at ? format(new Date(conv.last_message_at), 'MMM d, h:mm a') : '-'}
                                                </div>

                                            </div>
                                        ))}
                                    </div>
                                )}
                            </CardContent>
                            <div className="p-4 border-t flex items-center justify-between">
                                <p className="text-xs text-muted-foreground">Showing 1-{Math.min(10, conversations.length)} of {conversations.length} conversations</p>
                                <div className="flex gap-2">
                                    <Button variant="outline" size="icon" className="h-8 w-8" disabled><ChevronLeft className="h-4 w-4" /></Button>
                                    <Button variant="outline" size="icon" className="h-8 w-8" disabled><ChevronRight className="h-4 w-4" /></Button>
                                </div>
                            </div>
                        </Card>
                    </TabsContent>

                </Tabs>
            </div>
        </div>
    )
}

const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
        return (
            <div className="bg-white p-2 border rounded shadow-sm text-xs">
                <p className="font-medium text-slate-700">{label}</p>
                <p className="text-indigo-600 font-semibold">
                    {payload[0].value} conversations
                </p>
            </div>
        )
    }
    return null
}

const PercentageTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
        return (
            <div className="bg-white p-2 border rounded shadow-sm text-xs">
                <p className="font-medium text-slate-700">{label}</p>
                <p className="text-indigo-600 font-semibold">
                    {payload[0].value}% automated
                </p>
            </div>
        )
    }
    return null
}
