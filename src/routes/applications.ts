import { Router, Response } from 'express';
import { authenticate } from '../middleware/authenticate';
import type { AuthRequest } from '../middleware/authenticate';
import { checkApplicationLimit, loadProfile } from '../middleware/checkSubscription.ts';
import { getSupabaseAdmin } from '../lib/supabase/server.ts';
import { z } from 'zod';
import * as validators from '../lib/validators.ts';

const router = Router();

// Create application (Apply Now)
router.post('/applications', authenticate, loadProfile, checkApplicationLimit, async (req: AuthRequest, res: Response) => {
  const supabaseAdmin = getSupabaseAdmin();
  try {
    const { company_name, job_title, job_url, location, salary_range, status, description } = validators.createApplicationSchema.parse(req.body);

    const { data, error } = await supabaseAdmin
      .from('applications')
      .insert({
        user_id: req.user!.id,
        company_name,
        job_title,
        job_url: job_url || null,
        location: location || null,
        salary_range: salary_range || null,
        status: status || 'applied',
        description: description || null,
        applied_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      if (error.code === '23505') {
        return res.status(409).json({ error: 'You have already applied to this role at this company' });
      }
      throw error;
    }

    // Log activity
    await supabaseAdmin.from('application_activities').insert({
      application_id: data.id,
      activity_type: 'status_change',
      description: `Application created with status: ${status || 'applied'}`,
    });

    res.status(201).json(data);
  } catch (err: any) {
    if (err instanceof z.ZodError) {
      return res.status(400).json({ error: 'Validation failed', details: err.issues });
    }
    console.error('Create application error:', err);
    res.status(500).json({ error: err.message || 'Failed to create application' });
  }
});

// Get user's applications
router.get('/applications', authenticate, async (req: AuthRequest, res: Response) => {
  const supabaseAdmin = getSupabaseAdmin();
  try {
    const { status, limit } = req.query;
    
    let query = supabaseAdmin
      .from('applications')
      .select('*')
      .eq('user_id', req.user!.id)
      .order('applied_at', { ascending: false });

    if (status) {
      query = query.ilike('status', status as string);
    }
    if (limit) {
      query = query.limit(parseInt(limit as string));
    }

    const { data, error } = await query;
    if (error) throw error;

    res.json(data || []);
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to fetch applications' });
  }
});

// Update application status
router.patch('/applications/:id', authenticate, async (req: AuthRequest, res: Response) => {
  const supabaseAdmin = getSupabaseAdmin();
  try {
    const { id } = req.params;
    const updates = validators.updateApplicationSchema.parse(req.body);

    // Only allow updating own applications
    const { data: existing } = await supabaseAdmin
      .from('applications')
      .select('user_id')
      .eq('id', id)
      .single();

    if (!existing || existing.user_id !== req.user!.id) {
      return res.status(404).json({ error: 'Application not found' });
    }

    const { data, error } = await supabaseAdmin
      .from('applications')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    // Log status change if status was updated
    if (updates.status) {
      await supabaseAdmin.from('application_activities').insert({
        application_id: id,
        activity_type: 'status_change',
        description: `Status changed to: ${updates.status}`,
      });
    }

    res.json(data);
  } catch (err: any) {
    if (err instanceof z.ZodError) {
      return res.status(400).json({ error: 'Validation failed', details: err.issues });
    }
    res.status(500).json({ error: err.message || 'Failed to update application' });
  }
});

// Delete/Archive application
router.delete('/applications/:id', authenticate, async (req: AuthRequest, res: Response) => {
  const supabaseAdmin = getSupabaseAdmin();
  try {
    const { id } = req.params;

    const { data: existing } = await supabaseAdmin
      .from('applications')
      .select('user_id')
      .eq('id', id)
      .single();

    if (!existing || existing.user_id !== req.user!.id) {
      return res.status(404).json({ error: 'Application not found' });
    }

    const { error } = await supabaseAdmin
      .from('applications')
      .delete()
      .eq('id', id);

    if (error) throw error;

    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to delete application' });
  }
});

// ============ SAVED JOBS (Toggle) ============

router.post('/saved-jobs', authenticate, async (req: AuthRequest, res: Response) => {
  const supabaseAdmin = getSupabaseAdmin();
  try {
    const { company_name, job_title, job_url, location, salary_range, description } = validators.savedJobSchema.parse(req.body);

    // Check if already saved
    const { data: existing } = await supabaseAdmin
      .from('applications')
      .select('id, status')
      .eq('user_id', req.user!.id)
      .eq('company_name', company_name)
      .eq('job_title', job_title)
      .maybeSingle();

    if (existing) {
      if (existing.status === 'saved') {
        // Unsave (delete)
        await supabaseAdmin.from('applications').delete().eq('id', existing.id);
        return res.json({ saved: false, message: 'Job unsaved' });
      } else {
        return res.status(409).json({ error: 'This job is already in your pipeline' });
      }
    }

    // Save as new
    const { data, error } = await supabaseAdmin
      .from('applications')
      .insert({
        user_id: req.user!.id,
        company_name,
        job_title,
        job_url: job_url || null,
        location: location || null,
        salary_range: salary_range || null,
        description: description || null,
        status: 'saved',
      })
      .select()
      .single();

    if (error) throw error;
    res.status(201).json({ saved: true, data });
  } catch (err: any) {
    if (err instanceof z.ZodError) {
      return res.status(400).json({ error: 'Validation failed', details: err.issues });
    }
    res.status(500).json({ error: err.message || 'Failed to save job' });
  }
});

export default router;
