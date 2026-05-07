import React, { useState, useEffect } from 'react';
import {
  Search,
  Filter,
  MapPin,
  DollarSign,
  Briefcase,
  Sparkles,
  Zap,
  ChevronRight,
  Loader2,
  AlertCircle,
  Lock,
  Building2,
  Clock,
  CheckCircle2,
  X,
  ExternalLink,
} from 'lucide-react';
import { cn } from '../lib/utils';
import { motion, AnimatePresence } from 'motion/react';
import { supabase } from '../lib/supabase/client';

interface Job {
  id: string;
  title: string;
  company: string;
  location: string;
  salary: string;
  description: string;
  skills: string[];
  source: string;
  source_url: string;
  posted_at: string;
  matchScore?: number;
}

export function JobDiscovery() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [recommended, setRecommended] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [recoLoading, setRecoLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({
    location: '',
    source: '',
    salary_min: '',
  });
  const [applyLoading, setApplyLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [profile, setProfile] = useState<any>(null);

  useEffect(() => {
    fetchJobs();
    fetchRecommended();
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;
    const { data } = await supabase.from('profiles').select('*').eq('id', session.user.id).single();
    if (data) setProfile(data);
  };

  const fetchJobs = async (search = searchTerm, f = filters) => {
    setLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const params = new URLSearchParams();
      if (search) params.append('q', search);
      if (f.location) params.append('location', f.location);
      if (f.source) params.append('source', f.source);
      if (f.salary_min) params.append('salary_min', f.salary_min);

      const response = await fetch(`/api/jobs?${params.toString()}`, {
        headers: { 'Authorization': `Bearer ${session.access_token}` },
      });
      const data = await response.json();
      setJobs(data.jobs || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchRecommended = async () => {
    setRecoLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const response = await fetch('/api/jobs/recommended', {
        headers: { 'Authorization': `Bearer ${session.access_token}` },
      });
      const data = await response.json();
      setRecommended(data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setRecoLoading(false);
    }
  };

  const handleApply = async (jobId: string) => {
    setApplyLoading(jobId);
    setError(null);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const response = await fetch('/api/apply/one-click', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ jobId }),
      });

      const result = await response.json();
      if (!response.ok) {
        if (result.code === 'PRO_REQUIRED') {
          setError('One-click apply requires a Pro subscription.');
        } else {
          setError(result.error || 'Application failed');
        }
        return;
      }

      if (result.method === 'manual') {
        window.open(result.redirectUrl, '_blank');
      } else {
        alert('Application submitted successfully!');
      }
      fetchProfile(); // update counter
    } catch (err: any) {
      setError(err.message);
    } finally {
      setApplyLoading(null);
    }
  };

  return (
    <div className="space-y-8 pb-10">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-display font-bold text-white mb-1">Job Discovery</h1>
          <p className="text-slate-400">Aggregated listings from LinkedIn, Naukri, and more</p>
        </div>
        {profile?.subscription_tier === 'pro' && (
          <div className="px-4 py-2 bg-brand-primary/10 border border-brand-primary/20 rounded-xl flex items-center gap-3">
             <div className="w-2 h-2 rounded-full bg-brand-primary animate-pulse" />
             <span className="text-xs font-bold text-white">Daily Auto-applies: {profile.auto_apply_count_today || 0} / 10</span>
          </div>
        )}
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-between text-rose-300 text-sm">
          <div className="flex items-center gap-3">
            <AlertCircle className="w-4 h-4" />
            {error}
          </div>
          <button onClick={() => setError(null)}><X className="w-4 h-4" /></button>
        </div>
      )}

      {/* Recommended Section */}
      <section className="space-y-4">
        <div className="flex items-center gap-2 px-2">
          <Sparkles className="w-4 h-4 text-amber-400" />
          <h2 className="text-lg font-display font-bold text-white">Recommended for You</h2>
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-2">Based on your skills</span>
        </div>
        
        <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide">
          {recoLoading ? (
            Array(3).fill(0).map((_, i) => (
              <div key={i} className="w-80 h-48 rounded-2xl bg-surface-dark/50 animate-pulse border border-border-dark flex-shrink-0" />
            ))
          ) : (
            recommended.map((job) => (
              <div key={job.id} className="w-80 glass-card p-5 flex-shrink-0 group hover:border-brand-primary/50 transition-all border-brand-primary/10 bg-gradient-to-br from-brand-primary/5 to-transparent">
                <div className="flex items-start justify-between mb-4">
                  <div className="p-2 bg-surface-dark rounded-xl group-hover:text-brand-primary transition-colors uppercase font-bold text-xs">
                    {job.company[0]}
                  </div>
                  <div className="px-2 py-0.5 rounded-full bg-brand-primary/20 text-brand-primary text-[10px] font-bold">
                    {job.matchScore}% Match
                  </div>
                </div>
                <h3 className="text-sm font-bold text-white mb-1 truncate">{job.title}</h3>
                <p className="text-xs text-slate-400 mb-4">{job.company}</p>
                <div className="flex items-center gap-3 mb-6">
                  <div className="flex items-center gap-1 text-[10px] text-slate-500">
                    <MapPin className="w-3 h-3" /> {job.location}
                  </div>
                  <div className="flex items-center gap-1 text-[10px] text-emerald-400 font-bold">
                    <DollarSign className="w-3 h-3" /> {job.salary || 'Competitive'}
                  </div>
                </div>
                <button 
                  onClick={() => handleApply(job.id)}
                  disabled={applyLoading === job.id}
                  className="w-full py-2 bg-white text-black font-bold rounded-lg text-xs hover:bg-slate-200 transition-all flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-white/5"
                >
                  {applyLoading === job.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <Zap className="w-3 h-3 fill-current" />}
                  1-Click Apply
                </button>
              </div>
            ))
          )}
        </div>
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Filters Sidebar */}
        <aside className="lg:col-span-1 space-y-6">
          <div className="glass-card p-6">
             <h3 className="text-xs uppercase font-bold text-slate-500 tracking-wider mb-6 flex items-center gap-2">
                <Filter className="w-4 h-4" /> Filters
             </h3>
             <div className="space-y-4">
                <div className="space-y-1.5">
                   <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Location</label>
                   <div className="relative">
                      <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500" />
                      <input 
                        value={filters.location}
                        onChange={(e) => setFilters({...filters, location: e.target.value})}
                        className="w-full bg-bg-dark border border-border-dark rounded-lg py-2 pl-9 pr-3 text-xs text-white focus:outline-none focus:ring-1 focus:ring-brand-primary" 
                        placeholder="City or Remote" 
                      />
                   </div>
                </div>
                <div className="space-y-1.5">
                   <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Source</label>
                   <select 
                     value={filters.source}
                     onChange={(e) => setFilters({...filters, source: e.target.value})}
                     className="w-full bg-bg-dark border border-border-dark rounded-lg py-2 px-3 text-xs text-white focus:outline-none focus:ring-1 focus:ring-brand-primary"
                   >
                      <option value="">All Platforms</option>
                      <option value="linkedin">LinkedIn</option>
                      <option value="naukri">Naukri</option>
                      <option value="internshala">Internshala</option>
                      <option value="foundit">Foundit</option>
                   </select>
                </div>
                <div className="space-y-1.5">
                   <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Min Salary (Annual)</label>
                   <input 
                    type="number"
                    value={filters.salary_min}
                    onChange={(e) => setFilters({...filters, salary_min: e.target.value})}
                    className="w-full bg-bg-dark border border-border-dark rounded-lg py-2 px-3 text-xs text-white focus:outline-none focus:ring-1 focus:ring-brand-primary" 
                    placeholder="e.g. 1000000" 
                   />
                </div>
                <button 
                  onClick={() => fetchJobs()}
                  className="w-full py-2.5 bg-brand-primary text-white font-bold rounded-xl text-xs hover:bg-brand-secondary transition-all mt-4"
                >
                  Apply Filters
                </button>
             </div>
          </div>
        </aside>

        {/* Results Grid */}
        <div className="lg:col-span-3 space-y-6">
           {/* Search Bar */}
           <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
              <input 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && fetchJobs()}
                className="w-full bg-surface-dark border border-border-dark rounded-2xl py-4 pl-12 pr-4 text-white focus:outline-none focus:ring-2 focus:ring-brand-primary/50 transition-all shadow-xl"
                placeholder="Search jobs by title, skills, or company..."
              />
           </div>

           {/* Jobs List */}
           <div className="space-y-4">
              {loading ? (
                Array(5).fill(0).map((_, i) => (
                  <div key={i} className="h-32 rounded-2xl bg-surface-dark/50 animate-pulse border border-border-dark" />
                ))
              ) : jobs.length > 0 ? (
                jobs.map((job) => (
                  <div key={job.id} className="glass-card p-5 group hover:border-brand-primary/30 transition-all flex items-start gap-5">
                     <div className="w-12 h-12 rounded-xl bg-surface-dark border border-border-dark flex items-center justify-center font-bold text-lg text-slate-400 group-hover:text-brand-primary group-hover:border-brand-primary/50 transition-all uppercase">
                        {job.company[0]}
                     </div>
                     <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                           <h3 className="text-lg font-display font-bold text-white group-hover:text-brand-primary transition-colors truncate">{job.title}</h3>
                           <span className="text-[10px] text-slate-500 font-mono flex items-center gap-1">
                              <Clock className="w-3 h-3" /> {new Date(job.posted_at).toLocaleDateString()}
                           </span>
                        </div>
                        <div className="flex items-center gap-4 mb-3">
                           <div className="flex items-center gap-1.5 text-xs text-slate-400">
                              <Building2 className="w-3.5 h-3.5" /> {job.company}
                           </div>
                           <div className="flex items-center gap-1.5 text-xs text-slate-400">
                              <MapPin className="w-3.5 h-3.5" /> {job.location}
                           </div>
                           <div className="flex items-center gap-1.5 text-xs text-emerald-400 font-bold">
                              <DollarSign className="w-3.5 h-3.5" /> {job.salary || 'Competitive'}
                           </div>
                        </div>
                        <div className="flex flex-wrap gap-1.5">
                           {job.skills.slice(0, 4).map((skill, i) => (
                             <span key={i} className="px-2 py-0.5 rounded bg-white/5 border border-white/5 text-[9px] font-bold text-slate-500 uppercase tracking-widest">{skill}</span>
                           ))}
                           {job.skills.length > 4 && <span className="text-[9px] text-slate-600 font-bold">+{job.skills.length - 4} more</span>}
                        </div>
                     </div>
                     <div className="flex flex-col gap-2">
                        <button 
                          onClick={() => handleApply(job.id)}
                          disabled={applyLoading === job.id}
                          className="px-6 py-2.5 bg-white text-black font-bold rounded-xl text-xs hover:bg-slate-200 transition-all shadow-lg flex items-center gap-2 cursor-pointer"
                        >
                           {applyLoading === job.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Zap className="w-3.5 h-3.5 fill-current" />}
                           Apply
                        </button>
                        <a 
                          href={job.source_url} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="px-6 py-2.5 bg-surface-dark border border-border-dark text-slate-400 hover:text-white font-bold rounded-xl text-xs transition-all flex items-center gap-2 justify-center"
                        >
                           <ExternalLink className="w-3.5 h-3.5" />
                           View
                        </a>
                     </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-20 bg-surface-dark/20 rounded-3xl border border-dashed border-border-dark">
                   <Search className="w-10 h-10 text-slate-600 mx-auto mb-4" />
                   <h3 className="text-xl font-display font-bold text-white mb-2">No jobs found</h3>
                   <p className="text-sm text-slate-400">Try adjusting your search terms or filters</p>
                </div>
              )}
           </div>
        </div>
      </div>
    </div>
  );
}
