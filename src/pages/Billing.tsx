import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { CheckCircle, Zap, Shield, ArrowLeft, Loader2, AlertCircle, IndianRupee } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase/client';
import { cn } from '../lib/utils';
import { LoadingSpinner, ErrorState } from '../components/CommonUI';

declare global {
  interface Window {
    Razorpay: any;
  }
}

export function Billing() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [pageLoading, setPageLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [profile, setProfile] = useState<any>(null);
  const [interval, setInterval] = useState<'month' | 'year'>('month');
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [subscriptionStatus, setSubscriptionStatus] = useState<any>(null);

  useEffect(() => {
    fetchData();
    loadRazorpayScript();
  }, []);

  const loadRazorpayScript = () => {
    if (document.getElementById('razorpay-script')) return;
    const script = document.createElement('script');
    script.id = 'razorpay-script';
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    document.head.appendChild(script);
  };

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

  const handleRazorpayPayment = async () => {
    setLoading(true);
    setError(null);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Not authenticated');

      // 1. Create order on backend
      const orderRes = await fetch('/api/razorpay/create-order', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ plan: 'pro', interval }),
      });

      if (!orderRes.ok) {
        const errData = await orderRes.json();
        throw new Error(errData.error || 'Failed to create order');
      }

      const { orderId, amount, currency, keyId } = await orderRes.json();

      // 2. Open Razorpay checkout
      const options = {
        key: keyId || import.meta.env.VITE_RAZORPAY_KEY_ID,
        amount,
        currency,
        name: 'ApplyJi',
        description: `Pro Plan (${interval === 'year' ? 'Yearly' : 'Monthly'})`,
        order_id: orderId,
        handler: async function (response: any) {
          // 3. Verify payment on backend
          try {
            const verifyRes = await fetch('/api/razorpay/verify-payment', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${session.access_token}`,
              },
              body: JSON.stringify({
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
              }),
            });

            if (!verifyRes.ok) throw new Error('Payment verification failed');

            const result = await verifyRes.json();
            if (result.success) {
              setPaymentSuccess(true);
              setProfile({ ...profile, subscription_tier: 'pro' });
              // Refresh subscription status
              fetchData();
            }
          } catch (err: any) {
            setError('Payment was processed but verification failed. Please contact support.');
          }
        },
        prefill: {
          email: profile?.email,
          name: profile?.full_name,
        },
        theme: {
          color: '#8B5CF6',
        },
        modal: {
          ondismiss: function () {
            setLoading(false);
          },
        },
      };

      if (!window.Razorpay) {
        throw new Error('Payment system is loading. Please try again in a moment.');
      }

      const razorpay = new window.Razorpay(options);
      razorpay.on('payment.failed', function (response: any) {
        setError(`Payment failed: ${response.error.description}. Please try again.`);
        setLoading(false);
      });
      razorpay.open();
    } catch (err: any) {
      console.error('Payment error:', err);
      setError(err.message || 'Failed to initialize payment');
    } finally {
      setLoading(false);
    }
  };

  if (pageLoading) return <LoadingSpinner fullPage />;

  return (
    <div className="max-w-5xl mx-auto space-y-12 py-10">
      <button 
        onClick={() => navigate(-1)}
        className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors group"
      >
        <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
        Back
      </button>

      {/* Payment Success Banner */}
      {paymentSuccess && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-6 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center gap-4"
        >
          <div className="p-2 bg-emerald-500/20 rounded-full">
            <CheckCircle className="w-6 h-6 text-emerald-400" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white">Welcome to ApplyJi Pro! 🎉</h3>
            <p className="text-sm text-slate-400">Your account has been upgraded. Enjoy unlimited applications and AI features.</p>
          </div>
        </motion.div>
      )}

      {/* Error Banner */}
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

      {/* Current Plan Banner */}
      {subscriptionStatus && (
        <div className="glass-card p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={cn(
              "px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest",
              subscriptionStatus.isPro ? "bg-brand-primary/20 text-brand-primary" : "bg-slate-400/10 text-slate-400"
            )}>
              {subscriptionStatus.plan === 'pro' ? 'Pro' : 'Free'} Plan
            </div>
            {!subscriptionStatus.isPro && (
              <span className="text-xs text-slate-500">
                {subscriptionStatus.applicationsThisMonth}/{subscriptionStatus.applicationLimit} applications used this month
              </span>
            )}
            {subscriptionStatus.isTrialActive && subscriptionStatus.plan !== 'pro' && (
              <span className="text-xs text-amber-400">
                Trial active until {new Date(subscriptionStatus.trialEndsAt).toLocaleDateString()}
              </span>
            )}
          </div>
        </div>
      )}

      <div className="text-center space-y-4">
        <h1 className="text-4xl font-display font-bold text-white tracking-tight">Upgrade your search.</h1>
        <p className="text-slate-400 max-w-xl mx-auto">Choose the plan that fits your career goals. All plans include a 14-day free trial.</p>
        
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
            Yearly <span className="text-brand-primary font-bold ml-1">(-17%)</span>
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-stretch">
        <div className="glass-card p-10 flex flex-col justify-between space-y-8 bg-bg-dark/50 border-border-dark">
          <div className="space-y-2">
            <h3 className="text-xl font-bold uppercase tracking-widest text-slate-500">Free Tier</h3>
            <div className="flex items-baseline gap-1">
              <IndianRupee className="w-6 h-6 text-white" />
              <p className="text-4xl font-bold text-white">0</p>
            </div>
            <p className="text-xs text-slate-500">Free forever for basic needs</p>
          </div>
          <ul className="space-y-4 text-sm text-slate-400">
            <li className="flex items-center gap-3"><CheckCircle className="w-4 h-4 text-emerald-500" /> Manual job logging</li>
            <li className="flex items-center gap-3"><CheckCircle className="w-4 h-4 text-emerald-500" /> Basic status tracking</li>
            <li className="flex items-center gap-3"><CheckCircle className="w-4 h-4 text-emerald-500" /> 5 applications per month</li>
            <li className="flex items-center gap-3 opacity-30"><CheckCircle className="w-4 h-4" /> Gmail Automation</li>
            <li className="flex items-center gap-3 opacity-30"><CheckCircle className="w-4 h-4" /> AI Resume Analysis</li>
            <li className="flex items-center gap-3 opacity-30"><CheckCircle className="w-4 h-4" /> AI Resume Generation</li>
          </ul>
          <button 
            disabled={profile?.subscription_tier === 'free' || !profile?.subscription_tier}
            className="w-full py-4 bg-white/5 border border-white/10 rounded-2xl font-bold text-slate-300 hover:text-white hover:bg-white/10 transition-all disabled:opacity-50"
          >
            {(!profile?.subscription_tier || profile?.subscription_tier === 'free') ? 'Current Plan' : 'Downgrade'}
          </button>
        </div>

        <div className="glass-card p-10 flex flex-col justify-between space-y-8 relative overflow-hidden bg-brand-primary/5 border-brand-primary/30 shadow-2xl shadow-brand-primary/10">
          <div className="absolute top-6 right-8 px-3 py-1 bg-brand-primary text-white text-[10px] font-bold rounded-full uppercase tracking-widest">Recommended</div>
          <div className="space-y-2">
            <h3 className="text-xl font-bold uppercase tracking-widest text-brand-primary">ApplyJi Pro</h3>
            <div className="flex items-baseline gap-1">
              <IndianRupee className="w-6 h-6 text-white" />
              <p className="text-4xl font-bold text-white">
                {interval === 'month' ? '499' : '4,999'}
              </p>
              <p className="text-lg font-medium text-slate-400">/{interval === 'month' ? 'mo' : 'yr'}</p>
            </div>
            {interval === 'year' && (
              <p className="text-xs font-bold text-brand-primary tracking-tight">Save ₹989 — best value for long-term search</p>
            )}
          </div>
          <ul className="space-y-4 text-sm text-slate-300">
            <li className="flex items-center gap-3"><CheckCircle className="w-4 h-4 text-brand-primary" /> Automated Gmail Sync</li>
            <li className="flex items-center gap-3"><CheckCircle className="w-4 h-4 text-brand-primary" /> Gemini AI Resume Analysis</li>
            <li className="flex items-center gap-3"><CheckCircle className="w-4 h-4 text-brand-primary" /> AI Resume Generation</li>
            <li className="flex items-center gap-3"><CheckCircle className="w-4 h-4 text-brand-primary" /> AI Follow-up Composer</li>
            <li className="flex items-center gap-3"><CheckCircle className="w-4 h-4 text-brand-primary" /> Unlimited Applications</li>
            <li className="flex items-center gap-3"><CheckCircle className="w-4 h-4 text-brand-primary" /> Advanced Analytics</li>
          </ul>
          <button 
            onClick={handleRazorpayPayment}
            disabled={loading || profile?.subscription_tier === 'pro'}
            className="w-full py-4 bg-brand-primary text-white rounded-2xl font-bold hover:bg-brand-secondary transition-all shadow-lg shadow-brand-primary/20 disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Processing...
              </>
            ) : profile?.subscription_tier === 'pro' ? (
              'Current Plan'
            ) : (
              'Upgrade to Pro'
            )}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-10 border-t border-border-dark">
        {[
          { icon: Zap, title: "Instant Setup", desc: "No configuration needed. Connect Gmail and go." },
          { icon: Shield, title: "Secure Payments", desc: "Processed securely via Razorpay." },
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
