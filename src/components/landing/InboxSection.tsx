import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { MessageSquare, ArrowRight, Bot } from 'lucide-react'
import { containerVariants, itemVariants } from '@/components/landing/animations'

export function InboxSection() {
    return (
        <motion.section 
            className="py-24 bg-slate-50/50 relative overflow-hidden"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={containerVariants}
        >
            <div className="container mx-auto px-6">
                <div className="max-w-6xl mx-auto grid lg:grid-cols-2 gap-16 items-center">
                    <motion.div className="relative" variants={itemVariants}>
                            <div className="absolute -inset-4 bg-blue-100/20 rounded-[40px] blur-3xl opacity-60" />
                            <div className="relative rounded-[32px] border border-slate-200 bg-white shadow-2xl overflow-hidden premium-shadow">
                                <div className="h-10 border-b border-slate-50 flex items-center px-6 bg-slate-50/30">
                                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Flowcore Inbox</span>
                                </div>
                                <div className="p-8 space-y-6">
                                    <div className="flex gap-3">
                                        <div className="w-8 h-8 rounded-full bg-slate-100 flex-none" />
                                        <div className="bg-slate-50 rounded-2xl rounded-tl-none p-4 text-xs text-slate-600 border border-slate-100">
                                            Need help with tracking...
                                        </div>
                                    </div>
                                    <div className="ml-10 p-4 rounded-2xl border border-orange-100 bg-white shadow-sm flex items-center gap-3">
                                        <Bot className="h-4 w-4 text-primary" />
                                        <div>
                                            <p className="text-[10px] font-bold">AI Active</p>
                                            <p className="text-[10px] text-slate-400">Summarizing for teammate</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                    </motion.div>
                    <motion.div className="space-y-8" variants={itemVariants}>
                            <div className="inline-flex items-center gap-2 text-primary font-bold text-sm">
                            <MessageSquare className="h-4 w-4" />
                            Hybrid AI Inbox
                        </div>
                        <h2 className="text-4xl md:text-5xl font-bold tracking-tight text-slate-900 leading-tight">
                            Work alongside <br />
                            <span className="text-primary">human teammates.</span>
                        </h2>
                        <p className="text-lg text-slate-500 leading-relaxed max-w-lg">
                            Flowcore agents handle the repetitive grunt work, handing off complex cases to your team with full context summaries.
                        </p>
                        <div className="flex gap-4">
                            <Link to="/features/inbox">
                                <Button size="lg" variant="outline" className="rounded-full border-slate-200 h-14 px-8 font-medium">
                                    Learn about Handoffs <ArrowRight className="ml-2 h-4 w-4" />
                                </Button>
                            </Link>
                        </div>
                    </motion.div>
                </div>
            </div>
        </motion.section>
    )
}
