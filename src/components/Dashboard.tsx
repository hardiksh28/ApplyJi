import React from 'react';
import { motion } from 'motion/react';
import { 
  Briefcase, 
  CheckCircle2, 
  Clock, 
  RefreshCcw,
  Plus
} from 'lucide-react';
import { StatsCard } from './StatsCard';
import { RecentApplicationsTable } from './RecentApplicationsTable';
import { supabase } from '../lib/supabase/client';

export function Dashboard() {
  const [syncing, setSyncing] = React.useState(false);
  const [applications, setApplications] = React.useState([]);
  const [stats, setStats] = React.useState({
    total: 0,
    active: 0,
    interviews: 0
  });

  const fetchDashboardData = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;

    const { data: apps } = await supabase
      .from('applications')
      .select('*')
      .order('applied_at', { ascending: false })
      .limit(5);

    const { count: totalCount } = await supabase
      .from('applications')
      .select('*', { count: 'exact', head: true });

    const { count: activeCount } = await supabase
      .from('applications')
      .select('*', { count: 'exact', head: true })
      .in('status', ['applied', 'interviewing']);

    const { count: interviewCount } = await supabase
      .from('applications')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'interviewing');

    setApplications(apps || []);
    setStats({
      total: totalCount || 0,
      active: activeCount || 0,
      interviews: interviewCount || 0
    });
  };

  React.useEffect(() => {
    fetchDashboardData();
  }, []);

  const handleSync = async () => {
    setSyncing(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const response = await fetch('/api/sync/gmail', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session?.access_token}`
        }
      });
      const result = await response.json();
      console.log('Sync result:', result);
      fetchDashboardData();
    } catch (error) {
      console.error('Sync failed:', error);
    } finally {
      setSyncing(false);
    }
  };

  return (
    <div className="flex-1 overflow-y-auto bg-gray-50 bg-opacity-50 min-h-screen">
      <div className="p-8 max-w-7xl mx-auto space-y-8">
        <header className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Overview</h1>
            <p className="text-gray-500 mt-1">Track your progress and upcoming interviews</p>
          </div>
          <div className="flex gap-4">
            <button
              onClick={handleSync}
              disabled={syncing}
              className="px-4 py-2 bg-white border border-gray-200 rounded-xl text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-all flex items-center gap-2 shadow-sm disabled:opacity-50"
            >
              <RefreshCcw className={`w-4 h-4 ${syncing ? 'animate-spin' : ''}`} />
              {syncing ? 'Syncing...' : 'Sync Gmail'}
            </button>
            <button className="px-4 py-2 bg-indigo-600 rounded-xl text-sm font-semibold text-white hover:bg-indigo-700 transition-all flex items-center gap-2 shadow-lg shadow-indigo-200">
              <Plus className="w-4 h-4" />
              Add Application
            </button>
          </div>
        </header>

        <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <StatsCard 
            label="Total Applications" 
            value={stats.total} 
            icon={Briefcase} 
            color="bg-indigo-600" 
            trend="+12%"
          />
          <StatsCard 
            label="Active Applications" 
            value={stats.active} 
            icon={Clock} 
            color="bg-amber-500" 
            trend="+5%"
          />
          <StatsCard 
            label="Interviews" 
            value={stats.interviews} 
            icon={CheckCircle2} 
            color="bg-emerald-600" 
            trend="+2"
          />
        </section>

        <section className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <RecentApplicationsTable applications={applications} />
          </div>
          
          <div className="space-y-6">
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
              <h3 className="font-bold text-lg text-gray-900 mb-4">Upcoming Tasks</h3>
              <div className="space-y-4">
                {[
                  { title: 'Follow up with Google', time: 'Tomorrow, 10:00 AM', type: 'followup' },
                  { title: 'Prep for Meta Interview', time: 'Friday, 2:00 PM', type: 'interview' },
                ].map((task, i) => (
                  <motion.div 
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.1 }}
                    key={i} 
                    className="flex gap-4 p-3 rounded-xl hover:bg-gray-50 transition-colors cursor-pointer border border-transparent hover:border-gray-100"
                  >
                    <div className="w-10 h-10 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-600 flex-shrink-0">
                      <Clock className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="text-sm font-semibold text-gray-900">{task.title}</h4>
                      <p className="text-xs text-gray-500 mt-0.5">{task.time}</p>
                    </div>
                  </motion.div>
                ))}
              </div>
              <button className="w-full mt-6 py-2 text-sm font-medium text-gray-500 hover:text-gray-900 border border-dashed border-gray-200 rounded-xl hover:border-gray-300 transition-all">
                View Timeline
              </button>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
