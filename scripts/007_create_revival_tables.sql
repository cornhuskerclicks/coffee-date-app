-- Create table for GHL connections
CREATE TABLE IF NOT EXISTS ghl_connections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  api_key TEXT NOT NULL,
  location_id TEXT,
  account_name TEXT,
  connected_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_synced_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create table for campaigns synced from GHL
CREATE TABLE IF NOT EXISTS revival_campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  ghl_connection_id UUID REFERENCES ghl_connections(id) ON DELETE CASCADE,
  ghl_campaign_id TEXT,
  name TEXT NOT NULL,
  status TEXT,
  metrics JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  synced_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create table for conversations synced from GHL
CREATE TABLE IF NOT EXISTS revival_conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  ghl_connection_id UUID REFERENCES ghl_connections(id) ON DELETE CASCADE,
  campaign_id UUID REFERENCES revival_campaigns(id) ON DELETE CASCADE,
  ghl_conversation_id TEXT,
  contact_name TEXT,
  contact_email TEXT,
  contact_phone TEXT,
  last_message_at TIMESTAMP WITH TIME ZONE,
  messages JSONB DEFAULT '[]',
  status TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  synced_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE ghl_connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE revival_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE revival_conversations ENABLE ROW LEVEL SECURITY;

-- RLS Policies for ghl_connections
CREATE POLICY ghl_connections_select_own ON ghl_connections
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY ghl_connections_insert_own ON ghl_connections
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY ghl_connections_update_own ON ghl_connections
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY ghl_connections_delete_own ON ghl_connections
  FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for revival_campaigns
CREATE POLICY revival_campaigns_select_own ON revival_campaigns
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY revival_campaigns_insert_own ON revival_campaigns
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY revival_campaigns_update_own ON revival_campaigns
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY revival_campaigns_delete_own ON revival_campaigns
  FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for revival_conversations
CREATE POLICY revival_conversations_select_own ON revival_conversations
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY revival_conversations_insert_own ON revival_conversations
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY revival_conversations_update_own ON revival_conversations
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY revival_conversations_delete_own ON revival_conversations
  FOR DELETE USING (auth.uid() = user_id);
