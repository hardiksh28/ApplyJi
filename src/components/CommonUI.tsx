import React from 'react';
import { motion } from 'motion/react';
import { AlertCircle, Inbox, Loader2 } from 'lucide-react';

export function LoadingSpinner({ fullPage = false }: { fullPage?: boolean }) {
  const content = (
    <div className="flex flex-col items-center justify-center gap-3">
      <Loader2 className="w-8 h-8 text-brand-primary animate-spin" />
      <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">Loading</p>
    </div>
  );

  if (fullPage) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-bg-dark">
        {content}
      </div>
    );
  }

  return content;
}

export function ErrorState({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center p-12 text-center space-y-4 glass-card border-rose-500/20 bg-rose-500/5">
      <div className="p-3 bg-rose-500/10 rounded-full text-rose-500">
        <AlertCircle className="w-8 h-8" />
      </div>
      <div>
        <h3 className="text-lg font-bold text-white">Something went wrong</h3>
        <p className="text-sm text-slate-400 max-w-xs mx-auto mt-1">{message}</p>
      </div>
      {onRetry && (
        <button 
          onClick={onRetry}
          className="px-6 py-2 bg-rose-500 text-white font-bold rounded-xl hover:bg-rose-600 transition-all cursor-pointer shadow-lg shadow-rose-500/20"
        >
          Try Again
        </button>
      )}
    </div>
  );
}

export function EmptyState({ title, message, actionLabel, onAction }: { 
  title: string; 
  message: string; 
  actionLabel?: string; 
  onAction?: () => void 
}) {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col items-center justify-center p-12 text-center space-y-6 glass-card border-dashed"
    >
      <div className="p-4 bg-white/5 rounded-2xl text-slate-500 border border-white/5">
        <Inbox className="w-10 h-10" />
      </div>
      <div className="space-y-2">
        <h3 className="text-xl font-display font-bold text-white">{title}</h3>
        <p className="text-sm text-slate-400 max-w-xs mx-auto">{message}</p>
      </div>
      {actionLabel && onAction && (
        <button 
          onClick={onAction}
          className="px-6 py-3 bg-brand-primary text-white font-bold rounded-xl hover:bg-brand-secondary transition-all cursor-pointer shadow-lg shadow-brand-primary/20"
        >
          {actionLabel}
        </button>
      )}
    </motion.div>
  );
}
