import { Router, Response } from 'express';
import { authenticate } from '../middleware/authenticate';
import type { AuthRequest } from '../middleware/authenticate';
import { requirePro, loadProfile } from '../middleware/checkSubscription.ts';
import { getSupabaseAdmin } from '../lib/supabase/server.ts';
import { z } from 'zod';
import * as validators from '../lib/validators.ts';

const router = Router();

// 1. Search & Filter Jobs
router.get('/jobs', authenticate, async (req: AuthRequest, res: Response) => {
  const supabaseAdmin = getSupabaseAdmin();
  try {
    const { q, location, skills, salary_min, salary_max, source, sort = 'recent', limit = 20, offset = 0 } = req.query;
    
    let query = supabaseAdmin
      .from('jobs')
      .select('*', { count: 'exact' })
      .eq('is_active', true);

    // Full-text Search
    if (q) {
      query = query.textSearch('job_search_vector', q as string);
    }

    // Filters
    if (location) query = query.ilike('location', `%${location}%`);
    if (source) query = query.eq('source', source);
    if (salary_min) query = query.gte('salary_min', parseInt(salary_min as string));
    if (salary_max) query = query.lte('salary_max', parseInt(salary_max as string));
    
    // Skills Filter (GIN array match)
    if (skills) {
      const skillsArray = (skills as string).split(',');
      query = query.contains('skills', skillsArray);
    }

    // Sorting
    if (sort === 'recent') {
      query = query.order('posted_at', { ascending: false });
    }

    const { data, count, error } = await query
      .range(Number(offset), Number(offset) + Number(limit) - 1);

    if (error) {
      if (error.message.includes('schema cache') || error.message.includes('does not exist')) {
        return res.status(404).json({ error: 'The jobs table does not exist in the database. Please run the schema.sql file in your Supabase dashboard.' });
      }
      throw error;
    }

    res.json({ jobs: data, total: count });
  } catch (err: any) {
    console.error('Error fetching jobs:', err);
    res.status(500).json({ error: err.message });
  }
});

// 2. Smart Recommendations
router.get('/jobs/recommended', authenticate, async (req: AuthRequest, res: Response) => {
  const supabaseAdmin = getSupabaseAdmin();
  try {
    const { JobDiscoveryService } = await import('../lib/job-discovery-service.ts');
    const discovery = new JobDiscoveryService(supabaseAdmin);
    const recommendations = await discovery.getRecommendedJobs(req.user!.id);
    res.json(recommendations);
  } catch (err: any) {
    console.error('Error in recommended jobs:', err);
    if (err.message && (err.message.includes('schema cache') || err.message.includes('does not exist'))) {
      return res.status(404).json({ error: 'The jobs table does not exist in the database. Please run the schema.sql file in your Supabase dashboard.' });
    }
    res.status(500).json({ error: err.message });
  }
});

// 3. One-Click Apply (Pro-gated)
router.post('/apply/one-click', authenticate, loadProfile, requirePro, async (req: AuthRequest, res: Response) => {
  const supabaseAdmin = getSupabaseAdmin();
  try {
    const { jobId } = validators.oneClickApplySchema.parse(req.body);

    const { AutoApplyService } = await import('../lib/auto-apply-service.ts');
    const autoApply = new AutoApplyService(supabaseAdmin);
    
    const result = await autoApply.applyToJob(req.user!.id, jobId);
    res.json(result);
  } catch (err: any) {
    if (err instanceof z.ZodError) {
      return res.status(400).json({ error: 'Validation failed', details: err.issues });
    }
    if (err.message === 'DAILY_LIMIT_REACHED') {
      return res.status(429).json({ error: 'You have reached your daily limit of 10 auto-applies.' });
    }
    if (err.message === 'ONE_CLICK_APPLY_PRO_ONLY') {
      return res.status(403).json({ error: 'One-click apply is a Pro-only feature.', code: 'PRO_REQUIRED' });
    }
    res.status(500).json({ error: err.message });
  }
});

// 4. Admin — Trigger Aggregation
router.post('/admin/jobs/aggregate', authenticate, async (req: AuthRequest, res: Response) => {
  const supabaseAdmin = getSupabaseAdmin();
  const { data: profile } = await supabaseAdmin.from('profiles').select('is_admin').eq('id', req.user!.id).single();
  
  if (!profile?.is_admin) {
    return res.status(403).json({ error: 'Admin access required' });
  }

  try {
    const { JobDiscoveryService } = await import('../lib/job-discovery-service.ts');
    const discovery = new JobDiscoveryService(supabaseAdmin);
    const jobs = await discovery.runAggregationPipeline();
    res.json({ message: 'Aggregation complete', count: jobs?.length });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 5. Admin — Stats
router.get('/admin/jobs/stats', authenticate, async (req: AuthRequest, res: Response) => {
  const supabaseAdmin = getSupabaseAdmin();
  
  const { data: profile } = await supabaseAdmin.from('profiles').select('is_admin').eq('id', req.user!.id).single();
  
  if (!profile?.is_admin) {
    return res.status(403).json({ error: 'Admin access required' });
  }

  try {
    const { data, error } = await supabaseAdmin.rpc('get_job_stats');
    if (error) throw error;
    res.json(data);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
