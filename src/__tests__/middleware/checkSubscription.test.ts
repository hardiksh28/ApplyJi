import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import express from 'express';
import { checkSubscription } from '../../middleware/checkSubscription';

describe('checkSubscription middleware', () => {
  let app: express.Express;

  beforeEach(() => {
    app = express();
    app.use(express.json());
  });

  it('should return 401 if profile is missing', async () => {
    app.get('/test', checkSubscription, (req, res) => {
      res.status(200).json({ success: true });
    });

    const response = await request(app).get('/test');
    expect(response.status).toBe(401);
    expect(response.body.error).toBe('Profile not loaded');
  });

  it('should return 403 if trial is expired and user is not paid', async () => {
    const pastDate = new Date();
    pastDate.setDate(pastDate.getDate() - 1);

    app.get('/test', (req: any, res, next) => {
      req.profile = {
        trial_ends_at: pastDate.toISOString(),
        subscription_tier: 'free',
      };
      next();
    }, checkSubscription, (req, res) => {
      res.status(200).json({ success: true });
    });

    const response = await request(app).get('/test');
    expect(response.status).toBe(403);
    expect(response.body.code).toBe('TRIAL_EXPIRED');
  });

  it('should pass through if trial is active', async () => {
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 1);

    app.get('/test', (req: any, res, next) => {
      req.profile = {
        trial_ends_at: futureDate.toISOString(),
        subscription_tier: 'free',
      };
      next();
    }, checkSubscription, (req, res) => {
      res.status(200).json({ success: true });
    });

    const response = await request(app).get('/test');
    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
  });

  it('should pass through if user has pro subscription even if trial expired', async () => {
    const pastDate = new Date();
    pastDate.setDate(pastDate.getDate() - 1);

    app.get('/test', (req: any, res, next) => {
      req.profile = {
        trial_ends_at: pastDate.toISOString(),
        subscription_tier: 'pro',
      };
      next();
    }, checkSubscription, (req, res) => {
      res.status(200).json({ success: true });
    });

    const response = await request(app).get('/test');
    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
  });
});
