import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip } from 'recharts'
import { Brain, Cpu, Banknote, TrendingUp } from 'lucide-react'
import { cn } from '@/lib/utils'
import { SentimentTooltip } from './SentimentTooltip'

interface IntelligenceViewProps {
    stats: any
}

export function IntelligenceView({ stats }: IntelligenceViewProps) {
    return (
        <div className="space-y-6 focus-visible:outline-none">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <Card className="lg:col-span-2 rounded-xl border border-slate-200/60 shadow-sm overflow-hidden bg-white">
                    <CardHeader className="pb-4">
                        <div className="flex items-center justify-between">
                            <CardTitle className="text-lg font-semibold flex items-center gap-2">
                                Agent Intelligence Leaderboard
                                <TrendingUp className="h-4 w-4 text-emerald-500" />
                            </CardTitle>
                            <span className="text-xs text-slate-400 font-medium">Grouped by active agents</span>
                        </div>
                    </CardHeader>
                    <CardContent className="p-0">
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-slate-50/50 border-y border-slate-100">
                                    <tr className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">
                                        <th className="text-left px-6 py-3">Agent</th>
                                        <th className="text-right px-6 py-3">Invocations</th>
                                        <th className="text-right px-6 py-3">Avg Latency</th>
                                        <th className="text-right px-6 py-3">Tool Calls</th>
                                        <th className="text-right px-6 py-3">Tokens</th>
                                        <th className="text-right px-6 py-3">Estimated Cost</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {stats.agentLeaderboard.map((agent: any) => (
                                        <tr key={agent.name} className="hover:bg-slate-50/50 transition-colors">
                                            <td className="px-6 py-4">
                                                <div className="font-semibold text-slate-900">{agent.name}</div>
                                                <div className="text-[10px] text-slate-400 uppercase font-bold">Standard Logic</div>
                                            </td>
                                            <td className="px-6 py-4 text-right text-slate-600 font-medium">{agent.count}</td>
                                            <td className="px-6 py-4 text-right">
                                                <span className={cn(
                                                    "px-2 py-1 rounded-full text-xs font-bold",
                                                    agent.avgLatency < 2000 ? "bg-emerald-50 text-emerald-700" : "bg-orange-50 text-orange-700"
                                                )}>
                                                    {agent.avgLatency}ms
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-right text-slate-600">{agent.toolCalls}</td>
                                            <td className="px-6 py-4 text-right text-slate-500 text-xs font-mono">{agent.totalTokens.toLocaleString()}</td>
                                            <td className="px-6 py-4 text-right text-slate-900 font-bold">${agent.cost.toFixed(2)}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </CardContent>
                </Card>

                <Card className="rounded-xl border border-slate-200/60 shadow-sm bg-white">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-lg font-semibold">User Satisfaction Trend</CardTitle>
                        <div className="flex items-baseline gap-2 mt-1">
                            <span className="text-3xl font-bold text-slate-900">{stats.satisfaction}%</span>
                            <span className="text-xs font-bold text-emerald-500 bg-emerald-50 px-2 py-0.5 rounded-full">+4.2%</span>
                        </div>
                    </CardHeader>
                    <CardContent className="px-0 pt-4">
                        <div className="h-[220px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <LineChart data={stats.sentimentTrend}>
                                    <XAxis dataKey="name" hide />
                                    <YAxis domain={[0, 100]} hide />
                                    <Tooltip content={<SentimentTooltip />} />
                                    <Line type="monotone" dataKey="value" stroke="#6366f1" strokeWidth={3} dot={{ r: 4, strokeWidth: 2, fill: '#fff' }} activeDot={{ r: 6 }} />
                                </LineChart>
                            </ResponsiveContainer>
                        </div>
                        <div className="px-6 mt-4 grid grid-cols-2 gap-4">
                            <div className="p-3 rounded-xl bg-indigo-50/50 border border-indigo-100">
                                <p className="text-[10px] text-indigo-400 font-bold uppercase tracking-wider">Top Topic</p>
                                <p className="text-sm font-bold text-indigo-900">{stats.topicTrend[0]?.name || 'N/A'}</p>
                            </div>
                            <div className="p-3 rounded-xl bg-slate-50/50 border border-slate-100">
                                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Avg Score</p>
                                <p className="text-sm font-bold text-slate-900">{stats.satisfaction}/100</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                    { label: 'Total Conversations', value: stats.totalConversations, icon: TrendingUp, color: 'text-indigo-500' },
                    { label: 'Automation Success', value: `${stats.aiAutomationRate}%`, icon: Cpu, color: 'text-cyan-500' },
                    { label: 'Tasks Resolved', value: stats.tasksDetected, icon: Brain, color: 'text-indigo-500' },
                    { label: 'Finance Overhead', value: `$${stats.totalCost}`, icon: Banknote, color: 'text-emerald-500' },
                ].map((kpi, i) => (
                    <Card key={i} className="rounded-xl border border-slate-200/60 bg-white">
                        <CardContent className="p-5 flex items-center gap-4">
                            <div className={cn("p-2 rounded-lg bg-slate-50", kpi.color)}>
                                <kpi.icon className="h-5 w-5" />
                            </div>
                            <div>
                                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">{kpi.label}</p>
                                <p className="text-xl font-bold text-slate-900">{kpi.value}</p>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>
        </div>
    )
}
