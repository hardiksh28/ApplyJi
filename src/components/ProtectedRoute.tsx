import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { supabase } from '../lib/supabase/client';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const [loading, setLoading] = React.useState(true);
  const [authenticated, setAuthenticated] = React.useState(false);
  const [profile, setProfile] = React.useState<any>(null);
  const location = useLocation();

  React.useEffect(() => {
    let mounted = true;

    async function fetchProfile(userId: string) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();
      
      if (mounted) {
        setProfile(profile);
        setLoading(false);
      }
    }

    // Check initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!mounted) return;
      if (session) {
        setAuthenticated(true);
        fetchProfile(session.user.id);
      } else {
        setAuthenticated(false);
        setLoading(false);
      }
    });

    // Listen for auth changes (this handles PKCE correctly and updates if session appears later)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!mounted) return;
      if (session) {
        setAuthenticated(true);
        fetchProfile(session.user.id);
      } else {
        setAuthenticated(false);
        setProfile(null);
        setLoading(false);
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (!authenticated) {
    return <Navigate to="/" state={{ from: location }} replace />;
  }

  // Check trial expiration
  const isTrialExpired = profile?.trial_ends_at && new Date(profile.trial_ends_at) < new Date();
  const isPaid = ['pro', 'enterprise'].includes(profile?.subscription_tier);

  if (isTrialExpired && !isPaid && location.pathname !== '/billing') {
    return <Navigate to="/billing" state={{ from: location }} replace />;
  }

  return <>{children}</>;
}

export function ProRoute({ children }: ProtectedRouteProps) {
  const [loading, setLoading] = React.useState(true);
  const [profile, setProfile] = React.useState<any>(null);
  const location = useLocation();

  React.useEffect(() => {
    async function checkAuth() {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        setLoading(false);
        return;
      }

      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', session.user.id)
        .single();
      
      setProfile(profile);
      setLoading(false);
    }

    checkAuth();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  const isPro = profile?.subscription_tier === 'pro';

  if (!isPro) {
    return <Navigate to="/billing" state={{ from: location }} replace />;
  }

  return <>{children}</>;
}
