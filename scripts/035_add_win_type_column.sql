-- Add win_type column to niche_user_state for distinguishing Revival vs Audit wins
ALTER TABLE public.niche_user_state 
ADD COLUMN IF NOT EXISTS win_type text CHECK (win_type IN ('revival', 'audit')),
ADD COLUMN IF NOT EXISTS win_completed_at timestamp with time zone;

-- Add comment for documentation
COMMENT ON COLUMN public.niche_user_state.win_type IS 'Type of win: revival (GHL Dead Lead) or audit (AI Readiness Audit)';
