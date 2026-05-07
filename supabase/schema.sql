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

-- 5. Auto-create Profile Trigger
CREATE OR REPLACE FUNCTION public.handle_new_user() 
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, avatar_url)
  VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'avatar_url'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 6. Tasks
CREATE TABLE IF NOT EXISTS public.tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  completed BOOLEAN DEFAULT FALSE,
  due_date TEXT,
  priority TEXT CHECK (priority IN ('High', 'Medium', 'Low')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage own tasks" ON public.tasks FOR ALL USING (auth.uid() = user_id);
CREATE TRIGGER set_updated_at_tasks BEFORE UPDATE ON public.tasks FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- Add columns for settings
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS location TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS preferences JSONB DEFAULT '{"open_to_opportunities": true, "ghosting_detection": true}';

-- Phase 2: Profile extensions for AI features
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS skills JSONB DEFAULT '[]';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS experience JSONB DEFAULT '[]';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS education JSONB DEFAULT '[]';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS phone TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS current_role TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS linkedin_url TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS portfolio_url TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS autofill_data JSONB DEFAULT '{}';

-- 7. Generated Resumes (AI-tailored per job)
CREATE TABLE IF NOT EXISTS public.generated_resumes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  application_id UUID REFERENCES public.applications(id) ON DELETE SET NULL,
  job_description TEXT NOT NULL,
  resume_data JSONB NOT NULL, -- { summary, experience[], skills[], education[] }
  resume_text TEXT, -- plain text version
  ats_score INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.generated_resumes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage own generated resumes" ON public.generated_resumes FOR ALL USING (auth.uid() = user_id);
CREATE TRIGGER set_updated_at_generated_resumes BEFORE UPDATE ON public.generated_resumes FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- 8. Generated Cover Letters
CREATE TABLE IF NOT EXISTS public.generated_cover_letters (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  application_id UUID REFERENCES public.applications(id) ON DELETE SET NULL,
  job_description TEXT NOT NULL,
  tone TEXT NOT NULL CHECK (tone IN ('professional', 'casual', 'enthusiastic')),
  cover_letter_text TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.generated_cover_letters ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage own cover letters" ON public.generated_cover_letters FOR ALL USING (auth.uid() = user_id);
CREATE TRIGGER set_updated_at_generated_cover_letters BEFORE UPDATE ON public.generated_cover_letters FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- 9. AI Usage Logs (cost tracking)
CREATE TABLE IF NOT EXISTS public.ai_usage_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  feature TEXT NOT NULL CHECK (feature IN ('resume_generate', 'resume_analyze', 'cover_letter', 'skills_gap', 'follow_up', 'email_parse', 'job_discovery')),
  model TEXT NOT NULL,
  prompt_tokens INTEGER DEFAULT 0,
  completion_tokens INTEGER DEFAULT 0,
  total_tokens INTEGER DEFAULT 0,
  latency_ms INTEGER,
  success BOOLEAN DEFAULT TRUE,
  error_message TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.ai_usage_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own ai logs" ON public.ai_usage_logs FOR SELECT USING (auth.uid() = user_id);

-- PHASE 4: Application Intelligence

-- 12. Notifications
CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT CHECK (type IN ('follow_up', 'interview_invite', 'rejection', 'offer', 'system')),
  is_read BOOLEAN DEFAULT FALSE,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage own notifications" ON public.notifications FOR ALL USING (auth.uid() = user_id);

-- 13. Reminders
CREATE TABLE IF NOT EXISTS public.reminders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  application_id UUID REFERENCES public.applications(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  due_at TIMESTAMPTZ NOT NULL,
  is_completed BOOLEAN DEFAULT FALSE,
  type TEXT CHECK (type IN ('follow_up', 'prep', 'deadline')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.reminders ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage own reminders" ON public.reminders FOR ALL USING (auth.uid() = user_id);

-- Extensions for Application Intelligence
ALTER TABLE public.applications ADD COLUMN IF NOT EXISTS interview_prep_data JSONB DEFAULT '{}';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS notification_settings JSONB DEFAULT '{"email": true, "browser": true, "follow_ups": true}';

-- Trigger to auto-create follow-up reminder after applying
CREATE OR REPLACE FUNCTION public.schedule_follow_up_reminder()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'applied' AND (OLD.status IS NULL OR OLD.status != 'applied') THEN
    INSERT INTO public.reminders (user_id, application_id, title, description, due_at, type)
    VALUES (
      NEW.user_id,
      NEW.id,
      'Follow up: ' || NEW.company_name,
      'It has been 7 days since you applied. Consider sending a polite follow-up.',
      NOW() + INTERVAL '7 days',
      'follow_up'
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_follow_up_on_apply
AFTER INSERT OR UPDATE ON public.applications
FOR EACH ROW EXECUTE FUNCTION public.schedule_follow_up_reminder();

-- PHASE 3: Job Discovery & One-Click Apply

-- 10. Aggregated Jobs
CREATE TABLE IF NOT EXISTS public.jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  company TEXT NOT NULL,
  location TEXT,
  salary TEXT,
  salary_min INTEGER,
  salary_max INTEGER,
  description TEXT,
  skills JSONB DEFAULT '[]', -- Array of skill strings
  source TEXT NOT NULL, -- 'linkedin', 'naukri', 'internshala', 'foundit'
  source_url TEXT UNIQUE NOT NULL,
  posted_at TIMESTAMPTZ,
  fetched_at TIMESTAMPTZ DEFAULT NOW(),
  is_active BOOLEAN DEFAULT TRUE,
  job_search_vector tsvector GENERATED ALWAYS AS (
    to_tsvector('english', title || ' ' || company || ' ' || coalesce(description, ''))
  ) STORED,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_jobs_search_vector ON public.jobs USING GIN(job_search_vector);
CREATE INDEX IF NOT EXISTS idx_jobs_skills ON public.jobs USING GIN(skills);
CREATE INDEX IF NOT EXISTS idx_jobs_posted_at ON public.jobs(posted_at DESC);

ALTER TABLE public.jobs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view active jobs" ON public.jobs FOR SELECT USING (is_active = TRUE);

-- 11. Auto-Apply Logs
CREATE TABLE IF NOT EXISTS public.auto_apply_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  job_id UUID REFERENCES public.jobs(id) ON DELETE CASCADE NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'success', 'failed', 'manual_redirect')),
  method TEXT CHECK (method IN ('auto', 'manual')),
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.auto_apply_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own apply logs" ON public.auto_apply_logs FOR SELECT USING (auth.uid() = user_id);

-- Profile extensions for Discovery
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS preferred_role TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS preferred_location TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS target_salary_min INTEGER;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS target_salary_max INTEGER;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS auto_apply_count_today INTEGER DEFAULT 0;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS last_auto_apply_reset TIMESTAMPTZ DEFAULT NOW();

-- Function to reset daily auto-apply counter
CREATE OR REPLACE FUNCTION public.reset_daily_auto_apply() 
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.last_auto_apply_reset < CURRENT_DATE THEN
    NEW.auto_apply_count_today = 0;
    NEW.last_auto_apply_reset = NOW();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_reset_daily_apply
BEFORE UPDATE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.reset_daily_auto_apply();

-- Admin Job Stats Function
CREATE OR REPLACE FUNCTION public.get_job_stats()
RETURNS TABLE (
  source TEXT,
  job_count BIGINT,
  last_fetch TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    jobs.source, 
    COUNT(jobs.id) as job_count, 
    MAX(jobs.fetched_at) as last_fetch
  FROM public.jobs
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- PHASE 6: Community & Growth

-- 14. Referrals
CREATE TABLE IF NOT EXISTS public.referrals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    referrer_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    referee_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'rewarded', 'expired')),
    reward_granted_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(referee_id)
);

ALTER TABLE public.referrals ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own referrals" ON public.referrals FOR SELECT USING (auth.uid() = referrer_id OR auth.uid() = referee_id);

-- Profile extensions for Referrals
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS referral_code TEXT UNIQUE;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS referred_by UUID REFERENCES public.profiles(id);
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS subscription_end_date TIMESTAMPTZ;

-- Generate Referral Code Function
CREATE OR REPLACE FUNCTION public.generate_referral_code() 
RETURNS TRIGGER AS $$
DECLARE
  new_code TEXT;
  done BOOLEAN DEFAULT FALSE;
BEGIN
  IF NEW.referral_code IS NOT NULL THEN
    RETURN NEW;
  END IF;

  WHILE NOT done LOOP
    new_code := upper(substring(md5(random()::text) from 1 for 8));
    BEGIN
      NEW.referral_code := new_code;
      done := TRUE;
    EXCEPTION WHEN unique_violation THEN
      done := FALSE;
    END;
  END LOOP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_generate_referral_code
BEFORE INSERT ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.generate_referral_code();

-- 15. Company Reviews
CREATE TABLE IF NOT EXISTS public.company_reviews (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    company_name TEXT NOT NULL,
    rating INTEGER CHECK (rating >= 1 AND rating <= 5),
    title TEXT NOT NULL,
    body TEXT NOT NULL,
    interview_experience TEXT,
    offer_received BOOLEAN DEFAULT FALSE,
    helpful_votes INTEGER DEFAULT 0,
    is_flagged BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.company_reviews ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view reviews" ON public.company_reviews FOR SELECT USING (is_flagged = FALSE);
CREATE POLICY "Users can manage own reviews" ON public.company_reviews FOR ALL USING (auth.uid() = user_id);

-- Review Votes
CREATE TABLE IF NOT EXISTS public.review_votes (
    review_id UUID REFERENCES public.company_reviews(id) ON DELETE CASCADE,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    PRIMARY KEY (review_id, user_id)
);

ALTER TABLE public.review_votes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage own votes" ON public.review_votes FOR ALL USING (auth.uid() = user_id);

-- 16. Mentor Marketplace
CREATE TABLE IF NOT EXISTS public.mentor_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE UNIQUE,
    headline TEXT NOT NULL,
    specialties JSONB DEFAULT '[]',
    price_per_hour NUMERIC(10, 2) NOT NULL,
    currency TEXT DEFAULT 'INR',
    calendar_url TEXT NOT NULL,
    bio TEXT NOT NULL,
    rating NUMERIC(3, 2) DEFAULT 0.0,
    review_count INTEGER DEFAULT 0,
    verified_at TIMESTAMPTZ,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.mentor_profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view active mentors" ON public.mentor_profiles FOR SELECT USING (is_active = TRUE);
CREATE POLICY "Mentors can manage own profile" ON public.mentor_profiles FOR ALL USING (auth.uid() = user_id);

-- 17. Mentor Bookings
CREATE TABLE IF NOT EXISTS public.mentor_bookings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    mentor_id UUID REFERENCES public.mentor_profiles(id) ON DELETE CASCADE,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    slot TIMESTAMPTZ NOT NULL,
    message TEXT,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'cancelled', 'completed')),
    payment_status TEXT DEFAULT 'pending',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.mentor_bookings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own bookings" ON public.mentor_bookings FOR SELECT USING (auth.uid() = user_id OR auth.uid() IN (SELECT user_id FROM public.mentor_profiles WHERE id = mentor_id));
CREATE POLICY "Users can create bookings" ON public.mentor_bookings FOR INSERT WITH CHECK (auth.uid() = user_id);

-- RPC for incrementing helpful votes
CREATE OR REPLACE FUNCTION public.increment_helpful_votes(row_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE public.company_reviews
  SET helpful_votes = helpful_votes + 1
  WHERE id = row_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


