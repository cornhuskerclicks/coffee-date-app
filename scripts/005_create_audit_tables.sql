-- Create audits table to store AI readiness audits
CREATE TABLE IF NOT EXISTS audits (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  responses JSONB NOT NULL DEFAULT '{}'::jsonb
);

-- Enable RLS
ALTER TABLE audits ENABLE ROW LEVEL SECURITY;

-- RLS Policies for audits
CREATE POLICY audits_select_own ON audits
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY audits_insert_own ON audits
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY audits_update_own ON audits
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY audits_delete_own ON audits
  FOR DELETE USING (auth.uid() = user_id);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS audits_user_id_idx ON audits(user_id);
CREATE INDEX IF NOT EXISTS audits_created_at_idx ON audits(created_at DESC);
