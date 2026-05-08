-- Migration to create mentor tables

-- MENTOR PROFILES
CREATE TABLE IF NOT EXISTS mentor_profiles (
  id uuid references profiles(id) primary key,
  is_active boolean default true,
  specialties text[] default '{}',
  price_per_hour numeric default 0,
  rating numeric default 5.0,
  created_at timestamptz default now()
);

-- MENTOR BOOKINGS
CREATE TABLE IF NOT EXISTS mentor_bookings (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references profiles(id),
  mentor_id uuid references mentor_profiles(id),
  slot timestamptz not null,
  message text,
  created_at timestamptz default now()
);

-- Enable RLS
ALTER TABLE mentor_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE mentor_bookings ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Mentor Profiles: public read, admin or self write
CREATE POLICY "Anyone can view active mentors" ON mentor_profiles FOR SELECT USING (is_active = true);
CREATE POLICY "Mentors can update own profile" ON mentor_profiles FOR UPDATE USING (auth.uid() = id);

-- Mentor Bookings: users can view/write own bookings, mentors can view bookings for them
CREATE POLICY "Users can view own bookings" ON mentor_bookings FOR SELECT USING (auth.uid() = user_id OR auth.uid() = mentor_id);
CREATE POLICY "Users can insert own bookings" ON mentor_bookings FOR INSERT WITH CHECK (auth.uid() = user_id);
