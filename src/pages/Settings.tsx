import React from 'react';
import { 
  User, 
  Mail, 
  MapPin, 
  Bell, 
  Shield, 
  Globe, 
  Linkedin, 
  Github, 
  Smartphone,
  Download,
  Trash2,
  ChevronRight,
  Laptop,
  MessageCircle
} from 'lucide-react';
import { cn } from '../lib/utils';

export function Settings() {
  return (
    <div className="space-y-8 pb-10 max-w-4xl mx-auto">
      <div>
        <h1 className="text-3xl font-display font-bold text-white mb-1">Settings</h1>
        <p className="text-slate-400">Manage your profile, account preferences and integrations</p>
      </div>

      <div className="space-y-6">
        {/* Profile Section */}
        <div className="glass-card overflow-hidden">
          <div className="p-6 border-b border-border-dark flex items-center justify-between">
            <div className="flex items-center gap-4">
               <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-brand-primary to-brand-secondary flex items-center justify-center">
                  <User className="text-white w-8 h-8" />
               </div>
               <div>
                  <h3 className="text-xl font-display font-bold text-white">Hardik S.</h3>
                  <p className="text-sm text-slate-400">hardik9462@gmail.com</p>
               </div>
            </div>
            <button className="px-4 py-2 bg-white text-black text-sm font-bold rounded-lg hover:bg-slate-200 transition-all cursor-pointer">Edit Profile</button>
          </div>
          <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6 bg-bg-dark/20">
             <div className="space-y-1">
                <label className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Full Name</label>
                <div className="flex items-center gap-2 p-3 rounded-lg border border-border-dark bg-bg-dark/50 text-slate-300">
                   <User className="w-4 h-4 text-slate-500" />
                   <span>Hardik Sharma</span>
                </div>
             </div>
             <div className="space-y-1">
                <label className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Default Location</label>
                <div className="flex items-center gap-2 p-3 rounded-lg border border-border-dark bg-bg-dark/50 text-slate-300">
                   <MapPin className="w-4 h-4 text-slate-500" />
                   <span>Rajasthan, India (Remote Preferred)</span>
                </div>
             </div>
          </div>
        </div>

        {/* Preferences Section */}
        <div className="glass-card p-6 space-y-6">
           <h3 className="text-xs uppercase font-bold text-slate-500 tracking-wider flex items-center gap-2">
              <Globe className="w-4 h-4" />
              Job Preferences
           </h3>
           <div className="space-y-4">
              <div className="flex items-center justify-between p-4 rounded-xl border border-border-dark bg-bg-dark/30">
                 <div>
                    <h4 className="text-sm font-bold text-white mb-1">Open to opportunities</h4>
                    <p className="text-xs text-slate-500">Enable profile visibility to recruiters</p>
                 </div>
                 <div className="w-10 h-5 bg-brand-primary rounded-full relative cursor-pointer">
                    <div className="absolute right-0.5 top-0.5 w-4 h-4 bg-white rounded-full"></div>
                 </div>
              </div>
              <div className="flex items-center justify-between p-4 rounded-xl border border-border-dark bg-bg-dark/30">
                 <div>
                    <h4 className="text-sm font-bold text-white mb-1">Automatic Ghosting Detection</h4>
                    <p className="text-xs text-slate-500">Email alerts if no response after 14 days</p>
                 </div>
                 <div className="w-10 h-5 bg-brand-primary rounded-full relative cursor-pointer">
                    <div className="absolute right-0.5 top-0.5 w-4 h-4 bg-white rounded-full"></div>
                 </div>
              </div>
           </div>
        </div>

        {/* Integrations */}
        <div className="glass-card p-6 space-y-6">
           <h3 className="text-xs uppercase font-bold text-slate-500 tracking-wider flex items-center gap-2">
              <Shield className="w-4 h-4" />
              Integrations
           </h3>
           <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[
                { name: 'LinkedIn', icon: Linkedin, desc: 'Sync applications from jobs page', connected: true },
                { name: 'Gmail', icon: Mail, desc: 'Parse job emails automatically', connected: false },
                { name: 'GitHub', icon: Github, desc: 'Import project repositories', connected: true },
                { name: 'Slack', icon: MessageCircle, desc: 'Get interview reminders', connected: false },
              ].map((app) => (
                <div key={app.name} className="flex items-center justify-between p-4 rounded-xl border border-border-dark bg-bg-dark/30 hover:border-slate-700 transition-all group">
                   <div className="flex items-center gap-3">
                      <div className={cn(
                        "p-2 rounded-lg bg-surface-dark group-hover:scale-110 transition-transform",
                        app.connected ? "text-brand-primary" : "text-slate-500"
                      )}>
                        <app.icon className="w-5 h-5" />
                      </div>
                      <div>
                         <h4 className="text-sm font-bold text-white">{app.name}</h4>
                         <p className="text-[10px] text-slate-500">{app.desc}</p>
                      </div>
                   </div>
                   <button className={cn(
                     "text-[10px] uppercase font-bold tracking-widest px-3 py-1.5 rounded-lg border transition-all cursor-pointer",
                     app.connected ? "text-slate-400 border-border-dark hover:border-slate-700" : "bg-white text-black border-white hover:bg-slate-200"
                   )}>
                     {app.connected ? 'Disconnect' : 'Connect'}
                   </button>
                </div>
              ))}
           </div>
        </div>

        {/* Danger Zone */}
        <div className="glass-card p-6 border-rose-500/20 bg-rose-500/[0.02]">
           <h3 className="text-xs uppercase font-bold text-rose-500 tracking-wider mb-6">Danger Zone</h3>
           <div className="space-y-4">
              <div className="flex items-center justify-between">
                 <div>
                    <h4 className="text-sm font-bold text-white mb-1">Export Data</h4>
                    <p className="text-xs text-slate-400">Download all your applications as CSV or JSON</p>
                 </div>
                 <button className="flex items-center gap-2 text-xs font-bold text-slate-300 hover:text-white transition-colors cursor-pointer">
                    <Download className="w-4 h-4" />
                    <span>Download Archive</span>
                 </button>
              </div>
              <div className="h-px bg-rose-500/10"></div>
              <div className="flex items-center justify-between">
                 <div>
                    <h4 className="text-sm font-bold text-rose-400 mb-1">Delete Account</h4>
                    <p className="text-xs text-slate-400">Permanently delete your data and pro subscription</p>
                 </div>
                 <button className="flex items-center gap-2 text-xs font-bold text-rose-500 hover:text-rose-400 transition-colors cursor-pointer">
                    <Trash2 className="w-4 h-4" />
                    <span>Delete Permanently</span>
                 </button>
              </div>
           </div>
        </div>

        <div className="text-center text-[10px] text-slate-600 font-mono uppercase tracking-[0.2em]">
           ApplyJi Version 2.4.0-stable • {new Date().getFullYear()}
        </div>
      </div>
    </div>
  );
}
