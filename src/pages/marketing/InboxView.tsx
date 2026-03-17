import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { ArrowLeft, MessageSquare, Bot, Zap, Users } from 'lucide-react'

export default function InboxView() {
  return (
    <div className="min-h-screen bg-white text-slate-900 font-sans selection:bg-orange-100 overflow-x-hidden">
      {/* Subtle Grid Background */}
      <div className="fixed inset-0 z-0 pointer-events-none opacity-[0.03] bg-grid-flowcore" />
      
      {/* Top Navbar */}
      <nav className="fixed top-0 w-full z-50 bg-white/80 backdrop-blur-md border-b border-slate-200/60 h-16 flex items-center px-6">
        <div className="container mx-auto flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 group text-slate-600 font-medium hover:text-slate-900 transition-colors">
            <ArrowLeft className="h-4 w-4 group-hover:-translate-x-1 transition-transform" />
            <span className="text-sm">Back</span>
          </Link>
          <div className="text-lg font-bold tracking-tight">flowcore <span className="text-primary">Inbox</span></div>
          <Link to="/signup">
            <Button size="sm" className="rounded-full bg-slate-900 text-white">Get Started</Button>
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="pt-32 pb-20">
        <div className="container mx-auto px-6 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 border border-blue-100 text-blue-600 text-xs font-semibold uppercase tracking-wider mb-6">
            <MessageSquare className="h-3 w-3" />
            <span>AI + Human Hybrid</span>
          </div>
          <h1 className="text-5xl md:text-6xl font-bold tracking-tight mb-6 leading-[1.1]">
            Work alongside <br />
            <span className="text-primary">AI employees.</span>
          </h1>
          <p className="text-lg text-slate-500 max-w-2xl mx-auto mb-10 leading-relaxed">
            The Flowcore Inbox is where AI and humans collaborate. 
            Automate the repetitive, and step in exactly when you're needed.
          </p>
        </div>
      </section>

      {/* Layout Split */}
      <section className="pb-32">
        <div className="container mx-auto px-6">
          <div className="max-w-6xl mx-auto grid lg:grid-cols-2 gap-16 items-center">
            
            {/* Left: Chat Preview Mockup */}
            <div className="relative">
              <div className="absolute -inset-4 bg-blue-100/30 rounded-[40px] blur-3xl" />
              <div className="relative rounded-[32px] border border-slate-200 bg-white shadow-2xl overflow-hidden min-h-[500px]">
                <div className="h-12 border-b border-slate-100 flex items-center px-6 bg-slate-50/50">
                  <div className="flex gap-1.5">
                    <div className="w-2.5 h-2.5 rounded-full bg-slate-300" />
                    <div className="w-2.5 h-2.5 rounded-full bg-slate-300" />
                    <div className="w-2.5 h-2.5 rounded-full bg-slate-300" />
                  </div>
                </div>
                <div className="p-8 space-y-8">
                  <div className="flex gap-4">
                    <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 font-bold flex-none">AC</div>
                    <div className="bg-slate-50 rounded-[20px] rounded-tl-none px-6 py-4 text-sm text-slate-700 shadow-sm border border-slate-100 leading-relaxed">
                      "I need to postpone my booking for tomorrow at 2 PM."
                    </div>
                  </div>

                  <div className="ml-14 space-y-4">
                    <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-orange-50 text-orange-600 text-[10px] font-bold uppercase rounded-full border border-orange-100">
                      <Zap className="h-3 w-3" />
                      AI: checking availability
                    </div>
                    <div className="bg-white border border-slate-200 rounded-[20px] p-4 text-sm shadow-sm flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-2 h-2 rounded-full bg-green-500" />
                        <span className="font-medium">Found slot: 4 PM tomorrow</span>
                      </div>
                      <span className="text-[10px] text-slate-400">Match: 100%</span>
                    </div>
                  </div>

                  <div className="flex gap-4 justify-end">
                    <div className="bg-primary text-white rounded-[20px] rounded-tr-none px-6 py-4 text-sm shadow-lg shadow-primary/20 leading-relaxed">
                      "No problem! I've moved your booking to 4 PM tomorrow. You'll receive a confirmation email shortly."
                    </div>
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-orange-400 flex items-center justify-center shadow-lg shadow-primary/25 flex-none">
                      <Bot className="h-5 w-5 text-white" />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Right: Feature Content */}
            <div className="space-y-12">
              <div className="space-y-4">
                <div className="w-12 h-12 rounded-2xl bg-orange-50 flex items-center justify-center text-primary shadow-sm border border-orange-100">
                  <Zap className="h-6 w-6" />
                </div>
                <h3 className="text-3xl font-bold">Instant Handoff</h3>
                <p className="text-slate-500 leading-relaxed">
                  When a conversation gets complex or high-stakes, your AI employee flags a human teammate and provides a full summary of the interaction so far.
                </p>
              </div>

              <div className="space-y-4">
                <div className="w-12 h-12 rounded-2xl bg-blue-50 flex items-center justify-center text-blue-600 shadow-sm border border-blue-100">
                  <Users className="h-6 w-6" />
                </div>
                <h3 className="text-3xl font-bold">Collaborative Inbox</h3>
                <p className="text-slate-500 leading-relaxed">
                  A unified space where your team can monitor AI conversations in real-time, jump in to help, or leave internal notes for the AI to follow.
                </p>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* Trust Footer */}
      <section className="py-20 border-t border-slate-100">
        <div className="container mx-auto px-6 text-center">
          <p className="text-sm font-bold text-slate-400 uppercase tracking-[0.2em] mb-12">Seamlessly integrated everywhere</p>
          <div className="flex flex-wrap justify-center gap-12 opacity-30 grayscale contrast-125">
             <div className="text-2xl font-black">WHATSAPP</div>
             <div className="text-2xl font-black">SLACK</div>
             <div className="text-2xl font-black">INTERCOM</div>
             <div className="text-2xl font-black">ZENDESK</div>
          </div>
        </div>
      </section>
    </div>
  )
}
