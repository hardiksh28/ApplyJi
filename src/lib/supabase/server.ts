import { createClient } from '@supabase/supabase-js';

/**
 * Supabase client for server-side operations using Service Role key.
 * This client bypasses RLS and should ONLY be used in server-side code (server.ts or background jobs).
 */
export function getSupabaseAdmin() {
  const supabaseUrl = process.env.VITE_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error('SUPABASE_SERVICE_ROLE_KEY environment variable is required for server-side admin operations');
  }

  return createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });
}
