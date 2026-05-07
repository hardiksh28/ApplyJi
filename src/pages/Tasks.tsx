import React, { useState, useEffect } from 'react';
import { 
  CheckCircle2, 
  Circle, 
  Clock, 
  Tag as TagIcon,
  Plus,
  Filter,
  MoreVertical,
  Calendar,
  AlertCircle,
  Flag,
  RotateCcw
} from 'lucide-react';
import { cn } from '../lib/utils';
import { motion, AnimatePresence } from 'motion/react';
import { supabase } from '../lib/supabase/client';
import { LoadingSpinner, ErrorState } from '../components/CommonUI';

export function Tasks() {
  const [tasks, setTasks] = useState<any[]>([]);
  const [filter, setFilter] = useState<'All' | 'Todo' | 'Done'>('All');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchTasks();
  }, []);

  const fetchTasks = async () => {
    setLoading(true);
    setError(null);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;
      
      const { data, error: fetchError } = await supabase.from('tasks').select('*').order('created_at', { ascending: false });
      if (fetchError) throw fetchError;
      if (data) setTasks(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load tasks');
    } finally {
      setLoading(false);
    }
  };

  const toggleTask = async (id: string, currentStatus: boolean) => {
    setTasks(tasks.map(t => t.id === id ? { ...t, completed: !currentStatus } : t));
    await supabase.from('tasks').update({ completed: !currentStatus }).eq('id', id);
  };

  const handleNewTask = async () => {
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

    if (data) setTasks([data, ...tasks]);
  };

  const filteredTasks = tasks.filter(t => {
    if (filter === 'Todo') return !t.completed;
    if (filter === 'Done') return t.completed;
    return true;
  });

  if (loading) return <LoadingSpinner fullPage />;
  if (error) return <div className="p-8"><ErrorState message={error} onRetry={fetchTasks} /></div>;

  return (
    <div className="space-y-8 pb-10 max-w-5xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-display font-bold text-white mb-1">Tasks</h1>
          <p className="text-slate-400">Manage your daily action items and interview prep</p>
        </div>
        <button onClick={handleNewTask} className="flex items-center gap-2 px-5 py-2.5 bg-brand-primary hover:bg-brand-secondary text-white font-semibold rounded-xl transition-all shadow-lg shadow-brand-primary/20 cursor-pointer">
          <Plus className="w-5 h-5" />
          <span>New Task</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="md:col-span-1 space-y-6">
           <div className="glass-card p-4 space-y-1">
              <button onClick={() => setFilter('All')} className={cn("nav-item text-xs font-bold uppercase tracking-widest w-full justify-start", filter === 'All' && "bg-brand-primary/10 text-white")}>All Tasks</button>
              <button onClick={() => setFilter('Todo')} className={cn("nav-item text-xs font-bold uppercase tracking-widest w-full justify-start", filter === 'Todo' && "bg-brand-primary/10 text-white")}>To Do</button>
              <button onClick={() => setFilter('Done')} className={cn("nav-item text-xs font-bold uppercase tracking-widest w-full justify-start", filter === 'Done' && "bg-brand-primary/10 text-white")}>Completed</button>
           </div>
           
           <div className="glass-card p-4 space-y-4">
              <h3 className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Productivity</h3>
              <div className="flex items-center justify-between">
                 <span className="text-xs text-slate-400">Total Tasks</span>
                 <span className="text-xs font-bold text-brand-primary">{tasks.length}</span>
              </div>
              <div className="flex items-center justify-between">
                 <span className="text-xs text-slate-400">Completed</span>
                 <span className="text-xs font-bold text-emerald-400">{tasks.filter(t => t.completed).length} Tasks</span>
              </div>
           </div>
        </div>

        <div className="md:col-span-3 space-y-4">
           <AnimatePresence mode="popLayout">
              {filteredTasks.length > 0 ? (
                filteredTasks.map((task) => (
                  <motion.div
                    layout
                    key={task.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className={cn(
                      "glass-card p-4 flex items-center gap-4 group transition-all",
                      task.completed ? "opacity-60 grayscale-[0.5]" : "hover:border-slate-600"
                    )}
                  >
                    <button onClick={() => toggleTask(task.id, task.completed)} className="cursor-pointer">
                      {task.completed ? (
                        <CheckCircle2 className="w-6 h-6 text-brand-primary" />
                      ) : (
                        <Circle className="w-6 h-6 text-slate-600 group-hover:text-brand-primary transition-colors" />
                      )}
                    </button>
                    
                    <div className="flex-1 min-w-0">
                       <h4 className={cn(
                         "font-semibold text-white transition-all",
                         task.completed && "line-through text-slate-500"
                       )}>{task.title}</h4>
                       <div className="flex items-center gap-4 mt-1.5">
                          <div className="flex items-center gap-1 text-[10px] text-slate-500 font-medium">
                            <Calendar className="w-3.5 h-3.5" />
                            {task.due_date ? new Date(task.due_date).toLocaleDateString() : 'No Due Date'}
                          </div>
                          <div className={cn(
                            "flex items-center gap-1 text-[10px] font-bold uppercase tracking-widest",
                            task.priority === 'High' ? "text-rose-400" : task.priority === 'Medium' ? "text-amber-400" : "text-blue-400"
                          )}>
                             <Flag className="w-3 h-3 fill-current" />
                             {task.priority || 'Medium'}
                          </div>
                       </div>
                    </div>

                    <button className="p-2 text-slate-600 hover:text-white transition-colors cursor-pointer">
                       <MoreVertical className="w-5 h-5" />
                    </button>
                  </motion.div>
                ))
              ) : (
                <div className="p-12 text-center glass-card border-dashed">
                  <p className="text-slate-500 font-medium">No tasks found for this filter.</p>
                </div>
              )}
           </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
