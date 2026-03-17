import { Banknote } from 'lucide-react'

export function FinanceView() {
    return (
        <div className="p-12 text-center border-2 border-dashed rounded-xl bg-white/50">
            <Banknote className="h-12 w-12 text-slate-200 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-slate-900">Enterprise Economics View</h3>
            <p className="text-slate-500 max-w-sm mx-auto mt-2">Real-time token pricing models and per-customer ROI analytics. (Coming soon in v2.1)</p>
        </div>
    )
}
