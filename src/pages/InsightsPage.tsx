import { useState } from 'react'
import { useWorkspace } from '@/hooks/queries/useWorkspace'
import { useAnalytics } from '@/hooks/queries/useAnalytics'
import { useInsightsData } from '@/hooks/queries/useInsights'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Brain, Cpu, Banknote, ShieldAlert } from 'lucide-react'
import FlowCoreLoader from '@/components/ui/FlowCoreLoader'
import { AnalyticsHeader } from '@/components/insights/AnalyticsHeader'
import { IntelligenceView } from '@/components/insights/IntelligenceView'
import { OperationsView } from '@/components/insights/OperationsView'
import { FinanceView } from '@/components/insights/FinanceView'
import { EscalationsView } from '@/components/insights/EscalationsView'

export default function InsightsPage() {
    const { data: workspace } = useWorkspace()
    const workspaceId = workspace?.id
    const [days] = useState(7)
    
    const { data: stats, isLoading: isStatsLoading } = useAnalytics(workspaceId, days)
    const { data: insights, isLoading: isInsightsLoading } = useInsightsData(workspaceId, `${days}d`)

    const isLoading = isStatsLoading || isInsightsLoading

    if (isLoading) return <FlowCoreLoader fullScreen={false} />
    if (!stats || !insights) return <FlowCoreLoader fullScreen={false} />

    const handleExport = () => {
        // Implement export logic or trigger toast
        console.log("Exporting data...")
    }

    return (
        <div className="flex flex-col h-full bg-slate-50/50 overflow-y-auto">
            <div className="px-4 md:px-8 py-6 max-w-[1600px] mx-auto w-full space-y-6">
                
                <AnalyticsHeader onExport={handleExport} />

                <Tabs defaultValue="intelligence" className="space-y-6">
                    <TabsList className="bg-white/50 border border-slate-200 w-full justify-start h-auto p-1.5 space-x-2 rounded-xl backdrop-blur-sm">
                        <TabsTrigger value="intelligence" className="rounded-lg px-4 py-2 data-[state=active]:bg-white data-[state=active]:shadow-sm">
                            <Brain className="h-4 w-4 mr-2 text-indigo-500" />
                            Intelligence
                        </TabsTrigger>
                        <TabsTrigger value="operations" className="rounded-lg px-4 py-2 data-[state=active]:bg-white data-[state=active]:shadow-sm">
                            <Cpu className="h-4 w-4 mr-2 text-cyan-500" />
                            Operations
                        </TabsTrigger>
                        <TabsTrigger value="finance" className="rounded-lg px-4 py-2 data-[state=active]:bg-white data-[state=active]:shadow-sm">
                            <Banknote className="h-4 w-4 mr-2 text-emerald-500" />
                            Finance
                        </TabsTrigger>
                        <TabsTrigger value="escalations" className="rounded-lg px-4 py-2 data-[state=active]:bg-white data-[state=active]:shadow-sm">
                            <ShieldAlert className="h-4 w-4 mr-2 text-rose-500" />
                            Escalations
                        </TabsTrigger>
                    </TabsList>

                    <TabsContent value="intelligence">
                        <IntelligenceView stats={stats} />
                    </TabsContent>

                    <TabsContent value="operations">
                        <OperationsView />
                    </TabsContent>

                    <TabsContent value="finance">
                        <FinanceView />
                    </TabsContent>

                    <TabsContent value="escalations">
                        <EscalationsView stats={stats} />
                    </TabsContent>
                </Tabs>
            </div>
        </div>
    )
}
