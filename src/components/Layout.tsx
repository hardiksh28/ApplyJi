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
  User,
  PenTool,
  Target,
  Compass,
  Users,
  MessageSquare,
  Lock
} from 'lucide-react';
import { cn } from '../lib/utils';
import { motion, AnimatePresence } from 'motion/react';

import { NavLink, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase/client';
import { signOut } from '../lib/auth-service';
import { useEffect, useState } from 'react';

const navItems = [
  { id: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: '/discovery', label: 'Job Discovery', icon: Compass, isPro: true },
  { id: '/applications', label: 'Applications', icon: Briefcase },
  { id: '/saved', label: 'Saved Jobs', icon: Bookmark },
  { id: '/interviews', label: 'Interviews', icon: Calendar },
  { id: '/tasks', label: 'Tasks', icon: CheckSquare },
];

const aiItems = [
  { id: '/resume', label: 'Resume/CV', icon: FileText, isPro: true },
  { id: '/cover-letter', label: 'Cover Letter', icon: PenTool, isPro: true },
  { id: '/skills-gap', label: 'Skills Gap', icon: Target, isPro: true },
  { id: '/insights', label: 'Insights', icon: BarChart3, isPro: true },
];

const communityItems = [
  { id: '/mentors', label: 'Mentors', icon: Users, isPro: true },
  { id: '/reviews', label: 'Reviews', icon: MessageSquare, isPro: true },
];

export function Sidebar() {
  const [profile, setProfile] = useState<any>(null);
  const navigate = useNavigate();

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (user) {
        const { data } = await supabase.from('profiles').select('*').eq('id', user.id).single();
        setProfile(data);
      }
    });
  }, []);

  const handleLogout = async () => {
    await signOut();
    navigate('/');
  };

  return (
    <div className="w-64 glass-panel h-screen flex flex-col p-4">
      <div className="flex items-center gap-2 px-2 mb-10">
        <img src="/applyji-logo.svg" alt="ApplyJi" className="h-10 w-auto object-contain" />
      </div>

      <nav className="flex-1 space-y-8 overflow-y-auto pr-2 scrollbar-hide">
        <div className="space-y-1">
          <p className="px-3 text-[10px] font-bold text-slate-600 uppercase tracking-widest mb-2">Core</p>
          {navItems.map((item) => (
            <NavLink
              key={item.id}
              to={item.id}
              className={({ isActive }) => cn(
                isActive ? 'nav-item-active' : 'nav-item',
                'w-full cursor-pointer flex items-center justify-between'
              )}
            >
              {({ isActive }) => (
                <div className="flex items-center gap-3 flex-1">
                  <item.icon className={cn("w-5 h-5", isActive ? "text-brand-primary" : "text-zinc-500")} />
                  <span className="flex-1">{item.label}</span>
                  {item.isPro && profile?.subscription_tier !== 'pro' && (
                    <Lock className="w-3.5 h-3.5 text-amber-500 opacity-70" />
                  )}
                </div>
              )}
            </NavLink>
          ))}
        </div>

        <div className="space-y-1">
          <p className="px-3 text-[10px] font-bold text-slate-600 uppercase tracking-widest mb-2">AI Intelligence</p>
          {aiItems.map((item) => (
            <NavLink
              key={item.id}
              to={item.id}
              className={({ isActive }) => cn(
                isActive ? 'nav-item-active' : 'nav-item',
                'w-full cursor-pointer flex items-center justify-between'
              )}
            >
              {({ isActive }) => (
                <div className="flex items-center gap-3 flex-1">
                  <item.icon className={cn("w-5 h-5", isActive ? "text-brand-primary" : "text-zinc-500")} />
                  <span className="flex-1">{item.label}</span>
                  {item.isPro && profile?.subscription_tier !== 'pro' && (
                    <Lock className="w-3.5 h-3.5 text-amber-500 opacity-70" />
                  )}
                </div>
              )}
            </NavLink>
          ))}
        </div>

        <div className="space-y-1">
          <p className="px-3 text-[10px] font-bold text-slate-600 uppercase tracking-widest mb-2">Community</p>
          {communityItems.map((item) => (
            <NavLink
              key={item.id}
              to={item.id}
              className={({ isActive }) => cn(
                isActive ? 'nav-item-active' : 'nav-item',
                'w-full cursor-pointer flex items-center justify-between'
              )}
            >
              {({ isActive }) => (
                <div className="flex items-center gap-3 flex-1">
                  <item.icon className={cn("w-5 h-5", isActive ? "text-brand-primary" : "text-zinc-500")} />
                  <span className="flex-1">{item.label}</span>
                  {item.isPro && profile?.subscription_tier !== 'pro' && (
                    <Lock className="w-3.5 h-3.5 text-amber-500 opacity-70" />
                  )}
                </div>
              )}
            </NavLink>
          ))}
        </div>
      </nav>

      <div className="pt-4 mt-4 border-t border-zinc-800 space-y-1">
        <div className="flex items-center gap-3 px-2 py-3 mb-2">
          <div className="w-9 h-9 rounded-full bg-zinc-800 flex items-center justify-center text-xs font-bold ring-1 ring-zinc-700 text-brand-primary">
            {profile?.full_name ? profile!.full_name.substring(0, 2).toUpperCase() : 'HS'}
          </div>
          <div className="flex-1 min-w-0 leading-tight">
            <p className="text-sm font-semibold truncate text-white">{profile?.full_name || 'Hardik S.'}</p>
            <p className="text-xs text-zinc-500 truncate italic">{profile?.subscription_tier || 'Free Tier'}</p>
          </div>
        </div>
        <NavLink
          to="/settings"
          className={({ isActive }) => cn(
            isActive ? 'nav-item-active' : 'nav-item',
            'w-full cursor-pointer py-2'
          )}
        >
          <Settings className="w-4 h-4" />
          <span className="text-sm">Settings</span>
        </NavLink>
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-zinc-500 hover:text-rose-400 hover:bg-rose-500/10 transition-all duration-200 font-medium cursor-pointer"
        >
          <LogOut className="w-4 h-4" />
          <span className="text-sm">Log Out</span>
        </button>
      </div>

      {profile?.subscription_tier !== 'pro' && (
        <div className="mt-8 p-4 glass-card bg-brand-primary/5 border-brand-primary/20">
          <p className="text-xs text-slate-400 mb-2 uppercase tracking-wider font-semibold">Pro Plan</p>
          <p className="text-sm text-white font-medium mb-3">Get AI-powered resume matching</p>
          <button 
            onClick={() => navigate('/billing')}
            className="w-full py-2 bg-brand-primary hover:bg-brand-secondary text-white text-sm font-semibold rounded-lg transition-colors cursor-pointer"
          >
            Upgrade Now
          </button>
        </div>
      )}
    </div>
  );
}

