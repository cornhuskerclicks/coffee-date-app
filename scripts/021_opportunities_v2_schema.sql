-- Opportunities V2: Add workflow phase data to niche_user_state

-- Add new columns for Research phase
ALTER TABLE niche_user_state
ADD COLUMN IF NOT EXISTS research_notes TEXT,
ADD COLUMN IF NOT EXISTS aov_input NUMERIC,
ADD COLUMN IF NOT EXISTS database_size_input INTEGER,
ADD COLUMN IF NOT EXISTS cpl_calculated NUMERIC,
ADD COLUMN IF NOT EXISTS cpa_calculated NUMERIC,
ADD COLUMN IF NOT EXISTS potential_retainer NUMERIC,
ADD COLUMN IF NOT EXISTS profit_split_potential NUMERIC,
ADD COLUMN IF NOT EXISTS customer_profile JSONB,
ADD COLUMN IF NOT EXISTS research_notes_added BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS aov_calculator_completed BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS customer_profile_generated BOOLEAN DEFAULT FALSE;

-- Add columns for Shortlisted phase
ALTER TABLE niche_user_state
ADD COLUMN IF NOT EXISTS messaging_scripts JSONB,
ADD COLUMN IF NOT EXISTS messaging_prepared BOOLEAN DEFAULT FALSE;

-- Add columns for Outreach phase
ALTER TABLE niche_user_state
ADD COLUMN IF NOT EXISTS outreach_start_date DATE,
ADD COLUMN IF NOT EXISTS outreach_channels JSONB,
ADD COLUMN IF NOT EXISTS outreach_messages_sent INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS outreach_notes TEXT,
ADD COLUMN IF NOT EXISTS demo_script_created BOOLEAN DEFAULT FALSE;

-- Add columns for Coffee Date phase
ALTER TABLE niche_user_state
ADD COLUMN IF NOT EXISTS demo_script TEXT,
ADD COLUMN IF NOT EXISTS coffee_date_completed BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS ghl_sub_account_id TEXT;

-- Add columns for Win phase
ALTER TABLE niche_user_state
ADD COLUMN IF NOT EXISTS active_monthly_retainer NUMERIC,
ADD COLUMN IF NOT EXISTS monthly_profit_split NUMERIC,
ADD COLUMN IF NOT EXISTS target_monthly_recurring NUMERIC,
ADD COLUMN IF NOT EXISTS win_completed BOOLEAN DEFAULT FALSE;

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_niche_user_state_status ON niche_user_state(status);
