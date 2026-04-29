import React from 'react';
import { motion } from 'motion/react';
import { Sparkles, Copy, Check, Wand2 } from 'lucide-react';
import { generateFollowUp } from '../lib/ai/gemini';

interface FollowUpComposerProps {
  company: string;
  jobTitle: string;
}

export function FollowUpComposer({ company, jobTitle }: FollowUpComposerProps) {
  const [draft, setDraft] = React.useState('');
  const [generating, setGenerating] = React.useState(false);
  const [copied, setCopied] = React.useState(false);

  const handleGenerate = async () => {
    setGenerating(true);
    try {
      const content = await generateFollowUp({ company, jobTitle });
      setDraft(content);
    } catch (err) {
      console.error('Failed to generate follow-up:', err);
    } finally {
      setGenerating(false);
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(draft);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="bg-gradient-to-br from-indigo-50 to-white rounded-2xl p-6 border border-indigo-100 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-indigo-700">
          <Sparkles className="w-5 h-5" />
          <h3 className="font-bold">AI Follow-up Composer</h3>
        </div>
        {!draft && (
          <button
            onClick={handleGenerate}
            disabled={generating}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-xl text-sm font-semibold hover:bg-indigo-700 disabled:opacity-50 transition-all shadow-lg shadow-indigo-100"
          >
            <Wand2 className={`w-4 h-4 ${generating ? 'animate-spin' : ''}`} />
            {generating ? 'Generating...' : 'Draft Follow-up'}
          </button>
        )}
      </div>

      {draft ? (
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-4"
        >
          <textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            className="w-full h-40 p-4 bg-white border border-indigo-100 rounded-xl text-gray-700 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none resize-none text-sm leading-relaxed"
          />
          <div className="flex justify-end gap-3">
            <button
              onClick={handleGenerate}
              className="px-4 py-2 text-sm font-medium text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
            >
              Regenerate
            </button>
            <button
              onClick={copyToClipboard}
              className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-all"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
              {copied ? 'Copied' : 'Copy Text'}
            </button>
          </div>
        </motion.div>
      ) : (
        <p className="text-gray-500 text-sm italic">
          Need help reaching out? Let Gemini draft a professional follow-up for this role.
        </p>
      )}
    </div>
  );
}
