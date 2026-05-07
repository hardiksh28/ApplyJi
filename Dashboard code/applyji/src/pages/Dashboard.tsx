import React from 'react';
import { 
  TrendingUp, 
  TrendingDown, 
  Plus, 
  MoreVertical, 
  Clock, 
  CheckCircle2,
  Calendar as CalendarIcon,
  Zap
} from 'lucide-react';
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
import { mockApplications, mockTasks } from '../data/mockData';
import { cn } from '../lib/utils';

const stats = [
  { label: 'Applied', value: '42', trend: '+12%', isUp: true },
  { label: 'Interviews', value: '8', trend: '+2', isUp: true },
  { label: 'Offers', value: '2', trend: '0', isUp: null },
  { label: 'Response Rate', value: '19.4%', trend: '-2.1%', isUp: false },
];

const activityData = [
  { day: 'Mon', count: 4 },
  { day: 'Tue', count: 7 },
  { day: 'Wed', count: 5 },
  { day: 'Thu', count: 8 },
  { day: 'Fri', count: 6 },
  { day: 'Sat', count: 2 },
  { day: 'Sun', count: 1 },
];

const funnelData = [
  { stage: 'Applied', count: 42, color: '#8B5CF6' },
  { stage: 'Screening', count: 15, color: '#A78BFA' },
  { stage: 'Interview', count: 8, color: '#C084FC' },
  { stage: 'Offer', count: 2, color: '#D8B4FE' },
];

export function Dashboard({ onAddClick }: { onAddClick: () => void }) {
  return (
    <div className="space-y-8 pb-10">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-display font-bold text-white mb-1">Welcome back, Hardik!</h1>
          <p className="text-slate-400">You have 2 interviews coming up this week.</p>
        </div>
        <button 
          onClick={onAddClick}
          className="flex items-center gap-2 px-5 py-2.5 bg-brand-primary hover:bg-brand-secondary text-white font-semibold rounded-xl transition-all shadow-lg shadow-brand-primary/20 cursor-pointer"
        >
          <Plus className="w-5 h-5" />
          <span>Add Application</span>
        </button>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <div key={stat.label} className="bg-zinc-900 border border-zinc-800 p-5 rounded-2xl">
            <p className="text-[10px] uppercase font-bold text-zinc-500 tracking-widest mb-1">{stat.label}</p>
            <div className="flex items-baseline gap-2">
              <h3 className="text-2xl font-bold text-white">{stat.value}</h3>
              {stat.isUp !== null && (
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
            <div className="text-2xl font-display font-bold text-white mb-1">12 Days</div>
            <p className="text-xs text-slate-400">Keep it up! Your personal best is 15 days.</p>
          </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Applications */}
        <div className="glass-card p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-display font-semibold text-white">Recent Applications</h3>
            <button className="text-sm text-brand-primary hover:text-brand-secondary font-medium transition-colors cursor-pointer">View All</button>
          </div>
          <div className="space-y-4">
            {mockApplications.slice(0, 4).map((app) => (
              <div key={app.id} className="flex items-center justify-between p-3 rounded-xl hover:bg-white/5 transition-all group cursor-pointer border border-transparent hover:border-border-dark">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-lg bg-surface-dark flex items-center justify-center text-white font-bold border border-border-dark group-hover:border-brand-primary/50 transition-colors">
                    {app.company[0]}
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-white">{app.role}</h4>
                    <p className="text-xs text-slate-500">{app.company} • {app.location}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <span className={cn(
                    "text-[10px] uppercase tracking-wider font-bold px-2.5 py-1 rounded-full",
                    app.status === 'Interview' ? "text-amber-400 bg-amber-400/10" : 
                    app.status === 'Offer' ? "text-emerald-400 bg-emerald-400/10" :
                    app.status === 'Screening' ? "text-blue-400 bg-blue-400/10" :
                    "text-slate-400 bg-slate-400/10"
                  )}>
                    {app.status}
                  </span>
                  <button className="p-1 text-slate-500 hover:text-white transition-colors cursor-pointer">
                    <MoreVertical className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Today's Tasks */}
        <div className="glass-card p-6 text-white">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-display font-semibold text-white">Today's Tasks</h3>
            <button className="text-sm text-brand-primary hover:text-brand-secondary font-medium transition-colors cursor-pointer">View All</button>
          </div>
          <div className="space-y-3">
            {mockTasks.map((task) => (
              <div key={task.id} className="flex items-center gap-4 p-3 rounded-xl bg-bg-dark/50 border border-border-dark group hover:border-slate-700 transition-all cursor-pointer">
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
                      {task.dueDate}
                    </div>
                    {task.priority === 'High' && (
                      <span className="text-[10px] text-rose-400 font-semibold px-1.5 py-0.5 rounded bg-rose-400/10">High</span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
          <button className="w-full mt-6 py-3 border border-dashed border-border-dark rounded-xl text-slate-500 text-sm font-medium hover:text-white hover:border-slate-600 transition-all cursor-pointer">
            + Create New Task
          </button>
        </div>
      </div>
    </div>
  );
}
