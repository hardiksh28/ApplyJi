import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import express from 'express';
import paymentsRouter from '../../routes/payments';
import { getSupabaseAdmin } from '../../lib/supabase/server';

vi.mock('../../lib/supabase/server', () => ({
  getSupabaseAdmin: vi.fn(),
}));

// Mock stripe
const mockCreate = vi.fn();
const mockConstructEvent = vi.fn();

vi.mock('stripe', () => {
  return {
    default: vi.fn().mockImplementation(() => ({
      checkout: {
        sessions: {
          create: mockCreate,
        },
      },
      webhooks: {
        constructEvent: mockConstructEvent,
      },
    })),
  };
});

describe('payments routes', () => {
  let app: express.Express;
  const mockFrom = vi.fn();
  const mockUpdate = vi.fn();
  const mockEq = vi.fn();
  const mockSelect = vi.fn();
  const mockSingle = vi.fn();
  const mockGetUser = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    app = express();
    app.use(express.json());
    
    // Mock Supabase Admin
    (getSupabaseAdmin as any).mockReturnValue({
      auth: {
        getUser: mockGetUser,
      },
      from: mockFrom,
    });

    mockFrom.mockReturnValue({
      update: mockUpdate,
      select: mockSelect,
    });
    mockUpdate.mockReturnValue({
      eq: mockEq,
    });
    mockEq.mockReturnValue({
      select: mockSelect,
      single: mockSingle,
    });
    mockSelect.mockReturnValue({
      eq: mockEq,
      single: mockSingle,
    });
    mockSingle.mockResolvedValue({ data: { id: 'user-123', stripe_customer_id: 'cus_123' }, error: null });

    // Mock authenticate middleware behavior
    mockGetUser.mockResolvedValue({ data: { user: { id: 'user-123' } }, error: null });

    app.use('/api', paymentsRouter);
    
    process.env.STRIPE_SECRET_KEY = 'test_secret';
    process.env.STRIPE_WEBHOOK_SECRET = 'test_webhook_secret';
  });

  it('should create Stripe checkout session and return URL', async () => {
    mockCreate.mockResolvedValueOnce({ url: 'https://checkout.stripe.com/test' });

    const response = await request(app)
      .post('/api/stripe/create-checkout')
      .set('Authorization', 'Bearer valid-token')
      .send({ interval: 'month', currency: 'inr' });

    expect(response.status).toBe(200);
    expect(response.body.url).toBe('https://checkout.stripe.com/test');
    expect(mockCreate).toHaveBeenCalled();
  });

  it('should handle Stripe webhook for checkout completed', async () => {
    mockConstructEvent.mockReturnValueOnce({
      type: 'checkout.session.completed',
      data: {
        object: {
          customer: 'cus_123',
          metadata: { userId: 'user-123' },
        },
      },
    });

    const response = await request(app)
      .post('/api/webhooks/stripe')
      .set('stripe-signature', 'test_sig')
      .send({ id: 'evt_123' }); // Dummy body

    expect(response.status).toBe(200);
    expect(response.body.received).toBe(true);
    expect(mockUpdate).toHaveBeenCalledWith({
      subscription_tier: 'pro',
      stripe_customer_id: 'cus_123',
    });
  });

  it('should handle Stripe webhook for subscription deleted', async () => {
    mockConstructEvent.mockReturnValueOnce({
      type: 'customer.subscription.deleted',
      data: {
        object: {
          customer: 'cus_123',
        },
      },
    });

    const response = await request(app)
      .post('/api/webhooks/stripe')
      .set('stripe-signature', 'test_sig')
      .send({ id: 'evt_123' });

    expect(response.status).toBe(200);
    expect(response.body.received).toBe(true);
    expect(mockUpdate).toHaveBeenCalledWith({
      subscription_tier: 'free',
    });
  });
});
