-- Add subdomain column to profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS subdomain text UNIQUE;

-- Create index for fast subdomain lookups
CREATE INDEX IF NOT EXISTS idx_profiles_subdomain ON public.profiles(subdomain);

-- Add constraint to ensure subdomain follows domain rules (lowercase, alphanumeric, hyphens)
ALTER TABLE public.profiles
ADD CONSTRAINT valid_subdomain CHECK (
  subdomain IS NULL OR subdomain ~ '^[a-z0-9]([a-z0-9-]*[a-z0-9])?$'
);
