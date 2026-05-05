import { createClient } from '@supabase/supabase-js';

/**
 * Supabase client for server-side operations using Service Role key.
 * This client bypasses RLS and should ONLY be used in server-side code (server.ts or background jobs).
 */
export function getSupabaseAdmin() {
  const supabaseUrl = process.env.VITE_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    console.warn('SUPABASE_SERVICE_ROLE_KEY or VITE_SUPABASE_URL environment variable is missing. Server-side admin operations will fail.');
  }

  return createClient(supabaseUrl || 'https://placeholder.supabase.co', serviceRoleKey || 'placeholder', {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });
}
