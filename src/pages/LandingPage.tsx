import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import {
    MessageSquare,
    Calendar,
    FileText,
    Users,
    Clock,
    Shield,
    Lock,
    Key,
    Building2,
    Home,
    Briefcase,
    HeadphonesIcon,
    Truck,
    CreditCard,
    CheckCircle
} from 'lucide-react'
import { LandingNavbar } from '@/components/landing/LandingNavbar'
import { LandingFooter } from '@/components/landing/LandingFooter'
import { HeroSection } from '@/components/landing/HeroSection'
import { ReportingSection } from '@/components/landing/ReportingSection'
import { InboxSection } from '@/components/landing/InboxSection'
import { BeyondChatbotsSection } from '@/components/landing/BeyondChatbotsSection'
import { containerVariants, itemVariants } from '@/components/landing/animations'

// Feature cards
const featureCards = [
    { icon: MessageSquare, title: 'Respond across channels', description: 'Handle inquiries on WhatsApp, Email, Voice, SMS, & Webchat.' },
    { icon: Users, title: 'Qualify & Collect', description: 'Engage leads, gather requirements, and qualify potential customers.' },
    { icon: Calendar, title: 'Book & Update', description: 'Handle appointments, updates, and cancellations automatically.' },
    { icon: FileText, title: 'Follow SOPs', description: 'Adhere to complex business rules and standard operating procedures.' },
    { icon: HeadphonesIcon, title: 'Escalate with Context', description: 'Handoff to humans with full conversation history and internal notes.' },
    { icon: Clock, title: '24/7 Operations', description: 'Run continuous operations without increasing headcount.' }
]

// Industries
const industries = [
    { icon: Home, name: 'Hospitality', description: 'Handle guest communication, bookings, and inquiries 24/7.' },
    { icon: Building2, name: 'Real Estate', description: 'Qualify leads and schedule viewings instantly.' },
    { icon: CreditCard, name: 'Financial Services', description: 'Manage repetitive support queries and document collection.' },
    { icon: Briefcase, name: 'Operations', description: 'Automate inbound work and reduce operational overload.' },
    { icon: HeadphonesIcon, name: 'Customer Support', description: 'Scale response capacity without hiring more agents.' },
    { icon: Truck, name: 'Logistics', description: 'Coordinate deliveries and track shipments automatically.' }
]

// Stats
const stats = [
    { value: '70%', label: 'Reduction in support costs' },
    { value: '24/7', label: 'Instant availability' },
    { value: '3x', label: 'Increase in lead qualification' },
    { value: '<1s', label: 'Average response time' }
]

