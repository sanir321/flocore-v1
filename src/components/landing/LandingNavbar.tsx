import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { ChevronDown, X, Menu } from 'lucide-react'
import { cn } from '@/lib/utils'

export function LandingNavbar() {
    const [scrolled, setScrolled] = useState(false)
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

    useEffect(() => {
        const handleScroll = () => setScrolled(window.scrollY > 20)
        window.addEventListener('scroll', handleScroll)
        return () => window.removeEventListener('scroll', handleScroll)
    }, [])

    return (
        <nav className={cn(
            "fixed top-0 w-full z-50 transition-all duration-300",
            scrolled ? "bg-white/80 backdrop-blur-md border-b border-slate-200/60" : "bg-transparent"
        )}>
            <div className="container mx-auto px-6 h-20 flex items-center justify-between">
                <Link to="/" className="text-xl font-bold tracking-tight text-slate-900">flowcore</Link>

                {/* Desktop Navigation */}
                <div className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-600">
                    <div className="relative group">
                        <button className="flex items-center gap-1 hover:text-slate-900 transition-colors py-2" aria-label="Open solutions menu">
                            Solutions <ChevronDown className="h-4 w-4 group-hover:rotate-180 transition-transform duration-200" />
                        </button>
                        <div className="absolute top-full left-0 w-64 pt-2 opacity-0 translate-y-2 pointer-events-none group-hover:opacity-100 group-hover:translate-y-0 group-hover:pointer-events-auto transition-all duration-200 ease-out">
                            <div className="bg-white rounded-2xl shadow-2xl border border-slate-100 p-3 space-y-1">
                                <Link to="/features/inbox" className="flex items-start gap-3 p-3 rounded-xl hover:bg-slate-50 transition-colors group/item">
                                    <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600 group-hover/item:bg-blue-600 group-hover/item:text-white transition-colors">
                                        <div className="font-bold text-xs">AI</div>
                                    </div>
                                    <div>
                                        <div className="font-bold text-slate-900">AI Unified Inbox</div>
                                        <div className="text-xs text-slate-500">Multichannel lead management</div>
                                    </div>
                                </Link>
                                <Link to="/features/insights" className="flex items-start gap-3 p-3 rounded-xl hover:bg-slate-50 transition-colors group/item">
                                    <div className="w-10 h-10 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-600 group-hover/item:bg-emerald-600 group-hover/item:text-white transition-colors">
                                        <div className="font-bold text-xs">IN</div>
                                    </div>
                                    <div>
                                        <div className="font-bold text-slate-900">Smart Insights</div>
                                        <div className="text-xs text-slate-500">Analytics & performance</div>
                                    </div>
                                </Link>
                            </div>
                        </div>
                    </div>

                    <Link to="/pricing" className="hover:text-slate-900 transition-colors py-2">Pricing</Link>
                    <Link to="/docs" className="hover:text-slate-900 transition-colors py-2">Support</Link>
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

                <button 
                    className="md:hidden p-2 text-slate-600" 
                    onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                    aria-label={mobileMenuOpen ? "Close menu" : "Open menu"}
                >
                    {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
                </button>
            </div>

            {mobileMenuOpen && (
                <div className="md:hidden bg-white/95 backdrop-blur-xl border-t border-slate-100 p-6 space-y-4 shadow-lg animate-in slide-in-from-top-2">
                    <div className="space-y-2 text-center pt-2">
                        <Link to="/features/inbox" className="block px-2 py-3 text-slate-900 font-semibold hover:bg-slate-50 rounded-xl" onClick={() => setMobileMenuOpen(false)}>Product</Link>
                        <Link to="/pricing" className="block px-2 py-3 text-slate-900 font-semibold hover:bg-slate-50 rounded-xl" onClick={() => setMobileMenuOpen(false)}>Pricing</Link>
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
    )
}
