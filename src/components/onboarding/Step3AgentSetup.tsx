import { useState, useEffect, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/hooks/useAuth'
import { supabase } from '@/lib/supabase'
import { useToast } from '@/hooks/use-toast'
import { useNavigate } from 'react-router-dom'
import { ChevronLeft, ChevronRight, Smartphone, Calendar, TrendingUp, Check } from 'lucide-react'
import { cn } from '@/lib/utils'

// --- Types ---
interface Step3Props {
    data: {
        name: string
        industry: string
        timezone: string
        support_enabled: boolean
        appointments_enabled: boolean
    }
}

// --- Data ---
const AGENT_TEMPLATES = [
    {
        id: 'support',
        title: 'Customer Support',
        description: 'Handle customer inquiries and provide basic support.',
        icon: Smartphone,
        role: 'Customer Support Specialist',
        goal: 'To resolve customer issues efficiently and maintain high satisfaction.'
    },
    {
        id: 'booking',
        title: 'Appointment Booker',
        description: 'Schedule appointments and manage bookings.',
        icon: Calendar,
        role: 'Booking Coordinator',
        goal: 'To seamlessly schedule appointments and manage calendar efficiency.'
    },
    {
        id: 'sales',
        title: 'Sales Representative',
        description: 'Qualify leads and recommend products.',
        icon: TrendingUp,
        role: 'Sales Representative',
        goal: 'To understand customer needs and recommend the best products to increase sales.'
    }
]

// --- Particle Animation Component ---
const ParticleSphere = () => {
    const canvasRef = useRef<HTMLCanvasElement>(null)

    useEffect(() => {
        const canvas = canvasRef.current
        if (!canvas) return
        const ctx = canvas.getContext('2d')
        if (!ctx) return

        let width = canvas.width = window.innerWidth
        let height = canvas.height = window.innerHeight

        // Particles
        const particles: { x: number; y: number; z: number; size: number }[] = []
        const count = 1500
        const radius = 300

        for (let i = 0; i < count; i++) {
            // Random point on sphere surface
            const theta = Math.random() * 2 * Math.PI
            const phi = Math.acos(2 * Math.random() - 1)
            const x = radius * Math.sin(phi) * Math.cos(theta)
            const y = radius * Math.sin(phi) * Math.sin(theta)
            const z = radius * Math.cos(phi)
            particles.push({ x, y, z, size: Math.random() * 1.5 })
        }

        let angleX = 0
        let angleY = 0
        let animationFrameId: number

        const animate = () => {
            if (!ctx) return
            ctx.clearRect(0, 0, width, height)

            angleX += 0.002
            angleY += 0.002

            const cx = width / 2
            const cy = height / 2

            // Sort particles by Z for depth
            particles.sort((a, b) => {
                // Rotate positions for sorting context
                const az = a.z * Math.cos(angleX) - a.x * Math.sin(angleX)
                const bz = b.z * Math.cos(angleX) - b.x * Math.sin(angleX)
                return (bz - az)
            })

            ctx.fillStyle = '#000000' // unused if we fill individual

            particles.forEach(p => {
                // Rotation
                // Rotate around Y
                let x1 = p.x * Math.cos(angleY) - p.z * Math.sin(angleY)
                let z1 = p.z * Math.cos(angleY) + p.x * Math.sin(angleY)

                // Rotate around X
                let y2 = p.y * Math.cos(angleX) - z1 * Math.sin(angleX)
                let z2 = z1 * Math.cos(angleX) + p.y * Math.sin(angleX)

                // Projection
                const scale = 400 / (400 + z2)
                const x2d = cx + x1 * scale
                const y2d = cy + y2 * scale

                // Draw
                const alpha = Math.max(0.1, (scale - 0.5)) // Fade back particles
                ctx.fillStyle = `rgba(100, 100, 100, ${alpha})`
                ctx.beginPath()
                ctx.arc(x2d, y2d, p.size * scale, 0, Math.PI * 2)
                ctx.fill()
            })

            animationFrameId = requestAnimationFrame(animate)
        }

        animate()

        const handleResize = () => {
            if (!canvas) return
            width = canvas.width = window.innerWidth
            height = canvas.height = window.innerHeight
        }

        window.addEventListener('resize', handleResize)
        return () => {
            window.removeEventListener('resize', handleResize)
            cancelAnimationFrame(animationFrameId)
        }

    }, [])

    return <canvas ref={canvasRef} className="fixed inset-0 z-0 pointer-events-none opacity-60" />
}

// --- Main Component ---
export default function Step3AgentSetup({ data }: Step3Props) {
    const { user } = useAuth()
    const { toast } = useToast()
    const navigate = useNavigate()
    const [loading, setLoading] = useState(false)
    const [currentIndex, setCurrentIndex] = useState(0)

    // View State: 'SELECTION' | 'SUCCESS' | 'READY'
    const [viewState, setViewState] = useState<'SELECTION' | 'SUCCESS' | 'READY'>('SELECTION')

    const handleNext = () => {
        setCurrentIndex((prev) => (prev + 1) % AGENT_TEMPLATES.length)
    }

    const handlePrev = () => {
        setCurrentIndex((prev) => (prev - 1 + AGENT_TEMPLATES.length) % AGENT_TEMPLATES.length)
    }

    const handleSelect = () => {
        setViewState('SUCCESS')
    }

    const handleContinue = async () => {
        setLoading(true)
        // Simulate provisioning delay then showing 'Ready'
        await createWorkspace()
    }

    const createWorkspace = async () => {
        if (!user) {
            toast({ title: "Error", description: "Not authenticated", variant: "destructive" })
            return
        }

        try {
            const selectedAgent = AGENT_TEMPLATES[currentIndex]
            const slug = data.name.toLowerCase().replace(/[^a-z0-9]/g, '-') + '-' + Math.random().toString(36).substring(7)

            // 1. Create Workspace
            const { data: workspace, error: wsError } = await supabase
                .from('workspaces')
                .insert({
                    name: data.name,
                    slug: slug,
                    owner_id: user.id,
                    industry: data.industry,
                    timezone: data.timezone
                })
                .select()
                .single()

            if (wsError) throw wsError

            // 2. Initialize resources
            const supportEnabled = selectedAgent.id === 'support' || data.support_enabled
            const appointmentsEnabled = selectedAgent.id === 'booking' || data.appointments_enabled

            // Cast to 'any' because strict types might be out of sync with RPC
            const { error: fnError } = await supabase.rpc('initialize_workspace' as any, {
                p_workspace_id: workspace.id,
                p_support_enabled: supportEnabled,
                p_appointments_enabled: appointmentsEnabled
            })

            if (fnError) throw fnError

            // 3. Customize Agent
            const { data: agents } = await supabase.from('agents').select('id').eq('workspace_id', workspace.id).limit(1)
            if (agents && agents.length > 0) {
                await supabase.from('agents').update({
                    name: selectedAgent.title.split(' ')[0],
                    role: selectedAgent.role,
                    system_prompt: `You are a ${selectedAgent.role}. Your goal is: ${selectedAgent.goal}`
                }).eq('id', agents[0].id)
            }

            toast({ title: "Success", description: "Agent created successfully!" })
            setViewState('READY')

        } catch (error: any) {
            toast({ title: "Error", description: error.message, variant: "destructive" })
            setViewState('SELECTION') // Reset on error
        } finally {
            setLoading(false)
        }
    }

    const selectedAgent = AGENT_TEMPLATES[currentIndex]

    // --- READY View ---
    if (viewState === 'READY') {
        return (
            <div className="fixed inset-0 bg-[#FAFAFA] dark:bg-black flex flex-col items-center justify-center overflow-hidden">
                <ParticleSphere />
                <div className="z-10 text-center space-y-8 animate-in fade-in zoom-in duration-1000">
                    <h1 className="text-4xl md:text-6xl font-light tracking-tight text-foreground bg-clip-text text-transparent bg-gradient-to-b from-white to-white/50">
                        Your workspace is ready
                    </h1>
                    <Button
                        onClick={() => navigate('/inbox')}
                        className="h-14 px-12 text-lg bg-white text-black hover:bg-zinc-200 transition-all hover:scale-105 rounded-full font-medium"
                    >
                        Start now
                    </Button>
                </div>
            </div>
        )
    }

    // --- SELECTION & SUCCESS Views ---
    return (
        <div className="flex flex-col items-center justify-center w-full min-h-[600px] text-center pt-8 overflow-hidden">

            {/* Header (Only on Selection) */}
            {viewState === 'SELECTION' && (
                <div className="flex flex-col md:flex-row w-full max-w-6xl mx-auto items-center justify-between mb-8 px-4 md:px-8 relative z-20">
                    <div className="text-center md:text-left space-y-4 max-w-sm mb-8 md:mb-0">
                        <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-white">
                            Your first agent
                        </h1>
                        <p className="text-lg text-zinc-500">
                            Chat agents handle automating your messaging.
                        </p>
                    </div>

                    {/* Carousel */}
                    <div className="relative w-full max-w-[320px] md:max-w-[600px] h-[450px] perspective-[1000px] mx-auto">

                        {/* Navigation Arrows */}
                        <button onClick={handlePrev} className="absolute -left-2 md:-left-12 top-1/2 -translate-y-1/2 z-30 w-10 h-10 md:w-12 md:h-12 rounded-full bg-[#1A1A1A]/80 border border-white/10 flex items-center justify-center text-white hover:bg-white/10 hover:scale-110 transition-all backdrop-blur-sm shadow-lg">
                            <ChevronLeft className="w-5 h-5 md:w-6 md:h-6" />
                        </button>
                        <button onClick={handleNext} className="absolute -right-2 md:-right-12 top-1/2 -translate-y-1/2 z-30 w-10 h-10 md:w-12 md:h-12 rounded-full bg-[#1A1A1A]/80 border border-white/10 flex items-center justify-center text-white hover:bg-white/10 hover:scale-110 transition-all backdrop-blur-sm shadow-lg">
                            <ChevronRight className="w-5 h-5 md:w-6 md:h-6" />
                        </button>

                        {/* Cards */}
                        {AGENT_TEMPLATES.map((agent, index) => {
                            let offset = index - currentIndex;
                            if (offset < -1) offset += AGENT_TEMPLATES.length;
                            if (offset > 1) offset -= AGENT_TEMPLATES.length;

                            const isActive = offset === 0;
                            const isLeft = offset === -1;
                            const isRight = offset === 1;

                            // Only render active, left, and right to keep DOM light
                            if (!isActive && !isLeft && !isRight) return null;

                            return (
                                <div
                                    key={agent.id}
                                    className={cn(
                                        "absolute top-0 left-0 right-0 bottom-0 m-auto transition-all duration-500 ease-out cursor-pointer",
                                        isActive
                                            ? "z-10 bg-[#151515] border-emerald-500/30 shadow-[0_0_40px_-5px_rgba(16,185,129,0.15)] scale-100"
                                            : "z-0 bg-[#0A0A0A] border-transparent opacity-30 grayscale blur-[1px] shadow-none",
                                        "w-[260px] md:w-[280px] h-[380px] md:h-[400px] rounded-2xl border flex flex-col items-center select-none overflow-hidden"
                                    )}
                                    style={{
                                        // Tweaked transform for better spacing and depth
                                        transform: `translateX(${offset * 120}%) scale(${isActive ? 1 : 0.85}) rotateY(${offset * -10}deg)`
                                    }}
                                    onClick={() => {
                                        if (isLeft) handlePrev();
                                        if (isRight) handleNext();
                                    }}
                                >
                                    {/* Matrix Header Pattern */}
                                    <div className="w-full h-32 bg-zinc-900/50 relative overflow-hidden flex items-center justify-center">
                                        <div className="absolute inset-0 opacity-20" style={{
                                            backgroundImage: 'radial-gradient(#0ea5e9 1px, transparent 1px)',
                                            backgroundSize: '8px 8px'
                                        }} />

                                        {/* Circle Icon Container */}
                                        <div className={cn(
                                            "w-16 h-16 rounded-full flex items-center justify-center relative z-10 mt-8 transition-all duration-500",
                                            isActive ? "bg-[#1A1A1A] border-2 border-emerald-500/20 shadow-[0_0_20px_rgba(16,185,129,0.3)]" : "bg-[#1A1A1A]/50 border border-white/10"
                                        )}>
                                            <agent.icon className={cn("w-6 h-6 transition-colors", isActive ? "text-emerald-500" : "text-zinc-500")} />
                                        </div>
                                    </div>

                                    <div className="p-6 pt-2 text-center flex-1 flex flex-col items-center">
                                        <h3 className={cn("text-lg font-bold mb-3 transition-colors", isActive ? "text-white" : "text-zinc-400")}>{agent.title}</h3>
                                        <p className="text-zinc-500 text-xs leading-relaxed">
                                            {agent.description}
                                        </p>

                                        {isActive && (
                                            <div className="mt-4 p-2 bg-emerald-500/10 rounded-full animate-in zoom-in spin-in-12 duration-500">
                                                <Check className="w-4 h-4 text-emerald-500" />
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )
                        })}

                        {/* Pagination Dots */}
                        <div className="absolute -bottom-6 left-0 right-0 flex justify-center gap-3">
                            {AGENT_TEMPLATES.map((_, i) => (
                                <div
                                    key={i}
                                    className={cn(
                                        "w-2 h-2 rounded-full transition-all duration-300",
                                        i === currentIndex ? "bg-emerald-500 scale-125 shadow-[0_0_10px_rgba(16,185,129,0.5)]" : "bg-zinc-800"
                                    )}
                                />
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {/* Selection Text/Button (Only on Selection) */}
            {viewState === 'SELECTION' && (
                <div className="fixed bottom-10 left-0 right-0 flex justify-center z-50 px-4">
                    <Button
                        onClick={handleSelect}
                        className="h-12 w-full max-w-[280px] text-base font-medium rounded-lg bg-[#CC5500] hover:bg-[#B34400] text-white shadow-lg transition-all hover:scale-105"
                    >
                        Select
                    </Button>
                </div>
            )}

            {/* SUCCESS View */}
            {viewState === 'SUCCESS' && (
                <div className="flex flex-col-reverse md:flex-row w-full max-w-6xl mx-auto items-center justify-between px-6 md:px-16 animate-in slide-in-from-right duration-500 gap-8 md:gap-0">
                    <div className="text-center md:text-left space-y-6 max-w-md">
                        <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-white mb-2">
                            Great choice!
                        </h1>
                        <p className="text-lg md:text-xl text-zinc-400">
                            We'll set up your <span className="text-white font-medium">{selectedAgent.title}</span> agent to get you started.
                        </p>

                        <Button
                            onClick={handleContinue}
                            disabled={loading}
                            className="h-14 w-full md:w-auto px-12 text-lg font-medium rounded-lg bg-[#CC5500] hover:bg-[#B34400] text-white shadow-lg transition-all mt-8"
                        >
                            {loading ? "Setting up..." : "Continue"}
                        </Button>
                    </div>

                    {/* Selected Card Preview */}
                    <div className="w-[260px] md:w-[280px] h-[380px] md:h-[400px] rounded-2xl border border-emerald-500/30 bg-[#151515] flex flex-col items-center select-none overflow-hidden shadow-[0_0_40px_-5px_rgba(16,185,129,0.15)] scale-100 mb-8 md:mb-0">
                        {/* Matrix Header Pattern */}
                        <div className="w-full h-32 bg-zinc-900/50 relative overflow-hidden flex items-center justify-center">
                            <div className="absolute inset-0 opacity-20" style={{
                                backgroundImage: 'radial-gradient(#0ea5e9 1px, transparent 1px)',
                                backgroundSize: '8px 8px'
                            }} />
                            <div className="w-16 h-16 rounded-full bg-[#1A1A1A] border-2 border-emerald-500/20 flex items-center justify-center shadow-[0_0_20px_rgba(16,185,129,0.3)] relative z-10 mt-8">
                                <selectedAgent.icon className="w-6 h-6 text-emerald-500" />
                            </div>
                        </div>

                        <div className="p-6 pt-2 text-center flex-1 flex flex-col items-center">
                            <h3 className="text-lg font-bold text-white mb-3">{selectedAgent.title}</h3>
                            <p className="text-zinc-500 text-xs leading-relaxed">
                                {selectedAgent.description}
                            </p>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
