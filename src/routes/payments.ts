import express, { Router, Response } from 'express';
import { authenticate, AuthRequest } from '../middleware/authenticate';
import { loadProfile } from '../middleware/checkSubscription';
import { getSupabaseAdmin } from '../lib/supabase/server.ts';
import { z } from 'zod';
import * as validators from '../lib/validators.ts';

const router = Router();

// Stripe Checkout
// Stripe Checkout
router.post('/stripe/create-checkout', authenticate, async (req: AuthRequest, res: Response) => {
  const supabaseAdmin = getSupabaseAdmin();
  try {
    const { interval = 'month', currency = 'inr' } = validators.createCheckoutSchema.parse(req.body);
    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('*')
      .eq('id', req.user!.id)
      .single();
    
    const stripe = (await import('stripe')).default;
    const stripeClient = new stripe(process.env.STRIPE_SECRET_KEY!);

    let amount;
    if (currency === 'inr') {
      amount = interval === 'year' ? 499900 : 49900;
    } else {
      amount = interval === 'year' ? 9180 : 900;
    }

    const session = await stripeClient.checkout.sessions.create({
      customer: profile?.stripe_customer_id || undefined,
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: currency,
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
// NOTE: This route needs raw body. If express.json() is used globally, this might fail.
// You should mount this router BEFORE express.json() in server.ts or use a verify function.
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

  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object as any;
      const userId = session.metadata.userId;
      
      await supabaseAdmin
        .from('profiles')
        .update({ 
          subscription_tier: 'pro',
          stripe_customer_id: session.customer as string
        })
        .eq('id', userId);
      break;
    }
    case 'customer.subscription.deleted': {
      const subscription = event.data.object as any;
      const customerId = subscription.customer as string;
      
      await supabaseAdmin
        .from('profiles')
        .update({ subscription_tier: 'free' })
        .eq('stripe_customer_id', customerId);
      break;
    }
    case 'customer.subscription.updated': {
      const subscription = event.data.object as any;
      const customerId = subscription.customer as string;
      const status = subscription.status;
      
      const tier = status === 'active' ? 'pro' : 'free';
      
      await supabaseAdmin
        .from('profiles')
        .update({ subscription_tier: tier })
        .eq('stripe_customer_id', customerId);
      break;
    }
    case 'invoice.payment_failed': {
      const invoice = event.data.object as any;
      console.log(`Payment failed for invoice ${invoice.id}`);
      break;
    }
  }

  res.json({ received: true });
});

export default router;
