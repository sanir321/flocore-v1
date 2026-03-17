export function LandingFooter() {
    return (
        <footer className="bg-slate-50 border-t border-slate-200 pt-20 pb-10 text-slate-600">
            <div className="container mx-auto px-6">
                <div className="grid grid-cols-2 md:grid-cols-5 gap-12 mb-16">
                    <div className="col-span-2 md:col-span-1">
                        <span className="text-2xl font-bold text-slate-900">flowcore</span>
                        <p className="text-sm text-slate-500 mt-6 leading-relaxed">
                            Building the workforce of the future with AI employees that think, plan, and act.
                        </p>
                    </div>

                    <div className="col-span-2">
                        <h4 className="font-bold text-slate-900 mb-6">Explore Flowcore</h4>
                        <div className="grid grid-cols-2 gap-8">
                            <ul className="space-y-3 text-sm">
                                <li><a href="#" className="hover:text-primary transition-colors">Solutions</a></li>
                                <li><a href="#" className="hover:text-primary transition-colors">Pricing</a></li>
                                <li><a href="#" className="hover:text-primary transition-colors">Docs</a></li>
                            </ul>
                            <ul className="space-y-3 text-sm">
                                <li><a href="#" className="hover:text-primary transition-colors">About</a></li>
                                <li><a href="#" className="hover:text-primary transition-colors">Privacy</a></li>
                                <li><a href="#" className="hover:text-primary transition-colors">Terms</a></li>
                            </ul>
                        </div>
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
    )
}
