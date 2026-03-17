import { Button } from '@/components/ui/button'
import { Download } from 'lucide-react'

interface AnalyticsHeaderProps {
    onExport: () => void
}

export function AnalyticsHeader({ onExport }: AnalyticsHeaderProps) {
    return (
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
                <h1 className="text-3xl font-bold tracking-tight text-slate-900">Advanced Analytics</h1>
                <p className="text-slate-500 text-sm mt-1">Intelligence, Economics, and Operational depth for FlowCore.</p>
            </div>
            <div className="flex items-center gap-3">
                <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-lg p-1 shadow-sm">
                    <Button variant="ghost" size="sm" className="h-8 text-xs font-medium bg-slate-100">7 Days</Button>
                    <Button variant="ghost" size="sm" className="h-8 text-xs font-medium">30 Days</Button>
                </div>
                <Button 
                    variant="outline" 
                    size="sm" 
                    className="h-10 border-slate-200 shadow-sm bg-white"
                    onClick={onExport}
                >
                    <Download className="h-4 w-4 mr-2" />
                    Export Data
                </Button>
            </div>
        </div>
    )
}
