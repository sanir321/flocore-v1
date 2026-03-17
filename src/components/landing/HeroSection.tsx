import { useState } from 'react'
import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Zap, ArrowRight, Bot } from 'lucide-react'
import { MetalRingCluster } from '@/components/ui/MetalRingCluster'
import { containerVariants, itemVariants } from '@/components/landing/animations'

export function HeroSection() {
    const [email, setEmail] = useState('')

    return (
        <section className="relative pt-24 md:pt-40 pb-24 overflow-hidden">
            <div className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-[40%] pointer-events-none opacity-40 hidden lg:block">
                <MetalRingCluster />
            </div>

            <motion.div 
                className="container relative z-10 mx-auto px-6 text-center"
                initial="hidden"
                animate="visible"
                variants={containerVariants}
            >
                <motion.div 
                    variants={itemVariants}
                    className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-orange-50 border border-orange-100 text-primary text-xs font-semibold uppercase tracking-wider mb-8"
                >
                    <Zap className="h-3 w-3" />
                    <span>AI Employees v2.0</span>
                </motion.div>

                <motion.h1 
                    variants={itemVariants}
                    className="text-5xl md:text-7xl font-bold tracking-tight mb-8 leading-[1.1] text-slate-900"
                >
                    AI employees for <br />
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-orange-600">customer operations</span>
                </motion.h1>

                <motion.p 
                    variants={itemVariants}
                    className="text-lg md:text-xl text-slate-500 max-w-3xl mx-auto mb-12 leading-relaxed"
                >
                    Flowcore deploys AI employees that handle customer conversations and execute
                    operational workflows — working alongside your human team.
                </motion.p>

                <motion.div variants={itemVariants} className="max-w-lg mx-auto mb-20">
                    <div className="flex items-center bg-white/60 backdrop-blur-md border border-slate-200 shadow-xl rounded-full p-1.5 focus-within:ring-2 focus-within:ring-primary/20 transition-all">
                        <Input
                            type="email"
                            placeholder="example@company.com"
                            className="border-0 bg-transparent text-slate-900 placeholder:text-slate-400 h-12 px-6 focus-visible:ring-0"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                        />
                        <Link to={`/signup?email=${encodeURIComponent(email)}`}>
                            <Button size="lg" className="h-12 px-6 rounded-full bg-primary hover:bg-primary/90 text-white font-semibold whitespace-nowrap shadow-lg shadow-primary/20 hover:-translate-y-0.5 active:translate-y-0 transition-transform">
                                See Flowcore in action <ArrowRight className="ml-2 h-4 w-4" />
                            </Button>
                        </Link>
                    </div>
                    <p className="text-xs text-slate-400 mt-3">No credit card required · Cancel anytime</p>
                </motion.div>

                <motion.div 
                    variants={itemVariants}
                    className="relative max-w-5xl mx-auto"
                >
                    <div className="absolute -inset-1 bg-gradient-to-b from-slate-200/50 to-transparent rounded-[32px] blur-xl opacity-50" />
                    <div className="relative rounded-[32px] border border-slate-200 bg-white shadow-2xl overflow-hidden p-1">
                        <div className="rounded-[28px] border border-slate-100 bg-white overflow-hidden shadow-inner flex flex-col">
                            <div className="h-10 border-b border-slate-100 flex items-center px-4 gap-2 bg-slate-50/50">
                                <div className="flex gap-1.5">
                                    <div className="w-2.5 h-2.5 rounded-full bg-slate-300" />
                                    <div className="w-2.5 h-2.5 rounded-full bg-slate-300" />
                                    <div className="w-2.5 h-2.5 rounded-full bg-slate-300" />
                                </div>
                            </div>
                            <div className="p-6 grid grid-cols-12 gap-6 min-h-[400px] text-left">
                                <div className="hidden md:block md:col-span-3 border-r border-slate-100 pr-4">
                                    <div className="flex items-center gap-2 mb-6">
                                        <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                                        <span className="text-green-600 text-[10px] font-bold uppercase tracking-wider">System Online</span>
                                    </div>
                                    <div className="space-y-1">
                                        <div className="px-3 py-2 bg-orange-50 text-orange-700 rounded-lg text-xs font-bold">Inbox</div>
                                        <div className="px-3 py-2 text-slate-400 hover:bg-slate-50 rounded-lg text-xs font-medium">Contacts</div>
                                        <div className="px-3 py-2 text-slate-400 hover:bg-slate-50 rounded-lg text-xs font-medium">Analytics</div>
                                    </div>
                                    <div className="mt-8 p-4 bg-slate-50 rounded-2xl border border-slate-100 shadow-inner">
                                        <p className="text-[10px] uppercase font-bold text-slate-400 mb-1 tracking-wider">Workload</p>
                                        <p className="text-2xl font-black text-slate-900 tracking-tight">23</p>
                                    </div>
                                </div>
                                <div className="col-span-12 md:col-span-9 flex flex-col">
                                    <div className="flex-1 space-y-6">
                                        <div className="flex gap-4">
                                            <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 text-xs font-bold flex-none">JD</div>
                                            <div className="bg-slate-50 rounded-[20px] rounded-tl-none px-5 py-3.5 max-w-[85%] md:max-w-[70%] text-sm text-slate-700 shadow-sm border border-slate-100">
                                                I still haven't received my refund from last week...
                                            </div>
                                        </div>
                                        <div className="ml-12 bg-white border border-orange-100 shadow-sm rounded-xl p-3 max-w-[85%] md:max-w-[60%] flex items-center gap-3">
                                            <div className="w-1.5 h-1.5 rounded-full bg-orange-500 flex-none" />
                                            <div>
                                                <p className="text-[10px] font-bold text-slate-900 uppercase tracking-tighter">Checking Policy</p>
                                                <p className="text-[10px] text-slate-500 font-medium">Order #4521 eligible</p>
                                            </div>
                                        </div>
                                        <div className="flex gap-4 justify-end">
                                            <div className="bg-primary text-white rounded-[20px] rounded-tr-none px-5 py-3.5 max-w-[85%] md:max-w-[70%] text-sm shadow-xl shadow-primary/20">
                                                I've processed your refund of $49.99. You'll see it in 3-5 business days. Is there anything else I can help with?
                                            </div>
                                            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-orange-400 flex items-center justify-center shadow-lg shadow-primary/20 flex-none">
                                                <Bot className="h-4 w-4 text-white" />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </motion.div>
            </motion.div>
        </section>
    )
}
