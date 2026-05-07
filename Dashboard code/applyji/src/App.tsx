/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Sidebar, Navbar } from './components/Layout';
import { Dashboard } from './pages/Dashboard';
import { Applications } from './pages/Applications';
import { SavedJobs } from './pages/SavedJobs';
import { Interviews } from './pages/Interviews';
import { Tasks } from './pages/Tasks';
import { Resume } from './pages/Resume';
import { Insights } from './pages/Insights';
import { Settings } from './pages/Settings';
import { motion, AnimatePresence } from 'motion/react';
import { Search } from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsSearchOpen(true);
      }
      if (e.key === 'Escape') {
        setIsSearchOpen(false);
        setIsAddModalOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <Dashboard onAddClick={() => setIsAddModalOpen(true)} />;
      case 'applications':
        return <Applications onAddClick={() => setIsAddModalOpen(true)} />;
      case 'saved':
        return <SavedJobs />;
      case 'interviews':
        return <Interviews />;
      case 'tasks':
        return <Tasks />;
      case 'resume':
        return <Resume />;
      case 'insights':
        return <Insights />;
      case 'settings':
        return <Settings />;
      default:
        return (
          <div className="flex flex-col items-center justify-center h-full text-slate-500">
            <h2 className="text-xl font-display font-medium mb-2 text-white capitalize">{activeTab} Page</h2>
            <p className="text-slate-500">This page is under construction. Coming soon!</p>
          </div>
        );
    }
  };

  return (
    <div className="flex h-screen bg-bg-dark overflow-hidden font-sans">
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />
      
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <Navbar onSearchClick={() => setIsSearchOpen(true)} />
        
        <main className="flex-1 overflow-y-auto bg-bg-dark/50 p-8">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="h-full"
            >
              {renderContent()}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>

      <AnimatePresence>
        {/* Search Modal */}
        {isSearchOpen && (
          <div className="fixed inset-0 z-50 flex items-start justify-center pt-24 px-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-bg-dark/80 backdrop-blur-sm"
              onClick={() => setIsSearchOpen(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative w-full max-w-2xl glass-card bg-surface-dark border-border-dark overflow-hidden shadow-2xl"
            >
              <div className="p-4 border-b border-border-dark flex items-center gap-3">
                <Search className="w-5 h-5 text-slate-400" />
                <input
                  autoFocus
                  placeholder="Search for companies, roles, tasks, or contacts..."
                  className="flex-1 bg-transparent border-none outline-none text-white placeholder-slate-500 text-lg"
                />
                <button 
                  onClick={() => setIsSearchOpen(false)}
                  className="text-xs px-2 py-1 rounded border border-border-dark text-slate-500 hover:text-white hover:border-slate-700 transition-all"
                >
                  ESC
                </button>
              </div>
              <div className="p-2 max-h-[400px] overflow-y-auto">
                <div className="px-3 py-2 text-[10px] uppercase font-bold text-slate-500 tracking-wider">Recent Searches</div>
                <div className="space-y-1">
                  {['Google Software Engineer', 'Stripe Interview Prep', 'Resume version 2.1'].map((item) => (
                    <button key={item} className="w-full text-left px-3 py-2 rounded-lg hover:bg-white/5 text-slate-300 transition-all text-sm">
                      {item}
                    </button>
                  ))}
                </div>
              </div>
            </motion.div>
          </div>
        )}

        {/* Add Application Modal */}
        {isAddModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-bg-dark/80 backdrop-blur-sm"
              onClick={() => setIsAddModalOpen(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="relative w-full max-w-lg glass-card bg-surface-dark border-border-dark shadow-2xl p-8"
            >
              <h2 className="text-2xl font-display font-bold text-white mb-6">Add New Application</h2>
              <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); setIsAddModalOpen(false); }}>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Company Name</label>
                  <input placeholder="e.g. Google" className="w-full bg-bg-dark border border-border-dark rounded-xl px-4 py-2.5 text-white focus:ring-2 focus:ring-brand-primary outline-none" />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Job Role</label>
                  <input placeholder="e.g. Senior Frontend Engineer" className="w-full bg-bg-dark border border-border-dark rounded-xl px-4 py-2.5 text-white focus:ring-2 focus:ring-brand-primary outline-none" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                   <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Status</label>
                    <select className="w-full bg-bg-dark border border-border-dark rounded-xl px-4 py-2.5 text-white focus:ring-2 focus:ring-brand-primary outline-none">
                      <option>Applied</option>
                      <option>Saved</option>
                      <option>Interviewing</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Salary (Optional)</label>
                    <input placeholder="$150k" className="w-full bg-bg-dark border border-border-dark rounded-xl px-4 py-2.5 text-white focus:ring-2 focus:ring-brand-primary outline-none" />
                  </div>
                </div>
                <div className="pt-6 flex gap-3">
                  <button type="button" onClick={() => setIsAddModalOpen(false)} className="flex-1 py-3 border border-border-dark text-slate-400 font-bold rounded-xl hover:text-white hover:bg-white/5 transition-all">Cancel</button>
                  <button type="submit" className="flex-1 py-3 bg-brand-primary text-white font-bold rounded-xl shadow-lg shadow-brand-primary/20 hover:bg-brand-secondary transition-all">Create Application</button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}


