import { useState, useEffect } from 'react';
import { 
  Building2, 
  Search, 
  Star, 
  MessageSquare, 
  ThumbsUp, 
  CheckCircle2, 
  AlertCircle,
  TrendingUp,
  Award,
  ChevronRight,
  Loader2,
  Filter,
  ArrowUpRight
} from 'lucide-react';
import { cn } from '../lib/utils';
import { supabase } from '../lib/supabase/client';
import { motion, AnimatePresence } from 'motion/react';

export function CompanyReviews() {
  const [reviews, setReviews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCompany, setSelectedCompany] = useState<string | null>(null);
  const [isAddingReview, setIsAddingReview] = useState(false);

  useEffect(() => {
    if (selectedCompany) {
      fetchReviews(selectedCompany);
    } else {
      fetchAllReviews();
    }
  }, [selectedCompany]);

  const fetchAllReviews = async () => {
    setLoading(true);
    try {
      const { data } = await supabase
        .from('company_reviews')
        .select('*, profiles(full_name, avatar_url)')
        .order('created_at', { ascending: false });
      setReviews(data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchReviews = async (name: string) => {
    setLoading(true);
    try {
      const response = await fetch(`/api/companies/${encodeURIComponent(name)}/reviews`);
      const data = await response.json();
      setReviews(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error(err);
      setReviews([]);
    } finally {
      setLoading(false);
    }
  };

  const handleHelpful = async (reviewId: string) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return alert('Please login to vote.');

      const response = await fetch(`/api/companies/reviews/${reviewId}/helpful`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${session.access_token}` }
      });
      if (response.ok) {
        setReviews(reviews.map(r => r.id === reviewId ? { ...r, helpful_votes: r.helpful_votes + 1 } : r));
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-8 pb-20">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-1">
          <h1 className="text-3xl font-display font-bold text-white mb-1">Company Reviews</h1>
          <p className="text-slate-400">Honest interview experiences and workspace insights from the community</p>
        </div>
        <button 
          onClick={() => setIsAddingReview(true)}
          className="px-6 py-3 bg-brand-primary hover:bg-brand-secondary text-white font-bold rounded-xl transition-all shadow-lg shadow-brand-primary/20 cursor-pointer flex items-center gap-2"
        >
          <MessageSquare className="w-4 h-4" />
          Write a Review
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Left Column: Stats & Search */}
        <div className="lg:col-span-1 space-y-6">
           <div className="glass-card p-6">
              <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-4">Find Company</h3>
              <div className="relative mb-6">
                 <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-600" />
                 <input 
                  type="text" 
                  placeholder="e.g. Google, Zomato..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-bg-dark border border-border-dark rounded-xl py-2.5 pl-10 pr-4 text-sm text-white focus:outline-none focus:ring-1 focus:ring-brand-primary"
                 />
              </div>

              <div className="space-y-4">
                 <h3 className="text-[10px] font-bold text-slate-600 uppercase tracking-widest">Trending Companies</h3>
                 {['Google', 'Microsoft', 'Atlassian', 'Flipkart', 'Zomato'].map(c => (
                   <button 
                    key={c}
                    onClick={() => setSelectedCompany(c)}
                    className={cn(
                      "w-full flex items-center justify-between p-3 rounded-xl border transition-all text-xs font-bold",
                      selectedCompany === c ? "bg-brand-primary border-brand-primary text-white" : "bg-surface-dark border-border-dark text-slate-400 hover:border-slate-700"
                    )}
                   >
                      <div className="flex items-center gap-2">
                         <Building2 className="w-3.5 h-3.5" />
                         {c}
                      </div>
                      <ArrowUpRight className="w-3 h-3 opacity-50" />
                   </button>
                 ))}
              </div>
           </div>

           <div className="glass-card p-6 bg-gradient-to-br from-amber-400/5 to-transparent border-amber-400/10">
              <div className="flex items-center gap-3 mb-4">
                 <div className="p-2 bg-amber-400/20 rounded-lg text-amber-400">
                    <Award className="w-5 h-5" />
                 </div>
                 <h3 className="text-sm font-bold text-white">Top Rated Workplaces</h3>
              </div>
              <div className="space-y-3">
                 {[
                   { name: 'Cred', score: 4.8 },
                   { name: 'BrowserStack', score: 4.6 },
                   { name: 'Stripe', score: 4.5 }
                 ].map((c, i) => (
                   <div key={i} className="flex items-center justify-between text-xs">
                      <span className="text-slate-300 font-medium">{c.name}</span>
                      <div className="flex items-center gap-1 text-amber-400 font-bold">
                         <Star className="w-3 h-3 fill-amber-400" />
                         {c.score}
                      </div>
                   </div>
                 ))}
              </div>
           </div>
        </div>

        {/* Right Column: Reviews Feed */}
        <div className="lg:col-span-3 space-y-6">
           {loading ? (
             <div className="h-64 flex items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-brand-primary" />
             </div>
           ) : reviews.length > 0 ? (
             <div className="space-y-6">
                {reviews.map((review) => (
                  <motion.div 
                    key={review.id}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="glass-card p-6 hover:border-slate-700 transition-all"
                  >
                     <div className="flex items-start justify-between mb-6">
                        <div className="flex items-center gap-4">
                           <img 
                            src={review.profiles?.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(review.profiles?.full_name || 'U')}&background=random`} 
                            className="w-10 h-10 rounded-full border border-border-dark"
                           />
                           <div>
                              <h4 className="text-sm font-bold text-white">{review.profiles?.full_name || 'Anonymous'}</h4>
                              <p className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">
                                Reviewed {review.company_name} • {new Date(review.created_at).toLocaleDateString()}
                              </p>
                           </div>
                        </div>
                        <div className="flex items-center gap-1 bg-surface-dark px-3 py-1.5 rounded-full border border-border-dark">
                           {[...Array(5)].map((_, i) => (
                             <Star key={i} className={cn("w-3 h-3", i < review.rating ? "fill-amber-400 text-amber-400" : "text-slate-700")} />
                           ))}
                        </div>
                     </div>

                     <div className="space-y-3 mb-6">
                        <h3 className="text-lg font-display font-bold text-white">"{review.title}"</h3>
                        <p className="text-sm text-slate-400 leading-relaxed">{review.body}</p>
                     </div>

                     {review.interview_experience && (
                       <div className="p-4 rounded-xl bg-surface-dark/50 border border-border-dark/50 mb-6">
                          <h5 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2 flex items-center gap-2">
                             <MessageSquare className="w-3 h-3" /> Interview Experience
                          </h5>
                          <p className="text-xs text-slate-300 italic">"{review.interview_experience}"</p>
                       </div>
                     )}

                     <div className="flex items-center justify-between pt-6 border-t border-border-dark">
                        <div className="flex items-center gap-4">
                           {review.offer_received && (
                             <div className="flex items-center gap-1.5 px-3 py-1 bg-emerald-400/10 text-emerald-400 text-[10px] font-bold rounded-full border border-emerald-400/20 uppercase tracking-wider">
                                <CheckCircle2 className="w-3 h-3" /> Offer Received
                             </div>
                           )}
                        </div>
                        <button 
                          onClick={() => handleHelpful(review.id)}
                          className="flex items-center gap-2 text-xs font-bold text-slate-500 hover:text-brand-primary transition-colors cursor-pointer group"
                        >
                           <ThumbsUp className="w-3.5 h-3.5 group-hover:-translate-y-0.5 transition-transform" />
                           Helpful ({review.helpful_votes})
                        </button>
                     </div>
                  </motion.div>
                ))}
             </div>
           ) : (
             <div className="glass-card p-20 flex flex-col items-center justify-center text-center">
                <div className="w-20 h-20 rounded-full bg-surface-dark border border-dashed border-border-dark flex items-center justify-center mb-6">
                   <MessageSquare className="w-10 h-10 text-slate-700" />
                </div>
                <h3 className="text-xl font-display font-bold text-white mb-2">No Reviews Yet</h3>
                <p className="text-slate-400 text-sm max-w-xs mx-auto">Be the first to share your experience with {selectedCompany || 'this company'}.</p>
             </div>
           )}
        </div>
      </div>
      
      {/* Review Modal */}
      <AnimatePresence>
         {isAddingReview && (
           <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setIsAddingReview(false)}
                className="absolute inset-0 bg-bg-dark/80 backdrop-blur-sm" 
              />
              <motion.div 
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className="relative bg-surface-dark border border-border-dark w-full max-w-xl rounded-3xl p-8 shadow-2xl"
              >
                 <div className="absolute top-0 right-0 p-8">
                    <button onClick={() => setIsAddingReview(false)} className="text-slate-500 hover:text-white transition-colors cursor-pointer">✕</button>
                 </div>
                 <div className="space-y-6">
                    <div>
                       <h2 className="text-2xl font-display font-bold text-white mb-1">Share Your Experience</h2>
                       <p className="text-sm text-slate-400">Help the community by providing honest feedback.</p>
                    </div>

                    <div className="space-y-4">
                       <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-1">
                             <label className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Company Name</label>
                             <input placeholder="e.g. Google" className="w-full bg-bg-dark border border-border-dark rounded-xl px-4 py-3 text-sm text-white" />
                          </div>
                          <div className="space-y-1">
                             <label className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Overall Rating</label>
                             <div className="flex items-center gap-2 h-[46px]">
                                {[1, 2, 3, 4, 5].map(s => (
                                  <button key={s} className="p-1 text-slate-600 hover:text-amber-400 transition-colors">
                                     <Star className="w-6 h-6" />
                                  </button>
                                ))}
                             </div>
                          </div>
                       </div>
                       <div className="space-y-1">
                          <label className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Review Title</label>
                          <input placeholder="Great culture but high pressure" className="w-full bg-bg-dark border border-border-dark rounded-xl px-4 py-3 text-sm text-white" />
                       </div>
                       <div className="space-y-1">
                          <label className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Detailed Feedback</label>
                          <textarea placeholder="Describe your time at the company..." className="w-full h-32 bg-bg-dark border border-border-dark rounded-xl px-4 py-3 text-sm text-white resize-none" />
                       </div>
                       <div className="flex items-center gap-4 p-4 rounded-xl border border-border-dark bg-bg-dark/50">
                          <input type="checkbox" className="accent-brand-primary" id="offer" />
                          <label htmlFor="offer" className="text-xs font-bold text-slate-300 cursor-pointer">I received a job offer from this company</label>
                       </div>
                    </div>

                    <button className="w-full py-4 bg-brand-primary hover:bg-brand-secondary text-white font-bold rounded-2xl transition-all shadow-xl shadow-brand-primary/20">
                       Post Review
                    </button>
                 </div>
              </motion.div>
           </div>
         )}
      </AnimatePresence>
    </div>
  );
}
