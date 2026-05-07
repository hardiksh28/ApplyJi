import React, { useState, useEffect } from 'react';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart, 
  Pie, 
  Cell,
  AreaChart,
  Area
} from 'recharts';
import { 
  BarChart3, 
  Target, 
  Clock, 
  TrendingUp, 
  Calendar,
  Award,
  ChevronDown,
  Sparkles
} from 'lucide-react';
import { cn } from '../lib/utils';
import { supabase } from '../lib/supabase/client';
import { LoadingSpinner, ErrorState, EmptyState } from '../components/CommonUI';

export function Insights() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [applications, setApplications] = useState<any[]>([]);
  const [tasks, setTasks] = useState<any[]>([]);
  const [aiStats, setAiStats] = useState({ resumes: 0, letters: 0, analysis: 0 });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const [appsRes, tasksRes, resumeRes, letterRes, aiRes] = await Promise.all([
        supabase.from('applications').select('*').order('applied_at', { ascending: false }),
        supabase.from('tasks').select('*'),
        supabase.from('generated_resumes').select('id', { count: 'exact', head: true }),
        supabase.from('generated_cover_letters').select('id', { count: 'exact', head: true }),
        supabase.from('ai_usage_logs').select('id', { count: 'exact', head: true }),
      ]);

      if (appsRes.error) throw appsRes.error;
      if (appsRes.data) setApplications(appsRes.data);
      if (tasksRes.data) setTasks(tasksRes.data);
      setAiStats({
        resumes: resumeRes.count || 0,
        letters: letterRes.count || 0,
        analysis: aiRes.count || 0
      });
    } catch (err: any) {
      setError(err.message || 'Failed to load insights data');
    } finally {
      setLoading(false);
    }
  };

  // Compute real stats
  const totalApps = applications.length;
  const interviewCount = applications.filter(a => ['interviewing', 'interview'].includes((a.status || '').toLowerCase())).length;
  const offerCount = applications.filter(a => ['offer', 'offered'].includes((a.status || '').toLowerCase())).length;
  const rejectedCount = applications.filter(a => (a.status || '').toLowerCase() === 'rejected').length;
  const savedCount = applications.filter(a => (a.status || '').toLowerCase() === 'saved').length;
  const appliedCount = applications.filter(a => (a.status || '').toLowerCase() === 'applied').length;
  const screeningCount = applications.filter(a => (a.status || '').toLowerCase() === 'screening').length;

  const responseRate = totalApps > 0 ? Math.round(((interviewCount + offerCount) / totalApps) * 100) : 0;
  const interviewSuccess = interviewCount > 0 ? Math.round((offerCount / interviewCount) * 100) : 0;

  // Compute avg response time (days between applied_at and updated_at for interviewing/offer apps)
  const respondedApps = applications.filter(a => 
    ['interviewing', 'interview', 'offer', 'offered'].includes((a.status || '').toLowerCase()) &&
    a.applied_at && a.updated_at
  );
  const avgResponseDays = respondedApps.length > 0 
    ? (respondedApps.reduce((sum, a) => {
        const applied = new Date(a.applied_at).getTime();
        const updated = new Date(a.updated_at).getTime();
        return sum + Math.max(0, (updated - applied) / (1000 * 60 * 60 * 24));
      }, 0) / respondedApps.length).toFixed(1)
    : 'N/A';

  // Monthly trend data from real applications
  const monthlyData = (() => {
    const months: Record<string, number> = {};
    const responded: Record<string, number> = {};
    
    applications.forEach(app => {
      if (!app.applied_at) return;
      const date = new Date(app.applied_at);
      const key = date.toLocaleString('default', { month: 'short' });
      months[key] = (months[key] || 0) + 1;
      
      if (['interviewing', 'interview', 'offer', 'offered'].includes((app.status || '').toLowerCase())) {
        responded[key] = (responded[key] || 0) + 1;
      }
    });

    return Object.entries(months).map(([month, total]) => ({
      month,
      rate: total > 0 ? Math.round(((responded[month] || 0) / total) * 100) : 0,
    }));
  })();

  // Status distribution for donut
  const statusDonutData = [
    { name: 'Applied', value: appliedCount, color: '#8B5CF6' },
    { name: 'Screening', value: screeningCount, color: '#6366F1' },
    { name: 'Interview', value: interviewCount, color: '#C084FC' },
    { name: 'Offer', value: offerCount, color: '#10B981' },
    { name: 'Rejected', value: rejectedCount, color: '#EF4444' },
    { name: 'Saved', value: savedCount, color: '#64748B' },
  ].filter(d => d.value > 0);

  // Day of week analysis from real data
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const dayStats = dayNames.map(day => {
    const dayApps = applications.filter(a => {
      if (!a.applied_at) return false;
      return dayNames[new Date(a.applied_at).getDay()] === day;
    });
    const dayResponded = dayApps.filter(a => 
      ['interviewing', 'interview', 'offer', 'offered'].includes((a.status || '').toLowerCase())
    );
    return {
      day,
      power: dayApps.length > 0 ? Math.round((dayResponded.length / dayApps.length) * 100) : 0,
      total: dayApps.length,
    };
  });

  // Weekly growth
  const thisWeekApps = applications.filter(a => {
    if (!a.applied_at) return false;
    const d = new Date(a.applied_at);
    const now = new Date();
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    return d >= weekAgo;
  }).length;

  const lastWeekApps = applications.filter(a => {
    if (!a.applied_at) return false;
    const d = new Date(a.applied_at);
    const now = new Date();
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const twoWeeksAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);
    return d >= twoWeeksAgo && d < weekAgo;
  }).length;

  const weeklyGrowth = lastWeekApps > 0 ? Math.round(((thisWeekApps - lastWeekApps) / lastWeekApps) * 100) : 0;

  if (loading) return <LoadingSpinner fullPage />;
  if (error) return <div className="p-8"><ErrorState message={error} onRetry={fetchData} /></div>;

  if (applications.length === 0) {
    return (
      <div className="space-y-8 pb-10">
        <div>
          <h1 className="text-3xl font-display font-bold text-white mb-1">Insights & Analytics</h1>
          <p className="text-slate-400">Deep dive into your application performance</p>
        </div>
        <EmptyState 
          title="No data yet" 
          message="Start tracking your applications to see insights and analytics about your job search performance."
          actionLabel="Add Application"
          onAction={() => window.location.href = '/applications'}
        />
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-10">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-display font-bold text-white mb-1">Insights & Analytics</h1>
          <p className="text-slate-400">Deep dive into your application performance</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 bg-surface-dark border border-border-dark rounded-xl text-slate-300 hover:text-white transition-all cursor-pointer">
          <Calendar className="w-4 h-4" />
          <span>All Time</span>
          <ChevronDown className="w-3.5 h-3.5" />
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        {[
          { label: 'Avg. Response Time', value: typeof avgResponseDays === 'string' ? avgResponseDays : `${avgResponseDays} Days`, icon: Clock, color: 'text-blue-400', bg: 'bg-blue-400/10' },
          { label: 'Interview Success', value: `${interviewSuccess}%`, icon: Target, color: 'text-brand-primary', bg: 'bg-brand-primary/10' },
          { label: 'AI Efficiency', value: `${aiStats.resumes + aiStats.letters + aiStats.analysis}`, icon: Sparkles, color: 'text-amber-400', bg: 'bg-amber-400/10' },
          { label: 'Weekly Growth', value: `${weeklyGrowth >= 0 ? '+' : ''}${weeklyGrowth}%`, icon: TrendingUp, color: 'text-emerald-400', bg: 'bg-emerald-400/10' },
        ].map((item) => (
          <div key={item.label} className="glass-card p-5">
            <div className="flex items-center gap-3 mb-3">
              <div className={cn("p-2 rounded-lg", item.bg)}>
                <item.icon className={cn("w-4 h-4", item.color)} />
              </div>
              <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">{item.label}</span>
            </div>
            <div className="text-2xl font-display font-bold text-white">{item.value}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Response Rate Line Chart */}
        <div className="glass-card p-6">
          <h3 className="text-lg font-display font-bold text-white mb-6">Response Rate (%)</h3>
          <div className="h-[300px] w-full">
            {monthlyData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={monthlyData}>
                  <defs>
                    <linearGradient id="colorRate" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#8B5CF6" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#8B5CF6" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#1F1F23" />
                  <XAxis dataKey="month" stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} dy={10} />
                  <YAxis stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} />
                  <Tooltip contentStyle={{ backgroundColor: '#121217', borderColor: '#1F1F23', borderRadius: '8px', color: '#fff' }} />
                  <Area type="monotone" dataKey="rate" stroke="#8B5CF6" strokeWidth={3} fillOpacity={1} fill="url(#colorRate)" />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-slate-500 text-sm">Not enough data yet</div>
            )}
          </div>
        </div>

        {/* Status Distribution Donut */}
        <div className="glass-card p-6">
          <h3 className="text-lg font-display font-bold text-white mb-6">Status Distribution</h3>
          <div className="h-[300px] w-full flex items-center justify-center">
            {statusDonutData.length > 0 ? (
              <>
                <ResponsiveContainer width="60%" height="100%">
                  <PieChart>
                    <Pie
                      data={statusDonutData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={100}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {statusDonutData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{ backgroundColor: '#121217', borderColor: '#1F1F23', borderRadius: '8px', color: '#fff' }} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="flex flex-col gap-3 justify-center">
                   {statusDonutData.map((item) => (
                     <div key={item.name} className="flex items-center gap-2">
                       <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }}></div>
                       <span className="text-xs font-semibold text-slate-300">{item.name}</span>
                       <span className="text-xs font-medium text-slate-500 ml-auto">{item.value}</span>
                     </div>
                   ))}
                </div>
              </>
            ) : (
              <div className="text-slate-500 text-sm">No status data available</div>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 glass-card p-6">
          <h3 className="text-lg font-display font-bold text-white mb-6">Best Day to Apply</h3>
          <div className="space-y-4">
             {dayStats.map((item) => (
               <div key={item.day} className="flex items-center gap-4">
                 <span className="text-xs font-bold text-slate-500 w-8">{item.day}</span>
                 <div className="flex-1 h-3 bg-surface-dark rounded-full overflow-hidden flex">
                    <div className="h-full bg-brand-primary transition-all duration-500" style={{ width: `${item.power}%` }}></div>
                 </div>
                 <span className="text-[10px] font-bold text-slate-400 w-20 text-right">{item.power}% ({item.total})</span>
               </div>
             ))}
          </div>
          {dayStats.some(d => d.power > 0) && (
            <p className="mt-8 text-xs text-slate-500 italic p-3 bg-surface-dark rounded-lg border border-border-dark">
              Pro Tip: Your applications submitted on {dayStats.reduce((best, d) => d.power > best.power ? d : best, dayStats[0]).day}s have the highest response rate.
            </p>
          )}
        </div>

        <div className="lg:col-span-2 glass-card p-6">
           <h3 className="text-lg font-display font-bold text-white mb-8">Goal Tracker</h3>
           <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
              {[
                { label: 'Applications', current: totalApps, target: Math.max(totalApps + 10, 50) },
                { label: 'Interviews', current: interviewCount, target: Math.max(interviewCount + 4, 12) },
                { label: 'Tasks Done', current: tasks.filter(t => t.completed).length, target: Math.max(tasks.length, 10) },
                { label: 'Offers', current: offerCount, target: Math.max(offerCount + 1, 3) },
              ].map((goal) => (
                <div key={goal.label} className="flex flex-col items-center gap-4">
                  <div className="relative w-20 h-20">
                    <svg className="w-full h-full transform -rotate-90">
                      <circle cx="40" cy="40" r="32" stroke="currentColor" strokeWidth="6" fill="transparent" className="text-border-dark" />
                      <circle 
                        cx="40" cy="40" r="32" stroke="currentColor" strokeWidth="6" fill="transparent" 
                        strokeDasharray={2 * Math.PI * 32}
                        strokeDashoffset={2 * Math.PI * 32 * (1 - Math.min(goal.current / goal.target, 1))}
                        className="text-brand-primary transition-all duration-700" 
                      />
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center text-xs font-bold text-white">
                      {goal.target > 0 ? Math.round((goal.current / goal.target) * 100) : 0}%
                    </div>
                  </div>
                  <div className="text-center">
                    <h4 className="text-xs font-bold text-white mb-1 uppercase tracking-widest">{goal.label}</h4>
                    <p className="text-[10px] text-slate-500 font-medium">{goal.current} / {goal.target}</p>
                  </div>
                </div>
              ))}
           </div>
        </div>
      </div>
    </div>
  );
}
