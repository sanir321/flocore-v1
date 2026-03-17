import { Cpu } from 'lucide-react'

export function OperationsView() {
    return (
        <div className="p-12 text-center border-2 border-dashed rounded-xl bg-white/50">
            <Cpu className="h-12 w-12 text-slate-200 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-slate-900">Operational Engineering Deep-Dive</h3>
            <p className="text-slate-500 max-w-sm mx-auto mt-2">Live tool execution analysis and infrastructure latency tracking. (Coming soon in v2.1)</p>
        </div>
    )
}