export function Navbar({ onSearchClick, onAddClick }: { onSearchClick: () => void; onAddClick?: () => void }) {
  const [notifications, setNotifications] = useState<any[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);

  useEffect(() => {
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;

    const { data } = await supabase
      .from('notifications')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(10);
    
    if (data) setNotifications(data);
  };

  const markAsRead = async (id: string) => {
    await supabase.from('notifications').update({ is_read: true }).eq('id', id);
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
  };

  const unreadCount = notifications.filter(n => !n.is_read).length;

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

      <div className="flex items-center gap-4 relative">
        <button 
          onClick={() => setShowNotifications(!showNotifications)}
          className="p-2 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-lg transition-all relative cursor-pointer"
        >
          <Bell className="w-5 h-5" />
          {unreadCount > 0 && (
            <span className="absolute top-1.5 right-1.5 w-4 h-4 bg-brand-primary text-[10px] font-bold text-white rounded-full ring-2 ring-bg-dark flex items-center justify-center">
              {unreadCount}
            </span>
          )}
        </button>

        <AnimatePresence>
          {showNotifications && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setShowNotifications(false)} />
              <motion.div
                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 10, scale: 0.95 }}
                className="absolute top-full right-0 mt-2 w-80 glass-card bg-surface-dark border-border-dark shadow-2xl z-50 overflow-hidden"
              >
                <div className="p-4 border-b border-border-dark flex items-center justify-between">
                  <h4 className="text-xs font-bold text-white uppercase tracking-widest">Notifications</h4>
                  <button className="text-[10px] text-slate-500 hover:text-brand-primary transition-colors">Mark all as read</button>
                </div>
                <div className="max-h-[350px] overflow-y-auto">
                  {notifications.length > 0 ? (
                    notifications.map((n) => (
                      <div 
                        key={n.id} 
                        onClick={() => markAsRead(n.id)}
                        className={cn(
                          "p-4 border-b border-white/5 hover:bg-white/5 transition-colors cursor-pointer relative",
                          !n.is_read && "bg-brand-primary/5"
                        )}
                      >
                        {!n.is_read && <div className="absolute left-1 top-1/2 -translate-y-1/2 w-1 h-8 bg-brand-primary rounded-full" />}
                        <p className="text-[11px] font-bold text-white mb-0.5">{n.title}</p>
                        <p className="text-[10px] text-slate-400 leading-relaxed mb-2">{n.message}</p>
                        <span className="text-[9px] text-slate-600 font-mono">{new Date(n.created_at).toLocaleString()}</span>
                      </div>
                    ))
                  ) : (
                    <div className="p-8 text-center">
                      <Bell className="w-8 h-8 text-slate-700 mx-auto mb-2 opacity-20" />
                      <p className="text-[10px] text-slate-500 font-medium">No notifications yet</p>
                    </div>
                  )}
                </div>
                <div className="p-3 bg-bg-dark/50 text-center">
                  <button className="text-[10px] font-bold text-brand-primary hover:underline">View All Notifications</button>
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>
        
        <button 
          onClick={onAddClick}
          className="bg-brand-primary hover:bg-brand-secondary text-white px-4 py-2 rounded-lg text-sm font-semibold flex items-center gap-2 transition-all shadow-lg shadow-brand-primary/20 cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>New Application</span>
        </button>
      </div>
    </header>
  );
}
