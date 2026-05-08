import { Response, NextFunction } from 'express';
import { getSupabaseAdmin } from '../lib/supabase/server.ts';
import { AuthRequest } from '../types/auth.ts';

export { AuthRequest };

export const authenticate = async (req: AuthRequest, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const token = authHeader.split(' ')[1];
  const supabaseAdmin = getSupabaseAdmin();
  
  try {
    const { data: { user }, error } = await supabaseAdmin.auth.getUser(token);
    if (error || !user) throw error;
    req.user = user;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid token' });
  }
};
