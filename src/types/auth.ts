import type { User } from '@supabase/supabase-js'
import { Request } from 'express'

export interface UserProfile {
  id: string
  full_name: string | null
  email: string | null
  phone: string | null
  subscription_tier: 'free' | 'pro' | 'enterprise'
  trial_ends_at: string | null
  google_refresh_token: string | null
  stripe_customer_id: string | null
  is_admin: boolean
  skills: string[]
  experience: unknown[]
  education: unknown[]
  current_role: string | null
  location: string | null
  linkedin_url: string | null
  portfolio_url: string | null
  autofill_data: Record<string, unknown> | null
  created_at: string
  updated_at: string
}

export interface AuthRequest extends Request {
  user?: User
  profile?: UserProfile
}
