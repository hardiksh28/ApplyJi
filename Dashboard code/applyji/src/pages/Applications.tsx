import React, { useState } from 'react';
import { 
  Table as TableIcon, 
  LayoutPanelLeft, 
  Search, 
  Filter, 
  ArrowUpDown, 
  MoreHorizontal,
  ChevronRight,
  ExternalLink,
  Plus
} from 'lucide-react';
import { mockApplications } from '../data/mockData';
import { Application, ApplicationStatus } from '../types';
import { cn } from '../lib/utils';
import { motion, AnimatePresence } from 'motion/react';

const statuses: ApplicationStatus[] = ['Saved', 'Applied', 'Screening', 'Interview', 'Offer', 'Rejected', 'Ghosted'];

export function Applications({ onAddClick }: { onAddClick: () => void }) {
  const [view, setView] = useState<'table' | 'kanban'>('table');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedApp, setSelectedApp] = useState<Application | null>(null);

  const filteredApps = mockApplications.filter(app => 
    app.company.toLowerCase().includes(searchTerm.toLowerCase()) ||
    app.role.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="h-full flex flex-col space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-display font-bold text-white mb-1">My Applications</h1>
          <p className="text-slate-400">Total {mockApplications.length} active applications</p>
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
                        key={app.id} 
                        onClick={() => setSelectedApp(app)}
                        className={cn(
                          "hover:bg-white/5 transition-colors cursor-pointer group",
                          selectedApp?.id === app.id ? "bg-brand-primary/10" : ""
                        )}
                      >
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-bg-dark flex items-center justify-center font-bold text-white border border-border-dark group-hover:border-brand-primary/50 transition-colors">
                              {app.company[0]}
                            </div>
                            <span className="font-semibold text-white">{app.company}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 font-medium text-slate-300">{app.role}</td>
                        <td className="px-6 py-4 text-slate-400 text-sm">{app.dateApplied || 'Not yet'}</td>
                        <td className="px-6 py-4">
                          <span className={cn(
                            "text-[10px] uppercase tracking-wider font-bold px-2.5 py-1 rounded-full",
                            getStatusStyles(app.status)
                          )}>
                            {app.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-slate-400 text-sm">{app.location}</td>
                        <td className="px-6 py-4 text-right">
                          <button className="p-2 text-slate-500 hover:text-white transition-colors cursor-pointer">
                            <MoreHorizontal className="w-5 h-5" />
                          </button>
                        </td>
                      </tr>
                    ))}
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
              className="flex gap-4 overflow-x-auto pb-4 h-full"
            >
              {statuses.map((status) => (
                <div key={status} className="flex-shrink-0 w-80 flex flex-col gap-4">
                  <div className="flex items-center justify-between px-2">
                    <div className="flex items-center gap-2">
                      <div className={cn("w-1.5 h-1.5 rounded-full", getStatusStyles(status).split(' ')[1].replace('bg-', 'bg-').split('/')[0])}></div>
                      <h4 className="text-sm font-bold text-white uppercase tracking-wider">{status}</h4>
                      <span className="text-xs text-slate-500 bg-surface-dark px-1.5 py-0.5 rounded border border-border-dark">{mockApplications.filter(a => a.status === status).length}</span>
                    </div>
                  </div>
                  <div className="flex-1 space-y-3 p-2 bg-surface-dark/30 rounded-2xl border border-border-dark/50">
                    {mockApplications.filter(a => a.status === status).map(app => (
                      <div 
                        key={app.id} 
                        onClick={() => setSelectedApp(app)}
                        className="glass-card p-4 hover:border-brand-primary transition-all cursor-pointer group"
                      >
                        <h5 className="font-bold text-white mb-1 group-hover:text-brand-primary transition-colors">{app.company}</h5>
                        <p className="text-xs text-slate-400 mb-3">{app.role}</p>
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] text-slate-500">{app.location}</span>
                          <div className="flex -space-x-2">
                            {app.tags?.slice(0, 2).map((tag, i) => (
                              <div key={i} className="w-2 h-2 rounded-full border border-bg-dark" style={{ backgroundColor: i === 0 ? '#8B5CF6' : '#C084FC' }}></div>
                            ))}
                          </div>
                        </div>
                      </div>
                    ))}
                    <button className="w-full py-2 flex items-center justify-center gap-2 border border-dashed border-border-dark rounded-xl text-slate-500 hover:text-white hover:border-slate-600 transition-all text-xs font-medium cursor-pointer">
                      <Plus className="w-3 h-3" />
                      Add Job
                    </button>
                  </div>
                </div>
              ))}
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
                    <div className="w-12 h-12 rounded-xl bg-bg-dark flex items-center justify-center font-bold text-2xl text-white border border-border-dark">
                      {selectedApp.company[0]}
                    </div>
                    <div>
                      <h2 className="text-xl font-display font-bold text-white">{selectedApp.company}</h2>
                      <p className="text-sm text-slate-400">{selectedApp.role}</p>
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
                        <span className="text-[10px] text-slate-500 block mb-1">Status</span>
                        <span className={cn("text-xs font-bold px-2 py-0.5 rounded-full", getStatusStyles(selectedApp.status))}>
                          {selectedApp.status}
                        </span>
                      </div>
                      <div className="glass-card p-4">
                        <span className="text-[10px] text-slate-500 block mb-1">Salary</span>
                        <span className="text-xs font-bold text-emerald-400">{selectedApp.salary || 'N/A'}</span>
                      </div>
                    </div>
                  </section>

                  <section>
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-xs uppercase font-bold text-slate-500 tracking-wider">Timeline</h3>
                      <button className="text-[10px] text-brand-primary hover:underline cursor-pointer font-bold">Add Event</button>
                    </div>
                    <div className="space-y-4">
                      {selectedApp.timeline?.map((item, i) => (
                        <div key={i} className="relative pl-6 pb-2">
                          {i !== (selectedApp.timeline?.length || 0) - 1 && (
                            <div className="absolute left-[7px] top-4 bottom-0 w-[2px] bg-border-dark"></div>
                          )}
                          <div className="absolute left-0 top-1.5 w-4 h-4 rounded-full border-2 border-brand-primary bg-bg-dark"></div>
                          <div>
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-xs font-bold text-white">{item.label}</span>
                              <span className="text-[10px] text-slate-500 font-mono">{item.date}</span>
                            </div>
                            <p className="text-xs text-slate-400">{item.description}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </section>

                  <section>
                    <h3 className="text-xs uppercase font-bold text-slate-500 tracking-wider mb-4">Notes</h3>
                    <div className="glass-card p-4 bg-bg-dark/50 text-slate-300 text-sm leading-relaxed min-h-[100px] whitespace-pre-wrap italic">
                      {selectedApp.notes || "No notes for this application yet..."}
                    </div>
                  </section>

                  <section>
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-xs uppercase font-bold text-slate-500 tracking-wider">Contacts</h3>
                      <button className="text-[10px] text-brand-primary hover:underline cursor-pointer font-bold">Add Contact</button>
                    </div>
                    <div className="space-y-3">
                      {selectedApp.contacts && selectedApp.contacts.length > 0 ? (
                        selectedApp.contacts.map((contact, i) => (
                          <div key={i} className="flex items-center justify-between p-3 rounded-lg border border-border-dark bg-bg-dark/30">
                            <div>
                              <p className="text-sm font-semibold text-white">{contact.name}</p>
                              <p className="text-[10px] text-slate-500">{contact.role}</p>
                            </div>
                            <div className="flex gap-2">
                              <button className="p-1.5 text-slate-400 hover:text-white transition-colors cursor-pointer"><ExternalLink className="w-3.5 h-3.5" /></button>
                            </div>
                          </div>
                        ))
                      ) : (
                        <p className="text-xs text-slate-500 italic">No contacts added.</p>
                      )}
                    </div>
                  </section>
                </div>

                <div className="p-6 border-t border-border-dark bg-bg-dark/50 flex gap-3">
                  <button className="flex-1 py-2.5 bg-brand-primary hover:bg-brand-secondary text-white font-bold rounded-xl transition-all cursor-pointer">
                    Edit Application
                  </button>
                  <button className="px-4 py-2.5 bg-surface-dark border border-border-dark text-slate-400 hover:text-rose-400 hover:border-rose-400/50 rounded-xl transition-all cursor-pointer">
                    Archive
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

function getStatusStyles(status: ApplicationStatus) {
  switch (status) {
    case 'Saved': return 'text-slate-400 bg-slate-400/10';
    case 'Applied': return 'text-blue-400 bg-blue-400/10';
    case 'Screening': return 'text-indigo-400 bg-indigo-400/10';
    case 'Interview': return 'text-amber-400 bg-amber-400/10';
    case 'Offer': return 'text-emerald-400 bg-emerald-400/10 border border-emerald-400/30';
    case 'Rejected': return 'text-rose-400 bg-rose-400/10';
    case 'Ghosted': return 'text-purple-400 bg-purple-400/10';
    default: return 'text-slate-400 bg-slate-400/10';
  }
}
