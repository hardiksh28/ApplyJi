import { useState, useEffect } from 'react';
import { 
  Table as TableIcon, 
  LayoutPanelLeft, 
  Search, 
  Filter, 
  ArrowUpDown, 
  MoreHorizontal,
  ChevronRight,
  ExternalLink,
  Plus,
  Trash2,
  Edit3,
  Check,
  X,
  Loader2,
  Sparkles,
  PenTool,
  Target,
  FileText,
  BrainCircuit
} from 'lucide-react';
import { ApplicationStatus } from '../types';
import { cn } from '../lib/utils';
import { motion, AnimatePresence } from 'motion/react';
import { supabase } from '../lib/supabase/client';
import { LoadingSpinner, EmptyState, ErrorState } from '../components/CommonUI';
import { KanbanBoard } from '../components/KanbanBoard';

const statuses: ApplicationStatus[] = ['Saved', 'Applied', 'Screening', 'Interviewing', 'Offer', 'Rejected', 'Ghosted'];

export function Applications({ onAddClick }: { onAddClick: () => void }) {
  const [view, setView] = useState<'table' | 'kanban'>('table');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedApp, setSelectedApp] = useState<any | null>(null);
  const [applications, setApplications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null); // track which action is loading
  const [editingStatus, setEditingStatus] = useState(false);
  const [editingNotes, setEditingNotes] = useState(false);
  const [noteDraft, setNoteDraft] = useState('');

  useEffect(() => {
    fetchApplications();
  }, []);

  const fetchApplications = async () => {
    setLoading(true);
    setError(null);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;
      
      const { data, error: fetchError } = await supabase
        .from('applications')
        .select('*')
        .order('applied_at', { ascending: false });
        
      if (fetchError) throw fetchError;
      if (data) setApplications(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load applications');
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (appId: string, newStatus: string) => {
    setActionLoading(appId);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const response = await fetch(`/api/applications/${appId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error);
      }

      const updated = await response.json();
      setApplications(apps => apps.map(a => a.id === appId ? updated : a));
      if (selectedApp?.id === appId) setSelectedApp(updated);
      setEditingStatus(false);
    } catch (err: any) {
      alert('Failed to update status: ' + err.message);
    } finally {
      setActionLoading(null);
    }
  };

  const saveNotes = async (appId: string) => {
    setActionLoading('notes-' + appId);
    try {
      const { error } = await supabase
        .from('applications')
        .update({ notes: noteDraft })
        .eq('id', appId);

      if (error) throw error;

      setApplications(apps => apps.map(a => a.id === appId ? { ...a, notes: noteDraft } : a));
      if (selectedApp?.id === appId) setSelectedApp({ ...selectedApp, notes: noteDraft });
      setEditingNotes(false);
    } catch (err: any) {
      alert('Failed to save notes: ' + err.message);
    } finally {
      setActionLoading(null);
    }
  };

  const archiveApplication = async (appId: string) => {
    if (!window.confirm('Are you sure you want to delete this application?')) return;

    setActionLoading(appId);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const response = await fetch(`/api/applications/${appId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
        },
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error);
      }

      setApplications(apps => apps.filter(a => a.id !== appId));
      if (selectedApp?.id === appId) setSelectedApp(null);
    } catch (err: any) {
      alert('Failed to delete: ' + err.message);
    } finally {
      setActionLoading(null);
    }
  };

  const filteredApps = applications.filter(app => 
    (app!.company_name?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
    (app!.job_title?.toLowerCase() || '').includes(searchTerm.toLowerCase())
  );

  if (error && !loading) {
    return (
      <div className="p-8">
        <ErrorState message={error} onRetry={fetchApplications} />
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-display font-bold text-white mb-1">My Applications</h1>
          <p className="text-slate-400">Total {applications.length} active applications</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex bg-surface-dark border border-border-dark p-1 rounded-xl">
            <button 
              onClick={() => setView('table')}
              className={cn(
                "p-2 rounded-lg transition-all cursor-pointer",
                view === 'table' ? "bg-brand-primary text-white shadow-lg shadow-brand-primary/20" : "text-slate-400 hover:text-white"
              )}
            >
              <TableIcon className="w-5 h-5" />
            </button>
            <button 
              onClick={() => setView('kanban')}
              className={cn(
                "p-2 rounded-lg transition-all cursor-pointer",
                view === 'kanban' ? "bg-brand-primary text-white shadow-lg shadow-brand-primary/20" : "text-slate-400 hover:text-white"
              )}
            >
              <LayoutPanelLeft className="w-5 h-5" />
            </button>
          </div>
          <button 
            onClick={onAddClick}
            className="flex items-center gap-2 px-5 py-2.5 bg-brand-primary hover:bg-brand-secondary text-white font-semibold rounded-xl transition-all shadow-lg shadow-brand-primary/20 cursor-pointer"
          >
            <Plus className="w-5 h-5" />
            <span>New App</span>
          </button>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <input
            type="text"
            placeholder="Search by company, role or location..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-surface-dark border border-border-dark rounded-xl py-2.5 pl-11 pr-4 text-white focus:outline-none focus:ring-2 focus:ring-brand-primary/50 transition-all"
          />
        </div>
        <button className="flex items-center gap-2 px-4 py-2.5 bg-surface-dark border border-border-dark text-slate-300 rounded-xl hover:text-white hover:border-slate-700 transition-all cursor-pointer font-medium">
          <Filter className="w-4 h-4" />
          <span>Filters</span>
        </button>
        <button className="flex items-center gap-2 px-4 py-2.5 bg-surface-dark border border-border-dark text-slate-300 rounded-xl hover:text-white hover:border-slate-700 transition-all cursor-pointer font-medium">
          <ArrowUpDown className="w-4 h-4" />
          <span>Sort</span>
        </button>
      </div>

      <div className="flex-1 min-h-0 relative">
        <AnimatePresence mode="wait">
          {view === 'table' ? (
            <motion.div
              key="table"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="glass-card overflow-hidden h-full flex flex-col"
            >
              <div className="overflow-x-auto min-h-0 flex-1">
                <table className="w-full text-left border-collapse">
                  <thead className="sticky top-0 bg-surface-dark z-10">
                    <tr className="border-b border-border-dark">
                      <th className="px-6 py-4 text-xs uppercase font-bold text-slate-500 tracking-wider">Company</th>
                      <th className="px-6 py-4 text-xs uppercase font-bold text-slate-500 tracking-wider">Role</th>
                      <th className="px-6 py-4 text-xs uppercase font-bold text-slate-500 tracking-wider">Date Applied</th>
                      <th className="px-6 py-4 text-xs uppercase font-bold text-slate-500 tracking-wider">Status</th>
                      <th className="px-6 py-4 text-xs uppercase font-bold text-slate-500 tracking-wider">Location</th>
                      <th className="px-6 py-4 text-xs uppercase font-bold text-slate-500 tracking-wider"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border-dark/50">
                    {filteredApps.map((app) => (
                      <tr 
                        key={app!.id} 
                        onClick={() => {
                          setSelectedApp(app);
                          setNoteDraft(app!.notes || '');
                          setEditingStatus(false);
                          setEditingNotes(false);
                        }}
                        className={cn(
                          "hover:bg-white/5 transition-colors cursor-pointer group",
                          selectedApp?.id === app!.id ? "bg-brand-primary/10" : ""
                        )}
                      >
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-bg-dark flex items-center justify-center font-bold text-white border border-border-dark group-hover:border-brand-primary/50 transition-colors uppercase">
                              {app!.company_name ? app!.company_name[0] : '?'}
                            </div>
                            <span className="font-semibold text-white">{app!.company_name}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 font-medium text-slate-300">{app!.job_title}</td>
                        <td className="px-6 py-4 text-slate-400 text-sm">
                          {app!.applied_at ? new Date(app!.applied_at).toLocaleDateString() : 'Not yet'}
                        </td>
                        <td className="px-6 py-4">
                          <span className={cn(
                            "text-[10px] uppercase tracking-wider font-bold px-2.5 py-1 rounded-full",
                            getStatusStyles(app!.status || 'Applied')
                          )}>
                            {app!.status || 'Applied'}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-slate-400 text-sm">{app!.location || 'Remote'}</td>
                        <td className="px-6 py-4 text-right">
                          <button 
                            onClick={(e) => { e.stopPropagation(); archiveApplication(app!.id); }}
                            className="p-2 text-slate-500 hover:text-rose-400 transition-colors cursor-pointer"
                          >
                            {actionLoading === app!.id ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <Trash2 className="w-4 h-4" />
                            )}
                          </button>
                        </td>
                      </tr>
                    ))}
                    {filteredApps.length === 0 && !loading && (
                      <tr>
                        <td colSpan={6} className="py-12">
                          <EmptyState 
                            title="No applications found" 
                            message="We couldn't find any applications matching your search." 
                            actionLabel="Add New" 
                            onAction={onAddClick}
                          />
                        </td>
                      </tr>
                    )}
                    {loading && (
                      <tr>
                        <td colSpan={6} className="py-12 text-center">
                          <LoadingSpinner />
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="kanban"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="h-full"
            >
               <KanbanBoard 
                  applications={filteredApps} 
                  onStatusChange={updateStatus}
                  onCardClick={(app) => {
                    setSelectedApp(app);
                    setNoteDraft(app!.notes || '');
                  }}
               />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Side Panel */}
        <AnimatePresence>
          {selectedApp && (
            <>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-40 bg-bg-dark/40 backdrop-blur-xs lg:hidden"
                onClick={() => setSelectedApp(null)}
              />
              <motion.div
                initial={{ x: '100%' }}
                animate={{ x: 0 }}
                exit={{ x: '100%' }}
                transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                className="absolute top-0 right-0 h-full w-full max-w-md bg-surface-dark border-l border-border-dark z-50 shadow-2xl flex flex-col"
              >
                <div className="p-6 border-b border-border-dark flex items-center justify-between bg-bg-dark/50">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-bg-dark flex items-center justify-center font-bold text-2xl text-white border border-border-dark uppercase">
                      {selectedApp!.company_name ? selectedApp!.company_name[0] : '?'}
                    </div>
                    <div>
                      <h2 className="text-xl font-display font-bold text-white">{selectedApp!.company_name}</h2>
                      <p className="text-sm text-slate-400">{selectedApp!.job_title}</p>
                    </div>
                  </div>
                  <button 
                    onClick={() => setSelectedApp(null)}
                    className="p-2 text-slate-400 hover:text-white hover:bg-white/5 rounded-lg transition-all cursor-pointer"
                  >
                    <ChevronRight className="w-6 h-6" />
                  </button>
                </div>

                <div className="flex-1 overflow-y-auto p-6 space-y-8">
                  <section>
                    <h3 className="text-xs uppercase font-bold text-slate-500 tracking-wider mb-4">Quick Stats</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="glass-card p-4">
                        <span className="text-[10px] text-slate-500 block mb-2">Status</span>
                        {editingStatus ? (
                          <div className="space-y-2">
                            {statuses.map(s => (
                              <button
                                key={s}
                                onClick={() => updateStatus(selectedApp!.id, s.toLowerCase())}
                                disabled={actionLoading === selectedApp!.id}
                                className={cn(
                                  "block w-full text-left text-xs font-bold px-2 py-1 rounded transition-all cursor-pointer",
                                  selectedApp!.status?.toLowerCase() === s.toLowerCase()
                                    ? "bg-brand-primary/20 text-brand-primary"
                                    : "hover:bg-white/5 text-slate-400"
                                )}
                              >
                                {actionLoading === selectedApp!.id ? <Loader2 className="w-3 h-3 animate-spin inline" /> : s}
                              </button>
                            ))}
                            <button onClick={() => setEditingStatus(false)} className="text-[10px] text-slate-500 hover:text-white mt-1">Cancel</button>
                          </div>
                        ) : (
                          <button 
                            onClick={() => setEditingStatus(true)}
                            className="flex items-center gap-2 group cursor-pointer"
                          >
                            <span className={cn("text-xs font-bold px-2 py-0.5 rounded-full", getStatusStyles(selectedApp!.status))}>
                              {selectedApp!.status || 'Applied'}
                            </span>
                            <Edit3 className="w-3 h-3 text-slate-600 group-hover:text-brand-primary transition-colors" />
                          </button>
                        )}
                      </div>
                      <div className="glass-card p-4">
                        <span className="text-[10px] text-slate-500 block mb-1">Salary</span>
                        <span className="text-xs font-bold text-emerald-400">{selectedApp!.salary_range || selectedApp!.salary || 'N/A'}</span>
                      </div>
                    </div>
                  </section>

                  <section>
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-xs uppercase font-bold text-slate-500 tracking-wider">Notes</h3>
                      {editingNotes ? (
                        <div className="flex gap-2">
                          <button 
                            onClick={() => saveNotes(selectedApp!.id)} 
                            disabled={actionLoading === 'notes-' + selectedApp!.id}
                            className="text-[10px] text-brand-primary hover:underline cursor-pointer font-bold flex items-center gap-1"
                          >
                            {actionLoading === 'notes-' + selectedApp!.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <Check className="w-3 h-3" />}
                            Save
                          </button>
                          <button onClick={() => { setEditingNotes(false); setNoteDraft(selectedApp!.notes || ''); }} className="text-[10px] text-slate-500 hover:text-white cursor-pointer font-bold flex items-center gap-1">
                            <X className="w-3 h-3" /> Cancel
                          </button>
                        </div>
                      ) : (
                        <button onClick={() => { setEditingNotes(true); setNoteDraft(selectedApp!.notes || ''); }} className="text-[10px] text-brand-primary hover:underline cursor-pointer font-bold">Edit</button>
                      )}
                    </div>
                    {editingNotes ? (
                      <textarea
                        value={noteDraft}
                        onChange={(e) => setNoteDraft(e.target.value)}
                        className="w-full glass-card p-4 bg-bg-dark/50 text-slate-300 text-sm leading-relaxed min-h-[100px] resize-none border border-brand-primary/30 focus:outline-none focus:ring-2 focus:ring-brand-primary/50 rounded-xl"
                        placeholder="Add notes about this application..."
                      />
                    ) : (
                      <div className="glass-card p-4 bg-bg-dark/50 text-slate-300 text-sm leading-relaxed min-h-[100px] whitespace-pre-wrap italic">
                        {selectedApp!.notes || "No notes for this application yet... Click Edit to add notes."}
                      </div>
                    )}
                  </section>

                  <section>
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-xs uppercase font-bold text-slate-500 tracking-wider">Timeline</h3>
                    </div>
                    <div className="space-y-4">
                      <div className="relative pl-6 pb-2">
                        <div className="absolute left-0 top-1.5 w-4 h-4 rounded-full border-2 border-brand-primary bg-bg-dark"></div>
                        <div>
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-xs font-bold text-white">{selectedApp!.status || 'Applied'}</span>
                            <span className="text-[10px] text-slate-500 font-mono">{selectedApp!.applied_at ? new Date(selectedApp!.applied_at).toLocaleDateString() : 'N/A'}</span>
                          </div>
                          <p className="text-xs text-slate-400">Current status</p>
                        </div>
                      </div>
                    </div>
                  </section>

                  <section className="pt-6 border-t border-border-dark">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-2">
                        <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                        <h3 className="text-xs uppercase font-bold text-slate-300 tracking-wider">AI Toolkit</h3>
                      </div>
                      <span className="px-2 py-0.5 rounded bg-brand-primary/10 text-[8px] font-bold text-brand-primary uppercase tracking-widest border border-brand-primary/20">Pro Tier</span>
                    </div>
                    <div className="grid grid-cols-1 gap-3">
                      <button 
                        onClick={() => window.location.href = `/resume?jd=${encodeURIComponent(selectedApp!.company_name + ' ' + selectedApp!.job_title)}`}
                        className="w-full flex items-center justify-between p-3 rounded-xl bg-surface-dark border border-border-dark hover:border-brand-primary/50 hover:bg-brand-primary/5 transition-all group"
                      >
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-brand-primary/10 rounded-lg group-hover:bg-brand-primary/20 transition-colors">
                            <FileText className="w-4 h-4 text-brand-primary" />
                          </div>
                          <div className="text-left">
                            <p className="text-xs font-bold text-white">Tailor Resume</p>
                            <p className="text-[9px] text-slate-500">Optimize for this role</p>
                          </div>
                        </div>
                        <ChevronRight className="w-4 h-4 text-slate-600 group-hover:text-white transition-all" />
                      </button>

                      <button 
                        onClick={() => window.location.href = `/cover-letter?jd=${encodeURIComponent(selectedApp!.company_name + ' ' + selectedApp!.job_title)}`}
                        className="w-full flex items-center justify-between p-3 rounded-xl bg-surface-dark border border-border-dark hover:border-brand-primary/50 hover:bg-brand-primary/5 transition-all group"
                      >
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-indigo-400/10 rounded-lg group-hover:bg-indigo-400/20 transition-colors">
                            <PenTool className="w-4 h-4 text-indigo-400" />
                          </div>
                          <div className="text-left">
                            <p className="text-xs font-bold text-white">Cover Letter</p>
                            <p className="text-[9px] text-slate-500">Generate tailored letter</p>
                          </div>
                        </div>
                        <ChevronRight className="w-4 h-4 text-slate-600 group-hover:text-white transition-all" />
                      </button>

                      <button 
                        onClick={() => window.location.href = `/skills-gap?jd=${encodeURIComponent(selectedApp!.company_name + ' ' + selectedApp!.job_title)}`}
                        className="w-full flex items-center justify-between p-3 rounded-xl bg-surface-dark border border-border-dark hover:border-brand-primary/50 hover:bg-brand-primary/5 transition-all group"
                      >
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-emerald-400/10 rounded-lg group-hover:bg-emerald-400/20 transition-colors">
                            <Target className="w-4 h-4 text-emerald-400" />
                          </div>
                          <div className="text-left">
                            <p className="text-xs font-bold text-white">Skills Gap</p>
                            <p className="text-[9px] text-slate-500">Analyze compatibility</p>
                          </div>
                        </div>
                        <ChevronRight className="w-4 h-4 text-slate-600 group-hover:text-white transition-all" />
                      </button>

                      {['interviewing', 'interview'].includes((selectedApp!.status || '').toLowerCase()) && (
                        <button 
                          onClick={async () => {
                            const { data: { session } } = await supabase.auth.getSession();
                            if (!session) return;
                            setActionLoading('prep-' + selectedApp!.id);
                            try {
                              const response = await fetch('/api/interview-prep/generate', {
                                method: 'POST',
                                headers: {
                                  'Content-Type': 'application/json',
                                  'Authorization': `Bearer ${session.access_token}`,
                                },
                                body: JSON.stringify({ 
                                  jobId: selectedApp!.id,
                                  companyName: selectedApp!.company_name,
                                  role: selectedApp!.job_title
                                }),
                              });
                              const data = await response.json();
                              setApplications(apps => apps.map(a => a.id === selectedApp!.id ? { ...a, interview_prep_data: data } : a));
                              setSelectedApp({ ...selectedApp, interview_prep_data: data });
                            } catch (err) {
                              alert('Failed to generate prep: ' + (err as Error).message);
                            } finally {
                              setActionLoading(null);
                            }
                          }}
                          disabled={actionLoading === 'prep-' + selectedApp!.id}
                          className="w-full flex items-center justify-between p-3 rounded-xl bg-amber-400/5 border border-amber-400/20 hover:bg-amber-400/10 transition-all group"
                        >
                          <div className="flex items-center gap-3">
                            <div className="p-2 bg-amber-400/10 rounded-lg">
                              {actionLoading === 'prep-' + selectedApp!.id ? <Loader2 className="w-4 h-4 animate-spin text-amber-400" /> : <BrainCircuit className="w-4 h-4 text-amber-400" />}
                            </div>
                            <div className="text-left">
                              <p className="text-xs font-bold text-white">Interview Prep</p>
                              <p className="text-[9px] text-slate-500">Generate AI questions</p>
                            </div>
                          </div>
                          <ChevronRight className="w-4 h-4 text-slate-600 group-hover:text-white transition-all" />
                        </button>
                      )}
                    </div>

                    {selectedApp!.interview_prep_data?.questions && (
                      <div className="mt-4 p-4 rounded-xl bg-surface-dark border border-border-dark space-y-4">
                        <h4 className="text-[10px] font-bold text-amber-400 uppercase tracking-widest flex items-center gap-2">
                          <Sparkles className="w-3 h-3" />
                          AI Prep Sheet
                        </h4>
                        <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2 scrollbar-thin">
                          {selectedApp!.interview_prep_data.questions.map((q: any, i: number) => (
                            <div key={i} className="space-y-1">
                              <p className="text-xs font-bold text-white">Q: {q.q}</p>
                              <p className="text-[11px] text-slate-400 italic">A: {q.a}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </section>
                </div>

                <div className="p-6 border-t border-border-dark bg-bg-dark/50 flex gap-3">
                  <button 
                    onClick={() => setEditingStatus(true)}
                    className="flex-1 py-2.5 bg-brand-primary hover:bg-brand-secondary text-white font-bold rounded-xl transition-all cursor-pointer flex items-center justify-center gap-2"
                  >
                    <Edit3 className="w-4 h-4" />
                    Change Status
                  </button>
                  <button 
                    onClick={() => archiveApplication(selectedApp!.id)}
                    disabled={actionLoading === selectedApp!.id}
                    className="px-4 py-2.5 bg-surface-dark border border-border-dark text-slate-400 hover:text-rose-400 hover:border-rose-400/50 rounded-xl transition-all cursor-pointer flex items-center gap-2"
                  >
                    {actionLoading === selectedApp!.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                    Delete
                  </button>
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

function getStatusStyles(status: ApplicationStatus | string) {
  switch ((status || '').toLowerCase()) {
    case 'saved': return 'text-slate-400 bg-slate-400/10';
    case 'applied': return 'text-blue-400 bg-blue-400/10';
    case 'screening': return 'text-indigo-400 bg-indigo-400/10';
    case 'interview':
    case 'interviewing': return 'text-amber-400 bg-amber-400/10';
    case 'offer':
    case 'offered': return 'text-emerald-400 bg-emerald-400/10 border border-emerald-400/30';
    case 'rejected': return 'text-rose-400 bg-rose-400/10';
    case 'ghosted': return 'text-purple-400 bg-purple-400/10';
    case 'withdrawn': return 'text-gray-400 bg-gray-400/10';
    default: return 'text-slate-400 bg-slate-400/10';
  }
}

function getStatusDot(status: ApplicationStatus) {
  switch (status) {
    case 'Saved': return 'bg-slate-400';
    case 'Applied': return 'bg-blue-400';
    case 'Screening': return 'bg-indigo-400';
    case 'Interviewing': return 'bg-amber-400';
    case 'Offer': return 'bg-emerald-400';
    case 'Rejected': return 'bg-rose-400';
    case 'Ghosted': return 'bg-purple-400';
    default: return 'bg-slate-400';
  }
}
