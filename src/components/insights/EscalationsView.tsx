import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ResponsiveContainer, AreaChart, Area, XAxis, Tooltip } from 'recharts'
import { cn } from '@/lib/utils'

interface EscalationsViewProps {
    stats: any
}

export function EscalationsView({ stats }: EscalationsViewProps) {
    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card className="rounded-xl border border-slate-200 shadow-sm bg-white overflow-hidden">
                    <CardHeader className="bg-slate-50 border-b border-slate-100 py-3">
                        <CardTitle className="text-sm font-bold uppercase tracking-wider text-slate-500">Peak Escalation Heatmap</CardTitle>
                    </CardHeader>
                    <CardContent className="p-4 overflow-hidden">
                        <div className="grid grid-rows-6 gap-1.5 h-[280px]">
                            {[
                                '9am - 1pm', '1pm - 5pm', '5pm - 9pm', '9pm - 1am', '1am - 5am', '5am - 9am'
                            ].map((label, rowIndex) => (
                                <div key={label} className="grid grid-cols-8 gap-1.5 items-center">
                                    <div className="text-[9px] text-slate-400 font-bold uppercase w-16 text-right pr-2">
                                        {label}
                                    </div>
                                    {stats.heatmap[rowIndex]?.map((count: number, colIndex: number) => (
                                        <div
                                            key={`${rowIndex}-${colIndex}`}
                                            className={cn(
                                                "h-full min-h-[30px] rounded-md transition-all flex items-center justify-center border",
                                                count === 0 ? "bg-slate-50 border-slate-100" :
                                                    count < 3 ? "bg-indigo-50 border-indigo-100" :
                                                        count < 5 ? "bg-indigo-200 border-indigo-300" :
                                                            "bg-indigo-600 border-indigo-700 shadow-sm"
                                            )}
                                        >
                                            {count > 0 && <span className={cn("text-xs font-bold", count > 4 ? "text-white" : "text-indigo-900")}>{count}</span>}
                                        </div>
                                    ))}
                                </div>
                            ))}
                            <div className="grid grid-cols-8 gap-1.5 mt-2 ml-16 text-[9px] text-slate-400 font-bold uppercase text-center">
                                {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map(d => <div key={d}>{d}</div>)}
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card className="rounded-xl border border-slate-200/60 shadow-sm bg-white">
                    <CardHeader>
                        <CardTitle className="text-lg font-semibold">Volume Trend</CardTitle>
                    </CardHeader>
                    <CardContent className="px-0">
                        <div className="h-[280px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={stats.volumeTrend}>
                                    <defs>
                                        <linearGradient id="colorVol" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.1} />
                                            <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <XAxis dataKey="name" hide />
                                    <Tooltip />
                                    <Area type="monotone" dataKey="value" stroke="#3b82f6" strokeWidth={3} fill="url(#colorVol)" />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
