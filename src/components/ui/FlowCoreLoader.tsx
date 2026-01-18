import { cn } from "@/lib/utils"

interface FlowCoreLoaderProps {
    className?: string
    fullScreen?: boolean
}

export default function FlowCoreLoader({ className, fullScreen = false }: FlowCoreLoaderProps) {
    return (
        <div className={cn(
            "flex items-center justify-center bg-transparent select-none pointer-events-none",
            fullScreen ? "fixed inset-0 z-50 bg-white/80 backdrop-blur-sm" : "w-full h-full min-h-[300px]",
            className
        )}>
            <div className="relative flex flex-col items-center justify-center">
                <h1 className={cn(
                    "font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-br from-slate-200 to-slate-300 animate-pulse",
                    fullScreen ? "text-6xl md:text-8xl" : "text-4xl md:text-6xl"
                )}>
                    FlowCore AI
                </h1>
            </div>
        </div>
    )
}
