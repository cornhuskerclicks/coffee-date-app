-- Add new fields to audits table for enhanced tracking
ALTER TABLE public.audits 
ADD COLUMN IF NOT EXISTS status text DEFAULT 'in_progress',
ADD COLUMN IF NOT EXISTS niche_id uuid REFERENCES public.niches(id),
ADD COLUMN IF NOT EXISTS industry text,
ADD COLUMN IF NOT EXISTS website_url text,
ADD COLUMN IF NOT EXISTS business_size text,
ADD COLUMN IF NOT EXISTS completion_percentage integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS completed_at timestamp with time zone,
ADD COLUMN IF NOT EXISTS ai_insights jsonb;

-- Create index on status for filtering
CREATE INDEX IF NOT EXISTS audits_status_idx ON public.audits(status);
CREATE INDEX IF NOT EXISTS audits_niche_id_idx ON public.audits(niche_id);
