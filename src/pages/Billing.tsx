import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { CheckCircle, Zap, Shield, ArrowLeft, Loader2, AlertCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase/client';
import { cn } from '../lib/utils';
import { LoadingSpinner } from '../components/CommonUI';

const MONTHLY_DISPLAY = '$9.99';
const YEARLY_DISPLAY = '$101.90';

export function Billing() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [pageLoading, setPageLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [profile, setProfile] = useState<any>(null);
  const [interval, setInterval] = useState<'month' | 'year'>('month');
  const [subscriptionStatus, setSubscriptionStatus] = useState<any>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate('/login');
        return;
      }

      const [profileRes, subRes] = await Promise.all([
        supabase.from('profiles').select('*').eq('id', session.user.id).single(),
        fetch('/api/subscription/status', {
          headers: { 'Authorization': `Bearer ${session.access_token}` }
        }).then(r => r.ok ? r.json() : null).catch(() => null),
      ]);

      if (profileRes.data) setProfile(profileRes.data);
      if (subRes) setSubscriptionStatus(subRes);
    } catch (err) {
      setError('Failed to load billing information');
    } finally {
      setPageLoading(false);
    }
  };

  const handleStripePayment = async () => {
    setLoading(true);
    setError(null);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Not authenticated');

      const response = await fetch('/api/stripe/create-checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ interval }),
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || 'Failed to create checkout session');
      }

      const { url } = await response.json();
      window.location.href = url;
    } catch (err: any) {
      console.error('Payment error:', err);
      setError(err.message || 'Failed to initialize payment');
    } finally {
      setLoading(false);
    }
  };

  const handleManageBilling = async () => {
    setLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const response = await fetch('/api/stripe/portal', {
        headers: { 'Authorization': `Bearer ${session.access_token}` },
      });

      if (!response.ok) throw new Error('Failed to create portal session');

      const { url } = await response.json();
      window.location.href = url;
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (pageLoading) return <LoadingSpinner fullPage />;

  const isPro = profile?.subscription_tier === 'pro';

  return (
    <div className="max-w-5xl mx-auto space-y-12 py-10">
      <button 
        onClick={() => navigate(-1)}
        className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors group"
      >
        <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
        Back
      </button>

      {error && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 flex items-center gap-4"
        >
          <AlertCircle className="w-5 h-5 text-rose-400 flex-shrink-0" />
          <p className="text-sm text-rose-300 flex-1">{error}</p>
          <button 
            onClick={() => setError(null)}
            className="text-xs text-rose-400 hover:text-white font-bold px-3 py-1 border border-rose-500/30 rounded-lg transition-colors"
          >
            Dismiss
          </button>
        </motion.div>
      )}

      <div className="text-center space-y-4">
        <h1 className="text-4xl font-display font-bold text-white tracking-tight">Upgrade your search.</h1>
        <p className="text-slate-400 max-w-xl mx-auto">Choose the plan that fits your career goals.</p>
        
        <div className="flex items-center justify-center gap-4 pt-4">
          <span className={cn("text-sm transition-colors", interval === 'month' ? "text-white" : "text-slate-500")}>Monthly</span>
          <button 
            onClick={() => setInterval(prev => prev === 'month' ? 'year' : 'month')}
            className="w-14 h-7 bg-white/10 rounded-full p-1 relative flex items-center transition-colors hover:bg-white/20"
          >
            <motion.div 
              animate={{ x: interval === 'month' ? 0 : 28 }}
              className="w-5 h-5 bg-white rounded-full shadow-lg"
            />
          </button>
          <span className={cn("text-sm transition-colors", interval === 'year' ? "text-white" : "text-slate-500")}>
            Yearly <span className="text-brand-primary font-bold ml-1">(Save 15%)</span>
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-stretch">
        {/* FREE TIER */}
        <div className="glass-card p-10 flex flex-col justify-between space-y-8 bg-bg-dark/50 border-border-dark">
          <div className="space-y-2">
            <h3 className="text-xl font-bold uppercase tracking-widest text-slate-500">Free Tier</h3>
            <div className="flex items-baseline gap-1">
              <p className="text-4xl font-bold text-white">$0</p>
              <p className="text-lg font-medium text-slate-400">/mo</p>
            </div>
            <p className="text-xs text-slate-500">Free forever for basic needs</p>
          </div>
          <ul className="space-y-4 text-sm text-slate-400">
            <li className="flex items-center gap-3"><CheckCircle className="w-4 h-4 text-emerald-500" /> Up to 5 applications/month</li>
            <li className="flex items-center gap-3"><CheckCircle className="w-4 h-4 text-emerald-500" /> Manual tracking only</li>
            <li className="flex items-center gap-3 opacity-30"><CheckCircle className="w-4 h-4" /> Gmail auto-sync</li>
            <li className="flex items-center gap-3 opacity-30"><CheckCircle className="w-4 h-4" /> AI Resume Builder</li>
            <li className="flex items-center gap-3 opacity-30"><CheckCircle className="w-4 h-4" /> AI Cover Letter</li>
          </ul>
          <button 
            disabled={!isPro}
            className="w-full py-4 bg-white/5 border border-white/10 rounded-2xl font-bold text-slate-300 hover:text-white hover:bg-white/10 transition-all disabled:opacity-50"
          >
            {!isPro ? 'Current Plan' : 'Downgrade'}
          </button>
        </div>

        {/* PRO TIER */}
        <div className="glass-card p-10 flex flex-col justify-between space-y-8 relative overflow-hidden bg-brand-primary/5 border-brand-primary/30 shadow-2xl shadow-brand-primary/10">
          <div className="absolute top-6 right-8 px-3 py-1 bg-brand-primary text-white text-[10px] font-bold rounded-full uppercase tracking-widest">Recommended</div>
          <div className="space-y-2">
            <h3 className="text-xl font-bold uppercase tracking-widest text-brand-primary">ApplyJi Pro</h3>
            <div className="flex items-baseline gap-1">
              <p className="text-4xl font-bold text-white">
                {interval === 'month' ? MONTHLY_DISPLAY : YEARLY_DISPLAY}
              </p>
              <p className="text-lg font-medium text-slate-400">/{interval === 'month' ? 'mo' : 'yr'}</p>
            </div>
            {interval === 'year' && (
              <p className="text-xs font-bold text-brand-primary tracking-tight">Billed annually ($8.49/mo)</p>
            )}
          </div>
          <ul className="space-y-4 text-sm text-slate-300">
            <li className="flex items-center gap-3"><CheckCircle className="w-4 h-4 text-brand-primary" /> Unlimited applications</li>
            <li className="flex items-center gap-3"><CheckCircle className="w-4 h-4 text-brand-primary" /> Gmail auto-sync</li>
            <li className="flex items-center gap-3"><CheckCircle className="w-4 h-4 text-brand-primary" /> AI Resume Builder</li>
            <li className="flex items-center gap-3"><CheckCircle className="w-4 h-4 text-brand-primary" /> AI Cover Letter</li>
            <li className="flex items-center gap-3"><CheckCircle className="w-4 h-4 text-brand-primary" /> Skills Gap Analysis</li>
            <li className="flex items-center gap-3"><CheckCircle className="w-4 h-4 text-brand-primary" /> Follow-up Generator</li>
          </ul>
          
          {isPro ? (
            <button 
              onClick={handleManageBilling}
              disabled={loading}
              className="w-full py-4 bg-white/5 border border-white/10 rounded-2xl font-bold text-slate-300 hover:text-white hover:bg-white/10 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Manage Billing'}
            </button>
          ) : (
            <button 
              onClick={handleStripePayment}
              disabled={loading}
              className="w-full py-4 bg-brand-primary text-white rounded-2xl font-bold hover:bg-brand-secondary transition-all shadow-lg shadow-brand-primary/20 disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Processing...
                </>
              ) : (
                'Upgrade to Pro'
              )}
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-10 border-t border-border-dark">
        {[
          { icon: Zap, title: "Instant Setup", desc: "No configuration needed. Connect Gmail and go." },
          { icon: Shield, title: "Secure Payments", desc: "Processed securely via Stripe." },
          { icon: CheckCircle, title: "Cancel Anytime", desc: "No long-term contracts or hidden fees." }
        ].map((feature, i) => (
          <div key={i} className="flex gap-4">
            <div className="p-2 h-fit bg-white/5 rounded-lg border border-white/10">
              <feature.icon className="w-5 h-5 text-brand-primary" />
            </div>
            <div>
              <h4 className="font-bold text-white text-sm mb-1">{feature.title}</h4>
              <p className="text-xs text-slate-500 leading-relaxed">{feature.desc}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
