/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';
import { Sidebar, Navbar } from './components/Layout';
import { Dashboard } from './pages/Dashboard';
import { Applications } from './pages/Applications';
import { SavedJobs } from './pages/SavedJobs';
import { Interviews } from './pages/Interviews';
import { Tasks } from './pages/Tasks';
import { Resume } from './pages/Resume';
import { CoverLetter } from './pages/CoverLetter';
import { SkillsGap } from './pages/SkillsGap';
import { JobDiscovery } from './pages/JobDiscovery';
import { Insights } from './pages/Insights';
import { Settings } from './pages/Settings';
import { Billing } from './pages/Billing';
import { Mentors } from './pages/Mentors';
import { CompanyReviews } from './pages/CompanyReviews';
import { PrivacyPolicy } from './pages/PrivacyPolicy';
import { motion, AnimatePresence } from 'motion/react';
import { Search } from 'lucide-react';

import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import ReactGA from 'react-ga4';
import { Login } from './components/Login';
import { AuthCallback } from './components/AuthCallback';
import { ProtectedRoute, ProRoute } from './components/ProtectedRoute';
import { Landing } from './components/Landing';
import { supabase } from './lib/supabase/client';

const AnalyticsTracker = () => {
  const location = useLocation();
  useEffect(() => {
    const gaId = process.env.NEXT_PUBLIC_GA_ID;
    if (gaId) {
      ReactGA.send({ hitType: "pageview", page: location.pathname + location.search });
    }
  }, [location]);
  return null;
};

export default function App() {
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

  useEffect(() => {
    const gaId = process.env.NEXT_PUBLIC_GA_ID;
    if (gaId) {
      ReactGA.initialize(gaId);
    }
  }, []);

  const AppLayout = ({ children, onAddClick: addClickProp }: { children: React.ReactNode; onAddClick?: () => void }) => (
    <div className="flex h-screen bg-bg-dark overflow-hidden font-sans">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <Navbar onSearchClick={() => setIsSearchOpen(true)} onAddClick={addClickProp || (() => setIsAddModalOpen(true))} />
        <main className="flex-1 overflow-y-auto bg-bg-dark/50 p-8">
          <AnimatePresence mode="wait">
             {children}
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
              <form className="space-y-4" onSubmit={async (e) => { 
                e.preventDefault(); 
                const formData = new FormData(e.currentTarget);
                const company = formData.get('company') as string;
                const role = formData.get('role') as string;
                const status = formData.get('status') as string;
                const salary = formData.get('salary') as string;
                const location = formData.get('location') as string;
                const submitBtn = e.currentTarget.querySelector('button[type="submit"]') as HTMLButtonElement;

                try {
                  submitBtn.disabled = true;
                  submitBtn.textContent = 'Creating...';

                  const { data: { session } } = await supabase.auth.getSession();
                  if (!session) throw new Error('Not authenticated');

                  const response = await fetch('/api/applications', {
                    method: 'POST',
                    headers: {
                      'Content-Type': 'application/json',
                      'Authorization': `Bearer ${session.access_token}`,
                    },
                    body: JSON.stringify({
                      company_name: company,
                      job_title: role,
                      status: status,
                      salary_range: salary || null,
                      location: location || null,
                    }),
                  });

                  if (!response.ok) {
                    const err = await response.json();
                    if (err.code === 'LIMIT_REACHED') {
                      alert('You have reached the free tier limit of 5 applications per month. Upgrade to Pro for unlimited applications.');
                      return;
                    }
                    throw new Error(err.error || 'Failed to create application');
                  }

                  setIsAddModalOpen(false);
                  window.location.reload();
                } catch (err: any) {
                  console.error(err);
                  alert(err.message || 'Failed to create application');
                } finally {
                  submitBtn.disabled = false;
                  submitBtn.textContent = 'Create Application';
                }
              }}>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Company Name</label>
                  <input name="company" required placeholder="e.g. Google" className="w-full bg-bg-dark border border-border-dark rounded-xl px-4 py-2.5 text-white focus:ring-2 focus:ring-brand-primary outline-none" />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Job Role</label>
                  <input name="role" required placeholder="e.g. Senior Frontend Engineer" className="w-full bg-bg-dark border border-border-dark rounded-xl px-4 py-2.5 text-white focus:ring-2 focus:ring-brand-primary outline-none" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                   <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Status</label>
                    <select name="status" className="w-full bg-bg-dark border border-border-dark rounded-xl px-4 py-2.5 text-white focus:ring-2 focus:ring-brand-primary outline-none">
                      <option value="applied">Applied</option>
                      <option value="saved">Saved</option>
                      <option value="interviewing">Interviewing</option>
                      <option value="screening">Screening</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Location</label>
                    <input name="location" placeholder="e.g. Remote" className="w-full bg-bg-dark border border-border-dark rounded-xl px-4 py-2.5 text-white focus:ring-2 focus:ring-brand-primary outline-none" />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Salary Range (Optional)</label>
                  <input name="salary" placeholder="e.g. ₹15-25 LPA" className="w-full bg-bg-dark border border-border-dark rounded-xl px-4 py-2.5 text-white focus:ring-2 focus:ring-brand-primary outline-none" />
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

  return (
    <BrowserRouter>
      <AnalyticsTracker />
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/auth/callback" element={<AuthCallback />} />
        <Route path="/" element={<Landing />} />
        <Route path="/privacy-policy" element={<PrivacyPolicy />} />
        
        <Route path="/dashboard" element={<ProtectedRoute><AppLayout><Dashboard onAddClick={() => setIsAddModalOpen(true)} /></AppLayout></ProtectedRoute>} />
        <Route path="/applications" element={<ProtectedRoute><AppLayout><Applications onAddClick={() => setIsAddModalOpen(true)} /></AppLayout></ProtectedRoute>} />
        <Route path="/saved" element={<ProtectedRoute><AppLayout><SavedJobs /></AppLayout></ProtectedRoute>} />
        <Route path="/interviews" element={<ProtectedRoute><AppLayout><Interviews /></AppLayout></ProtectedRoute>} />
        <Route path="/tasks" element={<ProtectedRoute><AppLayout><Tasks /></AppLayout></ProtectedRoute>} />
        <Route path="/settings" element={<ProtectedRoute><AppLayout><Settings /></AppLayout></ProtectedRoute>} />
        <Route path="/billing" element={<ProtectedRoute><AppLayout><Billing /></AppLayout></ProtectedRoute>} />

        {/* Pro Routes */}
        <Route path="/resume" element={<ProRoute><AppLayout><Resume /></AppLayout></ProRoute>} />
        <Route path="/cover-letter" element={<ProRoute><AppLayout><CoverLetter /></AppLayout></ProRoute>} />
        <Route path="/skills-gap" element={<ProRoute><AppLayout><SkillsGap /></AppLayout></ProRoute>} />
        <Route path="/insights" element={<ProRoute><AppLayout><Insights /></AppLayout></ProRoute>} />
        <Route path="/discovery" element={<ProRoute><AppLayout><JobDiscovery /></AppLayout></ProRoute>} />
        <Route path="/mentors" element={<ProRoute><AppLayout><Mentors /></AppLayout></ProRoute>} />
        <Route path="/reviews" element={<ProRoute><AppLayout><CompanyReviews /></AppLayout></ProRoute>} />

        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </BrowserRouter>
  );
}


