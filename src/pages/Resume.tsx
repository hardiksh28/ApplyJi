import React, { useState } from 'react';
import { 
  FileText, 
  Upload, 
  Trash2, 
  Eye, 
  Download, 
  Sparkles, 
  AlertCircle,
  CheckCircle2,
  BrainCircuit,
  Zap
} from 'lucide-react';
import { cn } from '../lib/utils';
import { motion } from 'motion/react';

const resumes = [
  { id: '1', name: 'Software_Engineer_Main.pdf', version: '2.4', size: '1.2 MB', date: '2026-04-15', tags: ['Main', 'SWE'], score: 85 },
  { id: '2', name: 'Frontend_Specialist_V1.pdf', version: '1.0', size: '1.4 MB', date: '2026-05-01', tags: ['Frontend'], score: 92 },
];

export function Resume() {
  const [selectedResume, setSelectedResume] = useState(resumes[0]);
  const [isScanning, setIsScanning] = useState(false);

  const startScan = () => {
    setIsScanning(true);
    setTimeout(() => setIsScanning(false), 2000);
  };

  return (
    <div className="space-y-8 pb-10">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-display font-bold text-white mb-1">Resume & CV</h1>
          <p className="text-slate-400">Manage your documents and optimize them for ATS</p>
        </div>
        <button className="flex items-center gap-2 px-5 py-2.5 bg-brand-primary hover:bg-brand-secondary text-white font-semibold rounded-xl transition-all shadow-lg shadow-brand-primary/20 cursor-pointer">
          <Upload className="w-5 h-5" />
          <span>Upload Resume</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: List */}
        <div className="lg:col-span-1 space-y-4">
          <h3 className="text-xs uppercase font-bold text-slate-500 tracking-wider mb-2 px-2">Uploaded Versions</h3>
          {resumes.map((resume) => (
            <div 
              key={resume.id}
              onClick={() => setSelectedResume(resume)}
              className={cn(
                "glass-card p-4 hover:border-brand-primary transition-all cursor-pointer group",
                selectedResume.id === resume.id ? "border-brand-primary bg-brand-primary/5 shadow-inner" : "border-border-dark"
              )}
            >
              <div className="flex items-start justify-between mb-2">
                <div className="p-2 rounded-lg bg-surface-dark group-hover:bg-brand-primary/20 transition-colors">
                  <FileText className="w-5 h-5 text-brand-primary" />
                </div>
                <div className="flex items-center gap-1">
                   <span className="text-[10px] font-bold text-slate-500 bg-surface-dark px-1.5 py-0.5 rounded">v{resume.version}</span>
                </div>
              </div>
              <h4 className="text-sm font-bold text-white truncate mb-1">{resume.name}</h4>
              <p className="text-[10px] text-slate-500 mb-3">{resume.date} • {resume.size}</p>
              <div className="flex flex-wrap gap-1">
                {resume.tags.map(tag => (
                   <span key={tag} className="text-[9px] font-bold px-2 py-0.5 rounded bg-white/5 text-slate-400 uppercase tracking-wider">{tag}</span>
                ))}
              </div>
            </div>
          ))}
          
          <button className="w-full py-6 border-2 border-dashed border-border-dark rounded-xl text-slate-500 hover:text-brand-primary hover:border-brand-primary/50 transition-all flex flex-col items-center justify-center gap-2 cursor-pointer group">
             <Upload className="w-6 h-6 group-hover:scale-110 transition-transform" />
             <span className="text-sm font-bold">Upload New Version</span>
          </button>
        </div>

        {/* Right Column: AI Insights */}
        <div className="lg:col-span-2 space-y-6">
          <div className="glass-card p-8">
             <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
                <div className="flex items-center gap-4">
                  <div className="relative w-24 h-24">
                    <svg className="w-full h-full transform -rotate-90">
                      <circle cx="48" cy="48" r="40" stroke="currentColor" strokeWidth="8" fill="transparent" className="text-border-dark" />
                      <circle 
                        cx="48" cy="48" r="40" stroke="currentColor" strokeWidth="8" fill="transparent" 
                        strokeDasharray={2 * Math.PI * 40}
                        strokeDashoffset={2 * Math.PI * 40 * (1 - selectedResume.score / 100)}
                        className="text-brand-primary transition-all duration-1000 ease-out" 
                      />
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <span className="text-2xl font-display font-bold text-white">{selectedResume.score}</span>
                      <span className="text-[8px] font-bold text-slate-500 uppercase tracking-widest">ATS Score</span>
                    </div>
                  </div>
                  <div>
                    <h2 className="text-xl font-display font-bold text-white mb-1">Overall Health: Strong</h2>
                    <p className="text-sm text-slate-400 max-w-xs">Your resume is well-optimized for technical roles but could benefit from more quantitative achievements.</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button className="p-2.5 rounded-xl bg-surface-dark border border-border-dark text-slate-400 hover:text-white transition-all cursor-pointer"><Eye className="w-4 h-4" /></button>
                  <button className="p-2.5 rounded-xl bg-surface-dark border border-border-dark text-slate-400 hover:text-white transition-all cursor-pointer"><Download className="w-4 h-4" /></button>
                  <button className="p-2.5 rounded-xl border border-rose-500/20 text-rose-500 hover:bg-rose-500/10 transition-all cursor-pointer"><Trash2 className="w-4 h-4" /></button>
                </div>
             </div>

             <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h3 className="text-xs uppercase font-bold text-slate-500 tracking-wider flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                    Key Strengths
                  </h3>
                  <div className="space-y-2">
                    {[
                      'Clear contact information',
                      'Standardized headers',
                      'Relevant technical skills keyword density',
                      'Proper font & margin utilization'
                    ].map((item, i) => (
                      <div key={i} className="flex items-center gap-2 text-xs text-slate-300 bg-emerald-400/5 p-2 rounded-lg border border-emerald-400/10">
                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-400"></div>
                        {item}
                      </div>
                    ))}
                  </div>
                </div>
                <div className="space-y-4">
                  <h3 className="text-xs uppercase font-bold text-slate-500 tracking-wider flex items-center gap-2">
                    <AlertCircle className="w-3.5 h-3.5 text-rose-400" />
                    Improvements
                  </h3>
                   <div className="space-y-2">
                    {[
                      'Add more metric-driven bullet points',
                      'Link to specific project repositories',
                      'Expand on cloud infrastructure experience',
                      'Clean up date formatting consistency'
                    ].map((item, i) => (
                      <div key={i} className="flex items-center gap-2 text-xs text-slate-300 bg-rose-400/5 p-2 rounded-lg border border-rose-400/10">
                        <div className="w-1.5 h-1.5 rounded-full bg-rose-400"></div>
                        {item}
                      </div>
                    ))}
                  </div>
                </div>
             </div>
          </div>

          <div className="glass-card p-6 bg-gradient-to-br from-brand-primary/10 via-bg-dark to-brand-secondary/5 border-brand-primary/20">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                 <div className="p-2 bg-brand-primary rounded-lg text-white shadow-lg shadow-brand-primary/20">
                   <BrainCircuit className="w-5 h-5" />
                 </div>
                 <div>
                   <h3 className="text-lg font-display font-bold text-white">AI Job Matcher</h3>
                   <p className="text-xs text-slate-400">Paste a Job Description to see your match score</p>
                 </div>
              </div>
              {isScanning && (
                <div className="flex items-center gap-2 text-brand-primary font-bold text-xs">
                   <Zap className="w-3 h-3 animate-pulse" />
                   Analyzing...
                </div>
              )}
            </div>
            
            <textarea 
              placeholder="Paste job description here..."
              className="w-full h-40 bg-bg-dark/50 border border-border-dark rounded-xl p-4 text-sm text-slate-300 placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-brand-primary/50 transition-all mb-4 resize-none"
            />
            
            <div className="flex items-center justify-between">
               <div className="flex items-center gap-4 text-xs font-medium text-slate-500">
                  <span className="flex items-center gap-1"><Sparkles className="w-3 h-3 text-amber-400" /> Powered by Gemini 3</span>
                  <span className="px-2 py-0.5 rounded bg-surface-dark text-[10px] border border-border-dark uppercase tracking-widest text-slate-500">Premium</span>
               </div>
               <button 
                onClick={startScan}
                disabled={isScanning}
                className="flex items-center gap-2 px-6 py-2.5 bg-white text-black font-bold rounded-xl hover:bg-slate-200 transition-all disabled:opacity-50 cursor-pointer shadow-xl shadow-white/5"
               >
                 <Zap className="w-4 h-4 fill-current" />
                 {isScanning ? 'Processing...' : 'Run Analysis'}
               </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
