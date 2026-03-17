export const SentimentTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
        return (
            <div className="bg-white p-3 border border-slate-200 rounded-xl shadow-xl animate-in fade-in zoom-in-95">
                <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">{label}</p>
                <div className="flex items-center gap-2">
                    <div className="h-2 w-2 rounded-full bg-indigo-500" />
                    <p className="text-sm font-bold text-slate-900">
                        {payload[0].value}% Score
                    </p>
                </div>
            </div>
        )
    }
    return null
}
