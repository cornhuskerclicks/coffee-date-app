-- Add niche_id column to ghl_connections table
ALTER TABLE public.ghl_connections 
ADD COLUMN IF NOT EXISTS niche_id uuid REFERENCES public.niches(id);

-- Get the niche_id for "Academic Specialty Schools" and update the existing connection
-- Also mark the niche as WIN in niche_user_state
DO $$
DECLARE
  v_niche_id uuid;
  v_user_id uuid;
  v_connection_id uuid;
BEGIN
  -- Get the niche ID for Academic Specialty Schools
  SELECT id INTO v_niche_id FROM public.niches WHERE niche_name = 'Academic Specialty Schools' LIMIT 1;
  
  IF v_niche_id IS NULL THEN
    RAISE NOTICE 'Niche "Academic Specialty Schools" not found';
    RETURN;
  END IF;
  
  -- Get the first GHL connection (assuming there's only one)
  SELECT id, user_id INTO v_connection_id, v_user_id FROM public.ghl_connections LIMIT 1;
  
  IF v_connection_id IS NULL THEN
    RAISE NOTICE 'No GHL connection found';
    RETURN;
  END IF;
  
  -- Update the GHL connection with the niche_id
  UPDATE public.ghl_connections 
  SET niche_id = v_niche_id, updated_at = now()
  WHERE id = v_connection_id;
  
  -- Insert or update niche_user_state to mark as WIN
  INSERT INTO public.niche_user_state (
    user_id,
    niche_id,
    status,
    research_notes_added,
    aov_calculator_completed,
    customer_profile_generated,
    messaging_prepared,
    coffee_date_completed,
    win_completed,
    ghl_sub_account_id,
    created_at,
    updated_at
  ) VALUES (
    v_user_id,
    v_niche_id,
    'Win',
    true,
    true,
    true,
    true,
    true,
    true,
    v_connection_id::text,
    now(),
    now()
  )
  ON CONFLICT (user_id, niche_id) DO UPDATE SET
    status = 'Win',
    research_notes_added = true,
    aov_calculator_completed = true,
    customer_profile_generated = true,
    messaging_prepared = true,
    coffee_date_completed = true,
    win_completed = true,
    ghl_sub_account_id = v_connection_id::text,
    updated_at = now();
    
  RAISE NOTICE 'Successfully assigned niche and marked as WIN';
END $$;
