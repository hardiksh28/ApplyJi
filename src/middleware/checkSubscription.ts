import { Response, NextFunction } from 'express';
import { getSupabaseAdmin } from '../lib/supabase/server.ts';
import type { AuthRequest } from './authenticate';

export const loadProfile = async (req: AuthRequest, res: Response, next: NextFunction) => {
  if (!req.user) return res.status(401).json({ error: 'Unauthorized' });

  const supabaseAdmin = getSupabaseAdmin();
  try {
    const { data: profile, error } = await supabaseAdmin
      .from('profiles')
      .select('*')
      .eq('id', req.user!.id)
      .single();

    if (error || !profile) throw error;
    req.profile = profile;
    next();
  } catch (err) {
    return res.status(500).json({ error: 'Failed to load profile' });
  }
};

export const checkSubscription = async (req: AuthRequest, res: Response, next: NextFunction) => {
  if (!req.profile) return res.status(401).json({ error: 'Profile not loaded' });

  const profile = req.profile;
  const isTrialExpired = profile.trial_ends_at && new Date(profile.trial_ends_at) < new Date();
  const isPaid = ['pro', 'enterprise'].includes(profile.subscription_tier);

  if (isTrialExpired && !isPaid) {
    return res.status(403).json({ 
      error: 'Trial expired', 
      code: 'TRIAL_EXPIRED',
      redirectTo: '/billing'
    });
  }

  next();
};

export const requirePro = async (req: AuthRequest, res: Response, next: NextFunction) => {
  if (!req.profile) return res.status(401).json({ error: 'Profile not loaded' });

  const profile = req.profile;
  const isPaid = ['pro', 'enterprise'].includes(profile?.subscription_tier);
  const isTrialActive = profile?.trial_ends_at && new Date(profile.trial_ends_at) >= new Date();

  if (!isPaid && !isTrialActive) {
    return res.status(403).json({ 
      error: 'Pro plan required', 
      code: 'PRO_REQUIRED',
      message: 'This feature requires an active Pro subscription or trial.',
      redirectTo: '/billing'
    });
  }

  next();
};

export const checkApplicationLimit = async (req: AuthRequest, res: Response, next: NextFunction) => {
  if (!req.profile) return res.status(401).json({ error: 'Profile not loaded' });

  const supabaseAdmin = getSupabaseAdmin();
  const profile = req.profile;
  const isPaid = ['pro', 'enterprise'].includes(profile?.subscription_tier);
  const isTrialActive = profile?.trial_ends_at && new Date(profile.trial_ends_at) >= new Date();

  if (!isPaid && !isTrialActive) {
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const { count } = await supabaseAdmin
      .from('applications')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', req.user!.id)
      .neq('status', 'saved')
      .gte('applied_at', startOfMonth.toISOString());

    if ((count || 0) >= 5) {
      return res.status(403).json({
        error: 'Application limit reached',
        code: 'LIMIT_REACHED',
        message: 'Free tier allows up to 5 applications per month. Upgrade to Pro for unlimited.',
        redirectTo: '/billing'
      });
    }
  }

  next();
};
