import React, { useState } from 'react';
import { 
  ChevronLeft, 
  ChevronRight, 
  Clock, 
  MapPin, 
  Monitor, 
  Video, 
  Phone,
  FileText,
  MessageCircle,
  MoreVertical,
  Calendar as CalendarIcon
} from 'lucide-react';
import { cn } from '../lib/utils';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, addMonths, subMonths } from 'date-fns';

const interviews = [
  { 
    id: '1', 
    company: 'Google', 
    role: 'SWE III', 
    type: 'Technical Round', 
    format: 'Video', 
    date: new Date(2026, 4, 10, 14, 30), 
    duration: '60 min' 
  },
  { 
    id: '2', 
    company: 'Stripe', 
    role: 'Frontend Lead', 
    type: 'Screening', 
    format: 'Phone', 
    date: new Date(2026, 4, 15, 10, 0), 
    duration: '30 min' 
  },
];

export function Interviews() {
  const [currentDate, setCurrentDate] = useState(new Date(2026, 4, 1)); // May 2026
  
  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const calendarDays = eachDayOfInterval({
    start: monthStart,
    end: monthEnd,
  });

  const nextMonth = () => setCurrentDate(addMonths(currentDate, 1));
  const prevMonth = () => setCurrentDate(subMonths(currentDate, 1));

  return (
    <div className="space-y-8 h-full flex flex-col">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-display font-bold text-white mb-1">Interviews</h1>
          <p className="text-slate-400">Keep track of your interview schedule and preparation</p>
        </div>
        <div className="flex items-center gap-2 bg-surface-dark border border-border-dark p-1 rounded-xl">
          <button className="px-4 py-1.5 rounded-lg bg-brand-primary text-white text-sm font-bold shadow-lg shadow-brand-primary/20">Calendar</button>
          <button className="px-4 py-1.5 rounded-lg text-slate-400 hover:text-white transition-all text-sm font-bold">List</button>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8 flex-1 min-h-0">
        {/* Calendar Column */}
        <div className="xl:col-span-2 flex flex-col gap-6">
          <div className="glass-card flex-1 flex flex-col overflow-hidden">
            <div className="p-6 border-b border-border-dark flex items-center justify-between">
              <h2 className="text-xl font-display font-bold text-white uppercase tracking-wider">
                {format(currentDate, 'MMMM yyyy')}
              </h2>
              <div className="flex items-center gap-2">
                <button onClick={prevMonth} className="p-2 text-slate-400 hover:text-white hover:bg-white/5 rounded-lg transition-all cursor-pointer">
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <button onClick={() => setCurrentDate(new Date(2026, 4, 1))} className="px-3 py-1 text-xs font-bold text-slate-400 hover:text-white transition-colors cursor-pointer">Today</button>
                <button onClick={nextMonth} className="p-2 text-slate-400 hover:text-white hover:bg-white/5 rounded-lg transition-all cursor-pointer">
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>
            </div>
            
            <div className="grid grid-cols-7 border-b border-border-dark">
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                <div key={day} className="py-3 text-center text-[10px] font-bold text-slate-500 uppercase tracking-widest border-r last:border-r-0 border-border-dark">
                  {day}
                </div>
              ))}
            </div>

            <div className="grid grid-cols-7 flex-1">
              {calendarDays.map((day, idx) => {
                const dayInterviews = interviews.filter(i => isSameDay(i.date, day));
                return (
                  <div 
                    key={day.toString()} 
                    className={cn(
                      "min-h-[100px] p-2 border-r border-b border-border-dark transition-all",
                      !isSameMonth(day, currentDate) ? "bg-bg-dark/20 opacity-30" : "hover:bg-white/5",
                      idx % 7 === 6 ? "border-r-0" : ""
                    )}
                  >
                    <span className={cn(
                      "text-xs font-bold inline-block w-6 h-6 leading-6 text-center rounded-full mb-1",
                      isSameDay(day, new Date(2026, 4, 7)) ? "bg-brand-primary text-white" : "text-slate-500"
                    )}>
                      {format(day, 'd')}
                    </span>
                    <div className="space-y-1">
                      {dayInterviews.map(i => (
                        <div key={i.id} className="text-[10px] p-1.5 rounded bg-brand-primary/20 border border-brand-primary/30 text-brand-primary font-bold truncate cursor-pointer hover:bg-brand-primary/30 transition-all">
                          {i.company} Round
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Sidebar: Upcoming & Prep */}
        <div className="space-y-6">
          <div className="glass-card p-6">
            <h3 className="text-lg font-display font-bold text-white mb-6">Upcoming</h3>
            <div className="space-y-4">
              {interviews.map(i => (
                <div key={i.id} className="p-4 rounded-xl bg-surface-dark border border-border-dark hover:border-brand-primary/50 transition-all group">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                       {i.format === 'Video' ? <Video className="w-4 h-4 text-blue-400" /> : <Phone className="w-4 h-4 text-emerald-400" />}
                       <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{i.format} Call</span>
                    </div>
                    <button className="text-slate-500 hover:text-white"><MoreVertical className="w-4 h-4" /></button>
                  </div>
                  <h4 className="font-bold text-white mb-1 group-hover:text-brand-primary transition-colors">{i.company}</h4>
                  <p className="text-xs text-slate-400 mb-4">{i.type} • {i.role}</p>
                  
                  <div className="flex items-center justify-between pt-3 border-t border-white/5">
                    <div className="flex items-center gap-2 text-[10px] text-slate-500">
                      <Clock className="w-3.5 h-3.5 text-brand-primary" />
                      <span>{format(i.date, 'MMM d, h:mm a')}</span>
                    </div>
                    <span className="text-[10px] text-slate-400 font-medium">{i.duration}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="glass-card p-6 bg-gradient-to-br from-brand-primary/10 to-transparent border-brand-primary/20">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-brand-primary rounded-lg text-white">
                <FileText className="w-4 h-4" />
              </div>
              <h3 className="text-sm font-bold text-white">Prep Checklist</h3>
            </div>
            <div className="space-y-3">
              {[
                { label: 'Check audio/video setup', done: true },
                { label: 'Prepare self-intro (Elevator pitch)', done: true },
                { label: 'Review past projects & resume', done: false },
                { label: 'Prepare 3 thoughtful questions', done: false },
                { label: 'Research company values & news', done: false },
              ].map((item, idx) => (
                <div key={idx} className="flex items-center gap-3">
                  <div className={cn(
                    "w-4 h-4 rounded border flex items-center justify-center transition-all",
                    item.done ? "bg-brand-primary border-brand-primary" : "border-slate-700"
                  )}>
                    {item.done && <ChevronLeft className="w-3 h-3 text-white rotate-[-45deg]" />}
                  </div>
                  <span className={cn("text-xs font-medium", item.done ? "text-slate-500 line-through" : "text-slate-300")}>
                    {item.label}
                  </span>
                </div>
              ))}
            </div>
            <button className="w-full mt-6 py-2 bg-white/5 hover:bg-white/10 text-white text-xs font-bold rounded-lg transition-all border border-white/10 cursor-pointer">
              Go to Prep Dashboard
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
