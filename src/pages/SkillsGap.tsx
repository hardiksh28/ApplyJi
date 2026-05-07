import React, { useState } from 'react';
import {
  Target,
  Sparkles,
  Loader2,
  AlertCircle,
  Lock,
  CheckCircle2,
  XCircle,
  ExternalLink,
  Briefcase,
  TrendingUp,
} from 'lucide-react';
import { cn } from '../lib/utils';
import { motion, AnimatePresence } from 'motion/react';
import { supabase } from '../lib/supabase/client';

interface SkillItem {
  skill: string;
  relevance: string;
}

interface MissingSkill extends SkillItem {
  learnSuggestion: string;
}

interface SkillsGapResult {
  matched: SkillItem[];
  missing: MissingSkill[];
  score: number;
  summary: string;
}

export function SkillsGap() {
  const [jobDescription, setJobDescription] = useState('');

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const jd = params.get('jd');
    if (jd) {
      setJobDescription(decodeURIComponent(jd));
    }
  }, []);

  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState<SkillsGapResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleAnalyze = async () => {
    if (!jobDescription.trim()) {
      setError('Please paste a job description first');
      return;
    }

    setIsAnalyzing(true);
    setError(null);
    setResult(null);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Not authenticated');

      const response = await fetch('/api/skills-gap', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ jobDescriptionText: jobDescription }),
      });

      if (!response.ok) {
        const err = await response.json();
        if (err.code === 'PRO_REQUIRED') {
          setError('This feature requires a Pro subscription. Upgrade to access Skills Gap Analysis.');
          return;
        }
        throw new Error(err.error || 'Analysis failed');
      }

      const data = await response.json();
      setResult(data);
    } catch (err: any) {
      setError(err.message || 'Failed to analyze skills gap');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-emerald-400';
    if (score >= 60) return 'text-amber-400';
    return 'text-rose-400';
  };

  const getScoreBarColor = (score: number) => {
    if (score >= 80) return 'bg-emerald-400';
    if (score >= 60) return 'bg-amber-400';
    return 'bg-rose-400';
  };

  const getScoreLabel = (score: number) => {
    if (score >= 80) return 'Strong Match';
    if (score >= 60) return 'Good Fit';
    if (score >= 40) return 'Partial Match';
    return 'Needs Work';
  };

  return (
    <div className="space-y-8 pb-10">
      <div>
        <h1 className="text-3xl font-display font-bold text-white mb-1">Skills Gap Analyzer</h1>
        <p className="text-slate-400">Compare your skills against any job description</p>
      </div>

      {/* Input Section */}
      <div className="glass-card p-6 bg-gradient-to-br from-brand-primary/5 via-transparent to-brand-secondary/5 border-brand-primary/20">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-brand-primary rounded-lg text-white shadow-lg shadow-brand-primary/20">
              <Target className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-display font-bold text-white">Paste Job Description</h3>
              <p className="text-xs text-slate-400">We'll extract required skills and compare with your profile</p>
            </div>
          </div>
          {isAnalyzing && (
            <div className="flex items-center gap-2 text-brand-primary font-bold text-xs">
              <Loader2 className="w-3 h-3 animate-spin" />
              Analyzing...
            </div>
          )}
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center gap-3">
            <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0" />
            <p className="text-xs text-rose-300 flex-1">{error}</p>
            <button onClick={() => setError(null)} className="text-xs text-rose-400 hover:text-white font-bold cursor-pointer">✕</button>
          </div>
        )}

        <textarea
          placeholder="Paste the full job description here..."
          value={jobDescription}
          onChange={(e) => setJobDescription(e.target.value)}
          className="w-full h-40 bg-bg-dark/50 border border-border-dark rounded-xl p-4 text-sm text-slate-300 placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-brand-primary/50 transition-all mb-4 resize-none"
        />

        <div className="flex items-center justify-between">
          <span className="flex items-center gap-1 text-xs text-slate-500">
            <Sparkles className="w-3 h-3 text-amber-400" /> Powered by Gemini 3
            <span className="ml-2 px-2 py-0.5 rounded bg-surface-dark text-[10px] border border-border-dark uppercase tracking-widest text-slate-500 flex items-center gap-1">
              <Lock className="w-2.5 h-2.5" /> Pro
            </span>
          </span>
          <button
            onClick={handleAnalyze}
            disabled={isAnalyzing}
            className="flex items-center gap-2 px-6 py-2.5 bg-white text-black font-bold rounded-xl hover:bg-slate-200 transition-all disabled:opacity-50 cursor-pointer shadow-xl shadow-white/5"
          >
            {isAnalyzing ? (
              <><Loader2 className="w-4 h-4 animate-spin" /> Analyzing...</>
            ) : (
              <><Target className="w-4 h-4" /> Analyze Skills Gap</>
            )}
          </button>
        </div>
      </div>

      {/* Results */}
      <AnimatePresence>
        {result && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            {/* Score Card */}
            <div className="glass-card p-8">
              <div className="flex flex-col md:flex-row items-center gap-8">
                {/* Score Circle */}
                <div className="relative w-32 h-32 flex-shrink-0">
                  <svg className="w-full h-full transform -rotate-90">
                    <circle cx="64" cy="64" r="54" stroke="currentColor" strokeWidth="10" fill="transparent" className="text-border-dark" />
                    <circle
                      cx="64" cy="64" r="54" stroke="currentColor" strokeWidth="10" fill="transparent"
                      strokeDasharray={2 * Math.PI * 54}
                      strokeDashoffset={2 * Math.PI * 54 * (1 - result.score / 100)}
                      strokeLinecap="round"
                      className={cn("transition-all duration-1000 ease-out", getScoreColor(result.score))}
                    />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className={cn("text-3xl font-display font-bold", getScoreColor(result.score))}>{result.score}</span>
                    <span className="text-[8px] font-bold text-slate-500 uppercase tracking-widest">Score</span>
                  </div>
                </div>

                {/* Score Details */}
                <div className="flex-1 text-center md:text-left">
                  <h2 className="text-2xl font-display font-bold text-white mb-2">
                    {getScoreLabel(result.score)}
                  </h2>
                  <p className="text-sm text-slate-400 mb-4 max-w-lg">{result.summary}</p>

                  {/* Progress Bar */}
                  <div className="w-full max-w-md">
                    <div className="flex justify-between text-[10px] text-slate-500 mb-1">
                      <span>{result.matched.length} matched</span>
                      <span>{result.missing.length} missing</span>
                    </div>
                    <div className="h-3 bg-bg-dark rounded-full overflow-hidden border border-border-dark">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${result.score}%` }}
                        transition={{ duration: 1, ease: 'easeOut' }}
                        className={cn("h-full rounded-full", getScoreBarColor(result.score))}
                      />
                    </div>
                  </div>
                </div>

                {/* Stats */}
                <div className="flex gap-4">
                  <div className="text-center p-4 rounded-xl bg-emerald-400/5 border border-emerald-400/10">
                    <p className="text-2xl font-display font-bold text-emerald-400">{result.matched.length}</p>
                    <p className="text-[10px] text-slate-500 uppercase tracking-wider font-bold">Matched</p>
                  </div>
                  <div className="text-center p-4 rounded-xl bg-rose-400/5 border border-rose-400/10">
                    <p className="text-2xl font-display font-bold text-rose-400">{result.missing.length}</p>
                    <p className="text-[10px] text-slate-500 uppercase tracking-wider font-bold">Missing</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Skills Columns */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Matched Skills */}
              <div className="glass-card overflow-hidden">
                <div className="p-4 border-b border-border-dark bg-emerald-400/5">
                  <h3 className="text-xs uppercase font-bold text-emerald-400 tracking-wider flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4" />
                    You Have ({result.matched.length})
                  </h3>
                </div>
                <div className="p-4 space-y-2 max-h-[400px] overflow-y-auto">
                  {result.matched.map((skill, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.05 }}
                      className="flex items-center gap-3 p-3 rounded-xl bg-emerald-400/5 border border-emerald-400/10"
                    >
                      <div className="w-2 h-2 rounded-full bg-emerald-400 flex-shrink-0" />
                      <span className="text-sm text-slate-200 flex-1">{skill.skill}</span>
                      <span className={cn(
                        "text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded",
                        skill.relevance === 'required'
                          ? "bg-emerald-400/10 text-emerald-400"
                          : "bg-slate-700/50 text-slate-400"
                      )}>
                        {skill.relevance}
                      </span>
                    </motion.div>
                  ))}
                  {result.matched.length === 0 && (
                    <p className="text-sm text-slate-500 text-center py-4">No matching skills found</p>
                  )}
                </div>
              </div>

              {/* Missing Skills */}
              <div className="glass-card overflow-hidden">
                <div className="p-4 border-b border-border-dark bg-rose-400/5">
                  <h3 className="text-xs uppercase font-bold text-rose-400 tracking-wider flex items-center gap-2">
                    <XCircle className="w-4 h-4" />
                    You're Missing ({result.missing.length})
                  </h3>
                </div>
                <div className="p-4 space-y-2 max-h-[400px] overflow-y-auto">
                  {result.missing.map((skill, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, x: 10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.05 }}
                      className="p-3 rounded-xl bg-rose-400/5 border border-rose-400/10"
                    >
                      <div className="flex items-center gap-3 mb-2">
                        <div className="w-2 h-2 rounded-full bg-rose-400 flex-shrink-0" />
                        <span className="text-sm text-slate-200 flex-1">{skill.skill}</span>
                        <span className={cn(
                          "text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded",
                          skill.relevance === 'required'
                            ? "bg-rose-400/10 text-rose-400"
                            : "bg-slate-700/50 text-slate-400"
                        )}>
                          {skill.relevance}
                        </span>
                      </div>
                      <div className="ml-5 flex items-start gap-2 p-2 rounded-lg bg-bg-dark/50 border border-border-dark">
                        <TrendingUp className="w-3 h-3 text-brand-primary mt-0.5 flex-shrink-0" />
                        <p className="text-[11px] text-slate-400 leading-relaxed">{skill.learnSuggestion}</p>
                      </div>
                    </motion.div>
                  ))}
                  {result.missing.length === 0 && (
                    <p className="text-sm text-emerald-400 text-center py-4">🎉 You have all the required skills!</p>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
