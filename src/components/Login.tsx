import React from 'react';
import { motion } from 'motion/react';
import { LogIn } from 'lucide-react';
import { signInWithGoogle } from '../lib/auth-service';

export function Login() {
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const handleLogin = async () => {
    setLoading(true);
    setError(null);
    try {
      await signInWithGoogle();
    } catch (err: any) {
      setError(err.message || 'Failed to sign in');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-md w-full space-y-8 bg-white p-10 rounded-2xl shadow-xl border border-gray-100"
      >
        <div className="text-center">
          <h2 className="mt-6 text-3xl font-extrabold text-gray-900 tracking-tight">
            Welcome to ApplyJi
          </h2>
          <p className="mt-2 text-sm text-gray-500">
            Sign in to sync your job applications from Gmail
          </p>
        </div>

        {error && (
          <div className="bg-red-50 text-red-700 p-3 rounded-lg text-sm text-center">
            {error}
          </div>
        )}

        <button
          onClick={handleLogin}
          disabled={loading}
          className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-xl text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-all duration-200 disabled:opacity-50"
        >
          <span className="absolute left-0 inset-y-0 flex items-center pl-3">
            <LogIn className="h-5 w-5 text-indigo-500 group-hover:text-indigo-400" />
          </span>
          {loading ? 'Opening Google...' : 'Continue with Google'}
        </button>

        <div className="text-center text-xs text-gray-400">
          By signing in, you agree to our Terms and Privacy Policy.
        </div>
      </motion.div>
    </div>
  );
}
