import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { ArrowLeft, ArrowRight, BarChart3, TrendingUp, Shield, Zap } from 'lucide-react'
import { motion } from 'framer-motion'

export default function InsightsView() {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.5 }}
      className="min-h-screen bg-slate-50 text-slate-900 font-sans selection:bg-orange-100 overflow-x-hidden"
    >
      {/* Grid Background */}
      <div className="fixed inset-0 z-0 pointer-events-none opacity-[0.03] bg-grid-flowcore" />
      
      {/* Top Navbar */}
      <nav className="fixed top-0 w-full z-50 bg-white/80 backdrop-blur-md border-b border-slate-200/60 h-16 flex items-center px-6">
        <div className="container mx-auto flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 group text-slate-600 hover:text-slate-900 transition-colors">
            <ArrowLeft className="h-4 w-4 group-hover:-translate-x-1 transition-transform" />
            <span className="text-sm font-medium">Back to Landing</span>
          </Link>
          <div className="text-lg font-bold tracking-tight">flowcore <span className="text-primary italic">Insights</span></div>
          <Link to="/signup">
            <Button size="sm" className="rounded-full bg-slate-900 text-white hover:bg-slate-800 transition-all hover:scale-105 active:scale-95 shadow-lg shadow-slate-200/50">Get Started</Button>
          </Link>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-20 relative overflow-hidden">
        <div className="absolute -top-20 -right-20 w-64 h-64 bg-primary/10 rounded-full blur-3xl animate-pulse" />
        <div className="container mx-auto px-6 text-center">
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}
            className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-orange-50 border border-orange-100 text-primary text-[clamp(0.6rem,2vw,0.75rem)] font-bold uppercase tracking-[0.1em] mb-6 shadow-sm shadow-orange-100/50"
          >
            <BarChart3 className="h-3 w-3" />
            <span>Reporting & Operations</span>
          </motion.div>
          <h1 className="text-[clamp(2.5rem,8vw,4.5rem)] font-extrabold tracking-tighter mb-6 leading-[1.05]">
            Feel the impact of <br />
            <span className="bg-gradient-to-r from-primary via-orange-500 to-orange-600 bg-clip-text text-transparent drop-shadow-sm">AI automation.</span>
          </h1>
          <p className="text-[clamp(1rem,2.5vw,1.25rem)] text-slate-500 max-w-[65ch] mx-auto mb-10 leading-relaxed font-medium">
            Real-time insights to help monitor, evaluate, and continuously optimize your customer operations. 
            See exactly how your AI employees are performing.
          </p>
        </div>
      </section>

      {/* Main Mockup Section */}
      <section className="pb-32">
        <div className="container mx-auto px-6">
          <div className="max-w-6xl mx-auto grid lg:grid-cols-2 gap-16 items-center">
            {/* Left: Content */}
            <div className="space-y-8 max-w-xl">
              <motion.div 
                whileHover={{ y: -5 }}
                transition={{ type: "spring", stiffness: 300 }}
                className="p-8 rounded-[32px] bg-white border border-slate-200/60 shadow-[0_20px_50px_rgba(0,0,0,0.05),0_1px_2px_rgba(0,0,0,0.02)] relative overflow-hidden group hover:border-primary/20 transition-all duration-500"
              >
                <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                    <Zap className="w-24 h-24 text-primary" />
                </div>
                <h2 className="text-3xl font-bold mb-4 tracking-tighter">Automation Rate</h2>
                <p className="text-slate-500 mb-6 max-w-prose leading-relaxed">Track the percentage of conversations resolved entirely by AI without human intervention.</p>
                <div className="flex items-end gap-4">
                  <div className="text-7xl font-black text-slate-900 tracking-tighter drop-shadow-sm">70.6%</div>
                  <div className="flex items-center gap-1.5 text-green-600 font-bold mb-2 bg-green-50 px-2 py-1 rounded-md text-sm border border-green-100 shadow-sm shadow-green-100/50">
                    <TrendingUp className="h-4 w-4" />
                    +8.1%
                  </div>
                </div>
              </motion.div>
              
              <div className="grid grid-cols-2 gap-6">
                <motion.div 
                  whileHover={{ scale: 1.02 }}
                  className="p-8 rounded-[32px] bg-white border border-slate-200/40 shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-2xl hover:shadow-primary/5 transition-all duration-300"
                >
                  <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-3">Escalation Rate</h3>
                  <div className="text-4xl font-extrabold text-slate-900">12.4%</div>
                </motion.div>
                <motion.div 
                  whileHover={{ scale: 1.02 }}
                  className="p-8 rounded-[32px] bg-white border border-slate-200/40 shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-2xl hover:shadow-primary/5 transition-all duration-300"
                >
                  <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-3">Response Time</h3>
                  <div className="text-4xl font-extrabold text-slate-900 tracking-tighter">&lt;1s</div>
                </motion.div>
              </div>

              {/* Authority Indicator / Social Proof */}
              <div className="pt-6 flex flex-col gap-4">
                 <div className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                    <Shield className="h-3 w-3" />
                    Trusted by industry leaders
                 </div>
                 <div className="flex gap-8 opacity-40 grayscale hover:grayscale-0 transition-all cursor-default overflow-hidden">
                    <div className="font-bold text-xl tracking-tighter hover:text-primary transition-colors">METRONIC</div>
                    <div className="font-bold text-xl tracking-tighter hover:text-primary transition-colors">CLOUD9</div>
                    <div className="font-bold text-xl tracking-tighter hover:text-primary transition-colors">AETHER</div>
                 </div>
              </div>
            </div>

            {/* Right: The "Conduit" Style Mockup */}
            <div className="relative">
              <motion.div 
                initial={{ opacity: 0, x: 50 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                className="absolute -inset-8 bg-gradient-to-br from-orange-100/40 to-primary/5 rounded-[60px] blur-[100px]" 
              />
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                className="relative rounded-[40px] border border-slate-200/80 bg-white/95 backdrop-blur-md shadow-[0_32px_64px_-16px_rgba(0,0,0,0.12)] overflow-hidden min-h-[550px]"
              >
                <div className="h-14 border-b border-slate-100 flex items-center px-8 bg-slate-50/80 justify-between">
                  <span className="text-xs font-black text-slate-500 uppercase tracking-[0.1em]">Insights Dashboard</span>
                  <div className="flex gap-2">
                    <div className="w-2.5 h-2.5 rounded-full bg-slate-200" />
                    <div className="w-2.5 h-2.5 rounded-full bg-slate-200" />
                    <div className="w-2.5 h-2.5 rounded-full bg-slate-200" />
                  </div>
                </div>
                <div className="p-8 space-y-10">
                  {/* Chart Replacement Mock */}
                  <div className="h-56 relative overflow-hidden rounded-2xl bg-slate-50/50 border border-slate-100 group">
                    <div className="absolute inset-0 flex items-end justify-around px-6 pb-6 pt-10">
                       {[40, 70, 45, 90, 65, 80, 55].map((h, i) => (
                         <div key={i} className="w-10 bg-primary/10 rounded-t-lg relative group/bar hover:bg-primary/20 transition-all cursor-pointer" style={{ height: `${h}%` }}>
                            <motion.div 
                              initial={{ height: 0 }}
                              whileInView={{ height: '30%' }}
                              className="absolute bottom-full left-0 w-full bg-primary mb-1 rounded-sm opacity-0 group-hover/bar:opacity-100 transition-all duration-300"
                            />
                            <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-slate-900 text-white text-[10px] px-2 py-1 rounded opacity-0 group-hover/bar:opacity-100 transition-opacity whitespace-nowrap shadow-xl">
                                {h}% Target
                            </div>
                         </div>
                       ))}
                    </div>
                  </div>

                  {/* Escalations Mock */}
                  <div className="space-y-4">
                    <div className="flex items-center justify-between text-[11px] font-black text-slate-400 uppercase tracking-[0.15em] px-1">
                      <h3 className="font-black">Live Intelligence Feed</h3>
                      <span className="text-primary cursor-pointer hover:underline">Full Report</span>
                    </div>
                    {[
                      { type: 'AI missing context', count: 19, percent: '52.8%', color: 'from-orange-500 to-orange-400' },
                      { type: 'Complex verification', count: 10, percent: '27.8%', color: 'from-amber-500 to-amber-400' },
                      { type: 'Urgent tagged', count: 7, percent: '19.4%', color: 'from-red-500 to-red-400' }
                    ].map((row, i) => (
                      <motion.div 
                        key={i} 
                        whileHover={{ x: 5 }}
                        className="p-5 rounded-2xl border border-slate-100 bg-white shadow-sm flex items-center justify-between group hover:border-primary/20 hover:shadow-lg hover:shadow-primary/5 transition-all duration-300 cursor-default"
                      >
                        <div className="flex items-center gap-4">
                          <div className={`w-2.5 h-2.5 rounded-full bg-gradient-to-tr ${row.color} shadow-[0_0_8px] shadow-primary/20`} />
                          <span className="text-sm font-semibold text-slate-700">{row.type}</span>
                        </div>
                        <div className="flex items-center gap-6">
                          <span className="text-sm font-black text-slate-900">{row.count}</span>
                          <div className="w-12 h-1.5 bg-slate-50 rounded-full overflow-hidden">
                             <motion.div 
                               initial={{ width: 0 }}
                               whileInView={{ width: row.percent }}
                               className={`h-full bg-gradient-to-r ${row.color}`}
                             />
                          </div>
                          <span className="text-[10px] font-bold text-slate-400 tabular-nums w-8">{row.percent}</span>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
        </div>
      </section>

      {/* Brand Story Section (Reflective) */}
      <section className="py-24 bg-white border-y border-slate-100">
        <div className="container mx-auto px-6">
            <div className="max-w-3xl mx-auto text-center space-y-6">
                <h2 className="text-4xl font-extrabold tracking-tighter">Built for transparency.</h2>
                <p className="text-[clamp(1rem,2vw,1.125rem)] text-slate-500 leading-relaxed max-w-[65ch] mx-auto font-medium">
                    At FlowCore, we believe that AI shouldn't be a black box. Our mission is to provide the clearest 
                    perspective on machine-led operations, ensuring that every interaction is accountable, 
                    every decision is documented, and every outcome is measurable.
                </p>
                <div className="pt-4">
                    <div className="inline-flex items-center gap-2 text-primary font-bold text-sm cursor-pointer hover:gap-3 transition-all">
                        Read our mission statement <ArrowRight className="h-4 w-4" />
                    </div>
                </div>
            </div>
        </div>
      </section>

      {/* Footer CTA */}
      <section className="py-24 bg-slate-900 text-white relative overflow-hidden">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary/20 rounded-full blur-[120px] translate-x-1/2 -translate-y-1/2" />
        <div className="container mx-auto px-6 text-center relative z-10">
          <h2 className="text-4xl md:text-[clamp(1.5rem,5vw,3rem)] font-extrabold mb-8 tracking-tighter">Ready to see the data?</h2>
          <Link to="/signup">
            <Button size="lg" className="h-16 px-12 bg-primary hover:bg-primary/90 text-white text-lg font-bold rounded-full shadow-2xl shadow-primary/30 transition-all hover:-translate-y-1 hover:scale-105 active:scale-95 group">
              Start Free Trial <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
            </Button>
          </Link>

          {/* Authority Indicators in Footer */}
          <div className="mt-20 pt-12 border-t border-white/10 flex flex-col md:flex-row items-center justify-between gap-8">
             <div className="flex items-center gap-6 opacity-60">
                <div className="flex flex-col items-start">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-primary mb-1">Security</span>
                    <span className="text-xs font-medium">SOC2 Type II Certified</span>
                </div>
                <div className="w-px h-8 bg-white/10" />
                <div className="flex flex-col items-start">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-primary mb-1">Privacy</span>
                    <span className="text-xs font-medium">GDPR & HIPAA Compliant</span>
                </div>
             </div>
             <div className="flex items-center gap-4 text-xs font-medium text-white/40">
                <span>© 2024 FlowCore AI.</span>
                <span className="hover:text-white cursor-pointer transition-colors">Twitter</span>
                <span className="hover:text-white cursor-pointer transition-colors">LinkedIn</span>
                <span className="hover:text-white cursor-pointer transition-colors">Status</span>
             </div>
          </div>
        </div>
      </section>
    </motion.div>
  )
}
