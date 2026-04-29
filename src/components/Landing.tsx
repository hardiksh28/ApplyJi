import React from 'react';
import { motion } from 'motion/react';
import { 
  Sparkles, 
  Mail, 
  Brain, 
  BarChart3, 
  ArrowRight, 
  CheckCircle,
  ShieldCheck,
  Zap,
  Globe,
  Lock,
  Cpu
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { signInWithGoogle } from '../lib/auth-service';

export function Landing() {
  const navigate = useNavigate();
  const [billingInterval, setBillingInterval] = React.useState<'month' | 'year'>('month');

  const handleStart = async () => {
    try {
      await signInWithGoogle();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="min-h-screen bg-[#000000] text-white selection:bg-indigo-500/30 overflow-x-hidden font-sans">
      {/* Dynamic Background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] bg-indigo-600/5 blur-[160px] rounded-full animate-pulse" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[60%] h-[60%] bg-purple-600/5 blur-[160px] rounded-full animate-pulse" style={{ animationDelay: '2s' }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.02)_0%,transparent_70%)]" />
      </div>

      {/* Modern Navigation */}
      <nav className="fixed top-0 w-full z-50 border-b border-white/5 bg-black/40 backdrop-blur-2xl">
        <div className="max-w-7xl mx-auto px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-8">
            <div className="flex items-center gap-2 group cursor-pointer">
              <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center transition-transform group-hover:scale-110">
                <Sparkles className="w-5 h-5 text-black" />
              </div>
              <span className="font-bold text-lg tracking-tighter uppercase whitespace-nowrap">ApplyJi</span>
            </div>
            
            <div className="hidden md:flex items-center gap-6 text-[13px] font-medium text-gray-400">
              <a href="#product" className="hover:text-white transition-colors cursor-pointer">Product</a>
              <a href="#ai-tools" className="hover:text-white transition-colors cursor-pointer">AI Tools</a>
              <a href="#pricing" className="hover:text-white transition-colors cursor-pointer">Pricing</a>
              <a href="#enterprise" className="hover:text-white transition-colors cursor-pointer">Enterprise</a>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <button 
              onClick={handleStart}
              className="text-[13px] font-medium text-gray-400 hover:text-white transition-colors"
            >
              Sign In
            </button>
            <button 
              onClick={handleStart}
              className="px-4 py-1.5 bg-white text-black text-[13px] font-bold rounded-full hover:bg-gray-200 transition-all shadow-lg"
            >
              Get Started
            </button>
          </div>
        </div>
      </nav>

      {/* Minimalist Hero Section */}
      <section className="relative pt-44 pb-32 px-8 overflow-hidden" id="product">
        <div className="max-w-5xl mx-auto text-center space-y-12">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-white/60 text-[11px] font-bold tracking-widest uppercase"
          >
            <Cpu className="w-3 h-3" />
            Empowering the modern applicant
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="space-y-6"
          >
            <h1 className="text-7xl md:text-8xl font-medium tracking-tight text-white leading-[1.05]">
              Build your career <br />
              <span className="text-gray-500 italic">without the busywork.</span>
            </h1>
            <p className="max-w-2xl mx-auto text-xl text-gray-400 font-light leading-relaxed">
              ApplyJi handles the logistics. From syncing applications to generating 
              AI follow-ups, we give you back the time to focus on what matters.
            </p>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-6 pt-4"
          >
            <button 
              onClick={handleStart}
              className="group px-10 py-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-full font-bold transition-all shadow-2xl shadow-indigo-500/20 flex items-center gap-3 text-lg"
            >
              Start for free
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </button>
          </motion.div>
        </div>

        {/* Cinematic Dashboard Preview */}
        <div className="mt-32 max-w-6xl mx-auto relative group">
          <div className="absolute -inset-1 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-[2.5rem] blur opacity-25 group-hover:opacity-40 transition duration-1000 group-hover:duration-200"></div>
          <motion.div 
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 0.4 }}
            className="relative bg-[#000] border border-white/10 rounded-[2.2rem] overflow-hidden shadow-2xl"
          >
            <div className="h-8 bg-white/5 border-b border-white/5 flex items-center px-4 gap-1.5">
              <div className="w-2.5 h-2.5 rounded-full bg-white/10" />
              <div className="w-2.5 h-2.5 rounded-full bg-white/10" />
              <div className="w-2.5 h-2.5 rounded-full bg-white/10" />
            </div>
            <img 
              src="https://images.unsplash.com/photo-1460925895917-afdab827c52f?q=80&w=2426&auto=format&fit=crop" 
              alt="ApplyJi Interface" 
              className="w-full h-auto object-cover grayscale opacity-90 transition-all duration-1000 group-hover:grayscale-0 group-hover:opacity-100"
            />
          </motion.div>

          {/* Floating UI Bits */}
          <motion.div 
            animate={{ y: [0, -10, 0] }}
            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
            className="absolute -top-12 -right-6 hidden lg:flex bg-black/80 backdrop-blur-xl border border-white/10 px-4 py-3 rounded-2xl items-center gap-3 shadow-2xl"
          >
            <div className="w-8 h-8 rounded-full bg-indigo-500/20 flex items-center justify-center">
              <Zap className="w-4 h-4 text-indigo-400" />
            </div>
            <div className="text-left">
              <p className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest">Automation</p>
              <p className="text-xs font-medium text-white">Gmail Synced</p>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Bento Grid Features - AI Tools */}
      <section className="py-32 px-8 border-t border-white/5 bg-[#030303]" id="ai-tools">
        <div className="max-w-7xl mx-auto space-y-16">
          <div className="text-center space-y-4">
            <h2 className="text-4xl font-bold tracking-tight">Intelligence built-in.</h2>
            <p className="text-gray-500 max-w-xl mx-auto">Not just data. Actionable intelligence powered by Gemini.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 h-full md:h-[600px]">
            <motion.div 
              whileHover={{ scale: 0.99 }}
              className="md:col-span-2 bg-white/5 border border-white/5 rounded-[2rem] p-10 flex flex-col justify-end relative overflow-hidden group"
            >
              <div className="absolute top-10 right-10 w-64 h-64 bg-indigo-500/10 blur-[80px] rounded-full group-hover:bg-indigo-500/20 transition-colors" />
              <Mail className="w-12 h-12 text-indigo-400 mb-8" />
              <h3 className="text-3xl font-bold mb-4">Zero Data Entry.</h3>
              <p className="text-gray-400 max-w-md">Our algorithm scans your inbox for job applications, status updates, and interview invites. We do the logging so you don't have to.</p>
            </motion.div>

            <motion.div 
              whileHover={{ scale: 0.99 }}
              className="bg-[#0a0a0a] border border-white/5 rounded-[2rem] p-10 flex flex-col justify-between"
            >
              <Brain className="w-10 h-10 text-purple-400" />
              <div>
                <h3 className="text-2xl font-bold mb-4">Follow-up Composer</h3>
                <p className="text-sm text-gray-500 leading-relaxed">
                  Generated emails that reflect your style. Gemini crafts perfect 3-sentence nudges that get replies.
                </p>
              </div>
            </motion.div>

            <motion.div 
              whileHover={{ scale: 0.99 }}
              className="bg-[#0a0a0a] border border-white/5 rounded-[2rem] p-10 flex flex-col justify-between"
            >
              <ShieldCheck className="w-10 h-10 text-emerald-400" />
              <div>
                <h3 className="text-2xl font-bold mb-4">Privacy First</h3>
                <p className="text-sm text-gray-500 leading-relaxed">
                  We only scan for job-related content. Your emails are yours. We use narrow scopes to keep your data secure.
                </p>
              </div>
            </motion.div>

            <motion.div 
              whileHover={{ scale: 0.99 }}
              className="md:col-span-2 bg-indigo-600 rounded-[2rem] p-10 flex items-center justify-between group overflow-hidden relative"
            >
              <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-20" />
              <div className="relative z-10 w-2/3">
                <h3 className="text-3xl font-bold mb-4">Insights that matter.</h3>
                <p className="text-indigo-100">See your response rate, interview conversion, and market trends in real-time. No more guessing.</p>
              </div>
              <BarChart3 className="w-32 h-32 text-white/10 group-hover:scale-110 transition-transform duration-700" />
            </motion.div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="py-32 px-8 border-t border-white/5" id="pricing">
        <div className="max-w-5xl mx-auto space-y-16">
          <div className="text-center space-y-8">
            <h2 className="text-4xl font-bold tracking-tight mb-4">Simple, honest pricing.</h2>
            <p className="text-gray-500">Free forever for basic tracking. Power up when you're serious.</p>
            
            <div className="flex items-center justify-center gap-4">
              <span className={`text-sm ${billingInterval === 'month' ? 'text-white' : 'text-gray-500'}`}>Monthly</span>
              <button 
                onClick={() => setBillingInterval(prev => prev === 'month' ? 'year' : 'month')}
                className="w-14 h-7 bg-white/10 rounded-full p-1 relative flex items-center transition-colors hover:bg-white/20"
              >
                <motion.div 
                  animate={{ x: billingInterval === 'month' ? 0 : 28 }}
                  className="w-5 h-5 bg-white rounded-full shadow-lg"
                />
              </button>
              <span className={`text-sm ${billingInterval === 'year' ? 'text-white' : 'text-gray-500'}`}>
                Yearly <span className="text-indigo-400 font-bold ml-1">(-15%)</span>
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
            <div className="p-10 rounded-[2.5rem] bg-white/5 border border-white/5 space-y-8">
              <div className="space-y-2">
                <h3 className="text-xl font-bold uppercase tracking-widest text-gray-400">Basic</h3>
                <p className="text-4xl font-bold">Free</p>
              </div>
              <ul className="space-y-4 text-sm text-gray-400 font-medium">
                <li className="flex items-center gap-3"><CheckCircle className="w-4 h-4 text-emerald-500" /> Manual job logging</li>
                <li className="flex items-center gap-3"><CheckCircle className="w-4 h-4 text-emerald-500" /> Basic status tracking</li>
                <li className="flex items-center gap-3"><CheckCircle className="w-4 h-4 text-emerald-500" /> 5 application slots</li>
              </ul>
              <button 
                onClick={handleStart}
                className="w-full py-4 bg-white/10 rounded-2xl font-bold hover:bg-white/20 transition-all"
              >
                Get Started
              </button>
            </div>

            <div className="p-10 rounded-[2.5rem] bg-white text-black space-y-8 relative shadow-2xl shadow-indigo-600/20">
              <div className="absolute top-6 right-8 px-3 py-1 bg-indigo-600 text-white text-[10px] font-bold rounded-full uppercase tracking-widest">Popular</div>
              <div className="space-y-2">
                <h3 className="text-xl font-bold uppercase tracking-widest text-gray-500 font-black">ApplyJi Pro</h3>
                <div className="flex items-baseline gap-1">
                  <p className="text-4xl font-bold">
                    ${billingInterval === 'month' ? '9' : '7.65'}
                  </p>
                  <p className="text-lg font-medium text-gray-400">/mo</p>
                </div>
                {billingInterval === 'year' && (
                  <p className="text-xs font-bold text-indigo-600 tracking-tight">Billed annually at $91.80/year</p>
                )}
              </div>
              <ul className="space-y-4 text-sm font-medium">
                <li className="flex items-center gap-3"><CheckCircle className="w-4 h-4 text-indigo-600" /> Automated Gmail Sync</li>
                <li className="flex items-center gap-3"><CheckCircle className="w-4 h-4 text-indigo-600" /> Gemini AI Follow-up Composer</li>
                <li className="flex items-center gap-3"><CheckCircle className="w-4 h-4 text-indigo-600" /> Advanced Analytics</li>
                <li className="flex items-center gap-3"><CheckCircle className="w-4 h-4 text-indigo-600" /> Unlimited Applications</li>
                <li className="flex items-center gap-3"><CheckCircle className="w-4 h-4 text-indigo-600" /> Priority Support</li>
              </ul>
              <button 
                onClick={handleStart}
                className="w-full py-4 bg-black text-white rounded-2xl font-bold hover:opacity-90 transition-all"
              >
                Go Pro Now
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Enterprise Section */}
      <section className="py-32 px-8 border-t border-white/5 bg-[#000]" id="enterprise">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-20 items-center">
            <div className="space-y-8">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-white/60 text-[10px] font-bold tracking-widest uppercase">
                <Globe className="w-3 h-3" />
                Scale without limits
              </div>
              <h2 className="text-5xl md:text-6xl font-bold tracking-tight">Built for scale. <br /><span className="text-gray-500">Secured for enterprise.</span></h2>
              <p className="text-gray-400 text-lg leading-relaxed max-w-lg">
                For organizations that need more than just tracking. Deploy ApplyJi across your entire recruitment team or university career center with centralized control.
              </p>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                {[
                  { icon: Lock, title: "SAML & SSO", desc: "Enterprise-grade authentication and access." },
                  { icon: ShieldCheck, title: "Audit Logs", desc: "Complete transparency of all user activity." },
                  { icon: Globe, title: "Global Hosting", desc: "Data residency options to meet GDPR/SOC2." },
                  { icon: Cpu, title: "Custom APIs", desc: "Integrate directly into your internal HRIS." }
                ].map((item, i) => (
                  <div key={i} className="space-y-2">
                    <div className="flex items-center gap-2 text-white">
                      <item.icon className="w-4 h-4 text-indigo-400" />
                      <span className="font-bold text-sm tracking-tight">{item.title}</span>
                    </div>
                    <p className="text-xs text-gray-500">{item.desc}</p>
                  </div>
                ))}
              </div>

              <button className="px-8 py-4 bg-white/5 hover:bg-white/10 text-white rounded-full font-bold border border-white/10 transition-all">
                Contact Sales
              </button>
            </div>

            <div className="relative">
              <div className="absolute inset-0 bg-indigo-500/10 blur-[100px] rounded-full" />
              <div className="relative aspect-square bg-[#050505] border border-white/10 rounded-[3rem] p-12 overflow-hidden flex flex-col justify-center">
                <div className="space-y-6">
                  <div className="h-4 w-1/3 bg-white/10 rounded-full" />
                  <div className="h-4 w-2/3 bg-white/5 rounded-full" />
                  <div className="h-24 w-full bg-white/[0.02] border border-white/5 rounded-2xl" />
                  <div className="grid grid-cols-3 gap-4">
                    <div className="h-20 bg-indigo-500/20 border border-indigo-500/30 rounded-2xl" />
                    <div className="h-20 bg-white/5 border border-white/5 rounded-2xl" />
                    <div className="h-20 bg-white/5 border border-white/5 rounded-2xl" />
                  </div>
                </div>
                {/* 3D-like Overlay */}
                <motion.div 
                  animate={{ y: [0, -20, 0], rotateZ: [0, 2, 0] }}
                  transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
                  className="absolute top-1/4 right-10 bg-white/10 backdrop-blur-3xl border border-white/20 p-6 rounded-[2rem] shadow-2xl skew-x-[-10deg] rotate-[-5deg]"
                >
                  <p className="text-xs font-bold text-gray-400 mb-2 uppercase tracking-tight">Active Seats</p>
                  <p className="text-4xl font-bold tracking-tighter">12,402</p>
                </motion.div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-20 px-8 border-t border-white/5 bg-[#000]">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-12 text-center md:text-left">
          <div className="space-y-4">
            <div className="flex items-center gap-3 justify-center md:justify-start">
              <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-black" />
              </div>
              <span className="font-bold text-lg tracking-tighter uppercase">ApplyJi</span>
            </div>
            <p className="text-gray-500 max-w-xs text-sm">Automating the job search for the next generation of top talent.</p>
          </div>
          
          <div className="flex flex-wrap justify-center gap-x-12 gap-y-6 text-sm font-medium text-gray-400">
            <a href="#" className="hover:text-white transition-colors">Privacy</a>
            <a href="#" className="hover:text-white transition-colors">Terms</a>
            <a href="#" className="hover:text-white transition-colors">Twitter</a>
            <a href="#" className="hover:text-white transition-colors">LinkedIn</a>
          </div>
        </div>
        <div className="mt-12 text-center text-[11px] text-gray-600 tracking-widest font-bold uppercase">
          &copy; 2026 ApplyJi Operations Inc. All Rights Reserved.
        </div>
      </footer>
    </div>
  );
}

