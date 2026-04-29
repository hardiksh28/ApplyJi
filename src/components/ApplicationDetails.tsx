import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { ArrowLeft, Building2, MapPin, Calendar, ExternalLink, Activity } from 'lucide-react';
import { supabase } from '../lib/supabase/client';
import { Badge } from './ui/badge';
import { FollowUpComposer } from './FollowUpComposer';
import { format } from 'date-fns';

export function ApplicationDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [app, setApp] = React.useState<any>(null);
  const [activities, setActivities] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    async function fetchData() {
      const { data: application } = await supabase
        .from('applications')
        .select('*')
        .eq('id', id)
        .single();
      
      const { data: acts } = await supabase
        .from('application_activities')
        .select('*')
        .eq('application_id', id)
        .order('created_at', { ascending: false });

      setApp(application);
      setActivities(acts || []);
      setLoading(false);
    }
    fetchData();
  }, [id]);

  if (loading) return (
    <div className="p-8 text-center animate-pulse text-gray-400">Loading details...</div>
  );

  if (!app) return (
    <div className="p-8 text-center text-gray-500">Application not found.</div>
  );

  return (
    <div className="p-8 max-w-5xl mx-auto space-y-8">
      <button 
        onClick={() => navigate(-1)}
        className="flex items-center gap-2 text-gray-500 hover:text-gray-900 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Dashboard
      </button>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          <header className="space-y-4">
            <h1 className="text-4xl font-extrabold text-gray-900 tracking-tight">{app.job_title}</h1>
            <div className="flex flex-wrap items-center gap-6 text-gray-600">
              <div className="flex items-center gap-2">
                <Building2 className="w-5 h-5 text-indigo-600" />
                <span className="font-semibold">{app.company_name}</span>
              </div>
              <div className="flex items-center gap-2">
                <MapPin className="w-5 h-5" />
                <span>{app.location || 'Remote'}</span>
              </div>
              <div className="flex items-center gap-2">
                <Calendar className="w-5 h-5" />
                <span>Applied {format(new Date(app.applied_at), 'PPP')}</span>
              </div>
            </div>
            <Badge variant="secondary" className="px-4 py-1 text-sm bg-indigo-50 text-indigo-700">
              {app.status.toUpperCase()}
            </Badge>
          </header>

          <FollowUpComposer company={app.company_name} jobTitle={app.job_title} />

          <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100">
            <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
              <Activity className="w-5 h-5 text-indigo-600" />
              Activity History
            </h3>
            <div className="space-y-8 relative before:absolute before:left-4 before:top-2 before:bottom-2 before:w-0.5 before:bg-gray-100">
              {activities.map((activity, i) => (
                <div key={activity.id} className="relative pl-10">
                  <div className="absolute left-0 top-1.5 w-8 h-8 bg-white border-2 border-indigo-600 rounded-full z-10 flex items-center justify-center">
                    <div className="w-2 h-2 bg-indigo-600 rounded-full" />
                  </div>
                  <div>
                    <p className="text-gray-900 font-medium">{activity.description}</p>
                    <p className="text-xs text-gray-400 mt-1">
                      {format(new Date(activity.created_at), 'PPp')}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 sticky top-8">
            <h4 className="font-bold text-gray-900 mb-4">Actions</h4>
            <div className="space-y-3">
              <button className="w-full py-3 px-4 bg-indigo-600 text-white rounded-xl font-semibold hover:bg-indigo-700 transition-all flex items-center justify-center gap-2 shadow-lg shadow-indigo-100">
                Log New Activity
              </button>
              {app.job_url && (
                <a 
                  href={app.job_url} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="w-full py-3 px-4 border border-gray-200 text-gray-700 rounded-xl font-semibold hover:bg-gray-50 transition-all flex items-center justify-center gap-2"
                >
                  View Job Post
                  <ExternalLink className="w-4 h-4" />
                </a>
              )}
              <button className="w-full py-3 px-4 text-red-600 hover:bg-red-50 rounded-xl font-semibold transition-all">
                Delete Application
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
