import React, { useEffect, useState } from 'react';
import { Bookmark, MapPin, DollarSign, Clock, ArrowRight, ExternalLink, Loader2, Sparkles, PenTool, Target } from 'lucide-react';
import { cn } from '../lib/utils';
import { motion } from 'motion/react';
import { supabase } from '../lib/supabase/client';
import { LoadingSpinner, ErrorState, EmptyState } from '../components/CommonUI';

export function SavedJobs() {
  const [savedJobs, setSavedJobs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  useEffect(() => {
    fetchSavedJobs();
  }, []);

  const fetchSavedJobs = async () => {
    setLoading(true);
    setError(null);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;
      
      const { data, error: fetchError } = await supabase
        .from('applications')
        .select('*')
        .ilike('status', 'saved')
        .order('created_at', { ascending: false });
      
      if (fetchError) throw fetchError;
      if (data) setSavedJobs(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load saved jobs');
    } finally {
      setLoading(false);
    }
  };

  const moveToPipeline = async (id: string) => {
    setActionLoading(id);
    try {
      const { error } = await supabase.from('applications').update({ status: 'applied' }).eq('id', id);
      if (error) throw error;
      setSavedJobs(savedJobs.filter(job => job.id !== id));
    } catch (err: any) {
      alert('Failed to move to pipeline: ' + err.message);
    } finally {
      setActionLoading(null);
    }
  };

  const unsaveJob = async (id: string) => {
    setActionLoading('unsave-' + id);
    try {
      const { error } = await supabase.from('applications').delete().eq('id', id);
      if (error) throw error;
      setSavedJobs(savedJobs.filter(job => job.id !== id));
    } catch (err: any) {
      alert('Failed to remove: ' + err.message);
    } finally {
      setActionLoading(null);
    }
  };

  if (loading) return <LoadingSpinner fullPage />;
  if (error) return <div className="p-8"><ErrorState message={error} onRetry={fetchSavedJobs} /></div>;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-display font-bold text-white mb-1">Saved Jobs</h1>
        <p className="text-slate-400">Manage jobs you've bookmarked for later</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {savedJobs.map((job, idx) => (
          <motion.div
            key={job.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.1 }}
            className="glass-card flex flex-col group hover:border-brand-primary transition-all overflow-hidden"
          >
            <div className="p-6 flex-1">
              <div className="flex items-start justify-between mb-4">
                <div className="w-12 h-12 rounded-xl bg-surface-dark border border-border-dark flex items-center justify-center font-bold text-xl text-white group-hover:border-brand-primary/50 transition-colors uppercase">
                  {job.company_name ? job.company_name[0] : '?'}
                </div>
                <div className="flex items-center gap-2">
                  <span className="flex items-center gap-1 text-[10px] text-amber-400 font-bold bg-amber-400/10 px-2 py-0.5 rounded-full">
                    <Bookmark className="w-3 h-3 fill-current" />
                    Saved
                  </span>
                </div>
              </div>

              <h2 className="text-lg font-display font-bold text-white group-hover:text-brand-primary transition-colors mb-1">{job.job_title}</h2>
              <p className="text-slate-400 font-medium mb-4">{job.company_name}</p>

              <div className="flex flex-wrap gap-2 mb-6">
                  <span className="flex items-center gap-1 text-[10px] font-semibold bg-white/5 border border-white/10 text-slate-400 px-2.5 py-1 rounded-lg">
                    {job.location || 'Remote'}
                  </span>
              </div>

              <div className="grid grid-cols-2 gap-4 py-4 border-t border-border-dark">
                <div className="flex items-center gap-2 text-xs text-slate-500">
                  <DollarSign className="w-3.5 h-3.5 text-emerald-400" />
                  <span>{job.salary_range || job.salary || 'Unspecified'}</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-slate-500">
                  <MapPin className="w-3.5 h-3.5 text-blue-400" />
                  <span>{job.location || 'Remote'}</span>
                </div>
              </div>
            </div>

            <div className="p-4 bg-bg-dark/50 border-t border-border-dark space-y-3">
              {/* AI Actions Row */}
              <div className="flex items-center gap-2 pb-2 border-b border-white/5">
                <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-1">
                  <Sparkles className="w-2.5 h-2.5 text-amber-400" />
                  AI Tools
                </span>
                <div className="flex-1 h-px bg-white/5" />
                <span className="px-1.5 py-0.5 rounded bg-brand-primary/10 text-[8px] font-bold text-brand-primary uppercase tracking-tighter border border-brand-primary/20">Pro</span>
              </div>
              
              <div className="grid grid-cols-3 gap-2">
                <button 
                  onClick={() => {
                    // Deep link to Resume with JD
                    window.location.href = `/resume?jd=${encodeURIComponent(job.company_name + ' ' + job.job_title)}`;
                  }}
                  className="flex flex-col items-center justify-center gap-1 p-2 rounded-lg bg-surface-dark border border-border-dark hover:border-brand-primary/50 hover:bg-brand-primary/5 transition-all group/ai"
                >
                  <Sparkles className="w-3.5 h-3.5 text-brand-primary group-hover/ai:scale-110 transition-transform" />
                  <span className="text-[9px] font-bold text-slate-400 group-hover/ai:text-white">Tailor</span>
                </button>
                <button 
                  onClick={() => {
                    window.location.href = `/cover-letter?jd=${encodeURIComponent(job.company_name + ' ' + job.job_title)}`;
                  }}
                  className="flex flex-col items-center justify-center gap-1 p-2 rounded-lg bg-surface-dark border border-border-dark hover:border-brand-primary/50 hover:bg-brand-primary/5 transition-all group/ai"
                >
                  <PenTool className="w-3.5 h-3.5 text-brand-primary group-hover/ai:scale-110 transition-transform" />
                  <span className="text-[9px] font-bold text-slate-400 group-hover/ai:text-white">Letter</span>
                </button>
                <button 
                  onClick={() => {
                    window.location.href = `/skills-gap?jd=${encodeURIComponent(job.company_name + ' ' + job.job_title)}`;
                  }}
                  className="flex flex-col items-center justify-center gap-1 p-2 rounded-lg bg-surface-dark border border-border-dark hover:border-brand-primary/50 hover:bg-brand-primary/5 transition-all group/ai"
                >
                  <Target className="w-3.5 h-3.5 text-brand-primary group-hover/ai:scale-110 transition-transform" />
                  <span className="text-[9px] font-bold text-slate-400 group-hover/ai:text-white">Gap</span>
                </button>
              </div>

              <div className="flex gap-2 pt-1">
                <button 
                  onClick={() => moveToPipeline(job.id)} 
                  disabled={actionLoading === job.id}
                  className="flex-1 py-2 bg-brand-primary hover:bg-brand-secondary text-white text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-brand-primary/10 disabled:opacity-50"
                >
                  {actionLoading === job.id ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <>
                      Move to Pipeline
                      <ArrowRight className="w-3.5 h-3.5" />
                    </>
                  )}
                </button>
                <button 
                  onClick={() => unsaveJob(job.id)}
                  disabled={actionLoading === 'unsave-' + job.id}
                  className="p-2 bg-surface-dark border border-border-dark text-slate-400 hover:text-rose-400 hover:border-rose-400/30 rounded-lg transition-all cursor-pointer disabled:opacity-50"
                >
                  {actionLoading === 'unsave-' + job.id ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Bookmark className="w-4 h-4 fill-current" />
                  )}
                </button>
                <a href={job.job_url || '#'} target="_blank" rel="noopener noreferrer" className="p-2 bg-surface-dark border border-border-dark text-slate-400 hover:text-white rounded-lg transition-all cursor-pointer">
                  <ExternalLink className="w-4 h-4" />
                </a>
              </div>
            </div>
          </motion.div>
        ))}

        {savedJobs.length === 0 && (
          <div className="col-span-full">
            <EmptyState 
              title="No saved jobs" 
              message="Save jobs from the Applications page to review them later. Use the 'Saved' status when adding a new application." 
              actionLabel="Browse Applications"
              onAction={() => window.location.href = '/applications'}
            />
          </div>
        )}
      </div>
    </div>
  );
}
