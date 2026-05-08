import { Router, Response } from 'express';
import { authenticate, AuthRequest } from '../middleware/authenticate';
import { requirePro, loadProfile } from '../middleware/checkSubscription.ts';
import { getSupabaseAdmin } from '../lib/supabase/server.ts';
import { z } from 'zod';
import * as validators from '../lib/validators.ts';
import rateLimit from 'express-rate-limit';

const aiRateLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 5,
  message: { error: 'Too many AI requests. Please wait a minute before trying again.', code: 'RATE_LIMITED' },
  standardHeaders: true,
  legacyHeaders: false,
});

const router = Router();

// Resume Analysis (Pro-gated)
router.post('/resume/analyze', authenticate, aiRateLimiter, loadProfile, requirePro, async (req: AuthRequest, res: Response) => {
  const supabaseAdmin = getSupabaseAdmin();
  try {
    const { resumeText, jobDescription } = validators.resumeAnalyzeSchema.parse(req.body);

    const { analyzeResume, logAIUsage } = await import('../lib/ai/gemini.ts');
    const startTime = Date.now();
    const analysis = await analyzeResume(resumeText, jobDescription);
    
    await logAIUsage(supabaseAdmin, {
      userId: req.user!.id, feature: 'resume_analyze', model: 'gemini-3-flash-preview',
      latencyMs: Date.now() - startTime, success: true,
    });

    res.json(analysis);
  } catch (err: any) {
    if (err instanceof z.ZodError) {
      return res.status(400).json({ error: 'Validation failed', details: err.issues });
    }
    res.status(500).json({ error: err.message });
  }
});

// Generate Tailored Resume (Pro-gated)
router.post('/resume/generate', authenticate, aiRateLimiter, loadProfile, requirePro, async (req: AuthRequest, res: Response) => {
  const supabaseAdmin = getSupabaseAdmin();
  try {
    const { jobDescriptionText, applicationId } = validators.resumeGenerateSchema.parse(req.body);

    const { generateTailoredResume, logAIUsage } = await import('../lib/ai/gemini.ts');
    const profile = req.profile;

    const startTime = Date.now();
    const resumeData = await generateTailoredResume(
      {
        fullName: profile!.full_name || 'Candidate',
        skills: profile!.skills || [],
        experience: profile!.experience || [],
        education: profile!.education || [],
      },
      jobDescriptionText
    );

    // Store generated resume in DB
    const { data: savedResume } = await supabaseAdmin
      .from('generated_resumes')
      .insert({
        user_id: req.user!.id,
        application_id: applicationId || null,
        job_description: jobDescriptionText,
        resume_data: resumeData,
        resume_text: JSON.stringify(resumeData, null, 2),
      })
      .select()
      .single();

    await logAIUsage(supabaseAdmin, {
      userId: req.user!.id, feature: 'resume_generate', model: 'gemini-3-flash-preview',
      latencyMs: Date.now() - startTime, success: true,
      metadata: { resumeId: savedResume?.id },
    });

    res.json({ id: savedResume?.id, ...resumeData });
  } catch (err: any) {
    if (err instanceof z.ZodError) {
      return res.status(400).json({ error: 'Validation failed', details: err.issues });
    }
    console.error('Resume generate error:', err);
    res.status(500).json({ error: err.message || 'Failed to generate resume' });
  }
});

// Generate Cover Letter (Pro-gated)
router.post('/cover-letter/generate', authenticate, aiRateLimiter, loadProfile, requirePro, async (req: AuthRequest, res: Response) => {
  const supabaseAdmin = getSupabaseAdmin();
  try {
    const { jobDescriptionText, tone = 'professional', applicationId } = validators.coverLetterSchema.parse(req.body);

    const { generateCoverLetter, logAIUsage } = await import('../lib/ai/gemini.ts');
    const profile = req.profile;

    const startTime = Date.now();
    const coverLetterText = await generateCoverLetter(
      {
        fullName: profile!.full_name || 'Candidate',
        skills: profile!.skills || [],
        experience: profile!.experience || [],
      },
      jobDescriptionText,
      tone
    );

    // Store in DB
    const { data: saved } = await supabaseAdmin
      .from('generated_cover_letters')
      .insert({
        user_id: req.user!.id,
        application_id: applicationId || null,
        job_description: jobDescriptionText,
        tone,
        cover_letter_text: coverLetterText,
      })
      .select()
      .single();

    await logAIUsage(supabaseAdmin, {
      userId: req.user!.id, feature: 'cover_letter', model: 'gemini-3-flash-preview',
      latencyMs: Date.now() - startTime, success: true,
      metadata: { coverletterId: saved?.id, tone },
    });

    res.json({ id: saved?.id, coverLetter: coverLetterText, tone });
  } catch (err: any) {
    if (err instanceof z.ZodError) {
      return res.status(400).json({ error: 'Validation failed', details: err.issues });
    }
    console.error('Cover letter error:', err);
    res.status(500).json({ error: err.message || 'Failed to generate cover letter' });
  }
});

