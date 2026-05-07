import React from 'react';
import { Bookmark, MapPin, DollarSign, Clock, ArrowRight, ExternalLink, Tag } from 'lucide-react';
import { mockSavedJobs } from '../data/mockData';
import { cn } from '../lib/utils';
import { motion } from 'motion/react';

export function SavedJobs() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-display font-bold text-white mb-1">Saved Jobs</h1>
        <p className="text-slate-400">Manage jobs you've bookmarked for later</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {mockSavedJobs.map((job, idx) => (
          <motion.div
            key={job.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.1 }}
            className="glass-card flex flex-col group hover:border-brand-primary transition-all overflow-hidden"
          >
            <div className="p-6 flex-1">
              <div className="flex items-start justify-between mb-4">
                <div className="w-12 h-12 rounded-xl bg-surface-dark border border-border-dark flex items-center justify-center font-bold text-xl text-white group-hover:border-brand-primary/50 transition-colors">
                  {job.company[0]}
                </div>
                <div className="flex items-center gap-2">
                  <span className="flex items-center gap-1 text-[10px] text-rose-400 font-bold bg-rose-400/10 px-2 py-0.5 rounded-full">
                    <Clock className="w-3 h-3" />
                    {job.deadline}
                  </span>
                </div>
              </div>

              <h2 className="text-lg font-display font-bold text-white group-hover:text-brand-primary transition-colors mb-1">{job.role}</h2>
              <p className="text-slate-400 font-medium mb-4">{job.company}</p>

              <div className="flex flex-wrap gap-2 mb-6">
                {job.tags.map((tag) => (
                  <span key={tag} className="flex items-center gap-1 text-[10px] font-semibold bg-white/5 border border-white/10 text-slate-400 px-2.5 py-1 rounded-lg">
                    {tag}
                  </span>
                ))}
              </div>

              <div className="grid grid-cols-2 gap-4 py-4 border-t border-border-dark">
                <div className="flex items-center gap-2 text-xs text-slate-500">
                  <DollarSign className="w-3.5 h-3.5 text-emerald-400" />
                  <span>{job.salary}</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-slate-500">
                  <MapPin className="w-3.5 h-3.5 text-blue-400" />
                  <span>Remote / Hybrid</span>
                </div>
              </div>
            </div>

            <div className="p-4 bg-bg-dark/50 border-t border-border-dark flex gap-3">
              <button className="flex-1 py-2 bg-brand-primary hover:bg-brand-secondary text-white text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-brand-primary/10">
                Move to Pipeline
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
              <button className="p-2 bg-surface-dark border border-border-dark text-slate-400 hover:text-white rounded-lg transition-all cursor-pointer">
                <ExternalLink className="w-4 h-4" />
              </button>
            </div>
          </motion.div>
        ))}

        <button className="h-full min-h-[300px] flex flex-col items-center justify-center gap-3 border-2 border-dashed border-border-dark rounded-xl text-slate-500 hover:text-brand-primary hover:border-brand-primary/50 transition-all group cursor-pointer">
          <div className="w-12 h-12 rounded-full border-2 border-dashed border-slate-700 flex items-center justify-center group-hover:border-brand-primary transition-colors">
            <Bookmark className="w-6 h-6" />
          </div>
          <p className="font-bold text-sm">Save a New Job</p>
        </button>
      </div>
    </div>
  );
}
