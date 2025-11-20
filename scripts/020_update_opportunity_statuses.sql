-- Update niche_user_state status values to match new workflow
-- Old: 'Not Reviewed', 'Shortlisted', 'Outreach In Progress', 'Proposal Sent', 'Won', 'Dropped'
-- New: 'Not Reviewed', 'Shortlisted', 'Out Reach in Progress', 'Coffee Date Done', 'Success'

-- First, migrate existing data to new values
UPDATE niche_user_state 
SET status = CASE 
  WHEN status = 'Outreach In Progress' THEN 'Out Reach in Progress'
  WHEN status = 'Proposal Sent' THEN 'Coffee Date Done'
  WHEN status = 'Won' THEN 'Success'
  WHEN status = 'Dropped' THEN 'Not Reviewed'
  ELSE status
END;

-- Drop the existing constraint
ALTER TABLE niche_user_state 
DROP CONSTRAINT IF EXISTS niche_user_state_status_check;

-- Add new constraint with updated status values
ALTER TABLE niche_user_state 
ADD CONSTRAINT niche_user_state_status_check 
CHECK (status IN ('Not Reviewed', 'Shortlisted', 'Out Reach in Progress', 'Coffee Date Done', 'Success'));
