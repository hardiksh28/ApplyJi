import express, { Router, Response } from 'express';
import { authenticate } from '../middleware/authenticate';
import type { AuthRequest } from '../middleware/authenticate';
import { getSupabaseAdmin } from '../lib/supabase/server.ts';
import { z } from 'zod';

const router = Router();

const MONTHLY_PRICE_CENTS = 999;       // $9.99
const YEARLY_PRICE_CENTS = 10190;      // $101.90

// Stripe Checkout
router.post('/stripe/create-checkout', authenticate, async (req: AuthRequest, res: Response) => {
  const supabaseAdmin = getSupabaseAdmin();
  try {
    const { interval = 'month' } = z.object({
      interval: z.enum(['month', 'year']).optional()
    }).parse(req.body);

    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('*')
      .eq('id', req.user!.id)
      .single();
    
    const stripe = (await import('stripe')).default;
    const stripeClient = new stripe(process.env.STRIPE_SECRET_KEY!);

    const amount = interval === 'year' ? YEARLY_PRICE_CENTS : MONTHLY_PRICE_CENTS;

    const session = await stripeClient.checkout.sessions.create({
      customer: profile?.stripe_customer_id || undefined,
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'usd', // Defaulting to USD as per prompt cents specification
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
      metadata: { userId: req.user!.id },
    });

    res.json({ url: session.url });
  } catch (err: any) {
    if (err instanceof z.ZodError) {
      return res.status(400).json({ error: 'Validation failed', details: err.issues });
    }
    res.status(500).json({ error: err.message });
  }
});

// Stripe Webhook
router.post('/webhooks/stripe', express.raw({ type: 'application/json' }), async (req, res) => {
  const supabaseAdmin = getSupabaseAdmin();
  const stripe = (await import('stripe')).default;
  const stripeClient = new stripe(process.env.STRIPE_SECRET_KEY!);
  const sig = req.headers['stripe-signature'] as string;
  
  let event;
  try {
    event = stripeClient.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET!);
  } catch (err: any) {
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  const session = event.data.object as any;

  switch (event.type) {
    case 'checkout.session.completed': {
      const userId = session.metadata?.userId;
      if (userId) {
        await supabaseAdmin
          .from('profiles')
          .update({ 
            subscription_tier: 'pro',
            stripe_customer_id: session.customer as string,
            stripe_subscription_id: session.subscription as string
          })
          .eq('id', userId);
      }
      break;
    }
    case 'customer.subscription.deleted': {
      const customerId = session.customer as string;
      await supabaseAdmin
        .from('profiles')
        .update({ subscription_tier: 'free' })
        .eq('stripe_customer_id', customerId);
      break;
    }
    case 'customer.subscription.updated': {
      const customerId = session.customer as string;
      const status = session.status;
      const tier = status === 'active' ? 'pro' : 'free';
      
      await supabaseAdmin
        .from('profiles')
        .update({ subscription_tier: tier })
        .eq('stripe_customer_id', customerId);
      break;
    }
  }

  res.json({ received: true });
});

// Stripe Customer Portal
router.get('/stripe/portal', authenticate, async (req: AuthRequest, res: Response) => {
  const supabaseAdmin = getSupabaseAdmin();
  try {
    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('stripe_customer_id')
      .eq('id', req.user!.id)
      .single();

    if (!profile?.stripe_customer_id) {
      return res.status(400).json({ error: 'No Stripe customer ID found' });
    }

    const stripe = (await import('stripe')).default;
    const stripeClient = new stripe(process.env.STRIPE_SECRET_KEY!);

    const session = await stripeClient.billingPortal.sessions.create({
      customer: profile.stripe_customer_id,
      return_url: `${process.env.APP_URL}/billing`,
    });

    res.json({ url: session.url });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
