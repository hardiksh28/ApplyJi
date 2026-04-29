-- Supabase SQL Schema for ApplyJi

-- 1. Profiles (Extends Supabase Auth)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  avatar_url TEXT,
  email TEXT UNIQUE NOT NULL,
  subscription_tier TEXT DEFAULT 'free' CHECK (subscription_tier IN ('free', 'pro', 'enterprise')),
  trial_ends_at TIMESTAMPTZ DEFAULT NOW() + INTERVAL '14 days',
  stripe_customer_id TEXT,
  google_refresh_token TEXT,
  email_sync_enabled BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Applications
CREATE TABLE IF NOT EXISTS public.applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  company_name TEXT NOT NULL,
  job_title TEXT NOT NULL,
  job_url TEXT,
  location TEXT,
  salary_range TEXT,
  status TEXT DEFAULT 'applied' CHECK (status IN ('saved', 'applied', 'interviewing', 'offered', 'rejected', 'withdrawn')),
  description TEXT,
  notes TEXT,
  applied_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, company_name, job_title)
);

-- 3. Application Activities
CREATE TABLE IF NOT EXISTS public.application_activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id UUID REFERENCES public.applications(id) ON DELETE CASCADE NOT NULL,
  activity_type TEXT NOT NULL CHECK (activity_type IN ('status_change', 'note_added', 'email_received', 'interview_scheduled', 'system_insight')),
  description TEXT NOT NULL,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Email Sync Logs
CREATE TABLE IF NOT EXISTS public.email_sync_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  sync_status TEXT CHECK (sync_status IN ('success', 'failed', 'pending')),
  emails_processed INTEGER DEFAULT 0,
  error_message TEXT,
  last_synced_message_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.application_activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_sync_logs ENABLE ROW LEVEL SECURITY;

-- Simple RLS Policies (Owners can manage their own data)
CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can manage own applications" ON public.applications 
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can view activities of own applications" ON public.application_activities 
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.applications 
      WHERE id = application_activities.application_id AND user_id = auth.uid()
    )
  );

CREATE POLICY "Users can manage own sync logs" ON public.email_sync_logs 
  FOR ALL USING (auth.uid() = user_id);

-- Update timestamp function
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers
CREATE TRIGGER set_updated_at_profiles BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE TRIGGER set_updated_at_applications BEFORE UPDATE ON public.applications FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
