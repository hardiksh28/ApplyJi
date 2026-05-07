import React, { useState, useEffect } from 'react';
import { 
  User, 
  Mail, 
  MapPin, 
  Shield, 
  Globe, 
  Linkedin, 
  Github, 
  Download,
  Trash2,
  MessageCircle,
  Save,
  X,
  Loader2,
  Sparkles,
  Briefcase
} from 'lucide-react';
import { cn } from '../lib/utils';
import { supabase } from '../lib/supabase/client';
import { signOut } from '../lib/auth-service';
import { LoadingSpinner } from '../components/CommonUI';

export function Settings() {
  const [profile, setProfile] = useState<any>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [editForm, setEditForm] = useState({ 
    full_name: '', 
    location: '', 
    phone: '', 
    current_role: '',
    linkedin_url: '',
    portfolio_url: ''
  });
  const [skills, setSkills] = useState<any[]>([]);
  const [experience, setExperience] = useState<any[]>([]);
  const [education, setEducation] = useState<any[]>([]);
  const [preferences, setPreferences] = useState({ open_to_opportunities: true, ghosting_detection: true });
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;
    
    const { data } = await supabase.from('profiles').select('*').eq('id', session.user.id).single();
    if (data) {
      setProfile(data);
      setEditForm({ 
        full_name: data.full_name || '', 
        location: data.location || '',
        phone: data.phone || '',
        current_role: data.current_role || '',
        linkedin_url: data.linkedin_url || '',
        portfolio_url: data.portfolio_url || ''
      });
      setSkills(data.skills || []);
      setExperience(data.experience || []);
      setEducation(data.education || []);
      if (data.preferences) setPreferences(data.preferences);
    }
  };

  const handleSaveProfile = async () => {
    setIsSaving(true);
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;

    const { error } = await supabase.from('profiles').update({
      full_name: editForm.full_name,
      location: editForm.location,
      phone: editForm.phone,
      current_role: editForm.current_role,
      linkedin_url: editForm.linkedin_url,
      portfolio_url: editForm.portfolio_url,
      skills,
      experience,
      education
    }).eq('id', session.user.id);
    
    if (!error) {
      setProfile({ 
        ...profile, 
        ...editForm,
        skills,
        experience,
        education
      });
      setIsEditing(false);
      setIsEditingProfile(false);
    }
    setIsSaving(false);
  };

  const togglePreference = async (key: string) => {
    const newPrefs = { ...preferences, [key]: !preferences[key as keyof typeof preferences] };
    setPreferences(newPrefs);

    const { data: { session } } = await supabase.auth.getSession();
    if (session) {
      await supabase.from('profiles').update({ preferences: newPrefs }).eq('id', session.user.id);
    }
  };

  const toggleEmailSync = async () => {
    const newVal = !profile?.email_sync_enabled;
    const { data: { session } } = await supabase.auth.getSession();
    if (session) {
      await supabase.from('profiles').update({ email_sync_enabled: newVal }).eq('id', session.user.id);
      setProfile({ ...profile, email_sync_enabled: newVal });
    }
  };

  const handleExportData = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;

    const { data: apps } = await supabase.from('applications').select('*').eq('user_id', session.user.id);
    if (!apps) return;

    const blob = new Blob([JSON.stringify(apps, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `applyji-export-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleDeleteAccount = async () => {
    if (window.confirm("Are you sure you want to permanently delete your account? This action cannot be undone.")) {
      alert("Account deletion requires an admin request in this demo. We will log you out now.");
      await signOut();
      window.location.href = '/';
    }
  };

  if (!profile) return <LoadingSpinner fullPage />;

  return (
    <div className="space-y-8 pb-10 max-w-4xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-display font-bold text-white mb-1">Settings</h1>
          <p className="text-slate-400">Manage your profile, account preferences and integrations</p>
        </div>
        <div className="flex gap-3">
          {(isEditing || isEditingProfile) && (
            <button 
              onClick={handleSaveProfile} 
              disabled={isSaving}
              className="flex items-center gap-2 px-6 py-2.5 bg-brand-primary text-white font-bold rounded-xl hover:bg-brand-secondary transition-all cursor-pointer shadow-lg shadow-brand-primary/20"
            >
              {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              Save All Changes
            </button>
          )}
        </div>
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
                  <h3 className="text-xl font-display font-bold text-white">{profile.full_name || 'Anonymous User'}</h3>
                  <p className="text-sm text-slate-400">{profile.email}</p>
               </div>
            </div>
            {!isEditingProfile && (
              <button 
                onClick={() => { setIsEditing(true); setIsEditingProfile(true); }} 
                className="px-4 py-2 bg-white text-black text-sm font-bold rounded-lg hover:bg-slate-200 transition-all cursor-pointer"
              >
                Edit Profile
              </button>
            )}
          </div>

          <div className="p-6 space-y-8 bg-bg-dark/20">
            {/* Basic Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
               <div className="space-y-1">
                  <label className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Full Name</label>
                  <div className="flex items-center gap-2 p-3 rounded-lg border border-border-dark bg-bg-dark/50 text-slate-300">
                     <User className="w-4 h-4 text-slate-500" />
                     {isEditingProfile ? (
                       <input value={editForm.full_name} onChange={(e) => setEditForm({...editForm, full_name: e.target.value})} className="bg-transparent border-none outline-none w-full text-white" />
                     ) : (
                       <span>{profile.full_name || 'Not set'}</span>
                     )}
                  </div>
               </div>
               <div className="space-y-1">
                  <label className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Email Address</label>
                  <div className="flex items-center gap-2 p-3 rounded-lg border border-border-dark bg-bg-dark/20 text-slate-500">
                     <Mail className="w-4 h-4" />
                     <span>{profile.email}</span>
                  </div>
               </div>
               <div className="space-y-1">
                  <label className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Location</label>
                  <div className="flex items-center gap-2 p-3 rounded-lg border border-border-dark bg-bg-dark/50 text-slate-300">
                     <MapPin className="w-4 h-4 text-slate-500" />
                     {isEditingProfile ? (
                       <input value={editForm.location} onChange={(e) => setEditForm({...editForm, location: e.target.value})} className="bg-transparent border-none outline-none w-full text-white" placeholder="e.g. Remote / Mumbai" />
                     ) : (
                       <span>{profile.location || 'Not set'}</span>
                     )}
                  </div>
               </div>
               <div className="space-y-1">
                  <label className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Phone Number</label>
                  <div className="flex items-center gap-2 p-3 rounded-lg border border-border-dark bg-bg-dark/50 text-slate-300">
                     <div className="w-4 h-4 text-slate-500 flex items-center justify-center font-bold text-xs">#</div>
                     {isEditingProfile ? (
                       <input value={editForm.phone} onChange={(e) => setEditForm({...editForm, phone: e.target.value})} className="bg-transparent border-none outline-none w-full text-white" placeholder="+91 98765 43210" />
                     ) : (
                       <span>{profile.phone || 'Not set'}</span>
                     )}
                  </div>
               </div>
            </div>

            {/* AI Profile Layer */}
            <div className="pt-6 border-t border-border-dark space-y-6">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-brand-primary" />
                <h3 className="text-xs uppercase font-bold text-slate-400 tracking-widest">Professional Profile (AI Context)</h3>
              </div>

              <div className="space-y-4">
                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Current Role / Title</label>
                  <div className="flex items-center gap-2 p-3 rounded-lg border border-border-dark bg-bg-dark/50 text-slate-300">
                     <Briefcase className="w-4 h-4 text-slate-500" />
                     {isEditingProfile ? (
                       <input value={editForm.current_role} onChange={(e) => setEditForm({...editForm, current_role: e.target.value})} className="bg-transparent border-none outline-none w-full text-white" placeholder="e.g. Senior Frontend Engineer" />
                     ) : (
                       <span>{profile.current_role || 'Not set'}</span>
                     )}
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Key Skills</label>
                  {isEditingProfile ? (
                    <textarea 
                      value={typeof skills === 'string' ? skills : JSON.stringify(skills, null, 2)} 
                      onChange={(e) => {
                        try {
                          const parsed = JSON.parse(e.target.value);
                          setSkills(Array.isArray(parsed) ? parsed : [e.target.value]);
                        } catch {
                          setSkills([e.target.value]);
                        }
                      }}
                      className="w-full h-32 p-3 rounded-lg border border-border-dark bg-bg-dark/50 text-white text-sm font-mono focus:ring-1 focus:ring-brand-primary outline-none"
                      placeholder='["React", "Node.js", "System Design"]'
                    />
                  ) : (
                    <div className="flex flex-wrap gap-2 py-2">
                      {skills.length > 0 ? skills.map((s: any, i: number) => (
                        <span key={i} className="px-2 py-1 bg-brand-primary/10 border border-brand-primary/20 text-brand-primary text-[10px] font-bold rounded-lg uppercase tracking-wider">
                          {typeof s === 'string' ? s : (s.name || s.skill)}
                        </span>
                      )) : <span className="text-sm text-slate-500 italic">No skills added</span>}
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] uppercase font-bold text-slate-500 tracking-wider text-linkedin flex items-center gap-1.5">
                      <Linkedin className="w-3 h-3" /> LinkedIn URL
                    </label>
                    <div className="flex items-center gap-2 p-3 rounded-lg border border-border-dark bg-bg-dark/50 text-slate-300">
                      {isEditingProfile ? (
                        <input value={editForm.linkedin_url} onChange={(e) => setEditForm({...editForm, linkedin_url: e.target.value})} className="bg-transparent border-none outline-none w-full text-white" placeholder="https://linkedin.com/in/..." />
                      ) : (
                        <span className="truncate">{profile.linkedin_url || 'Not set'}</span>
                      )}
                    </div>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] uppercase font-bold text-slate-500 tracking-wider text-slate-300 flex items-center gap-1.5">
                      <Globe className="w-3 h-3" /> Portfolio / Website
                    </label>
                    <div className="flex items-center gap-2 p-3 rounded-lg border border-border-dark bg-bg-dark/50 text-slate-300">
                      {isEditingProfile ? (
                        <input value={editForm.portfolio_url} onChange={(e) => setEditForm({...editForm, portfolio_url: e.target.value})} className="bg-transparent border-none outline-none w-full text-white" placeholder="https://yourportfolio.com" />
                      ) : (
                        <span className="truncate">{profile.portfolio_url || 'Not set'}</span>
                      )}
                    </div>
                  </div>
                </div>
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
                 <div onClick={() => togglePreference('open_to_opportunities')} className={cn("w-10 h-5 rounded-full relative cursor-pointer transition-colors", preferences.open_to_opportunities ? "bg-brand-primary" : "bg-slate-700")}>
                    <div className={cn("absolute top-0.5 w-4 h-4 bg-white rounded-full transition-transform", preferences.open_to_opportunities ? "right-0.5" : "left-0.5")}></div>
                 </div>
              </div>
              <div className="flex items-center justify-between p-4 rounded-xl border border-border-dark bg-bg-dark/30">
                 <div>
                    <h4 className="text-sm font-bold text-white mb-1">Automatic Ghosting Detection</h4>
                    <p className="text-xs text-slate-500">Email alerts if no response after 14 days</p>
                 </div>
                 <div onClick={() => togglePreference('ghosting_detection')} className={cn("w-10 h-5 rounded-full relative cursor-pointer transition-colors", preferences.ghosting_detection ? "bg-brand-primary" : "bg-slate-700")}>
                    <div className={cn("absolute top-0.5 w-4 h-4 bg-white rounded-full transition-transform", preferences.ghosting_detection ? "right-0.5" : "left-0.5")}></div>
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
                { name: 'Gmail', icon: Mail, desc: 'Parse job emails automatically', connected: profile.email_sync_enabled, action: toggleEmailSync },
                { name: 'LinkedIn', icon: Linkedin, desc: 'Sync applications from jobs page (Coming Soon)', connected: false, action: () => alert('Coming soon!') },
                { name: 'GitHub', icon: Github, desc: 'Import project repositories (Coming Soon)', connected: false, action: () => alert('Coming soon!') },
                { name: 'Slack', icon: MessageCircle, desc: 'Get interview reminders (Coming Soon)', connected: false, action: () => alert('Coming soon!') },
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
                   <button onClick={app.action} className={cn(
                     "text-[10px] uppercase font-bold tracking-widest px-3 py-1.5 rounded-lg border transition-all cursor-pointer whitespace-nowrap",
                     app.connected ? "text-slate-400 border-border-dark hover:border-slate-700 hover:text-white" : "bg-white text-black border-white hover:bg-slate-200"
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
                    <p className="text-xs text-slate-400">Download all your applications as JSON</p>
                 </div>
                 <button onClick={handleExportData} className="flex items-center gap-2 text-xs font-bold text-slate-300 hover:text-white transition-colors cursor-pointer">
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
                 <button onClick={handleDeleteAccount} className="flex items-center gap-2 text-xs font-bold text-rose-500 hover:text-rose-400 transition-colors cursor-pointer">
                    <Trash2 className="w-4 h-4" />
                    <span>Delete Permanently</span>
                 </button>
              </div>
           </div>
        </div>

        <div className="text-center text-[10px] text-slate-600 font-mono uppercase tracking-[0.2em]">
           ApplyJi Version 2.5.0-stable • {new Date().getFullYear()}
        </div>
      </div>
    </div>
  );
}

