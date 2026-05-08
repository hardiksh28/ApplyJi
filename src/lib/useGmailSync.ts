import { useState, useCallback } from 'react';
import { supabase } from './supabase/client';

interface SyncResult {
  applicationsFound: number;
  processedCount: number;
  message: string;
}

interface SyncError {
  error: string;
  code?: string;
  message?: string;
}

export function useGmailSync() {
  const [syncing, setSyncing] = useState(false);
  const [syncProgress, setSyncProgress] = useState(0);

  const syncGmail = useCallback(async (): Promise<{
    success: boolean;
    data?: SyncResult;
    error?: SyncError;
  }> => {
    setSyncing(true);
    setSyncProgress(0);

    const progressInterval = setInterval(() => {
      setSyncProgress(prev => (prev >= 90 ? prev : prev + 10));
    }, 800);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        return { success: false, error: { error: 'Not authenticated', code: 'NOT_AUTHENTICATED' } };
      }

      const response = await fetch('/api/sync/gmail', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        return { success: false, error: data as SyncError };
      }

      setSyncProgress(100);
      return { success: true, data: data as SyncResult };
    } catch (err: any) {
      return { success: false, error: { error: err.message || 'Sync failed', code: 'NETWORK_ERROR' } };
    } finally {
      clearInterval(progressInterval);
      setTimeout(() => {
        setSyncing(false);
        setSyncProgress(0);
      }, 500);
    }
  }, []);

  return { syncGmail, syncing, syncProgress };
}
