import { useState, useEffect } from 'react';
import { 
  Users, 
  Search, 
  Filter, 
  Star, 
  Calendar, 
  ArrowRight, 
  ShieldCheck, 
  Clock, 
  MessageSquare,
  Sparkles,
  Loader2,
  ChevronRight
} from 'lucide-react';
import { cn } from '../lib/utils';
import { supabase } from '../lib/supabase/client';
import { motion, AnimatePresence } from 'motion/react';

const specialties = [
  'Resume Review',
  'Interview Prep',
  'Career Switch',
  'Salary Negotiation',
  'System Design',
  'Frontend Engineering',
  'Product Management'
];

export function Mentors() {
  const [mentors, setMentors] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSpecialty, setSelectedSpecialty] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isApplying, setIsApplying] = useState(false);

  useEffect(() => {
    fetchMentors();
  }, [selectedSpecialty]);

  const fetchMentors = async () => {
    setLoading(true);
    try {
      let url = '/api/mentors';
      if (selectedSpecialty) url += `?specialty=${encodeURIComponent(selectedSpecialty)}`;
      
      const response = await fetch(url);
      const data = await response.json();
      setMentors(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const filteredMentors = mentors.filter(m => 
    m.profiles?.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    m.headline?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-8 pb-20">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-1">
          <h1 className="text-3xl font-display font-bold text-white mb-1">Mentor Marketplace</h1>
          <p className="text-slate-400">Book 1:1 sessions with industry experts to accelerate your career</p>
        </div>
        <button 
          onClick={() => setIsApplying(true)}
          className="flex items-center gap-2 px-6 py-3 bg-white text-black font-bold rounded-xl hover:bg-slate-200 transition-all shadow-xl shadow-white/5 cursor-pointer"
        >
          <Sparkles className="w-4 h-4 text-brand-primary" />
          Become a Mentor
        </button>
      </div>

      {/* Filters & Search */}
      <div className="flex flex-col lg:flex-row gap-4">
        <div className="relative flex-1">
           <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
           <input 
            type="text" 
            placeholder="Search by name, role or company..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-surface-dark border border-border-dark rounded-xl py-3 pl-12 pr-4 text-sm text-white focus:outline-none focus:ring-2 focus:ring-brand-primary/50 transition-all"
           />
        </div>
        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-hide">
           <button 
            onClick={() => setSelectedSpecialty(null)}
            className={cn(
              "px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all border cursor-pointer",
              selectedSpecialty === null ? "bg-brand-primary border-brand-primary text-white" : "bg-surface-dark border-border-dark text-slate-400 hover:text-white"
            )}
           >
             All Experts
           </button>
           {specialties.map(s => (
             <button 
              key={s}
              onClick={() => setSelectedSpecialty(s)}
              className={cn(
                "px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all border cursor-pointer",
                selectedSpecialty === s ? "bg-brand-primary border-brand-primary text-white" : "bg-surface-dark border-border-dark text-slate-400 hover:text-white"
              )}
             >
               {s}
             </button>
           ))}
        </div>
      </div>

      {/* Mentor Grid */}
      {loading ? (
        <div className="h-64 flex items-center justify-center">
           <Loader2 className="w-10 h-10 animate-spin text-brand-primary" />
        </div>
      ) : filteredMentors.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
           {filteredMentors.map((mentor) => (
             <motion.div 
               key={mentor.id}
               initial={{ opacity: 0, y: 20 }}
               animate={{ opacity: 1, y: 0 }}
               className="glass-card group overflow-hidden"
             >
                <div className="p-6 space-y-4">
                   <div className="flex items-start justify-between">
                      <div className="flex items-center gap-4">
                         <div className="relative">
                            <img 
                              src={mentor.profiles?.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(mentor.profiles?.full_name || 'M')}&background=random`} 
                              className="w-14 h-14 rounded-2xl object-cover ring-2 ring-border-dark"
                            />
                            {mentor.verified_at && (
                              <div className="absolute -bottom-1 -right-1 bg-brand-primary rounded-full p-1 border-2 border-bg-dark">
                                 <ShieldCheck className="w-3 h-3 text-white" />
                              </div>
                            )}
                         </div>
                         <div>
                            <h3 className="text-lg font-display font-bold text-white group-hover:text-brand-primary transition-colors">{mentor.profiles?.full_name}</h3>
                            <p className="text-xs text-slate-400">{mentor.headline}</p>
                         </div>
                      </div>
                      <div className="flex items-center gap-1 text-amber-400 bg-amber-400/10 px-2 py-1 rounded-lg">
                         <Star className="w-3 h-3 fill-amber-400" />
                         <span className="text-[10px] font-bold">{mentor.rating || 'New'}</span>
                      </div>
                   </div>

                   <div className="flex flex-wrap gap-1.5">
                      {mentor.specialties?.slice(0, 3).map((s: string) => (
                        <span key={s} className="px-2 py-0.5 rounded-md bg-white/5 border border-white/5 text-[9px] font-bold text-slate-400 uppercase tracking-wider">{s}</span>
                      ))}
                      {mentor.specialties?.length > 3 && (
                        <span className="text-[9px] font-bold text-slate-600 self-center">+{mentor.specialties.length - 3} more</span>
                      )}
                   </div>

                   <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">
                      {mentor.bio}
                   </p>

                   <div className="pt-4 border-t border-border-dark flex items-center justify-between">
                      <div>
                         <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">Starts at</p>
                         <p className="text-lg font-display font-bold text-white">₹{mentor.price_per_hour}<span className="text-[10px] text-slate-500 ml-1">/hr</span></p>
                      </div>
                      <button 
                        onClick={() => window.open(mentor.calendar_url, '_blank')}
                        className="px-4 py-2 bg-brand-primary/10 hover:bg-brand-primary text-brand-primary hover:text-white text-xs font-bold rounded-xl transition-all flex items-center gap-2 group/btn"
                      >
                         Book Session
                         <ArrowRight className="w-3.5 h-3.5 group-hover/btn:translate-x-1 transition-transform" />
                      </button>
                   </div>
                </div>
             </motion.div>
           ))}
        </div>
      ) : (
        <div className="glass-card p-20 flex flex-col items-center justify-center text-center">
           <div className="w-20 h-20 rounded-full bg-surface-dark border border-dashed border-border-dark flex items-center justify-center mb-6">
              <Users className="w-10 h-10 text-slate-700" />
           </div>
           <h3 className="text-xl font-display font-bold text-white mb-2">No Mentors Found</h3>
           <p className="text-slate-400 text-sm max-w-xs mx-auto">Try adjusting your filters or search query to find more experts.</p>
        </div>
      )}

      {/* Mentor Application Modal */}
      <AnimatePresence>
         {isApplying && (
           <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setIsApplying(false)}
                className="absolute inset-0 bg-bg-dark/80 backdrop-blur-sm" 
              />
              <motion.div 
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className="relative bg-surface-dark border border-border-dark w-full max-w-lg rounded-3xl p-8 shadow-2xl overflow-hidden"
              >
                 <div className="absolute top-0 right-0 p-8">
                    <button onClick={() => setIsApplying(false)} className="text-slate-500 hover:text-white transition-colors cursor-pointer">✕</button>
                 </div>
                 <div className="space-y-6">
                    <div className="p-3 bg-brand-primary w-fit rounded-2xl text-white shadow-lg shadow-brand-primary/20">
                       <Sparkles className="w-6 h-6" />
                    </div>
                    <div>
                       <h2 className="text-2xl font-display font-bold text-white mb-1">Mentor Application</h2>
                       <p className="text-sm text-slate-400">Share your expertise and help job seekers find their dream roles.</p>
                    </div>

                    <div className="space-y-4">
                       <div className="space-y-1">
                          <label className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Professional Headline</label>
                          <input placeholder="e.g. Senior Software Engineer at Google" className="w-full bg-bg-dark border border-border-dark rounded-xl px-4 py-3 text-sm text-white" />
                       </div>
                       <div className="space-y-1">
                          <label className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Expertise / Specialties</label>
                          <div className="flex flex-wrap gap-2 py-2">
                             {specialties.slice(0, 4).map(s => (
                               <label key={s} className="flex items-center gap-2 px-3 py-1.5 bg-surface-dark rounded-lg border border-border-dark cursor-pointer hover:border-brand-primary/50 transition-all">
                                  <input type="checkbox" className="accent-brand-primary" />
                                  <span className="text-[10px] font-bold text-slate-300 uppercase">{s}</span>
                               </label>
                             ))}
                          </div>
                       </div>
                       <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-1">
                             <label className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Hourly Rate (₹)</label>
                             <input type="number" placeholder="1500" className="w-full bg-bg-dark border border-border-dark rounded-xl px-4 py-3 text-sm text-white" />
                          </div>
                          <div className="space-y-1">
                             <label className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Calendly / Booking Link</label>
                             <input placeholder="calendly.com/yourname" className="w-full bg-bg-dark border border-border-dark rounded-xl px-4 py-3 text-sm text-white" />
                          </div>
                       </div>
                    </div>

                    <button className="w-full py-4 bg-brand-primary hover:bg-brand-secondary text-white font-bold rounded-2xl transition-all shadow-xl shadow-brand-primary/20">
                       Submit Application
                    </button>
                    <p className="text-[10px] text-center text-slate-600 font-medium">ApplyJi takes a 15% service fee on all bookings to support the platform.</p>
                 </div>
              </motion.div>
           </div>
         )}
      </AnimatePresence>
    </div>
  );
}
