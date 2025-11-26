-- Create prompt_categories table to persist custom categories
CREATE TABLE IF NOT EXISTS prompt_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, name)
);

-- Enable RLS
ALTER TABLE prompt_categories ENABLE ROW LEVEL SECURITY;

-- Policies for prompt_categories
CREATE POLICY "prompt_categories_select_own" ON prompt_categories
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "prompt_categories_insert_own" ON prompt_categories
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "prompt_categories_delete_own" ON prompt_categories
  FOR DELETE USING (auth.uid() = user_id);
