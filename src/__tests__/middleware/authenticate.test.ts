import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import express from 'express';
import { authenticate } from '../../middleware/authenticate';
import { getSupabaseAdmin } from '../../lib/supabase/server';

vi.mock('../../lib/supabase/server', () => ({
  getSupabaseAdmin: vi.fn(),
}));

describe('authenticate middleware', () => {
  let app: express.Express;
  const mockGetUser = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    app = express();
    app.use(express.json());
    
    (getSupabaseAdmin as any).mockReturnValue({
      auth: {
        getUser: mockGetUser,
      },
    });

    app.get('/test', authenticate, (req: any, res: express.Response) => {
      res.status(200).json({ user: req.user });
    });
  });

  it('should return 401 if Authorization header is missing', async () => {
    const response = await request(app).get('/test');
    expect(response.status).toBe(401);
    expect(response.body.error).toBe('Unauthorized');
  });

  it('should return 401 if token is malformed', async () => {
    const response = await request(app)
      .get('/test')
      .set('Authorization', 'InvalidToken');
    expect(response.status).toBe(401);
    expect(response.body.error).toBe('Unauthorized');
  });

  it('should return 401 if token is invalid', async () => {
    mockGetUser.mockResolvedValueOnce({ data: { user: null }, error: new Error('Invalid token') });

    const response = await request(app)
      .get('/test')
      .set('Authorization', 'Bearer invalid-token');
    expect(response.status).toBe(401);
    expect(response.body.error).toBe('Invalid token');
  });

  it('should set req.user and call next() for valid token', async () => {
    const mockUser = { id: 'user-123', email: 'test@example.com' };
    mockGetUser.mockResolvedValueOnce({ data: { user: mockUser }, error: null });

    const response = await request(app)
      .get('/test')
      .set('Authorization', 'Bearer valid-token');
    expect(response.status).toBe(200);
    expect(response.body.user).toEqual(mockUser);
    expect(mockGetUser).toHaveBeenCalledWith('valid-token');
  });
});
