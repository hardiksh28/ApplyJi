-- Migration to create company_reviews table

CREATE TABLE IF NOT EXISTS company_reviews (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references profiles(id),
  company_name text not null,
  rating int not null check (rating >= 1 and rating <= 5),
  title text,
  body text,
  interview_experience text,
  offer_received boolean default false,
  helpful_votes int default 0,
  created_at timestamptz default now()
);

-- Enable RLS
ALTER TABLE company_reviews ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Anyone can view reviews" ON company_reviews FOR SELECT USING (true);
CREATE POLICY "Users can insert own reviews" ON company_reviews FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own reviews" ON company_reviews FOR UPDATE USING (auth.uid() = user_id);
