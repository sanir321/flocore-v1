import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Users, Bot, CheckCircle, Brain, Zap, ArrowRight } from 'lucide-react'
import { cn } from '@/lib/utils'
import { containerVariants, itemVariants } from '@/components/landing/animations'

const capabilityTabs = [
    {
        id: 'understanding',
        label: 'Contextual Engine',
        description: "Flowcore agents don't just match keywords. They understand the entire conversation history, customer intent, and sentiment to provide human-level responses.",
        icon: Brain
    },
    {
        id: 'decision',
        label: 'Autonomous Logic',
        description: 'Equipped with your business logic, agents can make independent decisions — approving refunds, scheduling appointments, or escalating complex issues.',
        icon: Zap
    },
    {
        id: 'action',
        label: 'Workflow Execution',
        description: 'Beyond conversation, agents trigger real workflows: updating CRMs, sending invoices, or managing bookings directly within your existing systems.',
        icon: ArrowRight
    }
]

export function BeyondChatbotsSection() {
    const [activeCapability, setActiveCapability] = useState('understanding')

    return (
        <motion.section 
            className="py-24 bg-white relative"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={containerVariants}
        >
            <div className="container mx-auto px-6 relative z-10">
                <motion.div className="mb-16" variants={itemVariants}>
                    <h2 className="text-4xl md:text-5xl font-bold mb-4 text-slate-900">
                        Beyond simple chatbots. <span className="text-primary">True AI Employees.</span>
                    </h2>
                </motion.div>

                <div className="grid lg:grid-cols-2 gap-12 max-w-6xl">
                    <motion.div className="space-y-4" variants={itemVariants}>
                        {capabilityTabs.map(tab => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveCapability(tab.id)}
                                className={cn(
                                    "w-full text-left p-6 rounded-2xl transition-all border-2",
                                    activeCapability === tab.id
                                        ? "bg-orange-50 border-orange-100 shadow-sm"
                                        : "bg-white border-transparent hover:bg-slate-50"
                                )}
                            >
                                <div className="flex items-start gap-5">
                                    <div className={cn(
                                        "w-12 h-12 rounded-xl flex items-center justify-center flex-none shadow-sm",
                                        activeCapability === tab.id ? "bg-white text-primary" : "bg-slate-100 text-slate-400"
                                    )}>
                                        <tab.icon className="h-6 w-6" />
                                    </div>
                                    <div>
                                        <h3 className={cn("text-lg font-bold mb-2", activeCapability === tab.id ? "text-slate-900" : "text-slate-500")}>
                                            {tab.label}
                                        </h3>
                                        <AnimatePresence mode="wait">
                                            {activeCapability === tab.id && (
                                                <motion.p 
                                                    initial={{ height: 0, opacity: 0 }}
                                                    animate={{ height: "auto", opacity: 1 }}
                                                    exit={{ height: 0, opacity: 0 }}
                                                    className="text-slate-600 leading-relaxed overflow-hidden"
                                                >
                                                    {tab.description}
                                                </motion.p>
                                            )}
                                        </AnimatePresence>
                                    </div>
                                </div>
                            </button>
                        ))}
                    </motion.div>

                    <motion.div className="bg-slate-50 rounded-3xl p-8 border border-slate-100" variants={itemVariants}>
                        <div className="flex gap-4">
                            <div className="w-10 h-10 rounded-full bg-white shadow-sm flex items-center justify-center flex-none">
                                <Users className="h-5 w-5 text-slate-400" />
                            </div>
                            <div className="bg-white border border-slate-100 rounded-2xl rounded-tl-none px-6 py-4 shadow-sm">
                                <p className="text-slate-700">Can I get a refund?</p>
                            </div>
                        </div>
                        <div className="my-6 ml-14">
                            <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-red-50 text-red-600 text-xs font-semibold rounded-full border border-red-100 mb-2">
                                <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
                                Sentiment: Frustrated
                            </div>
                            <div className="p-4 bg-white rounded-xl border border-slate-100 shadow-sm">
                                <div className="flex items-center gap-3 mb-2">
                                    <div className="w-6 h-6 rounded-full bg-green-100 flex items-center justify-center">
                                        <CheckCircle className="h-3 w-3 text-green-600" />
                                    </div>
                                    <span className="text-sm font-medium text-slate-700">Policy Verified</span>
                                </div>
                                <p className="text-xs text-slate-500 pl-9">Customer is eligible for full refund under standard terms.</p>
                            </div>
                        </div>
                        <div className="flex gap-4 justify-end">
                            <div className="bg-primary text-white rounded-2xl rounded-tr-none px-6 py-4 shadow-md shadow-primary/10">
                                I've processed your refund. You should see it in 3-5 business days.
                            </div>
                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-orange-400 flex items-center justify-center shadow-lg shadow-primary/20">
                                <Bot className="h-5 w-5 text-white" />
                            </div>
                        </div>
                    </motion.div>
                </div>
            </div>
        </motion.section>
    )
}
