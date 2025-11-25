-- Add branding and publishing fields to quiz_templates
ALTER TABLE public.quiz_templates 
ADD COLUMN IF NOT EXISTS brand_color text DEFAULT '#089fef',
ADD COLUMN IF NOT EXISTS logo_url text,
ADD COLUMN IF NOT EXISTS url_slug text,
ADD COLUMN IF NOT EXISTS cta_text text DEFAULT 'Book Your AI Readiness Audit',
ADD COLUMN IF NOT EXISTS cta_url text DEFAULT '/book-audit',
ADD COLUMN IF NOT EXISTS is_published boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS industry text,
ADD COLUMN IF NOT EXISTS goal text,
ADD COLUMN IF NOT EXISTS ghl_location_id text,
ADD COLUMN IF NOT EXISTS views integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS starts integer DEFAULT 0;

-- Add ghl_synced field to quiz_responses
ALTER TABLE public.quiz_responses
ADD COLUMN IF NOT EXISTS ghl_synced boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS ghl_contact_id text;

-- Create unique index on url_slug
CREATE UNIQUE INDEX IF NOT EXISTS quiz_templates_url_slug_idx ON public.quiz_templates(url_slug) WHERE url_slug IS NOT NULL;
