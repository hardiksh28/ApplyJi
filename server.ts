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

  // Check Trial/Subscription Status
  const checkSubscription = async (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) return res.status(401).json({ error: 'Unauthorized' });

    try {
      const { data: profile, error } = await supabaseAdmin
        .from('profiles')
        .select('*')
        .eq('id', req.user.id)
        .single();

      if (error || !profile) throw error;

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
    } catch (err) {
      return res.status(500).json({ error: 'Internal server error checking subscription' });
    }
  };

  // --- API Routes ---

  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', service: 'ApplyJi API' });
  });

  // Protected route example
  app.get('/api/user/profile', authenticate, async (req: AuthRequest, res) => {
    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('*')
      .eq('id', req.user.id)
      .single();
    res.json(profile);
  });

  // Gmail Sync Route (Protected)
  app.post('/api/sync/gmail', authenticate, checkSubscription, async (req: AuthRequest, res) => {
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

  // Supabase Auth Webhook
  app.post('/api/webhooks/supabase', (req, res) => {
    res.status(200).end();
  });

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

  // Updated Stripe Webhook
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