// Skills Gap Analyzer (Pro-gated)
router.post('/skills-gap', authenticate, aiRateLimiter, loadProfile, requirePro, async (req: AuthRequest, res: Response) => {
  const supabaseAdmin = getSupabaseAdmin();
  try {
    const { jobDescriptionText } = validators.skillsGapSchema.parse(req.body);

    const { analyzeSkillsGap, logAIUsage } = await import('../lib/ai/gemini.ts');
    const profile = req.profile;

    // Flatten user skills from JSONB array
    const userSkills: string[] = (profile!.skills || []).map((s: any) =>
      typeof s === 'string' ? s : s.name || s.skill || JSON.stringify(s)
    );

    const startTime = Date.now();
    const result = await analyzeSkillsGap(userSkills, jobDescriptionText);

    await logAIUsage(supabaseAdmin, {
      userId: req.user!.id, feature: 'skills_gap', model: 'gemini-3-flash-preview',
      latencyMs: Date.now() - startTime, success: true,
      metadata: { score: result.score },
    });

    res.json(result);
  } catch (err: any) {
    if (err instanceof z.ZodError) {
      return res.status(400).json({ error: 'Validation failed', details: err.issues });
    }
    console.error('Skills gap error:', err);
    res.status(500).json({ error: err.message || 'Failed to analyze skills gap' });
  }
});

// Generate Follow-up Email (Pro-gated)
router.post('/followup/generate', authenticate, aiRateLimiter, loadProfile, requirePro, async (req: AuthRequest, res: Response) => {
  const supabaseAdmin = getSupabaseAdmin();
  try {
    const { company, jobTitle, appliedDate } = validators.followupSchema.parse(req.body);

    const { generateFollowUp, logAIUsage } = await import('../lib/ai/gemini.ts');
    const startTime = Date.now();
    const followUp = await generateFollowUp({ company, jobTitle, appliedDate });
    
    await logAIUsage(supabaseAdmin, {
      userId: req.user!.id, feature: 'follow_up', model: 'gemini-3-flash-preview',
      latencyMs: Date.now() - startTime, success: true,
    });

    res.json({ followUp });
  } catch (err: any) {
    if (err instanceof z.ZodError) {
      return res.status(400).json({ error: 'Validation failed', details: err.issues });
    }
    res.status(500).json({ error: err.message || 'Failed to generate follow-up' });
  }
});

// Interview Prep (AI)
router.post('/interview-prep/generate', authenticate, loadProfile, requirePro, async (req: AuthRequest, res: Response) => {
  const supabaseAdmin = getSupabaseAdmin();
  try {
    const { jobId, companyName, role } = validators.interviewPrepSchema.parse(req.body);

    // 1. Fetch user's resume/profile for context
    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('skills, experience')
      .eq('id', req.user!.id)
      .single();

    const context = `Skills: ${JSON.stringify(profile?.skills)}. Experience: ${JSON.stringify(profile?.experience)}`;

    // 2. Generate prep via Intelligence Service
    const { EmailIntelligenceService } = await import('../lib/email-intelligence.ts');
    const emailIntel = new EmailIntelligenceService(supabaseAdmin, process.env.GEMINI_API_KEY!);
    
    const prepData = await emailIntel.generateInterviewPrep(role, companyName, context);

    // 3. Update application with prep data
    const { error } = await supabaseAdmin
      .from('applications')
      .update({ interview_prep_data: prepData })
      .eq('id', jobId)
      .select()
      .single();

    if (error) throw error;

    res.json(prepData);
  } catch (err: any) {
    if (err instanceof z.ZodError) {
      return res.status(400).json({ error: 'Validation failed', details: err.issues });
    }
    res.status(500).json({ error: err.message });
  }
});

// ATS Resume Score Checker
router.post('/resume/ats-score', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { resumeText, jobDescriptionText } = validators.atsScoreSchema.parse(req.body);

    const { checkATSScore } = await import('../lib/ai/gemini.ts');
    const scoreData = await checkATSScore(resumeText, jobDescriptionText);
    res.json(scoreData);
  } catch (err: any) {
    if (err instanceof z.ZodError) {
      return res.status(400).json({ error: 'Validation failed', details: err.issues });
    }
    res.status(500).json({ error: err.message });
  }
});

export default router;
