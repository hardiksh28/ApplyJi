import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';
import { getSupabaseAdmin } from './src/lib/supabase/server.ts';

// Import routers
import applicationsRouter from './src/routes/applications.ts';
import jobsRouter from './src/routes/jobs.ts';
import paymentsRouter from './src/routes/payments.ts';
import aiRouter from './src/routes/ai.ts';
import authRouter from './src/routes/auth.ts';

// Import middlewares
import { authenticate, AuthRequest } from './src/middleware/authenticate.ts';
import { requirePro, loadProfile } from './src/middleware/checkSubscription.ts';

const __filename = fileURLToPath(import.meta.url);
// const __dirname = path.dirname(__filename);

async function startServer() {
  if (process.env.NODE_ENV === 'production' && !process.env.APP_URL) {
    throw new Error('APP_URL is required in production environment');
  }

  const app = express();
  const PORT = process.env.PORT || 3000;
  const supabaseAdmin = getSupabaseAdmin();

  // Basic Middleware
  app!.use(helmet({
    contentSecurityPolicy: false, // Required for Vite/AI Studio preview
  }));
  app!.use(cors({
    origin: process.env.APP_URL || 'http://localhost:3000',
    credentials: true,
    methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  }));
  app!.use(morgan('dev'));
  app!.use(express.json());

  // Mount routers
  app!.use('/api', applicationsRouter);
  app!.use('/api', jobsRouter);
  app!.use('/api', paymentsRouter);
  app!.use('/api', aiRouter);
  app!.use('/api', authRouter);

  // --- Middlewares ---


  // --- API Routes ---

  app!.get('/api/health', (req, res) => {
    res.json({ status: 'ok', service: 'ApplyJi API' });
  });

  // Generate Google OAuth URL for connecting Gmail
  app!.get('/api/auth/google', async (req, res) => {
    try {
      const token = (req.query.token as string) || req.headers.authorization?.split(' ')[1];
      if (!token) {
        return res.status(401).json({ error: 'Unauthorized: No token provided' });
      }

      const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);
      if (authError || !user) {
        return res.status(401).json({ error: 'Unauthorized: Invalid token' });
      }

      const { google } = await import('googleapis');
      const oauth2Client = new google.auth.OAuth2(
        process.env.GOOGLE_CLIENT_ID,
        process.env.GOOGLE_CLIENT_SECRET,
        process.env.GOOGLE_REDIRECT_URI
      );

      // Encode the user's JWT in the state so we know who to associate after redirect
      const state = Buffer.from(JSON.stringify({
        userId: user.id,
        token: token,
      })).toString('base64url');

      const authUrl = oauth2Client.generateAuthUrl({
        access_type: 'offline',
        prompt: 'consent',
        scope: [
          'openid',
          'email',
          'profile',
          'https://www.googleapis.com/auth/gmail.readonly',
        ],
        state,
      });

      res.redirect(authUrl);
    } catch (err: any) {
      console.error('Google connect error:', err);
      res.status(500).json({ error: 'Failed to generate Google OAuth URL' });
    }
  });

  // Google OAuth callback — exchanges code for tokens, stores refresh_token
  app!.get('/api/auth/google/callback', async (req, res) => {
    try {
      const { code, state } = req.query;
      if (!code || !state) {
        return res.redirect(`${process.env.APP_URL || 'http://localhost:3000'}/settings?gmail=error&reason=missing_params`);
      }

      // Decode user info from state
      let stateData: { userId: string; token: string };
      try {
        stateData = JSON.parse(Buffer.from(state as string, 'base64url').toString());
      } catch {
        return res.redirect(`${process.env.APP_URL || 'http://localhost:3000'}/settings?gmail=error&reason=invalid_state`);
      }

      // Verify the user's token is still valid
      const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(stateData.token);
      if (authError || !user || user.id !== stateData.userId) {
        return res.redirect(`${process.env.APP_URL || 'http://localhost:3000'}/settings?gmail=error&reason=auth_failed`);
      }

      // Exchange authorization code for tokens
      const { google } = await import('googleapis');
      const oauth2Client = new google.auth.OAuth2(
        process.env.GOOGLE_CLIENT_ID,
        process.env.GOOGLE_CLIENT_SECRET,
        process.env.GOOGLE_REDIRECT_URI
      );

      const { tokens } = await oauth2Client.getToken(code as string);

      if (!tokens.refresh_token) {
        console.warn('No refresh_token received from Google. User may need to revoke access and reconnect.');
        return res.redirect(`${process.env.APP_URL || 'http://localhost:3000'}/settings?gmail=error&reason=no_refresh_token`);
      }

      // Save refresh_token to the user's profile
      const { error: updateError } = await supabaseAdmin
        .from('profiles')
        .update({
          google_refresh_token: tokens.refresh_token,
          gmail_connected_at: new Date().toISOString(),
        })
        .eq('id', user.id);

      if (updateError) {
        console.error('Failed to save Google refresh token:', updateError);
        return res.redirect(`${process.env.APP_URL || 'http://localhost:3000'}/settings?gmail=error&reason=save_failed`);
      }

      console.log(`✅ Gmail connected for user ${user.id}`);
      res.redirect(`${process.env.APP_URL || 'http://localhost:3000'}/dashboard?gmail=connected`);
    } catch (err: any) {
      console.error('Google callback error:', err);
      res.redirect(`${process.env.APP_URL || 'http://localhost:3000'}/settings?gmail=error&reason=unknown`);
    }
  });

  // Disconnect Google/Gmail
  app!.post('/api/auth/google/disconnect', authenticate, async (req: AuthRequest, res) => {
    try {
      const { error } = await supabaseAdmin
        .from('profiles')
        .update({
          google_refresh_token: null,
          gmail_connected_at: null,
        })
        .eq('id', req.user!.id);

      if (error) throw error;

      res.json({ success: true, message: 'Gmail disconnected successfully' });
    } catch (err: any) {
      console.error('Google disconnect error:', err);
      res.status(500).json({ error: 'Failed to disconnect Gmail' });
    }
  });







  // ============ AI FEATURES (Pro-gated) ============

  const syncRateLimiter = rateLimit({
    windowMs: 10 * 60 * 1000, // 10 minutes
    max: 3,
    message: { error: 'Gmail sync is limited to 3 times per 10 minutes.', code: 'RATE_LIMITED' },
  });

  // Gmail Sync Route (Protected + Pro Required)
  app!.post('/api/sync/gmail', authenticate, syncRateLimiter, loadProfile, requirePro, async (req: AuthRequest, res) => {
    try {
      const { data: profile, error: profileError } = await supabaseAdmin
        .from('profiles')
        .select('google_refresh_token')
        .eq('id', req.user!.id)
        .single();

      if (profileError || !profile?.google_refresh_token) {
        return res.status(400).json({ error: 'Google account not connected or refresh token missing' });
      }

      const { getGmailClient, fetchEmails, getEmailContent } = await import('./src/lib/gmail-service.ts');
      const { parseJobEmail } = await import('./src/lib/ai/gemini.ts');

      const gmail = await getGmailClient(profile.google_refresh_token, async (tokens) => {
        if (tokens.refresh_token) {
          console.log('Refreshing Google token for user:', req.user!.id);
          await supabaseAdmin
            .from('profiles')
            .update({ google_refresh_token: tokens.refresh_token })
            .eq('id', req.user!.id);
        }
      });
      
      // Filter for application keywords
      const query = 'newer_than:30d ("thank you for applying" OR "application received" OR "application for" OR "position at" OR "successfully applied" OR "आपका आवेदन" OR "internshala" OR "naukri" OR "unstop" OR "wellfound")';
      const messages = await fetchEmails(gmail, query);

      const results = [];
      // Processing up to 20 emails per sync
      for (const msg of messages.slice(0, 20)) {
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
              user_id: req.user!.id,
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
              application_id: app!.id,
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
        user_id: req.user!.id,
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
        user_id: req.user!.id,
        sync_status: 'failed',
        error_message: err.message,
      });

      res.status(500).json({ error: 'Sync failed', details: err.message });
    }
  });





  // PHASE 6: Community & Growth Endpoints

  // 10. Referral Stats
  app!.get('/api/referrals/:userId', authenticate, async (req: AuthRequest, res) => {
    try {
      const { data: profile } = await supabaseAdmin.from('profiles').select('referral_code').eq('id', req.params.userId).single();
      const { data: referrals } = await supabaseAdmin.from('referrals').select('*').eq('referrer_id', req.params.userId);
      
      const totalReferrals = referrals?.length || 0;
      const earnedRewards = referrals?.filter(r => r.status === 'rewarded').length || 0;
      const pendingRewards = referrals?.filter(r => r.status === 'pending').length || 0;

      res.json({
        code: profile?.referral_code,
        referralUrl: `https://applyji.in/ref/${profile?.referral_code}`,
        totalReferrals,
        earnedRewards,
        pendingRewards
      });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // 11. Company Reviews
  const PROFANITY_LIST = ['badword1', 'badword2']; // Simplified list
  const hasProfanity = (text: string) => PROFANITY_LIST.some(word => text.toLowerCase().includes(word));

  app!.get('/api/companies/:name/reviews', async (req, res) => {
    try {
      const { data, error } = await supabaseAdmin
        .from('company_reviews')
        .select('*, profiles(full_name, avatar_url)')
        .ilike('company_name', req.params.name)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      res.json(data);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app!.post('/api/companies/reviews', authenticate, async (req: AuthRequest, res) => {
    try {
      const { companyName, rating, title, body, interviewExperience, offerReceived } = req.body;
      
      if (hasProfanity(body) || hasProfanity(title)) {
        return res.status(400).json({ error: 'Review contains inappropriate language.' });
      }

      // Check if user already reviewed this company
      const { data: existing } = await supabaseAdmin
        .from('company_reviews')
        .select('id')
        .eq('user_id', req.user!.id)
        .ilike('company_name', companyName)
        .single();

      if (existing) return res.status(400).json({ error: 'You have already reviewed this company.' });

      const { data, error } = await supabaseAdmin
        .from('company_reviews')
        .insert({
          user_id: req.user!.id,
          company_name: companyName,
          rating,
          title,
          body,
          interview_experience: interviewExperience,
          offer_received: offerReceived
        })
        .select()
        .single();

      if (error) throw error;
      res.json(data);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app!.post('/api/companies/reviews/:id/helpful', authenticate, async (req: AuthRequest, res) => {
    try {
      const { error: voteError } = await supabaseAdmin
        .from('review_votes')
        .insert({ review_id: req.params.id, user_id: req.user!.id });

      if (voteError) {
        if (voteError.code === '23505') return res.status(400).json({ error: 'Already voted.' });
        throw voteError;
      }

      await supabaseAdmin.rpc('increment_helpful_votes', { row_id: req.params.id });
      res.json({ success: true });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // 12. Mentor Marketplace
  app!.get('/api/mentors', async (req, res) => {
    try {
      const { specialty, maxPrice } = req.query;
      let query = supabaseAdmin.from('mentor_profiles').select('*, profiles(full_name, avatar_url)').eq('is_active', true);
      
      if (specialty) query = query.contains('specialties', [specialty]);
      if (maxPrice) query = query.lte('price_per_hour', maxPrice);

      const { data, error } = await query.order('rating', { ascending: false });
      if (error) {
        console.error('Error fetching mentors (falling back to empty list):', error.message);
        return res.json([]);
      }
      res.json(data);
    } catch (err: any) {
      console.error('Unexpected error in /api/mentors:', err);
      res.status(500).json({ error: err.message });
    }
  });

  app!.post('/api/bookings', authenticate, async (req: AuthRequest, res) => {
    try {
      const { mentorId, slot, message } = req.body;
      const { data, error } = await supabaseAdmin
        .from('mentor_bookings')
        .insert({
          user_id: req.user!.id,
          mentor_id: mentorId,
          slot,
          message
        })
        .select()
        .single();

      if (error) throw error;
      res.json(data);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Supabase Auth Webhook
  app!.post('/api/webhooks/supabase', (req, res) => {
    res.status(200).end();
  });

  // Vite Integration
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app!.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app!.use(express.static(distPath));
    app!.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app!.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 ApplyJi Server running at http://localhost:${PORT}`);
  });
}

startServer().catch(console.error);
