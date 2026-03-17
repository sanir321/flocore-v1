import { Outlet, Navigate } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import { motion } from 'framer-motion'
import { MetalRingCluster } from '@/components/ui/MetalRingCluster'

export default function AuthLayout() {
    const { session, loading } = useAuth()

    if (loading) {
        return <div className="flex h-screen items-center justify-center">Loading...</div>
    }

    if (session) {
        return <Navigate to="/inbox" replace />
    }

    return (
        <div className="min-h-screen w-full lg:grid lg:grid-cols-2 bg-[#0A0A0A] text-white">
            {/* Left: Form Area */}
            <div className="flex flex-col justify-center px-8 lg:px-12 py-12 relative">
                {/* Mobile Background Effect */}
                <div className="absolute inset-0 bg-zinc-900/50 lg:hidden -z-10" />

                <div className="mx-auto w-full max-w-[400px]">
                    <div className="mb-12">
                        <span className="text-2xl font-bold tracking-tight text-white/90">flowcore</span>
                        <p className="text-sm text-zinc-500 mt-2">AI employees for your business</p>
                    </div>
                    <Outlet />
                </div>
            </div>

            {/* Right: Visual Area (Meta Style) */}
            <div className="hidden lg:block relative overflow-hidden bg-zinc-950 border-l border-white/5">
                {/* Metallic Gradient Mesh */}
                <div className="absolute inset-0 bg-[#0A0A0A]">
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-zinc-800/40 via-zinc-950/20 to-transparent opacity-60" />
                    <div className="absolute inset-0 bg-[linear-gradient(to_bottom_right,_var(--tw-gradient-stops))] from-zinc-900/30 via-transparent to-transparent" />
                </div>

                {/* Animated Metal Ring Cluster */}
                <div className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-[35%] pointer-events-none">
                    <MetalRingCluster />
                </div>

                {/* Text Content */}
                <div className="absolute bottom-12 left-12 z-10 p-6 max-w-md">
                    <motion.p 
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8, delay: 0.5 }}
                        className="text-2xl font-light tracking-wide text-white/90 mb-2"
                    >
                        Automate your workforce.
                    </motion.p>
                    <motion.p 
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8, delay: 0.7 }}
                        className="text-zinc-500"
                    >
                        Deploy AI agents that work 24/7.
                    </motion.p>
                </div>
            </div>
        </div>
    )
}

