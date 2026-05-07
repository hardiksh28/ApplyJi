import React from 'react';
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
  ChevronDown
} from 'lucide-react';
import { cn } from '../lib/utils';

const responseRateData = [
  { month: 'Jan', rate: 12 },
  { month: 'Feb', rate: 15 },
  { month: 'Mar', rate: 21 },
  { month: 'Apr', rate: 18 },
  { month: 'May', rate: 19.4 },
];

const statusDonutData = [
  { name: 'Applied', value: 42, color: '#8B5CF6' },
  { name: 'Interview', value: 8, color: '#C084FC' },
  { name: 'Offer', value: 2, color: '#10B981' },
  { name: 'Rejected', value: 15, color: '#EF4444' },
];

const heatmapData = [
  { day: 'Mon', power: 85 },
  { day: 'Tue', power: 92 },
  { day: 'Wed', power: 78 },
  { day: 'Thu', power: 65 },
  { day: 'Fri', power: 40 },
  { day: 'Sat', power: 20 },
  { day: 'Sun', power: 15 },
];

export function Insights() {
  return (
    <div className="space-y-8 pb-10">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-display font-bold text-white mb-1">Insights & Analytics</h1>
          <p className="text-slate-400">Deep dive into your application performance</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 bg-surface-dark border border-border-dark rounded-xl text-slate-300 hover:text-white transition-all cursor-pointer">
          <Calendar className="w-4 h-4" />
          <span>Last 3 Months</span>
          <ChevronDown className="w-3.5 h-3.5" />
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        {[
          { label: 'Avg. Response Time', value: '4.2 Days', icon: Clock, color: 'text-blue-400', bg: 'bg-blue-400/10' },
          { label: 'Interview Success', value: '38%', icon: Target, color: 'text-brand-primary', bg: 'bg-brand-primary/10' },
          { label: 'Application Goal', value: '85%', icon: Award, color: 'text-amber-400', bg: 'bg-amber-400/10' },
          { label: 'Weekly Growth', value: '+14%', icon: TrendingUp, color: 'text-emerald-400', bg: 'bg-emerald-400/10' },
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
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={responseRateData}>
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
          </div>
        </div>

        {/* Status Distribution Donut */}
        <div className="glass-card p-6">
          <h3 className="text-lg font-display font-bold text-white mb-6">Status Distribution</h3>
          <div className="h-[300px] w-full flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
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
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 glass-card p-6">
          <h3 className="text-lg font-display font-bold text-white mb-6">Best Day to Apply</h3>
          <div className="space-y-4">
             {heatmapData.map((item) => (
               <div key={item.day} className="flex items-center gap-4">
                 <span className="text-xs font-bold text-slate-500 w-8">{item.day}</span>
                 <div className="flex-1 h-3 bg-surface-dark rounded-full overflow-hidden flex">
                    <div className="h-full bg-brand-primary" style={{ width: `${item.power}%` }}></div>
                 </div>
                 <span className="text-[10px] font-bold text-slate-400">{item.power}% Success</span>
               </div>
             ))}
          </div>
          <p className="mt-8 text-xs text-slate-500 italic p-3 bg-surface-dark rounded-lg border border-border-dark italic">
            Pro Tip: Your applications submitted on Tuesdays have a 92% higher chance of receiving a first response.
          </p>
        </div>

        <div className="lg:col-span-2 glass-card p-6">
           <h3 className="text-lg font-display font-bold text-white mb-8">Quarterly Goal Tracker</h3>
           <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
              {[
                { label: 'Applications', current: 42, target: 50 },
                { label: 'Interviews', current: 8, target: 12 },
                { label: 'Networking', current: 15, target: 20 },
                { label: 'Referrals', current: 4, target: 5 },
              ].map((goal) => (
                <div key={goal.label} className="flex flex-col items-center gap-4">
                  <div className="relative w-20 h-20">
                    <svg className="w-full h-full transform -rotate-90">
                      <circle cx="40" cy="40" r="32" stroke="currentColor" strokeWidth="6" fill="transparent" className="text-border-dark" />
                      <circle 
                        cx="40" cy="40" r="32" stroke="currentColor" strokeWidth="6" fill="transparent" 
                        strokeDasharray={2 * Math.PI * 32}
                        strokeDashoffset={2 * Math.PI * 32 * (1 - goal.current / goal.target)}
                        className="text-brand-primary" 
                      />
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center text-xs font-bold text-white">
                      {Math.round((goal.current / goal.target) * 100)}%
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
