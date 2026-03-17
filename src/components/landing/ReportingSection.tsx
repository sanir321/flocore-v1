import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Zap, ArrowRight, TrendingUp } from 'lucide-react'
import { containerVariants, itemVariants } from '@/components/landing/animations'

export function ReportingSection() {
    return (
        <motion.section 
            className="py-24 bg-white relative overflow-hidden"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={containerVariants}
        >
            <div className="container mx-auto px-6">
                <div className="max-w-6xl mx-auto grid lg:grid-cols-2 gap-16 items-center">
                    <motion.div className="space-y-8 order-2 lg:order-1" variants={itemVariants}>
                        <div className="inline-flex items-center gap-2 text-primary font-bold text-sm">
                            <Zap className="h-4 w-4" />
                            Reporting & Insights
                        </div>
                        <h2 className="text-4xl md:text-5xl font-bold tracking-tight text-slate-900">
                            Feel the <span className="text-primary">impact.</span>
                        </h2>
                        <p className="text-lg text-slate-500 leading-relaxed max-w-lg">
                            Real-time AI insights help you monitor, evaluate, and continuously optimize every conversation your agents have.
                        </p>
                        <div className="flex gap-4">
                            <Link to="/features/insights">
                                <Button size="lg" className="rounded-full bg-slate-900 border-0 h-14 px-8 font-medium">
                                    Explore Insights <ArrowRight className="ml-2 h-4 w-4" />
                                </Button>
                            </Link>
                        </div>
                    </motion.div>
                    <motion.div className="relative order-1 lg:order-2" variants={itemVariants}>
                            <div className="absolute -inset-4 bg-orange-100/20 rounded-[40px] blur-3xl opacity-60" />
                            <div className="relative rounded-[32px] border border-slate-200 bg-white shadow-2xl overflow-hidden premium-shadow">
                                <div className="h-10 border-b border-slate-50 flex items-center px-6 bg-slate-50/30">
                                    <div className="flex gap-1">
                                        <div className="w-2 h-2 rounded-full bg-slate-200" />
                                        <div className="w-2 h-2 rounded-full bg-slate-200" />
                                    </div>
                                </div>
                                <div className="p-8">
                                    <div className="flex items-end justify-between mb-8">
                                        <div>
                                            <div className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Automation Rate</div>
                                            <div className="text-4xl font-black text-slate-900 tracking-tighter">70.6%</div>
                                        </div>
                                        <div className="text-right">
                                            <div className="text-xs font-bold text-green-600 mb-1">+8.1%</div>
                                            <div className="w-20 h-8 rounded-md bg-green-50 border border-green-100 flex items-center justify-center">
                                                <TrendingUp className="h-4 w-4 text-green-600" />
                                            </div>
                                        </div>
                                    </div>
                                    <div className="space-y-3">
                                        <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                                            <div className="h-full bg-primary rounded-full" style={{ width: '70.6%' }} />
                                        </div>
                                        <div className="flex justify-between text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                                            <span>This Period</span>
                                            <span>Target: 85%</span>
                                        </div>
                                    </div>
                                    <div className="mt-8 pt-8 border-t border-slate-50">
                                        <div className="flex items-center gap-3 text-sm font-bold text-slate-700">
                                            <div className="w-2 h-2 rounded-full bg-primary" />
                                            Escalation Rate Down
                                        </div>
                                    </div>
                                </div>
                            </div>
                    </motion.div>
                </div>
            </div>
        </motion.section>
    )
}
