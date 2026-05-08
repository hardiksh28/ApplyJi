import { useState, useEffect } from 'react';
import {
  FileText,
  Sparkles,
  Copy,
  Download,
  Loader2,
  AlertCircle,
  Lock,
  Check,
  History,
  Briefcase,
} from 'lucide-react';
import { cn } from '../lib/utils';
import { motion, AnimatePresence } from 'motion/react';
import { supabase } from '../lib/supabase/client';

const tones = [
  { id: 'professional' as const, label: 'Professional', desc: 'Formal and polished', emoji: '🎩' },
  { id: 'casual' as const, label: 'Casual', desc: 'Warm and conversational', emoji: '💬' },
  { id: 'enthusiastic' as const, label: 'Enthusiastic', desc: 'Energetic and passionate', emoji: '🔥' },
];

export function CoverLetter() {
  const [jobDescription, setJobDescription] = useState('');

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const jd = params.get('jd');
    if (jd) {
      setJobDescription(decodeURIComponent(jd));
    }
  }, []);

  const [selectedTone, setSelectedTone] = useState<'professional' | 'casual' | 'enthusiastic'>('professional');
  const [isGenerating, setIsGenerating] = useState(false);
  const [coverLetter, setCoverLetter] = useState<string | null>(null);
  const [editedLetter, setEditedLetter] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [history, setHistory] = useState<any[]>([]);
  const [showHistory, setShowHistory] = useState(false);

  useEffect(() => {
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;
    const { data } = await supabase
      .from('generated_cover_letters')
      .select('*')
      .eq('user_id', session.user.id)
      .order('created_at', { ascending: false })
      .limit(10);
    if (data) setHistory(data);
  };

  const handleGenerate = async () => {
    if (!jobDescription.trim()) {
      setError('Please paste a job description first');
      return;
    }

    setIsGenerating(true);
    setError(null);
    setCoverLetter(null);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Not authenticated');

      const response = await fetch('/api/cover-letter/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          jobDescriptionText: jobDescription,
          tone: selectedTone,
        }),
      });

      if (!response.ok) {
        const err = await response.json();
        if (err.code === 'PRO_REQUIRED') {
          setError('This feature requires a Pro subscription. Upgrade to generate AI cover letters.');
          return;
        }
        throw new Error(err.error || 'Generation failed');
      }

      const result = await response.json();
      setCoverLetter(result.coverLetter);
      setEditedLetter(result.coverLetter);
      fetchHistory();
    } catch (err: any) {
      setError(err.message || 'Failed to generate cover letter');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(editedLetter || coverLetter || '');
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const text = editedLetter || coverLetter || '';
    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `cover-letter-${selectedTone}-${new Date().toISOString().split('T')[0]}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const loadFromHistory = (item: any) => {
    setCoverLetter(item.cover_letter_text);
    setEditedLetter(item.cover_letter_text);
    setSelectedTone(item.tone);
    setJobDescription(item.job_description);
    setShowHistory(false);
  };

  return (
    <div className="space-y-8 pb-10">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-display font-bold text-white mb-1">Cover Letter</h1>
          <p className="text-slate-400">AI-generated cover letters tailored to every job</p>
        </div>
        <button
          onClick={() => setShowHistory(!showHistory)}
          className="flex items-center gap-2 px-4 py-2.5 bg-surface-dark border border-border-dark text-slate-300 font-semibold rounded-xl hover:bg-white/5 transition-all cursor-pointer"
        >
          <History className="w-4 h-4" />
          History
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
        {/* Left: Input Panel */}
        <div className="lg:col-span-2 space-y-6">
          {/* Tone Selector */}
          <div className="glass-card p-6">
            <h3 className="text-xs uppercase font-bold text-slate-500 tracking-wider mb-4">Select Tone</h3>
            <div className="space-y-2">
              {tones.map((tone) => (
                <button
                  key={tone.id}
                  onClick={() => setSelectedTone(tone.id)}
                  className={cn(
                    "w-full flex items-center gap-3 p-3 rounded-xl border transition-all cursor-pointer text-left",
                    selectedTone === tone.id
                      ? "border-brand-primary bg-brand-primary/10 shadow-inner"
                      : "border-border-dark hover:border-slate-700 bg-bg-dark/30"
                  )}
                >
                  <span className="text-xl">{tone.emoji}</span>
                  <div className="flex-1">
                    <p className={cn("text-sm font-bold", selectedTone === tone.id ? "text-white" : "text-slate-300")}>{tone.label}</p>
                    <p className="text-[10px] text-slate-500">{tone.desc}</p>
                  </div>
                  {selectedTone === tone.id && (
                    <div className="w-2 h-2 rounded-full bg-brand-primary" />
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Job Description Input */}
          <div className="glass-card p-6 bg-gradient-to-br from-brand-primary/5 via-transparent to-brand-secondary/5 border-brand-primary/20">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-brand-primary rounded-lg text-white shadow-lg shadow-brand-primary/20">
                <Briefcase className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-display font-bold text-white">Job Description</h3>
                <p className="text-[10px] text-slate-500">Paste the full JD for best results</p>
              </div>
            </div>

            {error && (
              <div className="mb-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center gap-3">
                <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0" />
                <p className="text-xs text-rose-300 flex-1">{error}</p>
                <button onClick={() => setError(null)} className="text-xs text-rose-400 hover:text-white font-bold cursor-pointer">✕</button>
              </div>
            )}

            <textarea
              placeholder="Paste the job description here..."
              value={jobDescription}
              onChange={(e) => setJobDescription(e.target.value)}
              className="w-full h-48 bg-bg-dark/50 border border-border-dark rounded-xl p-4 text-sm text-slate-300 placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-brand-primary/50 transition-all mb-4 resize-none"
            />

            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1 text-xs text-slate-500">
                <Sparkles className="w-3 h-3 text-amber-400" /> Powered by Gemini 3
                <span className="ml-2 px-2 py-0.5 rounded bg-surface-dark text-[10px] border border-border-dark uppercase tracking-widest text-slate-500 flex items-center gap-1">
                  <Lock className="w-2.5 h-2.5" /> Pro
                </span>
              </span>
              <button
                onClick={handleGenerate}
                disabled={isGenerating}
                className="flex items-center gap-2 px-6 py-2.5 bg-white text-black font-bold rounded-xl hover:bg-slate-200 transition-all disabled:opacity-50 cursor-pointer shadow-xl shadow-white/5"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    Generate
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Right: Output Panel */}
        <div className="lg:col-span-3 space-y-6">
          <AnimatePresence mode="wait">
            {coverLetter ? (
              <motion.div
                key="result"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="glass-card overflow-hidden"
              >
                <div className="p-4 border-b border-border-dark flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-brand-primary/10 rounded-lg">
                      <FileText className="w-4 h-4 text-brand-primary" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-white">Generated Cover Letter</h3>
                      <p className="text-[10px] text-slate-500">
                        Tone: {tones.find(t => t.id === selectedTone)?.label} • Editable below
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={handleCopy}
                      className={cn(
                        "flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-bold transition-all cursor-pointer",
                        copied
                          ? "border-emerald-500/30 text-emerald-400 bg-emerald-500/10"
                          : "border-border-dark text-slate-400 hover:text-white hover:border-slate-700"
                      )}
                    >
                      {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                      {copied ? 'Copied!' : 'Copy'}
                    </button>
                    <button
                      onClick={handleDownload}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border-dark text-xs font-bold text-slate-400 hover:text-white hover:border-slate-700 transition-all cursor-pointer"
                    >
                      <Download className="w-3 h-3" />
                      Download
                    </button>
                  </div>
                </div>
                <textarea
                  value={editedLetter}
                  onChange={(e) => setEditedLetter(e.target.value)}
                  className="w-full min-h-[500px] bg-bg-dark/30 p-6 text-sm text-slate-200 leading-relaxed resize-none focus:outline-none border-none"
                />
              </motion.div>
            ) : (
              <motion.div
                key="empty"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="glass-card p-12 flex flex-col items-center justify-center text-center border-dashed min-h-[500px]"
              >
                <div className="p-4 bg-white/5 rounded-2xl text-slate-500 border border-white/5 mb-6">
                  <FileText className="w-10 h-10" />
                </div>
                <h3 className="text-xl font-display font-bold text-white mb-2">No Cover Letter Yet</h3>
                <p className="text-sm text-slate-400 max-w-xs">
                  Paste a job description and select your preferred tone to generate a personalized cover letter.
                </p>
              </motion.div>
            )}
          </AnimatePresence>

          {/* History Panel */}
          <AnimatePresence>
            {showHistory && history.length > 0 && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="glass-card overflow-hidden"
              >
                <div className="p-4 border-b border-border-dark">
                  <h3 className="text-xs uppercase font-bold text-slate-500 tracking-wider">Recent Cover Letters</h3>
                </div>
                <div className="divide-y divide-border-dark max-h-[300px] overflow-y-auto">
                  {history.map((item) => (
                    <button
                      key={item.id}
                      onClick={() => loadFromHistory(item)}
                      className="w-full text-left p-4 hover:bg-white/5 transition-all cursor-pointer"
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-bold text-white capitalize">{item.tone}</span>
                        <span className="text-[10px] text-slate-500">
                          {new Date(item.created_at).toLocaleDateString()}
                        </span>
                      </div>
                      <p className="text-xs text-slate-400 line-clamp-2">{item.cover_letter_text?.substring(0, 120)}...</p>
                    </button>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
