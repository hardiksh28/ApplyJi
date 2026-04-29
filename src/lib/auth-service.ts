import { supabase } from './supabase/client';

/**
 * Initiates Google OAuth flow with Gmail scopes.
 * Requests 'offline' access to ensure we get a refresh_token.
 */
export async function signInWithGoogle() {
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      scopes: 'https://www.googleapis.com/auth/gmail.readonly https://www.googleapis.com/auth/userinfo.email https://www.googleapis.com/auth/userinfo.profile',
      queryParams: {
        access_type: 'offline',
        prompt: 'consent',
      },
      redirectTo: `${window.location.origin}/auth/callback`,
    },
  });

  if (error) throw error;
  return data;
}

export async function signOut() {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}

/**
 * Syncs the provider refresh token to the database if it exists in the session.
 * This should be called after a successful OAuth redirect.
 */
export async function syncRefreshToken() {
  const { data: { session } } = await supabase.auth.getSession();
  
  if (session?.provider_refresh_token) {
    const { error } = await supabase
      .from('profiles')
      .update({ google_refresh_token: session.provider_refresh_token })
      .eq('id', session.user.id);
    
    if (error) {
      console.error('Error saving refresh token:', error);
      throw error;
    }
    return true;
  }
  return false;
}
