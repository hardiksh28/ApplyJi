import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Login } from './components/Login';
import { AuthCallback } from './components/AuthCallback';
import { ProtectedRoute } from './components/ProtectedRoute';
import { Sidebar } from './components/Sidebar';
import { Dashboard } from './components/Dashboard';
import { ApplicationDetails } from './components/ApplicationDetails';
import { Landing } from './components/Landing';
import { supabase } from './lib/supabase/client';

const Layout = ({ children }: { children: React.ReactNode }) => (
  <div className="flex min-h-screen bg-gray-50/50">
    <Sidebar />
    <main className="flex-1 overflow-y-auto">
      {children}
    </main>
  </div>
);

const Billing = () => {
  const [loading, setLoading] = React.useState(false);
  const [interval, setInterval] = React.useState<'month' | 'year'>('month');

  const handleUpgrade = async () => {
    setLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const res = await fetch('/api/stripe/create-checkout', {
        method: 'POST',
        headers: { 
          'Authorization': `Bearer ${session?.access_token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ interval })
      });
      const { url } = await res.json();
      if (url) window.location.href = url;
    } catch (err) {
      console.error('Checkout failed:', err);
      setLoading(false);
    }
  };

  return (
    <div className="p-8 max-w-2xl mx-auto text-center mt-20">
      <h1 className="text-4xl font-bold tracking-tight text-gray-900 leading-tight">
        Continue your journey <br /> with <span className="text-indigo-600">ApplyJi Pro</span>
      </h1>
      <p className="text-lg text-gray-600 mt-6 max-w-lg mx-auto">
        Your 14-day trial has concluded. Upgrade to maintain your edge and track every opportunity automatically.
      </p>

      <div className="mt-12 flex flex-col items-center gap-6">
        <div className="inline-flex items-center gap-4 bg-gray-100 p-1.5 rounded-2xl">
          <button 
            onClick={() => setInterval('month')}
            className={`px-6 py-2 rounded-xl text-sm font-bold transition-all ${interval === 'month' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-900'}`}
          >
            Monthly
          </button>
          <button 
            onClick={() => setInterval('year')}
            className={`px-6 py-2 rounded-xl text-sm font-bold transition-all flex items-center gap-2 ${interval === 'year' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-900'}`}
          >
            Yearly
            <span className="text-[10px] bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full">-15%</span>
          </button>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 w-full">
          <button 
            onClick={handleUpgrade}
            disabled={loading}
            className="w-full sm:w-auto bg-indigo-600 text-white px-10 py-4 rounded-2xl font-bold hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-200 disabled:opacity-50"
          >
            {loading ? 'Redirecting...' : `Upgrade for ${interval === 'month' ? '$9/mo' : '$91.80/yr'}`}
          </button>
          <button className="w-full sm:w-auto bg-white text-gray-700 px-10 py-4 rounded-2xl font-bold border border-gray-200 hover:bg-gray-50 transition-all">
            Contact Support
          </button>
        </div>
      </div>
    </div>
  );
};

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/auth/callback" element={<AuthCallback />} />
        
        <Route 
          path="/dashboard" 
          element={
            <ProtectedRoute>
              <Layout>
                <Dashboard />
              </Layout>
            </ProtectedRoute>
          } 
        />
        
        <Route 
          path="/billing" 
          element={
            <ProtectedRoute>
              <Layout>
                <Billing />
              </Layout>
            </ProtectedRoute>
          } 
        />
        
        <Route 
          path="/applications/:id" 
          element={
            <ProtectedRoute>
              <Layout>
                <ApplicationDetails />
              </Layout>
            </ProtectedRoute>
          } 
        />

        <Route path="/applications" element={<Navigate to="/dashboard" replace />} />
        <Route path="/analytics" element={<Navigate to="/dashboard" replace />} />
        <Route path="/settings" element={<Navigate to="/dashboard" replace />} />

        <Route path="/" element={<Landing />} />
      </Routes>
    </BrowserRouter>
  );
}
