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
  Zap,
  Loader2,
  Lock,
  Copy,
  Target,
  XCircle,
  ChevronRight
} from 'lucide-react';
import { cn } from '../lib/utils';
import { motion } from 'motion/react';
import { supabase } from '../lib/supabase/client';
import { LoadingSpinner, ErrorState, EmptyState } from '../components/CommonUI';

const resumes = [
  { id: '1', name: 'Software_Engineer_Main.pdf', version: '2.4', size: '1.2 MB', date: '2026-04-15', tags: ['Main', 'SWE'], score: 85 },
  { id: '2', name: 'Frontend_Specialist_V1.pdf', version: '1.0', size: '1.4 MB', date: '2026-05-01', tags: ['Frontend'], score: 92 },
];

export function Resume() {
  const [selectedResume, setSelectedResume] = useState(resumes[0]);
  const [isScanning, setIsScanning] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [jobDescription, setJobDescription] = useState('');

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const jd = params.get('jd');
    if (jd) {
      setJobDescription(decodeURIComponent(jd));
    }
  }, []);
  const [activeTab, setActiveTab] = useState<'editor' | 'preview' | 'ats'>('preview');
  const [atsResult, setAtsResult] = useState<any>(null);
  const [isAtsChecking, setIsAtsChecking] = useState(false);

  const handleATSCheck = async () => {
    if (!jobDescription) {
      setScanError('Please enter a job description to check ATS compatibility.');
      return;
    }
    setIsAtsChecking(true);
    setScanError(null);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;
      const response = await fetch('/api/resume/ats-score', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ 
          resumeText: "Main Software Engineer Resume Content...", // Simplified
          jobDescriptionText: jobDescription 
        }),
      });
      const data = await response.json();
      setAtsResult(data);
      setActiveTab('ats');
    } catch (err) {
      console.error(err);
      setScanError('Failed to check ATS score');
    } finally {
      setIsAtsChecking(false);
    }
  };

  const startScan = async () => {
    if (!jobDescription) {
      setScanError('Please paste a job description first');
      return;
    }
    
    setIsScanning(true);
    setScanError(null);
    setAnalysisResult(null);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Not authenticated');

      const response = await fetch('/api/resume/analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({
          resumeText: "Main Software Engineer Resume Content...", // In real app, extract from file
          jobDescription: jobDescription
        })
      });

      if (!response.ok) {
        const err = await response.json();
        if (err.code === 'PRO_REQUIRED') {
          setScanError('This feature requires a Pro subscription. Upgrade to access AI Resume Analysis.');
          return;
        }
        throw new Error(err.error || 'Analysis failed');
      }

      const result = await response.json();
      setAnalysisResult(result);
    } catch (err: any) {
      setScanError(err.message || 'Failed to analyze resume. Please try again.');
    } finally {
      setIsScanning(false);
    }
  };

  const generateResume = async () => {
    if (!jobDescription) {
      setScanError('Please paste a job description first');
      return;
    }

    setIsGenerating(true);
    setScanError(null);
    setGeneratedResume(null);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Not authenticated');

      const response = await fetch('/api/resume/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({
          jobDescriptionText: jobDescription,
        })
      });

      if (!response.ok) {
        const err = await response.json();
        if (err.code === 'PRO_REQUIRED') {
          setScanError('This feature requires a Pro subscription. Upgrade to generate AI resumes.');
          return;
        }
        throw new Error(err.error || 'Generation failed');
      }

      const result = await response.json();
      setGeneratedResume(result); // Result is now the structured object
    } catch (err: any) {
      setScanError(err.message || 'Failed to generate resume. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="space-y-8 pb-20">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-display font-bold text-white mb-1">Resume & CV</h1>
          <p className="text-slate-400">Manage your documents and optimize them for ATS</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex bg-surface-dark border border-border-dark p-1 rounded-xl">
             {['preview', 'ats'].map((tab) => (
               <button 
                key={tab}
                onClick={() => setActiveTab(tab as any)}
                className={cn(
                  "px-4 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer uppercase tracking-wider",
                  activeTab === tab ? "bg-brand-primary text-white shadow-lg" : "text-slate-500 hover:text-white"
                )}
               >
                 {tab === 'ats' ? 'ATS Score' : 'Analyzer'}
               </button>
             ))}
          </div>
          <button className="flex items-center gap-2 px-5 py-2.5 bg-brand-primary hover:bg-brand-secondary text-white font-semibold rounded-xl transition-all shadow-lg shadow-brand-primary/20 cursor-pointer">
            <Upload className="w-5 h-5" />
            <span>Upload New</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Job Matcher */}
        <div className="lg:col-span-4 space-y-6">
          <div className="glass-card p-6 bg-gradient-to-br from-brand-primary/10 via-bg-dark to-brand-secondary/5 border-brand-primary/20">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                 <div className="p-2 bg-brand-primary rounded-lg text-white shadow-lg shadow-brand-primary/20">
                   <BrainCircuit className="w-5 h-5" />
                 </div>
                 <div>
                   <h3 className="text-lg font-display font-bold text-white">Target Job</h3>
                 </div>
              </div>
            </div>
            
            <textarea 
              placeholder="Paste job description here..."
              value={jobDescription}
              onChange={(e) => setJobDescription(e.target.value)}
              className="w-full h-48 bg-bg-dark/50 border border-border-dark rounded-xl p-4 text-sm text-slate-300 placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-brand-primary/50 transition-all mb-4 resize-none"
            />
            
            <div className="space-y-2">
              <button 
                onClick={generateResume}
                disabled={isGenerating || isScanning}
                className="w-full flex items-center justify-center gap-2 py-3 bg-white text-black font-bold rounded-xl hover:bg-slate-200 transition-all disabled:opacity-50 cursor-pointer text-sm shadow-xl shadow-white/5"
              >
                {isGenerating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4 text-brand-primary" />}
                Tailor Resume
              </button>
              <button 
                onClick={handleATSCheck}
                disabled={isAtsChecking || isGenerating}
                className="w-full flex items-center justify-center gap-2 py-3 bg-surface-dark border border-border-dark text-white font-bold rounded-xl hover:bg-white/10 transition-all disabled:opacity-50 cursor-pointer"
              >
                {isAtsChecking ? <Loader2 className="w-4 h-4 animate-spin" /> : <Target className="w-4 h-4 text-brand-primary" />}
                ATS Scan
              </button>
            </div>
          </div>
        </div>

        {/* Right Column: Content */}
        <div className="lg:col-span-8">
           <AnimatePresence mode="wait">
             {activeTab === 'ats' && atsResult ? (
               <motion.div
                key="ats-results"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-6"
               >
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="glass-card p-6 flex flex-col items-center justify-center text-center">
                       <div className="relative w-32 h-32 mb-4">
                          <svg className="w-full h-full transform -rotate-90">
                            <circle cx="64" cy="64" r="58" stroke="currentColor" strokeWidth="8" fill="transparent" className="text-border-dark" />
                            <circle 
                              cx="64" cy="64" r="58" stroke="currentColor" strokeWidth="8" fill="transparent" 
                              strokeDasharray={2 * Math.PI * 58}
                              strokeDashoffset={2 * Math.PI * 58 * (1 - atsResult.overallScore / 100)}
                              className={cn(
                                "transition-all duration-1000",
                                atsResult.overallScore >= 80 ? "text-emerald-400" : atsResult.overallScore >= 60 ? "text-amber-400" : "text-rose-400"
                              )} 
                            />
                          </svg>
                          <div className="absolute inset-0 flex flex-col items-center justify-center">
                             <span className="text-3xl font-display font-bold text-white">{atsResult.overallScore}</span>
                             <span className="text-[10px] font-bold text-slate-500 uppercase tracking-tighter">Match</span>
                          </div>
                       </div>
                    </div>
                    
                    <div className="glass-card p-6 col-span-2 space-y-4">
                       <h4 className="text-xs font-bold text-slate-500 uppercase tracking-widest">Breakdown</h4>
                       {Object.entries(atsResult.breakdown).map(([label, score]: any) => (
                         <div key={label} className="space-y-1.5">
                            <div className="flex justify-between text-[10px] font-bold uppercase tracking-wider">
                               <span className="text-slate-400">{label}</span>
                               <span className="text-white">{score}%</span>
                            </div>
                            <div className="h-1.5 bg-surface-dark rounded-full overflow-hidden">
                               <div className="h-full bg-brand-primary" style={{ width: `${score}%` }} />
                            </div>
                         </div>
                       ))}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="glass-card p-5 border-rose-500/10 bg-rose-500/5">
                       <h4 className="text-[10px] font-bold text-rose-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                          <AlertCircle className="w-3.5 h-3.5" /> Issues
                       </h4>
                       <ul className="space-y-2">
                          {atsResult.issues.map((issue: string, i: number) => (
                            <li key={i} className="text-xs text-slate-300 flex items-start gap-3">
                               <div className="w-1 h-1 rounded-full bg-rose-500 mt-1.5 flex-shrink-0" />
                               {issue}
                            </li>
                          ))}
                       </ul>
                    </div>
                    <div className="glass-card p-5 border-emerald-500/10 bg-emerald-500/5">
                       <h4 className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                          <Sparkles className="w-3.5 h-3.5" /> Suggestions
                       </h4>
                       <ul className="space-y-2">
                          {atsResult.suggestions.map((suggestion: string, i: number) => (
                            <li key={i} className="text-xs text-slate-300 flex items-start gap-3">
                               <div className="w-1 h-1 rounded-full bg-emerald-500 mt-1.5 flex-shrink-0" />
                               {suggestion}
                            </li>
                          ))}
                       </ul>
                    </div>
                  </div>

                  <div className="glass-card p-6">
                    <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-6">Keyword Analysis</h4>
                    <div className="flex flex-wrap gap-2">
                       {atsResult.keywordAnalysis.map((kw: any, i: number) => (
                          <div 
                            key={i}
                            className={cn(
                              "px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-2 border transition-all",
                              kw.found 
                                ? "bg-emerald-400/10 border-emerald-400/20 text-emerald-400" 
                                : "bg-rose-400/10 border-rose-400/20 text-rose-400"
                            )}
                          >
                            {kw.found ? <CheckCircle2 className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                            {kw.skill}
                            <span className="text-[8px] font-bold uppercase opacity-50">{kw.importance}</span>
                          </div>
                       ))}
                    </div>
                  </div>
               </motion.div>
             ) : (
               <motion.div
                key="preview-content"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="space-y-6"
               >
                  <div className="glass-card p-8">
                     <div className="flex items-center justify-between mb-10">
                        <div className="flex items-center gap-4">
                           <div className="w-16 h-16 rounded-2xl bg-surface-dark flex items-center justify-center font-bold text-2xl text-brand-primary ring-1 ring-border-dark">
                              {selectedResume.name[0]}
                           </div>
                           <div>
                              <h2 className="text-xl font-display font-bold text-white mb-1">{selectedResume.name}</h2>
                              <p className="text-xs text-slate-500">v{selectedResume.version} • Updated {selectedResume.date}</p>
                           </div>
                        </div>
                        <div className="flex gap-2">
                           <button className="p-2.5 rounded-xl bg-surface-dark border border-border-dark text-slate-400 hover:text-white transition-all cursor-pointer"><Download className="w-4 h-4" /></button>
                           <button className="p-2.5 rounded-xl border border-rose-500/20 text-rose-500 hover:bg-rose-500/10 transition-all cursor-pointer"><Trash2 className="w-4 h-4" /></button>
                        </div>
                     </div>

                     <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="space-y-6">
                           <h3 className="text-xs font-bold text-slate-500 uppercase tracking-[0.2em]">Strengths</h3>
                           <div className="space-y-3">
                              {analysisResult?.strengths?.map((s: string, i: number) => (
                                <div key={i} className="flex items-center gap-3 text-xs text-slate-300 p-3 rounded-xl bg-white/5 border border-white/5">
                                   <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                                   {s}
                                </div>
                              ))}
                           </div>
                        </div>
                        <div className="space-y-6">
                           <h3 className="text-xs font-bold text-slate-500 uppercase tracking-[0.2em]">Opportunities</h3>
                           <div className="space-y-3">
                              {analysisResult?.improvements?.map((s: string, i: number) => (
                                <div key={i} className="flex items-center gap-3 text-xs text-slate-300 p-3 rounded-xl bg-white/5 border border-white/5">
                                   <div className="w-1.5 h-1.5 rounded-full bg-rose-400" />
                                   {s}
                                </div>
                              ))}
                           </div>
                        </div>
                     </div>
                  </div>
               </motion.div>
             )}
           </AnimatePresence>
        </div>
      </div>
    </div>
  );
}

