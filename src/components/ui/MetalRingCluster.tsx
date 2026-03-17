import { motion } from 'framer-motion'

export function MetalRingCluster() {
    return (
        <div className="relative w-[1000px] h-[1000px]">
            {/* Outer Orbital Ring */}
            <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 60, repeat: Infinity, ease: "linear" }}
                className="absolute inset-0 rounded-full border-[1px] border-white/5 flex items-center justify-center"
            >
                <div className="w-[850px] h-[850px] rounded-full border border-white/10" />
            </motion.div>

            {/* Main Thick Metal Ring */}
            <motion.div
                animate={{ rotate: -360 }}
                transition={{ duration: 80, repeat: Infinity, ease: "linear" }}
                className="absolute inset-[100px] rounded-full"
            >
                {/* The "Deep" Metal Effect */}
                <div className="absolute inset-0 rounded-full border-[60px] border-zinc-900/40 blur-3xl" />
                <div className="absolute inset-0 rounded-full border-[20px] border-zinc-800/50" />
                <div className="absolute inset-0 rounded-full border-[2px] border-white/10 shadow-[0_0_100px_rgba(255,255,255,0.05)]" />
                
                {/* Floating nodes on the ring */}
                <div className="absolute top-1/2 left-0 -translate-x-1/2 -translate-y-1/2 w-4 h-4 bg-orange-500 shadow-[0_0_15px_rgba(249,115,22,0.5)] rounded-full" />
                <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 w-3 h-3 bg-zinc-400 rounded-full" />
            </motion.div>

            {/* Inner Secondary Ring with Wobble */}
            <motion.div
                animate={{ 
                    rotate: 360,
                    scale: [1, 1.02, 1],
                }}
                transition={{ 
                    rotate: { duration: 40, repeat: Infinity, ease: "linear" },
                    scale: { duration: 10, repeat: Infinity, ease: "easeInOut" }
                }}
                className="absolute inset-[250px] rounded-full border border-zinc-700/30"
            >
                <div className="absolute inset-0 rounded-full border-t border-white/20 opacity-40 rotate-[45deg]" />
            </motion.div>

            {/* Core Glow (Center of the sphere-like cluster) */}
            <motion.div 
                animate={{ 
                    opacity: [0.3, 0.5, 0.3],
                    scale: [1, 1.1, 1]
                }}
                transition={{ duration: 8, repeat: Infinity }}
                className="absolute inset-[400px] bg-orange-500/10 rounded-full blur-[80px]" 
            />
            
            {/* Fine Light Rays (pseudo structure) */}
            <div className="absolute inset-0 flex items-center justify-center opacity-20">
                <div className="w-[1200px] h-[1px] bg-gradient-to-r from-transparent via-white/20 to-transparent rotate-[30deg]" />
                <div className="w-[1200px] h-[1px] bg-gradient-to-r from-transparent via-white/10 to-transparent rotate-[120deg]" />
            </div>
        </div>
    )
}
