import { Router, Response } from 'express';
import { authenticate, AuthRequest } from '../middleware/authenticate';
import { loadProfile } from '../middleware/checkSubscription';
import { getSupabaseAdmin } from '../lib/supabase/server.ts';

const router = Router();

// Get user profile
router.get('/user/profile', authenticate, async (req: AuthRequest, res: Response) => {
  const supabaseAdmin = getSupabaseAdmin();
  const { data: profile } = await supabaseAdmin
    .from('profiles')
    .select('*')
    .eq('id', req.user!.id)
    .single();
  res.json(profile);
});

// Get subscription status
router.get('/subscription/status', authenticate, loadProfile, async (req: AuthRequest, res: Response) => {
  const supabaseAdmin = getSupabaseAdmin();
  const profile = req.profile;
  if (!profile) return res.status(401).json({ error: 'Profile not loaded' });
  const isTrialActive = profile.trial_ends_at && new Date(profile.trial_ends_at) >= new Date();
  const isPaid = ['pro', 'enterprise'].includes(profile.subscription_tier);

  // Count this month's applications
  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);

  const { count } = await supabaseAdmin
    .from('applications')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', req.user!.id)
    .neq('status', 'saved')
    .gte('applied_at', startOfMonth.toISOString());

  res.json({
    plan: profile.subscription_tier,
    isTrialActive,
    trialEndsAt: profile.trial_ends_at,
    isPro: isPaid || isTrialActive,
    applicationsThisMonth: count || 0,
    applicationLimit: isPaid ? null : 5,
    canApply: isPaid || isTrialActive || (count || 0) < 5,
  });
});

// Autofill Data (for browser extension)
router.get('/profile/autofill-data', authenticate, loadProfile, async (req: AuthRequest, res: Response) => {
  const p = req.profile;
  res.json({
    fullName: p!.full_name || '',
    email: p!.email || '',
    phone: p!.phone || '',
    currentRole: p!.current_role || '',
    experience: p!.experience || [],
    skills: p!.skills || [],
    education: p!.education || [],
    linkedinUrl: p!.linkedin_url || '',
    portfolioUrl: p!.portfolio_url || '',
    location: p!.location || '',
    ...(p!.autofill_data || {}),
  });
});

router.put('/profile/autofill-data', authenticate, async (req: AuthRequest, res: Response) => {
  const supabaseAdmin = getSupabaseAdmin();
  try {
    const updates = req.body;
    const profileUpdates: any = {};
    
    if (updates.fullName !== undefined) profileUpdates.full_name = updates.fullName;
    if (updates.phone !== undefined) profileUpdates.phone = updates.phone;
    if (updates.currentRole !== undefined) profileUpdates.current_role = updates.currentRole;
    if (updates.skills !== undefined) profileUpdates.skills = updates.skills;
    if (updates.experience !== undefined) profileUpdates.experience = updates.experience;
    if (updates.education !== undefined) profileUpdates.education = updates.education;
    if (updates.linkedinUrl !== undefined) profileUpdates.linkedin_url = updates.linkedinUrl;
    if (updates.portfolioUrl !== undefined) profileUpdates.portfolio_url = updates.portfolioUrl;
    if (updates.location !== undefined) profileUpdates.location = updates.location;
    if (updates.autofill_data !== undefined) profileUpdates.autofill_data = updates.autofill_data;

    const { data, error } = await supabaseAdmin
      .from('profiles')
      .update(profileUpdates)
      .eq('id', req.user!.id)
      .select()
      .single();

    if (error) throw error;
    res.json({ success: true, profile: data });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to update profile' });
  }
});

// Profile Completeness
router.get('/profile/completeness', authenticate, async (req: AuthRequest, res: Response) => {
  const supabaseAdmin = getSupabaseAdmin();
  try {
    const { data: profile } = await supabaseAdmin.from('profiles').select('*').eq('id', req.user!.id).single();
    if (!profile) return res.status(404).json({ error: 'Profile not found' });

    let score = 0;
    const missingFields = [];

    const weights: Record<string, number> = {
      full_name: 5,
      current_role: 5,
      location: 5,
      avatar_url: 5,
      summary: 10,
      experience: 20,
      education: 10,
      skills: 15,
      phone: 5,
      linkedin_url: 5,
      portfolio_url: 5,
      autofill_data: 10
    };

    for (const [field, weight] of Object.entries(weights)) {
      const val = profile[field];
      const isSet = val && (Array.isArray(val) ? val.length > 0 : typeof val === 'object' ? Object.keys(val).length > 0 : true);
      if (isSet) {
        score += weight;
      } else {
        missingFields.push(field);
      }
    }

    res.json({ score, missingFields });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Market Intelligence: Trending Skills
router.get('/market/trending-skills', authenticate, async (req: AuthRequest, res: Response) => {
  const supabaseAdmin = getSupabaseAdmin();
  try {
    const { role, location } = req.query;
    
    let query = supabaseAdmin.from('jobs').select('skills');
    if (role) query = query.ilike('title', `%${role}%`);
    if (location) query = query.ilike('location', `%${location}%`);

    const { data: jobs } = await query.limit(100);
    
    const skillCounts: Record<string, number> = {};
    jobs?.forEach(job => {
      const skills = job.skills || [];
      const skillsArray = typeof skills === 'string' ? JSON.parse(skills) : skills;
      if (Array.isArray(skillsArray)) {
        skillsArray.forEach((skill: string) => {
          skillCounts[skill] = (skillCounts[skill] || 0) + 1;
        });
      }
    });

    const sortedSkills = Object.entries(skillCounts)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    res.json(sortedSkills);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
