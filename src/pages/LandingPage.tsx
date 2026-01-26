import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
    ArrowRight,
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
    ChevronDown,
    X,
    Menu,
    Zap,
    Brain,
    Bot,
    CheckCircle
} from 'lucide-react'
import { cn } from '@/lib/utils'

// Feature tabs
const capabilityTabs = [
    {
        id: 'understanding',
        label: 'Contextual Understanding',
        description: "Flowcore agents don't just match keywords. They understand the entire conversation history, customer intent, and sentiment to provide human-level responses.",
        icon: Brain
    },
    {
        id: 'decision',
        label: 'Decision Making',
        description: 'Equipped with your business logic, agents can make independent decisions — approving refunds, scheduling appointments, or escalating complex issues.',
        icon: Zap
    },
    {
        id: 'action',
        label: 'Action Execution',
        description: 'Beyond conversation, agents trigger real workflows: updating CRMs, sending invoices, or managing bookings directly within your existing systems.',
        icon: ArrowRight
    }
]

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
    const [activeCapability, setActiveCapability] = useState('understanding')
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
    const [scrolled, setScrolled] = useState(false)
    const [email, setEmail] = useState('')


    useEffect(() => {
        const handleScroll = () => setScrolled(window.scrollY > 20)
        window.addEventListener('scroll', handleScroll)
        return () => window.removeEventListener('scroll', handleScroll)
    }, [])

    return (
        <div className="min-h-screen bg-slate-50 text-slate-900 selection:bg-orange-100 overflow-x-hidden font-sans">
            {/* Background Pastel Blobs */}
            <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
                <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-orange-100/40 rounded-full blur-[120px] -translate-y-1/2 translate-x-1/2" />
                <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-blue-100/40 rounded-full blur-[100px] translate-y-1/2 -translate-x-1/2" />
            </div>

            {/* ===== NAVBAR ===== */}
            <nav className={cn(
                "fixed top-0 w-full z-50 transition-all duration-300",
                scrolled ? "bg-white/80 backdrop-blur-md border-b border-slate-200/60" : "bg-transparent"
            )}>
                <div className="container mx-auto px-6 h-20 flex items-center justify-between">
                    <Link to="/" className="text-xl font-bold tracking-tight text-slate-900">flowcore</Link>

                    {/* Desktop Navigation */}
                    <div className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-600">
                        {/* Industries Dropdown */}
                        <div className="relative group">
                            <button className="flex items-center gap-1 hover:text-slate-900 transition-colors py-2">
                                Industries <ChevronDown className="h-4 w-4 group-hover:rotate-180 transition-transform duration-200" />
                            </button>
                            <div className="absolute top-full left-0 w-56 pt-2 opacity-0 translate-y-2 pointer-events-none group-hover:opacity-100 group-hover:translate-y-0 group-hover:pointer-events-auto transition-all duration-200 ease-out">
                                <div className="bg-white rounded-xl shadow-xl border border-slate-100 p-2 space-y-1">
                                    <a href="#" className="block px-3 py-2 rounded-lg hover:bg-slate-50 text-slate-700 hover:text-primary transition-colors">
                                        <div className="font-semibold">Hospitality</div>
                                        <div className="text-xs text-slate-400 font-normal">Guest management</div>
                                    </a>
                                    <a href="#" className="block px-3 py-2 rounded-lg hover:bg-slate-50 text-slate-700 hover:text-primary transition-colors">
                                        <div className="font-semibold">Real Estate</div>
                                        <div className="text-xs text-slate-400 font-normal">Lead qualification</div>
                                    </a>
                                    <a href="#" className="block px-3 py-2 rounded-lg hover:bg-slate-50 text-slate-700 hover:text-primary transition-colors">
                                        <div className="font-semibold">Finance</div>
                                        <div className="text-xs text-slate-400 font-normal">Support & Docs</div>
                                    </a>
                                    <a href="#" className="block px-3 py-2 rounded-lg hover:bg-slate-50 text-slate-700 hover:text-primary transition-colors">
                                        <div className="font-semibold">Logistics</div>
                                        <div className="text-xs text-slate-400 font-normal">Coordination</div>
                                    </a>
                                </div>
                            </div>
                        </div>

                        <a href="#" className="hover:text-slate-900 transition-colors">Customers</a>
                        <a href="#" className="hover:text-slate-900 transition-colors">Pricing</a>

                        {/* Resources Dropdown */}
                        <div className="relative group">
                            <button className="flex items-center gap-1 hover:text-slate-900 transition-colors py-2">
                                Resources <ChevronDown className="h-4 w-4 group-hover:rotate-180 transition-transform duration-200" />
                            </button>
                            <div className="absolute top-full left-0 w-56 pt-2 opacity-0 translate-y-2 pointer-events-none group-hover:opacity-100 group-hover:translate-y-0 group-hover:pointer-events-auto transition-all duration-200 ease-out">
                                <div className="bg-white rounded-xl shadow-xl border border-slate-100 p-2 space-y-1">
                                    <a href="#" className="block px-3 py-2 rounded-lg hover:bg-slate-50 text-slate-700 hover:text-primary transition-colors">Blog</a>
                                    <a href="#" className="block px-3 py-2 rounded-lg hover:bg-slate-50 text-slate-700 hover:text-primary transition-colors">Documentation</a>
                                    <a href="#" className="block px-3 py-2 rounded-lg hover:bg-slate-50 text-slate-700 hover:text-primary transition-colors">Community</a>
                                    <a href="#" className="block px-3 py-2 rounded-lg hover:bg-slate-50 text-slate-700 hover:text-primary transition-colors">Help Center</a>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Auth Buttons */}
                    <div className="hidden md:flex items-center gap-4">
                        <Link to="/login" className="text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors">
                            Sign In
                        </Link>
                        <Link to="/signup">
                            <Button className="h-10 px-6 bg-slate-900 text-white hover:bg-slate-800 border border-transparent font-medium rounded-full shadow-sm transition-all hover:scale-105 active:scale-95">
                                Get Started
                            </Button>
                        </Link>
                    </div>

                    <button className="md:hidden p-2 text-slate-600" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
                        {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
                    </button>
                </div>

                {mobileMenuOpen && (
                    <div className="md:hidden bg-white/95 backdrop-blur-xl border-t border-slate-100 p-6 space-y-4 shadow-lg animate-in slide-in-from-top-2">
                        <div className="space-y-2">
                            <div className="px-2 text-xs font-semibold text-slate-400 uppercase tracking-wider">Product</div>
                            <a href="#" className="block px-2 py-2 text-slate-900 font-medium hover:bg-slate-50 rounded-lg">Industries</a>
                            <a href="#" className="block px-2 py-2 text-slate-900 font-medium hover:bg-slate-50 rounded-lg">Customers</a>
                            <a href="#" className="block px-2 py-2 text-slate-900 font-medium hover:bg-slate-50 rounded-lg">Pricing</a>
                            <a href="#" className="block px-2 py-2 text-slate-900 font-medium hover:bg-slate-50 rounded-lg">Resources</a>
                        </div>
                        <div className="pt-4 border-t border-slate-100 flex flex-col gap-3">
                            <Link to="/login" className="block w-full text-center py-2.5 text-slate-600 font-medium hover:text-slate-900">Sign In</Link>
                            <Link to="/signup">
                                <Button className="w-full h-12 bg-primary hover:bg-primary/90 text-white font-semibold rounded-full shadow-lg shadow-primary/20">
                                    Get Started
                                </Button>
                            </Link>
                        </div>
                    </div>
                )}
            </nav>

            {/* ===== HERO SECTION ===== */}
            <section className="relative pt-24 md:pt-40 pb-24 overflow-hidden">
                <div className="container relative z-10 mx-auto px-6 text-center">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-orange-50 border border-orange-100 text-primary text-xs font-semibold uppercase tracking-wider mb-8">
                        <Zap className="h-3 w-3" />
                        <span>AI Employees v2.0</span>
                    </div>

                    <h1 className="text-5xl md:text-7xl font-bold tracking-tight mb-8 leading-[1.1] text-slate-900">
                        AI employees for <br />
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-orange-600">customer operations</span>
                    </h1>

                    <p className="text-lg md:text-xl text-slate-500 max-w-3xl mx-auto mb-12 leading-relaxed">
                        Flowcore deploys AI employees that handle customer conversations and execute
                        operational workflows — working alongside your human team.
                    </p>

                    {/* Email CTA */}
                    <div className="max-w-lg mx-auto mb-20">
                        <div className="flex items-center bg-white border border-slate-200 shadow-sm rounded-full p-1.5 focus-within:ring-2 focus-within:ring-primary/20 transition-shadow">
                            <Input
                                type="email"
                                placeholder="example@company.com"
                                className="border-0 bg-transparent text-slate-900 placeholder:text-slate-400 h-12 px-6 focus-visible:ring-0"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                            />
                            <Link to={`/signup?email=${encodeURIComponent(email)}`}>
                                <Button size="lg" className="h-12 px-6 rounded-full bg-primary hover:bg-primary/90 text-white font-semibold whitespace-nowrap shadow-md shadow-primary/20">
                                    See Flowcore in action <ArrowRight className="ml-2 h-4 w-4" />
                                </Button>
                            </Link>
                        </div>
                        <p className="text-xs text-slate-400 mt-3">No credit card required · Cancel anytime</p>
                    </div>

                    {/* Platform Preview (Light Mode Version) */}
                    <div className="relative max-w-5xl mx-auto">
                        <div className="absolute -inset-1 bg-gradient-to-b from-slate-200 to-transparent rounded-2xl blur-lg opacity-50" />
                        <div className="relative rounded-xl border border-slate-200 bg-white shadow-2xl overflow-hidden">
                            <div className="h-10 border-b border-slate-100 flex items-center px-4 gap-2 bg-slate-50/50">
                                <div className="flex gap-1.5">
                                    <div className="w-3 h-3 rounded-full bg-slate-300" />
                                    <div className="w-3 h-3 rounded-full bg-slate-300" />
                                    <div className="w-3 h-3 rounded-full bg-slate-300" />
                                </div>
                            </div>
                            <div className="p-6 grid grid-cols-12 gap-6 min-h-[400px] text-left">
                                {/* Sidebar - Hidden on mobile */}
                                <div className="hidden md:block md:col-span-3 border-r border-slate-100 pr-4">
                                    <div className="flex items-center gap-2 mb-6">
                                        <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                                        <span className="text-green-600 text-sm font-medium">System Online</span>
                                    </div>
                                    <div className="space-y-1">
                                        <div className="px-3 py-2 bg-orange-50 text-orange-700 rounded-lg text-sm font-medium">Inbox</div>
                                        <div className="px-3 py-2 text-slate-600 hover:bg-slate-50 rounded-lg text-sm font-medium">Contacts</div>
                                        <div className="px-3 py-2 text-slate-600 hover:bg-slate-50 rounded-lg text-sm font-medium">Analytics</div>
                                    </div>
                                    <div className="mt-8 p-4 bg-slate-50 rounded-xl border border-slate-100">
                                        <p className="text-xs text-slate-500 mb-1">Active Conversations</p>
                                        <p className="text-2xl font-bold text-slate-900">23</p>
                                    </div>
                                </div>
                                {/* Chat area - Full width on mobile */}
                                <div className="col-span-12 md:col-span-9 flex flex-col">
                                    <div className="flex-1 space-y-6">
                                        <div className="flex gap-4">
                                            <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 text-xs font-bold flex-none">JD</div>
                                            <div className="bg-slate-50 rounded-2xl rounded-tl-none px-5 py-4 max-w-[85%] md:max-w-[70%] text-sm text-slate-700">
                                                I still haven't received my refund from last week...
                                            </div>
                                        </div>
                                        <div className="ml-12 bg-white border border-orange-100 shadow-sm rounded-lg p-3 max-w-[85%] md:max-w-[60%] flex items-center gap-3">
                                            <div className="w-1.5 h-1.5 rounded-full bg-orange-500 flex-none" />
                                            <div>
                                                <p className="text-xs font-semibold text-slate-900">Checking Refund Policy</p>
                                                <p className="text-xs text-slate-500">Order #4521 matched</p>
                                            </div>
                                        </div>
                                        <div className="flex gap-4 justify-end">
                                            <div className="bg-primary text-white rounded-2xl rounded-tr-none px-5 py-4 max-w-[85%] md:max-w-[70%] text-sm shadow-md shadow-primary/10">
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
                </div>
            </section>

            {/* ===== BEYOND CHATBOTS (Pastel) ===== */}
            <section className="py-24 bg-white relative">
                <div className="container mx-auto px-6 relative z-10">
                    <div className="mb-16">
                        <h2 className="text-4xl md:text-5xl font-bold mb-4 text-slate-900">
                            Beyond simple chatbots. <span className="text-primary">True AI Employees.</span>
                        </h2>
                    </div>

                    <div className="grid lg:grid-cols-2 gap-12 max-w-6xl">
                        {/* Tabs */}
                        <div className="space-y-4">
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
                                            {activeCapability === tab.id && (
                                                <p className="text-slate-600 leading-relaxed">{tab.description}</p>
                                            )}
                                        </div>
                                    </div>
                                </button>
                            ))}
                        </div>

                        {/* Visual Card */}
                        <div className="bg-slate-50 rounded-3xl p-8 border border-slate-100">
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
                        </div>
                    </div>
                </div>
            </section>

            {/* ===== REAL WORK (Pastel) ===== */}
            <section className="py-24 bg-slate-50 text-slate-900">
                <div className="container mx-auto px-6">
                    <div className="text-center mb-16">
                        <h2 className="text-4xl md:text-5xl font-bold mb-4">
                            Real work, <span className="text-primary">not conversation demos.</span>
                        </h2>
                        <p className="text-lg text-slate-500 max-w-2xl mx-auto">
                            Flowcore AI employees understand context, follow rules, and take action.
                        </p>
                    </div>

                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
                        {featureCards.map((card, i) => (
                            <div key={i} className="p-8 rounded-2xl bg-white border border-slate-100 shadow-sm hover:shadow-xl hover:shadow-slate-200/50 hover:border-slate-200 hover:-translate-y-1 transition-all">
                                <div className="w-14 h-14 rounded-xl bg-orange-50 flex items-center justify-center text-primary mb-6">
                                    <card.icon className="h-7 w-7" />
                                </div>
                                <h3 className="text-xl font-bold text-slate-900 mb-3">{card.title}</h3>
                                <p className="text-slate-500 leading-relaxed">{card.description}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ===== PRODUCTION READY (White) ===== */}
            <section className="py-24 bg-white border-y border-slate-100">
                <div className="container mx-auto px-6">
                    <div className="grid lg:grid-cols-2 gap-16 items-center max-w-6xl mx-auto">
                        <div>
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
                        </div>

                        <div className="bg-slate-50 border border-slate-100 rounded-3xl p-8">
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
                        </div>
                    </div>
                </div>
            </section>

            {/* ===== INDUSTRIES (Pastel) ===== */}
            <section className="py-24 bg-slate-50">
                <div className="container mx-auto px-6">
                    <div className="text-center mb-16">
                        <h2 className="text-4xl md:text-5xl font-bold text-slate-900">
                            Built for your <span className="text-primary">industry.</span>
                        </h2>
                    </div>

                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
                        {industries.map((industry, i) => (
                            <div key={i} className="p-8 rounded-2xl bg-white border border-slate-100 shadow-sm hover:shadow-lg hover:shadow-slate-200/50 hover:-translate-y-1 transition-all cursor-pointer group">
                                <div className="w-14 h-14 rounded-xl bg-slate-50 group-hover:bg-orange-50 flex items-center justify-center text-slate-400 group-hover:text-primary mb-6 transition-colors">
                                    <industry.icon className="h-7 w-7" />
                                </div>
                                <h3 className="text-xl font-bold text-slate-900 mb-3">{industry.name}</h3>
                                <p className="text-slate-500 leading-relaxed">{industry.description}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ===== STATS (White) ===== */}
            <section className="py-20 bg-white border-y border-slate-100">
                <div className="container mx-auto px-6">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-12 max-w-5xl mx-auto text-center">
                        {stats.map((stat, i) => (
                            <div key={i}>
                                <div className="text-5xl md:text-6xl font-extrabold text-primary mb-3 tracking-tight">{stat.value}</div>
                                <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">{stat.label}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ===== SECURITY (Pastel) ===== */}
            <section className="py-24 bg-slate-50">
                <div className="container mx-auto px-6 text-center">
                    <p className="text-xs font-bold text-primary uppercase tracking-widest mb-4">Trust & Safety</p>
                    <h2 className="text-4xl font-bold mb-16 text-slate-900">Enterprise-Grade Security</h2>
                    <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
                        {[
                            { icon: Shield, title: 'SOC 2 Type II', sub: 'Certified & Audited' },
                            { icon: Lock, title: 'E2E Encryption', sub: 'AES-256 / TLS 1.3' },
                            { icon: Key, title: 'RBAC', sub: 'Granular Controls' }
                        ].map((item, i) => (
                            <div key={i} className="p-10 bg-white rounded-3xl border border-slate-100 shadow-sm flex flex-col items-center hover:shadow-md transition-shadow">
                                <div className="w-12 h-12 rounded-2xl bg-slate-50 flex items-center justify-center text-slate-900 mb-6">
                                    <item.icon className="h-6 w-6" strokeWidth={1.5} />
                                </div>
                                <h3 className="text-xl font-bold text-slate-900 mb-2">{item.title}</h3>
                                <p className="text-slate-500 text-sm">{item.sub}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ===== FINAL CTA (White) ===== */}
            <section className="py-32 bg-white relative overflow-hidden">
                <div className="absolute inset-0 overflow-hidden pointer-events-none">
                    <div className="absolute top-0 left-1/4 w-[800px] h-[800px] bg-orange-50/50 rounded-full blur-[120px]" />
                    <div className="absolute bottom-0 right-1/4 w-[800px] h-[800px] bg-blue-50/50 rounded-full blur-[120px]" />
                </div>
                <div className="container mx-auto px-6 text-center relative z-10">
                    <h2 className="text-5xl md:text-6xl font-bold mb-10 text-slate-900 tracking-tight">
                        Bring AI employees into your operations.
                    </h2>
                    <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
                        <Link to="/signup">
                            <Button size="lg" className="h-16 px-12 bg-primary hover:bg-primary/90 text-white text-lg font-bold rounded-full shadow-xl shadow-primary/25 hover:shadow-primary/40 transition-all hover:-translate-y-1">
                                Talk to Sales <ArrowRight className="ml-2 h-5 w-5" />
                            </Button>
                        </Link>
                        <Button size="lg" variant="outline" className="h-16 px-12 rounded-full border-slate-200 bg-white text-slate-700 hover:bg-slate-50 text-lg font-medium hover:text-slate-900">
                            Schedule a Demo
                        </Button>
                    </div>
                </div>
            </section>

            {/* ===== FOOTER (Light) ===== */}
            <footer className="bg-slate-50 border-t border-slate-200 pt-20 pb-10 text-slate-600">
                <div className="container mx-auto px-6">
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-12 mb-16">
                        <div className="col-span-2 md:col-span-1">
                            <span className="text-2xl font-bold text-slate-900">flowcore</span>
                            <p className="text-sm text-slate-500 mt-6 leading-relaxed">
                                Building the workforce of the future with AI employees that think, plan, and act.
                            </p>
                        </div>

                        <div>
                            <h4 className="font-bold text-slate-900 mb-6">Product</h4>
                            <ul className="space-y-3 text-sm">
                                <li><a href="#" className="hover:text-primary transition-colors">Agents</a></li>
                                <li><a href="#" className="hover:text-primary transition-colors">Workflows</a></li>
                                <li><a href="#" className="hover:text-primary transition-colors">Integrations</a></li>
                                <li><a href="#" className="hover:text-primary transition-colors">Security</a></li>
                            </ul>
                        </div>

                        <div>
                            <h4 className="font-bold text-slate-900 mb-6">Solutions</h4>
                            <ul className="space-y-3 text-sm">
                                <li><a href="#" className="hover:text-primary transition-colors">Support</a></li>
                                <li><a href="#" className="hover:text-primary transition-colors">Sales</a></li>
                                <li><a href="#" className="hover:text-primary transition-colors">Operations</a></li>
                            </ul>
                        </div>

                        <div>
                            <h4 className="font-bold text-slate-900 mb-6">Company</h4>
                            <ul className="space-y-3 text-sm">
                                <li><a href="#" className="hover:text-primary transition-colors">About</a></li>
                                <li><a href="#" className="hover:text-primary transition-colors">Blog</a></li>
                                <li><a href="#" className="hover:text-primary transition-colors">Careers</a></li>
                                <li><a href="#" className="hover:text-primary transition-colors">Contact</a></li>
                            </ul>
                        </div>

                        <div>
                            <h4 className="font-bold text-slate-900 mb-6">Legal</h4>
                            <ul className="space-y-3 text-sm">
                                <li><a href="#" className="hover:text-primary transition-colors">Privacy</a></li>
                                <li><a href="#" className="hover:text-primary transition-colors">Terms</a></li>
                            </ul>
                        </div>
                    </div>

                    <div className="pt-8 border-t border-slate-200 flex flex-col md:flex-row items-center justify-between gap-4">
                        <p className="text-sm text-slate-400">© 2026 Flowcore AI Inc.</p>
                        <div className="flex items-center gap-2 text-sm text-slate-500">
                            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                            Global Systems Operational
                        </div>
                    </div>
                </div>
            </footer>
        </div>
    )
}
