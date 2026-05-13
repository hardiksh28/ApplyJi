import React from 'react';
import { useNavigate } from 'react-router-dom';
import { syncRefreshToken } from '../lib/auth-service';
import { supabase } from '../lib/supabase/client';

export function AuthCallback() {
  const navigate = useNavigate();
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    let mounted = true;
    let authListener: any = null;

    const proceedWithAuth = async () => {
      try {
        await syncRefreshToken();
        if (!mounted) return;
        const redirectPath = localStorage.getItem('redirect_after_auth') || '/dashboard';
        localStorage.removeItem('redirect_after_auth');
        navigate(redirectPath, { replace: true });
      } catch (err: any) {
        if (!mounted) return;
        console.error('Auth callback error:', err);
        setError(`Failed to sign in: ${err.message || 'Unknown error'}. Redirecting to home...`);
        setTimeout(() => mounted && navigate('/'), 4000);
      }
    };

    const handleAuth = async () => {
      try {
        const url = new URL(window.location.href);
        const errorDesc = url.searchParams.get('error_description') || new URLSearchParams(url.hash.substring(1)).get('error_description');
        if (errorDesc) {
          throw new Error(decodeURIComponent(errorDesc.replace(/\+/g, ' ')));
        }

        // Wait for session. It might be available immediately, or via onAuthStateChange
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        if (sessionError) throw sessionError;

        if (session) {
          await proceedWithAuth();
        } else {
          // Wait for the automatic PKCE exchange to finish via the event listener
          const { data } = supabase.auth.onAuthStateChange((event, newSession) => {
            if (event === 'SIGNED_IN' && newSession) {
              proceedWithAuth();
            }
          });
          authListener = data.subscription;
          
          // Failsafe timeout just in case the event never fires
          setTimeout(() => {
            if (mounted && !error) {
              setError('Session timeout. Redirecting to home...');
              setTimeout(() => mounted && navigate('/'), 3000);
            }
          }, 5000);
        }
      } catch (err: any) {
        if (!mounted) return;
        console.error('Auth check error:', err);
        setError(`Error: ${err.message}. Redirecting...`);
        setTimeout(() => mounted && navigate('/'), 4000);
      }
    };

    handleAuth();

    return () => {
      mounted = false;
      if (authListener) authListener.unsubscribe();
    };
  }, [navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-white">
      <div className="text-center space-y-4">
        {!error && <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>}
        <p className="text-gray-600 font-medium">{error ? 'Authentication Error' : 'Finishing setup!...'}</p>
        {error && <p className="text-red-500 font-bold max-w-md mx-auto">{error}</p>}
      </div>
    </div>
  );
}
