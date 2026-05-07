import 'dotenv/config';
import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';
import { getSupabaseAdmin } from './src/lib/supabase/server.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// types for augmented request
interface AuthRequest extends Request {
  user?: any;
  profile?: any;
}

async function startServer() {
  const app = express();
  const PORT = 3000;
  const supabaseAdmin = getSupabaseAdmin();

  // Basic Middleware
  app.use(helmet({
    contentSecurityPolicy: false, // Required for Vite/AI Studio preview
  }));
  app.use(cors());
  app.use(morgan('dev'));
  app.use(express.json());

  // --- Middlewares ---

  // Verify Supabase Auth Token
  const authenticate = async (req: AuthRequest, res: Response, next: NextFunction) => {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const token = authHeader.split(' ')[1];
    try {
      const { data: { user }, error } = await supabaseAdmin.auth.getUser(token);
      if (error || !user) throw error;
      req.user = user;
      next();
    } catch (err) {
      return res.status(401).json({ error: 'Invalid token' });
    }
  };

  // Load user profile onto request
  const loadProfile = async (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) return res.status(401).json({ error: 'Unauthorized' });

    try {
      const { data: profile, error } = await supabaseAdmin
        .from('profiles')
        .select('*')
        .eq('id', req.user.id)
        .single();

      if (error || !profile) throw error;
      req.profile = profile;
      next();
    } catch (err) {
      return res.status(500).json({ error: 'Failed to load profile' });
    }
  };

  // Check Trial/Subscription Status
  const checkSubscription = async (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.profile) {
      // Load profile if not yet loaded
      const { data: profile, error } = await supabaseAdmin
        .from('profiles')
        .select('*')
        .eq('id', req.user.id)
        .single();

      if (error || !profile) return res.status(500).json({ error: 'Internal server error' });
      req.profile = profile;
    }

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

  // Check if user has Pro plan (for AI features)
  const requirePro = async (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.profile) {
      const { data: profile } = await supabaseAdmin
        .from('profiles')
        .select('*')
        .eq('id', req.user.id)
        .single();
      req.profile = profile;
    }

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

  // Check free-tier application limits
  const checkApplicationLimit = async (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.profile) {
      const { data: profile } = await supabaseAdmin
        .from('profiles')
        .select('*')
        .eq('id', req.user.id)
        .single();
      req.profile = profile;
    }

    const profile = req.profile;
    const isPaid = ['pro', 'enterprise'].includes(profile?.subscription_tier);
    const isTrialActive = profile?.trial_ends_at && new Date(profile.trial_ends_at) >= new Date();

    if (!isPaid && !isTrialActive) {
      // Count this month's applications
      const startOfMonth = new Date();
      startOfMonth.setDate(1);
      startOfMonth.setHours(0, 0, 0, 0);

      const { count } = await supabaseAdmin
        .from('applications')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', req.user.id)
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

  // --- API Routes ---

  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', service: 'ApplyJi API' });
  });

  // ============ USER PROFILE ============

  app.get('/api/user/profile', authenticate, async (req: AuthRequest, res) => {
    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('*')
      .eq('id', req.user.id)
      .single();
    res.json(profile);
  });

  // ============ SUBSCRIPTION STATUS ============

  app.get('/api/subscription/status', authenticate, loadProfile, async (req: AuthRequest, res) => {
    const profile = req.profile;
    const isTrialActive = profile.trial_ends_at && new Date(profile.trial_ends_at) >= new Date();
    const isPaid = ['pro', 'enterprise'].includes(profile.subscription_tier);

    // Count this month's applications
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const { count } = await supabaseAdmin
      .from('applications')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', req.user.id)
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

  // ============ APPLICATIONS ============

  // Create application (Apply Now)
  app.post('/api/applications', authenticate, checkApplicationLimit, async (req: AuthRequest, res) => {
    try {
      const { company_name, job_title, job_url, location, salary_range, status, description } = req.body;
      
      if (!company_name || !job_title) {
        return res.status(400).json({ error: 'company_name and job_title are required' });
      }

      const { data, error } = await supabaseAdmin
        .from('applications')
        .insert({
          user_id: req.user.id,
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
      console.error('Create application error:', err);
      res.status(500).json({ error: err.message || 'Failed to create application' });
    }
  });

  // Get user's applications
  app.get('/api/applications', authenticate, async (req: AuthRequest, res) => {
    try {
      const { status, limit } = req.query;
      
      let query = supabaseAdmin
        .from('applications')
        .select('*')
        .eq('user_id', req.user.id)
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
  app.patch('/api/applications/:id', authenticate, async (req: AuthRequest, res) => {
    try {
      const { id } = req.params;
      const updates = req.body;

      // Only allow updating own applications
      const { data: existing } = await supabaseAdmin
        .from('applications')
        .select('user_id')
        .eq('id', id)
        .single();

      if (!existing || existing.user_id !== req.user.id) {
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
      res.status(500).json({ error: err.message || 'Failed to update application' });
    }
  });

  // Delete/Archive application
  app.delete('/api/applications/:id', authenticate, async (req: AuthRequest, res) => {
    try {
      const { id } = req.params;

      const { data: existing } = await supabaseAdmin
        .from('applications')
        .select('user_id')
        .eq('id', id)
        .single();

      if (!existing || existing.user_id !== req.user.id) {
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

  app.post('/api/saved-jobs', authenticate, async (req: AuthRequest, res) => {
    try {
      const { company_name, job_title, job_url, location, salary_range, description } = req.body;

      if (!company_name || !job_title) {
        return res.status(400).json({ error: 'company_name and job_title are required' });
      }

      // Check if already saved
      const { data: existing } = await supabaseAdmin
        .from('applications')
        .select('id, status')
        .eq('user_id', req.user.id)
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
          user_id: req.user.id,
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
      res.status(500).json({ error: err.message || 'Failed to save job' });
    }
  });

  // ============ RAZORPAY INTEGRATION ============

  // Create Razorpay Order
  app.post('/api/razorpay/create-order', authenticate, loadProfile, async (req: AuthRequest, res) => {
    try {
      const { plan = 'pro', interval = 'month' } = req.body;
      
      const Razorpay = (await import('razorpay')).default;
      const razorpay = new Razorpay({
        key_id: process.env.RAZORPAY_KEY_ID!,
        key_secret: process.env.RAZORPAY_KEY_SECRET!,
      });

      // ₹499/month or ₹4999/year
      const amount = interval === 'year' ? 499900 : 49900; // in paise

      const order = await razorpay.orders.create({
        amount,
        currency: 'INR',
        receipt: `applyji_${req.user.id}_${Date.now()}`,
        notes: {
          userId: req.user.id,
          plan,
          interval,
        },
      });

      res.json({
        orderId: order.id,
        amount: order.amount,
        currency: order.currency,
        keyId: process.env.RAZORPAY_KEY_ID,
      });
    } catch (err: any) {
      console.error('Razorpay order error:', err);
      res.status(500).json({ error: err.message || 'Failed to create order' });
    }
  });

  // Verify Razorpay Payment
  app.post('/api/razorpay/verify-payment', authenticate, async (req: AuthRequest, res) => {
    try {
      const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

      if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
        return res.status(400).json({ error: 'Missing payment verification fields' });
      }

      const crypto = await import('crypto');
      const expectedSignature = crypto
        .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET!)
        .update(`${razorpay_order_id}|${razorpay_payment_id}`)
        .digest('hex');

      if (expectedSignature !== razorpay_signature) {
        return res.status(400).json({ error: 'Payment verification failed' });
      }

      // Upgrade user to Pro
      const { data: updatedProfile, error } = await supabaseAdmin
        .from('profiles')
        .update({ 
          subscription_tier: 'pro',
          updated_at: new Date().toISOString(),
        })
        .eq('id', req.user.id)
        .select()
        .single();

      if (error) throw error;

      res.json({ 
        success: true, 
        message: 'Payment verified! You are now a Pro user.',
        profile: updatedProfile,
      });
    } catch (err: any) {
      console.error('Payment verification error:', err);
      res.status(500).json({ error: err.message || 'Payment verification failed' });
    }
  });

  // Keep Stripe routes for backward compatibility
  // Stripe Checkout
  app.post('/api/stripe/create-checkout', authenticate, async (req: AuthRequest, res) => {
    try {
      const { interval = 'month' } = req.body;
      const { data: profile } = await supabaseAdmin
        .from('profiles')
        .select('*')
        .eq('id', req.user.id)
        .single();
      
      const stripe = (await import('stripe')).default;
      const stripeClient = new stripe(process.env.STRIPE_SECRET_KEY!);

      // $9 monthly. Yearly is $108 - 15% = $91.8 (~$7.65/mo)
      const amount = interval === 'year' ? 9180 : 900;

      const session = await stripeClient.checkout.sessions.create({
        customer: profile?.stripe_customer_id || undefined,
        payment_method_types: ['card'],
        line_items: [
          {
            price_data: {
              currency: 'usd',
              product_data: {
                name: `ApplyJi Pro ${interval === 'year' ? 'Yearly' : 'Monthly'}`,
                description: 'Full access to automated job tracking and AI insights',
              },
              unit_amount: amount,
              recurring: { interval: interval as 'month' | 'year' },
            },
            quantity: 1,
          },
        ],
        mode: 'subscription',
        success_url: `${process.env.APP_URL}/dashboard?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${process.env.APP_URL}/billing`,
        metadata: { userId: req.user.id },
      });

      res.json({ url: session.url });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Stripe Webhook
  app.post('/api/webhooks/stripe', express.raw({ type: 'application/json' }), async (req, res) => {
    const stripe = (await import('stripe')).default;
    const stripeClient = new stripe(process.env.STRIPE_SECRET_KEY!);
    const sig = req.headers['stripe-signature'] as string;
    
    let event;
    try {
      event = stripeClient.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET!);
    } catch (err: any) {
      return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    if (event.type === 'checkout.session.completed') {
      const session = event.data.object as any;
      const userId = session.metadata.userId;
      
      await supabaseAdmin
        .from('profiles')
        .update({ 
          subscription_tier: 'pro',
          stripe_customer_id: session.customer as string
        })
        .eq('id', userId);
    }

    res.json({ received: true });
  });

  // ============ AI FEATURES (Pro-gated) ============

  // Gmail Sync Route (Protected + Pro Required)
  app.post('/api/sync/gmail', authenticate, requirePro, async (req: AuthRequest, res) => {
    try {
      const { data: profile, error: profileError } = await supabaseAdmin
        .from('profiles')
        .select('google_refresh_token')
        .eq('id', req.user.id)
        .single();

      if (profileError || !profile?.google_refresh_token) {
        return res.status(400).json({ error: 'Google account not connected or refresh token missing' });
      }

      const { getGmailClient, fetchEmails, getEmailContent } = await import('./src/lib/gmail-service.ts');
      const { parseJobEmail } = await import('./src/lib/ai/gemini.ts');

      const gmail = await getGmailClient(profile.google_refresh_token, async (tokens) => {
        if (tokens.refresh_token) {
          console.log('Refreshing Google token for user:', req.user.id);
          await supabaseAdmin
            .from('profiles')
            .update({ google_refresh_token: tokens.refresh_token })
            .eq('id', req.user.id);
        }
      });
      
      // Filter for application keywords
      const query = 'newer_than:30d ("thank you for applying" OR "application received" OR "application for" OR "position at")';
      const messages = await fetchEmails(gmail, query);

      const results = [];
      // Processing only the first 2 emails per sync to stay within Gemini Free Tier rate limits (5 RPM)
      for (const msg of messages.slice(0, 2)) {
        // Check if we already processed this thread
        const { data: existing } = await supabaseAdmin
          .from('application_activities')
          .select('id')
          .eq('metadata->messageId', msg.id)
          .maybeSingle();

        if (existing) continue;

        const email = await getEmailContent(gmail, msg.id);
        
        let parsed;
        try {
          parsed = await parseJobEmail(email.body || email.snippet);
        } catch (e: any) {
          console.error("Gemini API Error during parsing:", e.message || e);
          if (e.status === 429 || (e.message && e.message.includes('429'))) {
            console.log('Gemini rate limit hit, using fallback parser based on Subject line!');
            // Fallback: extract basic info from Subject since AI is unavailable
            const companyMatch = email.subject.match(/(?:from|at)\s+([A-Z][\w\s]+)/i);
            const companyName = companyMatch ? companyMatch[1].trim() : 'Unknown Company';
            
            parsed = {
              isJobApplication: true, // We assume true since the Gmail query matched it
              company: companyName,
              jobTitle: email.subject || 'Application Received',
              appliedDate: email.date,
              platform: 'Email Fallback'
            };
          } else {
            throw e; 
          }
        }

        if (parsed.isJobApplication) {
          // 1. Create or find application
          const { data: app, error: appError } = await supabaseAdmin
            .from('applications')
            .upsert({
              user_id: req.user.id,
              company_name: parsed.company,
              job_title: parsed.jobTitle,
              platform: parsed.platform,
              applied_at: parsed.appliedDate || email.date,
            }, { onConflict: 'user_id, company_name, job_title' })
            .select()
            .single();

          if (app) {
            // 2. Log activity
            await supabaseAdmin.from('application_activities').insert({
              application_id: app.id,
              activity_type: 'email_received',
              description: `Email found: ${email.snippet}`,
              metadata: { messageId: email.id, threadId: email.threadId }
            });
            results.push({ app, parsed });
          }
        }
      }

      // Log the sync
      await supabaseAdmin.from('email_sync_logs').insert({
        user_id: req.user.id,
        sync_status: 'success',
        emails_processed: messages.length,
      });

      res.json({ 
        message: 'Sync completed', 
        applicationsFound: results.length,
        processedCount: messages.length 
      });

    } catch (err: any) {
      console.error('Sync error:', err);
      
      await supabaseAdmin.from('email_sync_logs').insert({
        user_id: req.user.id,
        sync_status: 'failed',
        error_message: err.message,
      });

      res.status(500).json({ error: 'Sync failed', details: err.message });
    }
  });

  // Resume Analysis (Pro-gated)
  app.post('/api/resume/analyze', authenticate, requirePro, async (req: AuthRequest, res) => {
    try {
      const { resumeText, jobDescription } = req.body;
      if (!resumeText || !jobDescription) {
        return res.status(400).json({ error: 'Missing resumeText or jobDescription' });
      }

      const { analyzeResume, logAIUsage } = await import('./src/lib/ai/gemini.ts');
      const startTime = Date.now();
      const analysis = await analyzeResume(resumeText, jobDescription);
      
      await logAIUsage(supabaseAdmin, {
        userId: req.user.id, feature: 'resume_analyze', model: 'gemini-3-flash-preview',
        latencyMs: Date.now() - startTime, success: true,
      });

      res.json(analysis);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // PHASE 2 — Generate Tailored Resume (Pro-gated)
  app.post('/api/resume/generate', authenticate, requirePro, loadProfile, async (req: AuthRequest, res) => {
    try {
      const { jobDescriptionText, applicationId } = req.body;
      if (!jobDescriptionText) {
        return res.status(400).json({ error: 'Missing jobDescriptionText' });
      }

      const { generateTailoredResume, logAIUsage } = await import('./src/lib/ai/gemini.ts');
      const profile = req.profile;

      const startTime = Date.now();
      const resumeData = await generateTailoredResume(
        {
          fullName: profile.full_name || 'Candidate',
          skills: profile.skills || [],
          experience: profile.experience || [],
          education: profile.education || [],
        },
        jobDescriptionText
      );

      // Store generated resume in DB
      const { data: savedResume } = await supabaseAdmin
        .from('generated_resumes')
        .insert({
          user_id: req.user.id,
          application_id: applicationId || null,
          job_description: jobDescriptionText,
          resume_data: resumeData,
          resume_text: JSON.stringify(resumeData, null, 2),
        })
        .select()
        .single();

      await logAIUsage(supabaseAdmin, {
        userId: req.user.id, feature: 'resume_generate', model: 'gemini-3-flash-preview',
        latencyMs: Date.now() - startTime, success: true,
        metadata: { resumeId: savedResume?.id },
      });

      res.json({ id: savedResume?.id, ...resumeData });
    } catch (err: any) {
      console.error('Resume generate error:', err);
      res.status(500).json({ error: err.message || 'Failed to generate resume' });
    }
  });

  // PHASE 2 — Generate Cover Letter (Pro-gated)
  app.post('/api/cover-letter/generate', authenticate, requirePro, loadProfile, async (req: AuthRequest, res) => {
    try {
      const { jobDescriptionText, tone = 'professional', applicationId } = req.body;
      if (!jobDescriptionText) {
        return res.status(400).json({ error: 'Missing jobDescriptionText' });
      }
      if (!['professional', 'casual', 'enthusiastic'].includes(tone)) {
        return res.status(400).json({ error: 'Invalid tone. Must be professional, casual, or enthusiastic' });
      }

      const { generateCoverLetter, logAIUsage } = await import('./src/lib/ai/gemini.ts');
      const profile = req.profile;

      const startTime = Date.now();
      const coverLetterText = await generateCoverLetter(
        {
          fullName: profile.full_name || 'Candidate',
          skills: profile.skills || [],
          experience: profile.experience || [],
        },
        jobDescriptionText,
        tone
      );

      // Store in DB
      const { data: saved } = await supabaseAdmin
        .from('generated_cover_letters')
        .insert({
          user_id: req.user.id,
          application_id: applicationId || null,
          job_description: jobDescriptionText,
          tone,
          cover_letter_text: coverLetterText,
        })
        .select()
        .single();

      await logAIUsage(supabaseAdmin, {
        userId: req.user.id, feature: 'cover_letter', model: 'gemini-3-flash-preview',
        latencyMs: Date.now() - startTime, success: true,
        metadata: { coverletterId: saved?.id, tone },
      });

      res.json({ id: saved?.id, coverLetter: coverLetterText, tone });
    } catch (err: any) {
      console.error('Cover letter error:', err);
      res.status(500).json({ error: err.message || 'Failed to generate cover letter' });
    }
  });

  // PHASE 2 — Skills Gap Analyzer (Pro-gated)
  app.post('/api/skills-gap', authenticate, requirePro, loadProfile, async (req: AuthRequest, res) => {
    try {
      const { jobDescriptionText } = req.body;
      if (!jobDescriptionText) {
        return res.status(400).json({ error: 'Missing jobDescriptionText' });
      }

      const { analyzeSkillsGap, logAIUsage } = await import('./src/lib/ai/gemini.ts');
      const profile = req.profile;

      // Flatten user skills from JSONB array
      const userSkills: string[] = (profile.skills || []).map((s: any) =>
        typeof s === 'string' ? s : s.name || s.skill || JSON.stringify(s)
      );

      const startTime = Date.now();
      const result = await analyzeSkillsGap(userSkills, jobDescriptionText);

      await logAIUsage(supabaseAdmin, {
        userId: req.user.id, feature: 'skills_gap', model: 'gemini-3-flash-preview',
        latencyMs: Date.now() - startTime, success: true,
        metadata: { score: result.score },
      });

      res.json(result);
    } catch (err: any) {
      console.error('Skills gap error:', err);
      res.status(500).json({ error: err.message || 'Failed to analyze skills gap' });
    }
  });

  // PHASE 2 — Autofill Data (for browser extension)
  app.get('/api/profile/autofill-data', authenticate, loadProfile, async (req: AuthRequest, res) => {
    const p = req.profile;
    res.json({
      fullName: p.full_name || '',
      email: p.email || '',
      phone: p.phone || '',
      currentRole: p.current_role || '',
      experience: p.experience || [],
      skills: p.skills || [],
      education: p.education || [],
      linkedinUrl: p.linkedin_url || '',
      portfolioUrl: p.portfolio_url || '',
      location: p.location || '',
      ...(p.autofill_data || {}),
    });
  });

  app.put('/api/profile/autofill-data', authenticate, async (req: AuthRequest, res) => {
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

      const { data, error } = await supabaseAdmin
        .from('profiles')
        .update(profileUpdates)
        .eq('id', req.user.id)
        .select()
        .single();

      if (error) throw error;
      res.json({ success: true, profile: data });
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'Failed to update profile' });
    }
  });

  // Generate Follow-up Email (Pro-gated)
  app.post('/api/followup/generate', authenticate, requirePro, async (req: AuthRequest, res) => {
    try {
      const { company, jobTitle, appliedDate } = req.body;
      if (!company || !jobTitle) {
        return res.status(400).json({ error: 'Missing company or jobTitle' });
      }

      const { generateFollowUp, logAIUsage } = await import('./src/lib/ai/gemini.ts');
      const startTime = Date.now();
      const followUp = await generateFollowUp({ company, jobTitle, appliedDate });
      
      await logAIUsage(supabaseAdmin, {
        userId: req.user.id, feature: 'follow_up', model: 'gemini-3-flash-preview',
        latencyMs: Date.now() - startTime, success: true,
      });

      res.json({ followUp });
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'Failed to generate follow-up' });
    }
  });

  // Supabase Auth Webhook
  app.post('/api/webhooks/supabase', (req, res) => {
    res.status(200).end();
  });

  // Vite Integration
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 ApplyJi Server running at http://localhost:${PORT}`);
  });
}

startServer().catch(console.error);
