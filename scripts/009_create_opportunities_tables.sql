-- Create industries table
CREATE TABLE IF NOT EXISTS public.industries (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create niches table
CREATE TABLE IF NOT EXISTS public.niches (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  industry_id UUID NOT NULL REFERENCES industries(id) ON DELETE CASCADE,
  niche_name TEXT NOT NULL,
  -- Fixed scale constraint to include 'National/Local' instead of truncated 'National/Loca'
  scale TEXT NOT NULL CHECK (scale IN ('Local', 'National', 'Global', 'National/Local')),
  database_size TEXT NOT NULL CHECK (database_size IN ('Small', 'Medium', 'Big')),
  default_priority INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create niche_user_state table for per-user customization
CREATE TABLE IF NOT EXISTS public.niche_user_state (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  niche_id UUID NOT NULL REFERENCES niches(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  is_favourite BOOLEAN DEFAULT FALSE,
  status TEXT DEFAULT 'Not Reviewed' CHECK (status IN ('Not Reviewed', 'Shortlisted', 'Outreach In Progress', 'Proposal Sent', 'Won', 'Dropped')),
  notes TEXT,
  expected_monthly_value INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(niche_id, user_id)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_niches_industry_id ON niches(industry_id);
CREATE INDEX IF NOT EXISTS idx_niche_user_state_user_id ON niche_user_state(user_id);
CREATE INDEX IF NOT EXISTS idx_niche_user_state_niche_id ON niche_user_state(niche_id);

-- Enable RLS
ALTER TABLE industries ENABLE ROW LEVEL SECURITY;
ALTER TABLE niches ENABLE ROW LEVEL SECURITY;
ALTER TABLE niche_user_state ENABLE ROW LEVEL SECURITY;

-- RLS Policies for industries (public read)
CREATE POLICY industries_select_all ON industries FOR SELECT USING (true);

-- RLS Policies for niches (public read)
CREATE POLICY niches_select_all ON niches FOR SELECT USING (true);

-- RLS Policies for niche_user_state (users can only see/edit their own)
CREATE POLICY niche_user_state_select_own ON niche_user_state 
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY niche_user_state_insert_own ON niche_user_state 
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY niche_user_state_update_own ON niche_user_state 
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY niche_user_state_delete_own ON niche_user_state 
  FOR DELETE USING (auth.uid() = user_id);