export default function LandingPage() {
    return (
        <div className="min-h-screen bg-slate-50 text-slate-900 selection:bg-orange-100 overflow-x-hidden font-sans">
            {/* Background Pastel Blobs */}
            <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
                <div className="absolute inset-0 bg-grid-flowcore opacity-[0.03]" />
                <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-orange-100/40 rounded-full blur-[120px] -translate-y-1/2 translate-x-1/2" />
                <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-blue-100/40 rounded-full blur-[100px] translate-y-1/2 -translate-x-1/2" />
            </div>

            <LandingNavbar />
            <HeroSection />
            <ReportingSection />
            <InboxSection />
            <BeyondChatbotsSection />

            {/* ===== REAL WORK (Pastel) ===== */}
            <motion.section 
                className="py-24 bg-slate-50 text-slate-900"
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, margin: "-100px" }}
                variants={containerVariants}
            >
                <div className="container mx-auto px-6">
                    <motion.div className="text-center mb-16" variants={itemVariants}>
                        <h2 className="text-4xl md:text-5xl font-bold mb-4">
                            Real work, <span className="text-primary">not conversation demos.</span>
                        </h2>
                        <p className="text-lg text-slate-500 max-w-2xl mx-auto">
                            Flowcore AI employees understand context, follow rules, and take action.
                        </p>
                    </motion.div>

                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
                        {featureCards.map((card, i) => (
                            <motion.div 
                                key={i} 
                                variants={itemVariants}
                                whileHover={{ y: -8, transition: { duration: 0.2 } }}
                                className="p-8 rounded-2xl bg-white border border-slate-100 shadow-sm hover:shadow-xl hover:shadow-slate-200/50 hover:border-slate-200 transition-all"
                            >
                                <div className="w-14 h-14 rounded-xl bg-orange-50 flex items-center justify-center text-primary mb-6">
                                    <card.icon className="h-7 w-7" />
                                </div>
                                <h3 className="text-xl font-bold text-slate-900 mb-3">{card.title}</h3>
                                <p className="text-slate-500 leading-relaxed">{card.description}</p>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </motion.section>

            {/* ===== PRODUCTION READY (White) ===== */}
            <motion.section 
                className="py-24 bg-white border-y border-slate-100"
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, margin: "-100px" }}
                variants={containerVariants}
            >
                <div className="container mx-auto px-6">
                    <div className="grid lg:grid-cols-2 gap-16 items-center max-w-6xl mx-auto">
                        <motion.div variants={itemVariants}>
                            <h2 className="text-4xl md:text-5xl font-bold mb-6 text-slate-900">
                                Production-Ready <span className="text-primary">Day One.</span>
                            </h2>
                            <p className="text-lg text-slate-500 mb-8">Deploy in minutes, not months.</p>

                            <div className="space-y-8">
                                {[
                                    { step: '01', title: 'Connect', desc: 'Link your communication channels and internal tools in one click.' },
                                    { step: '02', title: 'Configure', desc: 'Define business rules, upload knowledge bases, set permissions. No coding required.' },
                                    { step: '03', title: 'Deploy', desc: 'Launch your AI employees. Monitor performance in real-time.' }
                                ].map((item, i) => (
                                    <div key={i} className="flex gap-6">
                                        <div className="text-3xl font-bold text-primary/20">{item.step}</div>
                                        <div>
                                            <h3 className="text-lg font-bold text-slate-900 mb-2">{item.title}</h3>
                                            <p className="text-slate-500">{item.desc}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </motion.div>

                        <motion.div className="bg-slate-50 border border-slate-100 rounded-3xl p-8" variants={itemVariants}>
                            <div className="space-y-5">
                                {[
                                    'No Hallucinations — Grounded responses only',
                                    'Role-Based Access Control',
                                    'Complete Audit Logs',
                                    'SSO Integration'
                                ].map((item, i) => (
                                    <div key={i} className="flex items-center gap-4">
                                        <CheckCircle className="h-6 w-6 text-primary flex-none" />
                                        <span className="text-lg text-slate-700 font-medium">{item}</span>
                                    </div>
                                ))}
                            </div>
                            <div className="mt-8 pt-8 border-t border-slate-200 text-center">
                                <p className="text-4xl font-extrabold text-primary mb-1">99.9%</p>
                                <p className="text-sm font-semibold text-slate-400 uppercase tracking-wide">Uptime SLA</p>
                            </div>
                        </motion.div>
                    </div>
                </div>
            </motion.section>

            {/* ===== INDUSTRIES (Pastel) ===== */}
            <motion.section 
                className="py-24 bg-slate-50"
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, margin: "-100px" }}
                variants={containerVariants}
            >
                <div className="container mx-auto px-6">
                    <motion.div className="text-center mb-16" variants={itemVariants}>
                        <h2 className="text-4xl md:text-5xl font-bold text-slate-900">
                            Built for your <span className="text-primary">industry.</span>
                        </h2>
                    </motion.div>

                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
                        {industries.map((industry, i) => (
                            <motion.div 
                                key={i} 
                                variants={itemVariants}
                                whileHover={{ y: -8, transition: { duration: 0.2 } }}
                                className="p-8 rounded-2xl bg-white border border-slate-100 shadow-sm hover:shadow-lg hover:shadow-slate-200/50 transition-all cursor-pointer group"
                            >
                                <div className="w-14 h-14 rounded-xl bg-slate-50 group-hover:bg-orange-50 flex items-center justify-center text-slate-400 group-hover:text-primary mb-6 transition-colors">
                                    <industry.icon className="h-7 w-7" />
                                </div>
                                <h3 className="text-xl font-bold text-slate-900 mb-3">{industry.name}</h3>
                                <p className="text-slate-500 leading-relaxed">{industry.description}</p>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </motion.section>

            {/* ===== STATS (White) ===== */}
            <motion.section 
                className="py-20 bg-white border-y border-slate-100"
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, margin: "-100px" }}
                variants={containerVariants}
            >
                <div className="container mx-auto px-6">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-12 max-w-5xl mx-auto text-center">
                        {stats.map((stat, i) => (
                            <motion.div key={i} variants={itemVariants}>
                                <div className="text-5xl md:text-6xl font-extrabold text-primary mb-3 tracking-tight">{stat.value}</div>
                                <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">{stat.label}</p>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </motion.section>

            {/* ===== SECURITY (Pastel) ===== */}
            <motion.section 
                className="py-24 bg-slate-50"
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, margin: "-100px" }}
                variants={containerVariants}
            >
                <div className="container mx-auto px-6 text-center">
                    <motion.p variants={itemVariants} className="text-xs font-bold text-primary uppercase tracking-widest mb-4">Trust & Safety</motion.p>
                    <motion.h2 variants={itemVariants} className="text-4xl font-bold mb-16 text-slate-900">Enterprise-Grade Security</motion.h2>
                    <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
                        {[
                            { icon: Shield, title: 'SOC 2 Type II', sub: 'Certified & Audited' },
                            { icon: Lock, title: 'E2E Encryption', sub: 'AES-256 / TLS 1.3' },
                            { icon: Key, title: 'RBAC', sub: 'Granular Controls' }
                        ].map((item, i) => (
                            <motion.div 
                                key={i} 
                                variants={itemVariants}
                                whileHover={{ y: -5, transition: { duration: 0.2 } }}
                                className="p-10 bg-white rounded-3xl border border-slate-100 shadow-sm flex flex-col items-center hover:shadow-md transition-shadow"
                            >
                                <div className="w-12 h-12 rounded-2xl bg-slate-50 flex items-center justify-center text-slate-900 mb-6">
                                    <item.icon className="h-6 w-6" strokeWidth={1.5} />
                                </div>
                                <h3 className="text-xl font-bold text-slate-900 mb-2">{item.title}</h3>
                                <p className="text-slate-500 text-sm">{item.sub}</p>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </motion.section>

            {/* ===== FINAL CTA (White) ===== */}
            <motion.section 
                className="py-32 bg-white relative overflow-hidden"
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                variants={containerVariants}
            >
                <div className="absolute inset-0 overflow-hidden pointer-events-none">
                    <motion.div 
                        initial={{ opacity: 0 }}
                        whileInView={{ opacity: 0.5 }}
                        transition={{ duration: 2 }}
                        className="absolute top-0 left-1/4 w-[800px] h-[800px] bg-orange-50/50 rounded-full blur-[120px]" 
                    />
                    <motion.div 
                        initial={{ opacity: 0 }}
                        whileInView={{ opacity: 0.5 }}
                        transition={{ duration: 2, delay: 0.5 }}
                        className="absolute bottom-0 right-1/4 w-[800px] h-[800px] bg-blue-50/50 rounded-full blur-[120px]" 
                    />
                </div>
                <div className="container mx-auto px-6 text-center relative z-10">
                    <motion.h2 
                        variants={itemVariants}
                        className="text-5xl md:text-6xl font-bold mb-10 text-slate-900 tracking-tight"
                    >
                        Bring AI employees into <br className="hidden md:block" />
                        your operations <span className="text-primary">today.</span>
                    </motion.h2>
                    <motion.div variants={itemVariants} className="flex flex-col md:flex-row gap-4 justify-center items-center">
                        <Link to="/signup">
                            <Button size="lg" className="h-16 px-10 rounded-full bg-primary hover:bg-primary/90 text-white font-bold text-lg shadow-xl shadow-primary/20 hover:scale-105 active:scale-95 transition-all">
                                Get Started Now
                            </Button>
                        </Link>
                        <Link to="/contact">
                            <Button size="lg" variant="outline" className="h-16 px-10 rounded-full border-slate-200 text-slate-900 font-bold text-lg hover:bg-slate-50 transition-all">
                                Contact Sales
                            </Button>
                        </Link>
                    </motion.div>
                </div>
            </motion.section>

            <LandingFooter />
        </div>
    )
}
