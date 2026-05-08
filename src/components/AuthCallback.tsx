import React from 'react';
import { useNavigate } from 'react-router-dom';
import { syncRefreshToken } from '../lib/auth-service';

export function AuthCallback() {
  const navigate = useNavigate();
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    const handleAuth = async () => {
      try {
        // Sync the refresh token to the profile
        await syncRefreshToken();
        
        const redirectPath = localStorage.getItem('redirect_after_auth') || '/dashboard';
        localStorage.removeItem('redirect_after_auth');
        
        navigate(redirectPath, { replace: true });
      } catch (err: any) {
        console.error('Auth callback error:', err);
        setError('Failed to sync authentication. Please try again.');
        // If it fails, we still might have a session, but Gmail sync won't work perfectly
        setTimeout(() => navigate('/dashboard'), 3000);
      }
    };

    handleAuth();
  }, [navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-white">
      <div className="text-center space-y-4">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
        <p className="text-gray-600 font-medium">Finishing setup!...</p>
        {error && <p className="text-red-500 text-sm">{error}</p>}
      </div>
    </div>
  );
}
