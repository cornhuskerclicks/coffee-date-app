-- Create demo_logs table to track all demo sessions with their type
CREATE TABLE IF NOT EXISTS public.demo_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  android_id UUID NOT NULL REFERENCES public.androids(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('test', 'client')),
  niche_id UUID REFERENCES public.niches(id) ON DELETE SET NULL,
  niche_name TEXT, -- For "Other" niches not in the list
  session_id UUID REFERENCES public.sessions(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for common queries
CREATE INDEX IF NOT EXISTS demo_logs_user_id_idx ON public.demo_logs(user_id);
CREATE INDEX IF NOT EXISTS demo_logs_android_id_idx ON public.demo_logs(android_id);
CREATE INDEX IF NOT EXISTS demo_logs_type_idx ON public.demo_logs(type);
CREATE INDEX IF NOT EXISTS demo_logs_created_at_idx ON public.demo_logs(created_at DESC);

-- Enable RLS
ALTER TABLE public.demo_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY demo_logs_select_own ON public.demo_logs
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY demo_logs_insert_own ON public.demo_logs
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY demo_logs_update_own ON public.demo_logs
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY demo_logs_delete_own ON public.demo_logs
  FOR DELETE USING (auth.uid() = user_id);
