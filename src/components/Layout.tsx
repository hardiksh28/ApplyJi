import React from 'react';
import { 
  LayoutDashboard, 
  Briefcase, 
  Bookmark, 
  Calendar, 
  CheckSquare, 
  FileText, 
  BarChart3, 
  Settings,
  Plus,
  Search,
  Bell,
  LogOut,
  User
} from 'lucide-react';
import { cn } from '../lib/utils';
import { motion, AnimatePresence } from 'motion/react';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

const navItems = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'applications', label: 'Applications', icon: Briefcase },
  { id: 'saved', label: 'Saved Jobs', icon: Bookmark },
  { id: 'interviews', label: 'Interviews', icon: Calendar },
  { id: 'tasks', label: 'Tasks', icon: CheckSquare },
  { id: 'resume', label: 'Resume/CV', icon: FileText },
  { id: 'insights', label: 'Insights', icon: BarChart3 },
];

export function Sidebar({ activeTab, setActiveTab }: SidebarProps) {
  return (
    <div className="w-64 glass-panel h-screen flex flex-col p-4">
      <div className="flex items-center gap-2 px-2 mb-10">
        <img src="/applyji-logo.svg" alt="ApplyJi" className="h-10 w-auto object-contain" />
      </div>

      <nav className="flex-1 space-y-1">
        {navItems.map((item) => (
          <button
            key={item.id}
            onClick={() => setActiveTab(item.id)}
            className={cn(
              activeTab === item.id ? 'nav-item-active' : 'nav-item',
              'w-full cursor-pointer'
            )}
          >
            <item.icon className={cn("w-5 h-5", activeTab === item.id ? "text-brand-primary" : "text-zinc-500")} />
            <span>{item.label}</span>
          </button>
        ))}
      </nav>

      <div className="pt-4 mt-4 border-t border-zinc-800 space-y-1">
        <div className="flex items-center gap-3 px-2 py-3 mb-2">
          <div className="w-9 h-9 rounded-full bg-zinc-800 flex items-center justify-center text-xs font-bold ring-1 ring-zinc-700">
            HS
          </div>
          <div className="flex-1 min-w-0 leading-tight">
            <p className="text-sm font-semibold truncate text-white">Hardik S.</p>
            <p className="text-xs text-zinc-500 truncate italic">Free Tier</p>
          </div>
        </div>
        <button
          onClick={() => setActiveTab('settings')}
          className={cn(
            activeTab === 'settings' ? 'nav-item-active' : 'nav-item',
            'w-full cursor-pointer py-2'
          )}
        >
          <Settings className="w-4 h-4" />
          <span className="text-sm">Settings</span>
        </button>
      </div>

      <div className="mt-8 p-4 glass-card bg-brand-primary/5 border-brand-primary/20">
        <p className="text-xs text-slate-400 mb-2 uppercase tracking-wider font-semibold">Pro Plan</p>
        <p className="text-sm text-white font-medium mb-3">Get AI-powered resume matching</p>
        <button className="w-full py-2 bg-brand-primary hover:bg-brand-secondary text-white text-sm font-semibold rounded-lg transition-colors cursor-pointer">
          Upgrade Now
        </button>
      </div>
    </div>
  );
}

export function Navbar({ onSearchClick }: { onSearchClick: () => void }) {
  return (
    <header className="h-16 border-b border-border-dark flex items-center justify-between px-8 bg-bg-dark z-40">
      <div className="relative w-96">
        <button 
          onClick={onSearchClick}
          className="w-full flex items-center gap-3 bg-zinc-900 border border-zinc-800 rounded-full py-2 px-4 text-zinc-500 hover:text-zinc-300 hover:ring-1 hover:ring-indigo-500/50 transition-all cursor-pointer group"
        >
          <Search className="w-4 h-4 text-zinc-500 group-hover:text-brand-primary transition-colors" />
          <span className="text-sm">Search anything (Cmd + K)</span>
        </button>
      </div>

      <div className="flex items-center gap-4">
        <button className="p-2 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-lg transition-all relative cursor-pointer">
          <Bell className="w-5 h-5" />
          <span className="absolute top-2.5 right-2.5 w-2 h-2 bg-brand-primary rounded-full ring-2 ring-bg-dark"></span>
        </button>
        
        <button className="bg-brand-primary hover:bg-brand-secondary text-white px-4 py-2 rounded-lg text-sm font-semibold flex items-center gap-2 transition-all shadow-lg shadow-brand-primary/20 cursor-pointer">
          <Plus className="w-4 h-4" />
          <span>New Application</span>
        </button>
      </div>
    </header>
  );
}
