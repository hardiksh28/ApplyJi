-- Migration to create required tables for ApplyJi

-- PROFILES
CREATE TABLE IF NOT EXISTS profiles (
  id uuid references auth.users primary key,
  email text,
  full_name text,
  phone text,
  current_role text,
  skills jsonb default '[]',
  experience jsonb default '[]',
  education jsonb default '[]',
  linkedin_url text,
  portfolio_url text,
  location text,
  autofill_data jsonb,
  google_refresh_token text,
  subscription_tier text default 'free',
  trial_ends_at timestamptz,
  stripe_customer_id text,
  stripe_subscription_id text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- APPLICATIONS
CREATE TABLE IF NOT EXISTS applications (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references profiles(id),
  company_name text not null,
  job_title text not null,
  job_url text,
  location text,
  salary_range text,
  status text default 'applied',
  description text,
  platform text,
  source text,
  applied_at timestamptz default now(),
  unique(user_id, company_name, job_title)
);

-- APPLICATION ACTIVITIES
CREATE TABLE IF NOT EXISTS application_activities (
  id uuid default gen_random_uuid() primary key,
  application_id uuid references applications(id) on delete cascade,
  activity_type text,
  description text,
  metadata jsonb,
  created_at timestamptz default now()
);

-- EMAIL SYNC LOGS
CREATE TABLE IF NOT EXISTS email_sync_logs (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references profiles(id),
  sync_status text,
  emails_processed int default 0,
  error_message text,
  created_at timestamptz default now()
);

-- GENERATED RESUMES
CREATE TABLE IF NOT EXISTS generated_resumes (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references profiles(id),
  application_id uuid references applications(id),
  job_description text,
  resume_data jsonb,
  resume_text text,
  created_at timestamptz default now()
);

-- GENERATED COVER LETTERS
CREATE TABLE IF NOT EXISTS generated_cover_letters (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references profiles(id),
  application_id uuid references applications(id),
  job_description text,
  tone text,
  cover_letter_text text,
  created_at timestamptz default now()
);

-- AI USAGE LOGS
CREATE TABLE IF NOT EXISTS ai_usage_logs (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references profiles(id),
  feature text,
  model text,
  latency_ms int,
  success boolean,
  metadata jsonb,
  created_at timestamptz default now()
);

-- JOBS
CREATE TABLE IF NOT EXISTS jobs (
  id uuid default gen_random_uuid() primary key,
  title text not null,
  company text not null,
  location text,
  description text,
  skills jsonb default '[]',
  salary_min int,
  salary_max int,
  source text,
  job_url text,
  posted_at timestamptz,
  is_active boolean default true,
  job_search_vector tsvector generated always as (to_tsvector('english', coalesce(title,'') || ' ' || coalesce(company,'') || ' ' || coalesce(description,''))) stored
);

-- Indexes
CREATE INDEX IF NOT EXISTS jobs_search_idx ON jobs USING GIN (job_search_vector);
CREATE INDEX IF NOT EXISTS jobs_skills_idx ON jobs USING GIN (skills);

-- Enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE application_activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_sync_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE generated_resumes ENABLE ROW LEVEL SECURITY;
ALTER TABLE generated_cover_letters ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_usage_logs ENABLE ROW LEVEL SECURITY;
-- jobs table is public for read, but we should protect write
ALTER TABLE jobs ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Profiles: users can read/write their own
CREATE POLICY "Users can view own profile" ON profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);

-- Applications: users can read/write their own
CREATE POLICY "Users can view own applications" ON applications FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own applications" ON applications FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own applications" ON applications FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own applications" ON applications FOR DELETE USING (auth.uid() = user_id);

-- Application Activities: users can read/write their own via application
CREATE POLICY "Users can view own activities" ON application_activities FOR SELECT USING (
  exists (select 1 from applications where id = application_id and user_id = auth.uid())
);
CREATE POLICY "Users can insert own activities" ON application_activities FOR INSERT WITH CHECK (
  exists (select 1 from applications where id = application_id and user_id = auth.uid())
);

-- Email Sync Logs: users can view own
CREATE POLICY "Users can view own sync logs" ON email_sync_logs FOR SELECT USING (auth.uid() = user_id);

-- Generated Resumes: users can view/write own
CREATE POLICY "Users can view own resumes" ON generated_resumes FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own resumes" ON generated_resumes FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Generated Cover Letters: users can view/write own
CREATE POLICY "Users can view own cover letters" ON generated_cover_letters FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own cover letters" ON generated_cover_letters FOR INSERT WITH CHECK (auth.uid() = user_id);

-- AI Usage Logs: users can view own
CREATE POLICY "Users can view own ai logs" ON ai_usage_logs FOR SELECT USING (auth.uid() = user_id);

-- Jobs: public read, admin write
CREATE POLICY "Anyone can view jobs" ON jobs FOR SELECT USING (true);
CREATE POLICY "Admins can insert jobs" ON jobs FOR INSERT WITH CHECK (
  exists (select 1 from profiles where id = auth.uid() and is_admin = true)
);

-- Trigger for new user
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, email)
  VALUES (new.id, new.email);
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
