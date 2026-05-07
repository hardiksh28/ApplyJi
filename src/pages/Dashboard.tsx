import React, { useEffect, useState } from 'react';
import { 
  TrendingUp, 
  TrendingDown, 
  Plus, 
  MoreVertical, 
  Clock, 
  CheckCircle2,
  Calendar as CalendarIcon,
  Zap,
  RefreshCcw,
  PlusCircle
} from 'lucide-react';
import { LoadingSpinner, EmptyState } from '../components/CommonUI';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Cell
} from 'recharts';
import { ErrorState } from '../components/CommonUI';
import { cn } from '../lib/utils';
import { supabase } from '../lib/supabase/client';

export function Dashboard({ onAddClick }: { onAddClick: () => void }) {
  const [profile, setProfile] = useState<any>(null);
  const [applications, setApplications] = useState<any[]>([]);
  const [tasks, setTasks] = useState<any[]>([]);
  const [syncing, setSyncing] = useState(false);
  const [syncProgress, setSyncProgress] = useState(0);
  const [streak, setStreak] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState([
    { label: 'Applied', value: '0', trend: '+0%', isUp: true },
    { label: 'Interviews', value: '0', trend: '+0', isUp: true },
    { label: 'Offers', value: '0', trend: '0', isUp: null },
    { label: 'Response Rate', value: '0%', trend: '0%', isUp: false },
  ]);

  const fetchDashboardData = async () => {
    setError(null);
    try {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;

    const { data: profileData } = await supabase.from('profiles').select('*').eq('id', session.user.id).single();
    if (profileData) setProfile(profileData);

    const { data: apps } = await supabase
      .from('applications')
      .select('*')
      .order('applied_at', { ascending: false });

    if (apps) {
      setApplications(apps);
      const applied = apps.length;
      const interviewing = apps.filter(a => a.status?.toLowerCase() === 'interviewing').length;
      const offers = apps.filter(a => a.status?.toLowerCase() === 'offer').length;
      const responseRate = applied > 0 ? Math.round(((interviewing + offers) / applied) * 100) : 0;

      setStats([
        { label: 'Applied', value: applied.toString(), trend: '', isUp: true },
        { label: 'Interviews', value: interviewing.toString(), trend: '', isUp: true },
        { label: 'Offers', value: offers.toString(), trend: '', isUp: null },
        { label: 'Response Rate', value: `${responseRate}%`, trend: '', isUp: responseRate > 0 },
      ]);

      // Calculate simple streak based on consecutive days of applying
      let currentStreak = 0;
      const sortedApps = [...apps].sort((a, b) => new Date(b.applied_at).getTime() - new Date(a.applied_at).getTime());
      
      if (sortedApps.length > 0) {
        const today = new Date();
        today.setHours(0,0,0,0);
        let checkDate = new Date(today);
        
        for (let i = 0; i < 30; i++) { // check up to 30 days
          const hasAppOnDate = sortedApps.some(a => {
            const d = new Date(a.applied_at);
            d.setHours(0,0,0,0);
            return d.getTime() === checkDate.getTime();
          });
          
          if (hasAppOnDate) {
            currentStreak++;
            checkDate.setDate(checkDate.getDate() - 1);
          } else {
            // Allow skipping today if they haven't applied yet today but had a streak yesterday
            if (i === 0) {
              checkDate.setDate(checkDate.getDate() - 1);
            } else {
              break;
            }
          }
        }
      }
      setStreak(currentStreak);
    }

    const { data: userTasks } = await supabase
      .from('tasks')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(5);
    
    if (userTasks) setTasks(userTasks);
    } catch (err: any) {
      setError(err.message || 'Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const toggleTask = async (task: any) => {
    const { error } = await supabase.from('tasks').update({ completed: !task.completed }).eq('id', task.id);
    if (!error) {
      setTasks(tasks.map(t => t.id === task.id ? { ...t, completed: !task.completed } : t));
    }
  };

  const handleSync = async () => {
    setSyncing(true);
    setSyncProgress(0);

    const progressInterval = setInterval(() => {
      setSyncProgress(prev => (prev >= 90 ? prev : prev + 10));
    }, 800);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      const response = await fetch('/api/sync/gmail', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session?.access_token}`
        }
      });
      if (!response.ok) throw new Error('Sync failed');
      
      setSyncProgress(100);
      await fetchDashboardData();
    } catch (error: any) {
      console.error('Sync failed:', error);
      alert('Sync failed: ' + (error.message || 'Unknown error'));
    } finally {
      clearInterval(progressInterval);
      setTimeout(() => {
        setSyncing(false);
        setSyncProgress(0);
      }, 500);
    }
  };

  const funnelData = [
    { stage: 'Applied', count: applications.length, color: '#8B5CF6' },
    { stage: 'Screening', count: Math.floor(applications.length * 0.4), color: '#A78BFA' }, // Simulated for now
    { stage: 'Interview', count: applications.filter(a => a.status?.toLowerCase() === 'interviewing').length, color: '#C084FC' },
    { stage: 'Offer', count: applications.filter(a => a.status?.toLowerCase() === 'offer').length, color: '#D8B4FE' },
  ];

  const activityData = [
    { day: 'Mon', count: 4 },
    { day: 'Tue', count: 7 },
    { day: 'Wed', count: 5 },
    { day: 'Thu', count: applications.length > 0 ? 8 : 0 },
    { day: 'Fri', count: 6 },
    { day: 'Sat', count: 2 },
    { day: 'Sun', count: 1 },
  ];

  if (loading) return <LoadingSpinner fullPage />;
  if (error) return <div className="p-8"><ErrorState message={error} onRetry={fetchDashboardData} /></div>;

  return (
    <div className="space-y-8 pb-10">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-display font-bold text-white mb-1">
            Welcome back{profile?.full_name ? `, ${profile.full_name.split(' ')[0]}` : ''}!
          </h1>
          <p className="text-slate-400">
            {applications.length} applications tracked so far.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={handleSync}
            disabled={syncing}
            className="relative overflow-hidden flex items-center gap-2 px-5 py-2.5 bg-zinc-900 border border-zinc-800 hover:bg-zinc-800 text-white font-semibold rounded-xl transition-all disabled:opacity-50 cursor-pointer"
          >
            {syncing && (
              <div 
                className="absolute bottom-0 left-0 h-1 bg-brand-primary transition-all duration-300 ease-out"
                style={{ width: `${syncProgress}%` }}
              />
            )}
            <RefreshCcw className={cn("w-4 h-4", syncing && "animate-spin")} />
            <span>{syncing ? `Syncing... ${syncProgress}%` : 'Sync Gmail'}</span>
          </button>
          <button 
            onClick={onAddClick}
            className="flex items-center gap-2 px-5 py-2.5 bg-brand-primary hover:bg-brand-secondary text-white font-semibold rounded-xl transition-all shadow-lg shadow-brand-primary/20 cursor-pointer whitespace-nowrap"
          >
            <Plus className="w-5 h-5" />
            <span className="hidden sm:inline">Add Application</span>
            <span className="sm:hidden">Add</span>
          </button>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <div key={stat.label} className="bg-zinc-900 border border-zinc-800 p-5 rounded-2xl">
            <p className="text-[10px] uppercase font-bold text-zinc-500 tracking-widest mb-1">{stat.label}</p>
            <div className="flex items-baseline gap-2">
              <h3 className="text-2xl font-bold text-white">{stat.value}</h3>
              {stat.trend && (
                <span className={cn(
                  "text-[10px] font-bold",
                  stat.isUp ? "text-emerald-500" : "text-rose-500"
                )}>
                  {stat.isUp ? '+' : ''}{stat.trend}
                </span>
              )}
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Pipeline Health (Bento Style) */}
        <div className="lg:col-span-2 bg-zinc-900 border border-zinc-800 rounded-2xl p-8 flex flex-col min-h-[340px]">
          <div className="flex justify-between items-center mb-8">
            <div>
              <h4 className="text-lg font-bold text-white">Pipeline Health</h4>
              <p className="text-xs text-zinc-500">Track conversion across recruitment stages</p>
            </div>
            <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest bg-zinc-800 px-2 py-1 rounded">Last 30 days</span>
          </div>
          
          <div className="flex-1 flex items-end gap-2 pb-2">
            {funnelData.map((item, idx) => (
              <div key={item.stage} className="flex-1 flex flex-col items-center gap-3 group">
                <span className="text-xs font-bold text-zinc-400 group-hover:text-white transition-colors">{item.count}</span>
                <div 
                  className="w-full rounded-t-lg transition-all duration-700 hover:brightness-110" 
                  style={{ 
                    height: `${(item.count / funnelData[0].count) * 100}%`,
                    backgroundColor: `${item.color}20`,
                    borderTop: `2px solid ${item.color}`
                  }}
                />
                <span className="text-[9px] uppercase font-bold text-zinc-500 tracking-tighter text-center">{item.stage}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Weekly Activity (Bento style) */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-8 flex flex-col">
          <h4 className="text-lg font-bold text-white mb-2">Weekly Activity</h4>
          <p className="text-xs text-zinc-500 mb-8 font-medium">Daily submission frequency</p>
          
          <div className="flex-1 flex items-end justify-between gap-1">
            {activityData.map((item, idx) => (
              <div key={item.day} className="flex-1 flex flex-col items-center gap-2">
                <div 
                  className={cn(
                    "w-full rounded-t-sm transition-all duration-500",
                    idx === 3 ? "bg-brand-primary" : "bg-zinc-800"
                  )} 
                  style={{ height: `${(item.count / 10) * 100}%` }}
                />
                <span className="text-[9px] font-bold text-zinc-500">{item.day[0]}</span>
              </div>
            ))}
          </div>
          
          <div className="mt-8 flex items-center justify-between text-[10px] font-bold uppercase text-zinc-600 tracking-widest pt-4 border-t border-zinc-800">
             <span>Mon</span>
             <span>Sun</span>
          </div>
        </div>
      </div>

          <div className="mt-10 p-4 rounded-xl bg-gradient-to-br from-brand-primary/20 to-transparent border border-brand-primary/20">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 bg-brand-primary rounded-lg text-white">
                <Zap className="w-4 h-4 fill-current" />
              </div>
              <span className="text-sm font-semibold text-white">Apply Streak</span>
            </div>
            <div className="text-2xl font-display font-bold text-white mb-1">{streak} Days</div>
            <p className="text-xs text-slate-400">Keep applying every day to grow your streak!</p>
          </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Applications */}
        <div className="glass-card p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-display font-semibold text-white">Recent Applications</h3>
            <button className="text-sm text-brand-primary hover:text-brand-secondary font-medium transition-colors cursor-pointer">View All</button>
          </div>
          <div className="space-y-4">
            {applications.length > 0 ? applications.slice(0, 4).map((app) => (
              <div key={app.id} className="flex items-center justify-between p-3 rounded-xl hover:bg-white/5 transition-all group cursor-pointer border border-transparent hover:border-border-dark">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-lg bg-surface-dark flex items-center justify-center text-white font-bold border border-border-dark group-hover:border-brand-primary/50 transition-colors uppercase">
                    {app.company_name ? app.company_name[0] : '?'}
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-white">{app.job_title}</h4>
                    <p className="text-xs text-slate-500">{app.company_name} {app.location ? `• ${app.location}` : ''}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <span className={cn(
                    "text-[10px] uppercase tracking-wider font-bold px-2.5 py-1 rounded-full",
                    app.status?.toLowerCase() === 'interviewing' ? "text-amber-400 bg-amber-400/10" : 
                    app.status?.toLowerCase() === 'offer' ? "text-emerald-400 bg-emerald-400/10" :
                    app.status?.toLowerCase() === 'screening' ? "text-blue-400 bg-blue-400/10" :
                    "text-slate-400 bg-slate-400/10"
                  )}>
                    {app.status || 'Applied'}
                  </span>
                  <button className="p-1 text-slate-500 hover:text-white transition-colors cursor-pointer">
                    <MoreVertical className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )) : (
              <EmptyState 
                title="No applications yet" 
                message="Sync your Gmail or add your first application manually to start tracking."
                actionLabel="Add Application"
                onAction={onAddClick}
              />
            )}
          </div>
        </div>

        {/* Today's Tasks */}
        <div className="glass-card p-6 text-white">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-display font-semibold text-white">Today's Tasks</h3>
            <button className="text-sm text-brand-primary hover:text-brand-secondary font-medium transition-colors cursor-pointer">View All</button>
          </div>
          <div className="space-y-3">
            {tasks.length > 0 ? tasks.map((task) => (
              <div key={task.id} onClick={() => toggleTask(task)} className="flex items-center gap-4 p-3 rounded-xl bg-bg-dark/50 border border-border-dark group hover:border-slate-700 transition-all cursor-pointer">
                <button className={cn(
                  "w-5 h-5 rounded flex items-center justify-center border transition-all cursor-pointer",
                  task.completed ? "bg-brand-primary border-brand-primary" : "border-slate-700 hover:border-brand-primary"
                )}>
                  {task.completed && <CheckCircle2 className="w-4 h-4 text-white" />}
                </button>
                <div className="flex-1 min-w-0">
                  <h4 className={cn(
                    "text-sm font-medium transition-all",
                    task.completed ? "text-slate-500 line-through" : "text-white"
                  )}>
                    {task.title}
                  </h4>
                  <div className="flex items-center gap-3 mt-1">
                    <div className="flex items-center gap-1 text-[10px] text-slate-500">
                      <Clock className="w-3 h-3" />
                      {task.due_date ? new Date(task.due_date).toLocaleDateString() : 'No Due Date'}
                    </div>
                    {task.priority === 'High' && (
                      <span className="text-[10px] text-rose-400 font-semibold px-1.5 py-0.5 rounded bg-rose-400/10">High</span>
                    )}
                  </div>
                </div>
              </div>
            )) : (
               <p className="text-sm text-slate-500 text-center py-4">No tasks yet. Create one to get started!</p>
            )}
          </div>
          <button onClick={async () => {
            const title = window.prompt("Enter new task title:");
            if (!title) return;
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) return;
            const { data } = await supabase.from('tasks').insert({
              user_id: session.user.id,
              title: title,
              priority: 'Medium',
              completed: false,
              due_date: new Date().toISOString()
            }).select().single();
            if (data) setTasks([data, ...tasks].slice(0, 5));
          }} className="w-full mt-6 py-3 border border-dashed border-border-dark rounded-xl text-slate-500 text-sm font-medium hover:text-white hover:border-slate-600 transition-all cursor-pointer">
            + Create New Task
          </button>
        </div>
      </div>
    </div>
  );
}
