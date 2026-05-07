import React, { useState, useEffect } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { 
  TrendingUp, 
  Target, 
  Briefcase, 
  Clock, 
  Award, 
  ArrowUpRight, 
  ArrowDownRight,
  Filter,
  Loader2,
  Sparkles
} from 'lucide-react';
import { cn } from '../lib/utils';
import { supabase } from '../lib/supabase/client';
import { motion } from 'motion/react';

export function Insights() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<any>(null);
  const [trendingSkills, setTrendingSkills] = useState<any[]>([]);
  const [role, setRole] = useState('Frontend Engineer');

  useEffect(() => {
    fetchStats();
    fetchMarketTrends();
  }, [role]);

  const fetchStats = async () => {
    setLoading(true);
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;

    // Fetch applications for real stats
    const { data: apps } = await supabase.from('applications').select('status, created_at, company_name');
    
    if (apps) {
      const total = apps.length;
      const interviewing = apps.filter(a => ['screening', 'interviewing', 'technical_round', 'final_round'].includes(a.status)).length;
      const offers = apps.filter(a => a.status === 'offered').length;
      
      setStats({
        total,
        responseRate: total > 0 ? Math.round(((total - apps.filter(a => a.status === 'applied').length) / total) * 100) : 0,
        interviewRate: total > 0 ? Math.round((interviewing / total) * 100) : 0,
        offerRate: interviewing > 0 ? Math.round((offers / interviewing) * 100) : 0,
        funnelData: [
          { name: 'Applied', value: total },
          { name: 'Interviews', value: interviewing },
          { name: 'Offers', value: offers },
        ],
        timelineData: [
          { date: 'Mar', apps: 5 },
          { date: 'Apr', apps: 12 },
          { date: 'May', apps: total },
        ]
      });
    }
    setLoading(false);
  };

  const fetchMarketTrends = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;
      const response = await fetch(`/api/market/trending-skills?role=${role}`, {
        headers: { 'Authorization': `Bearer ${session.access_token}` }
      });
      const data = await response.json();
      setTrendingSkills(data);
    } catch (err) {
      console.error(err);
    }
  };

  if (loading || !stats) return <div className="h-[60vh] flex items-center justify-center"><Loader2 className="w-10 h-10 animate-spin text-brand-primary" /></div>;

  return (
    <div className="space-y-8 pb-20">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-display font-bold text-white mb-1">Career Insights</h1>
          <p className="text-slate-400">Data-driven analysis of your application performance</p>
        </div>
        <div className="flex items-center gap-3">
          <button className="px-4 py-2 bg-surface-dark border border-border-dark text-white font-bold rounded-xl text-xs hover:bg-white/5 transition-all cursor-pointer">
            Export Report (PDF)
          </button>
        </div>
      </div>

      {/* Top Level Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {[
          { label: 'Total Applications', value: stats.total, sub: '+4 this week', icon: Briefcase, color: 'text-blue-400' },
          { label: 'Response Rate', value: `${stats.responseRate}%`, sub: 'Above average', icon: TrendingUp, color: 'text-emerald-400' },
          { label: 'Interview Invites', value: stats.funnelData[1].value, sub: 'Next step conv.', icon: Target, color: 'text-amber-400' },
          { label: 'Avg. Response Time', value: '4.2d', sub: 'Faster than avg', icon: Clock, color: 'text-indigo-400' },
        ].map((stat, i) => (
          <div key={i} className="glass-card p-6">
            <div className="flex items-center justify-between mb-4">
               <div className={cn("p-2 rounded-lg bg-surface-dark", stat.color.replace('text', 'bg') + '/10')}>
                  <stat.icon className={cn("w-5 h-5", stat.color)} />
               </div>
               <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-400">
                  <ArrowUpRight className="w-3 h-3" /> 12%
               </span>
            </div>
            <h3 className="text-2xl font-display font-bold text-white mb-1">{stat.value}</h3>
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{stat.label}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Application Funnel */}
        <div className="lg:col-span-2 glass-card p-8">
          <h3 className="text-sm font-bold text-white mb-8 uppercase tracking-widest flex items-center gap-2">
             <Target className="w-4 h-4 text-brand-primary" />
             Application Funnel
          </h3>
          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats.funnelData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '12px' }}
                  itemStyle={{ color: '#fff', fontSize: '12px' }}
                />
                <Bar dataKey="value" fill="#6366f1" radius={[8, 8, 0, 0]} barSize={60}>
                  {stats.funnelData.map((entry: any, index: number) => (
                    <Cell key={`cell-${index}`} fill={['#6366f1', '#f59e0b', '#10b981'][index % 3]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Conversion Rates */}
        <div className="lg:col-span-1 glass-card p-8 flex flex-col justify-center">
           <h3 className="text-sm font-bold text-white mb-8 uppercase tracking-widest">Conversions</h3>
           <div className="space-y-8">
              {[
                { label: 'Applied to Interview', value: stats.interviewRate, color: 'bg-amber-400' },
                { label: 'Interview to Offer', value: stats.offerRate, color: 'bg-emerald-400' },
              ].map((rate, i) => (
                <div key={i} className="space-y-3">
                   <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-400">{rate.label}</span>
                      <span className="text-lg font-display font-bold text-white">{rate.value}%</span>
                   </div>
                   <div className="h-2 bg-surface-dark rounded-full overflow-hidden">
                      <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: `${rate.value}%` }}
                        className={cn("h-full", rate.color)} 
                      />
                   </div>
                </div>
              ))}
           </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
         {/* Market Intelligence */}
         <div className="glass-card p-8">
            <div className="flex items-center justify-between mb-8">
               <h3 className="text-sm font-bold text-white uppercase tracking-widest flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-amber-400" />
                  Trending Skills (Market)
               </h3>
               <select 
                value={role}
                onChange={(e) => setRole(e.target.value)}
                className="bg-surface-dark border border-border-dark rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:ring-1 focus:ring-brand-primary"
               >
                  <option>Frontend Engineer</option>
                  <option>Backend Developer</option>
                  <option>Product Manager</option>
                  <option>Full Stack Developer</option>
               </select>
            </div>
            <div className="space-y-4">
               {trendingSkills.length > 0 ? trendingSkills.map((item, i) => (
                 <div key={i} className="flex items-center gap-4">
                    <span className="text-xs font-bold text-slate-300 w-24 truncate">{item.skill}</span>
                    <div className="flex-1 h-6 bg-surface-dark rounded-md overflow-hidden relative">
                       <div 
                        className="h-full bg-brand-primary/30" 
                        style={{ width: `${(item.count / trendingSkills[0].count) * 100}%` }} 
                       />
                       <span className="absolute inset-y-0 left-3 flex items-center text-[9px] font-bold text-white uppercase tracking-tighter">{item.count} Listings</span>
                    </div>
                 </div>
               )) : (
                 <div className="h-40 flex flex-col items-center justify-center text-center">
                    <p className="text-xs text-slate-500 italic">No market data available for this role yet.</p>
                 </div>
               )}
            </div>
         </div>

         {/* Application Activity */}
         <div className="glass-card p-8">
            <h3 className="text-sm font-bold text-white mb-8 uppercase tracking-widest flex items-center gap-2">
               <TrendingUp className="w-4 h-4 text-emerald-400" />
               Application Activity
            </h3>
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={stats.timelineData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                  <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '12px' }}
                    itemStyle={{ color: '#fff', fontSize: '12px' }}
                  />
                  <Line type="monotone" dataKey="apps" stroke="#6366f1" strokeWidth={3} dot={{ fill: '#6366f1', r: 4 }} activeDot={{ r: 6 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
         </div>
      </div>
    </div>
  );
}
