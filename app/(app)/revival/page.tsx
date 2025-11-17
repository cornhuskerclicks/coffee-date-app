"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Plus, Download, RefreshCw, Settings, TrendingUp, MessageSquare, Users } from 'lucide-react'
import { useState, useEffect } from "react"
import { useToast } from "@/hooks/use-toast"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from 'next/navigation'

type GHLConnection = {
  id: string
  account_name: string | null
  location_id: string | null
  last_synced_at: string | null
  connected_at: string
}

type Campaign = {
  id: string
  name: string
  status: string | null
  metrics: {
    total_conversations?: number
    total_messages?: number
    response_rate?: number
  }
  synced_at: string
}

export default function DeadLeadRevivalPage() {
  const [connection, setConnection] = useState<GHLConnection | null>(null)
  const [campaigns, setCampaigns] = useState<Campaign[]>([])
  const [loading, setLoading] = useState(true)
  const [syncing, setSyncing] = useState(false)
  const { toast } = useToast()
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      setLoading(true)

      // Load GHL connection
      const { data: connectionData, error: connError } = await supabase
        .from('ghl_connections')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(1)
        .single()

      if (connError && connError.code !== 'PGRST116') {
        throw connError
      }

      setConnection(connectionData || null)

      // Load campaigns
      const { data: campaignsData, error: campaignsError } = await supabase
        .from('revival_campaigns')
        .select('*')
        .order('created_at', { ascending: false })

      if (campaignsError) throw campaignsError

      setCampaigns(campaignsData || [])
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to load data",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const handleSync = async () => {
    if (!connection) {
      toast({
        title: "No Connection",
        description: "Please connect to GoHighLevel first",
        variant: "destructive"
      })
      return
    }

    setSyncing(true)
    try {
      const response = await fetch('/api/revival/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ connectionId: connection.id })
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || 'Sync failed')
      }

      const result = await response.json()
      
      toast({
        title: "Sync Complete",
        description: `Synced ${result.campaignsCount} campaigns and ${result.conversationsCount} conversations`
      })

      await loadData()
    } catch (error: any) {
      toast({
        title: "Sync Failed",
        description: error.message,
        variant: "destructive"
      })
    } finally {
      setSyncing(false)
    }
  }

  const handleDownloadCampaign = async (campaignId: string, campaignName: string) => {
    try {
      const { data, error } = await supabase
        .from('revival_conversations')
        .select('*')
        .eq('campaign_id', campaignId)

      if (error) throw error

      const csvContent = [
        ['Contact Name', 'Email', 'Phone', 'Status', 'Last Message', 'Messages Count'],
        ...data.map(conv => [
          conv.contact_name || '',
          conv.contact_email || '',
          conv.contact_phone || '',
          conv.status || '',
          conv.last_message_at || '',
          Array.isArray(conv.messages) ? conv.messages.length : 0
        ])
      ].map(row => row.join(',')).join('\n')

      const blob = new Blob([csvContent], { type: 'text/csv' })
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${campaignName.replace(/\s+/g, '_')}_conversations.csv`
      a.click()
      window.URL.revokeObjectURL(url)

      toast({
        title: "Downloaded",
        description: "Campaign data exported successfully"
      })
    } catch (error: any) {
      toast({
        title: "Download Failed",
        description: error.message,
        variant: "destructive"
      })
    }
  }

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-muted rounded w-1/3"></div>
          <div className="h-32 bg-muted rounded"></div>
        </div>
      </div>
    )
  }

  if (!connection) {
    return (
      <div className="p-6 space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Dead Lead Revival Engine</h1>
          <p className="text-muted-foreground">Connect to GoHighLevel to sync campaigns and conversations</p>
        </div>

        <Card className="max-w-2xl">
          <CardHeader>
            <CardTitle>Connect GoHighLevel</CardTitle>
            <CardDescription>
              Enter your GoHighLevel API key to start syncing campaigns and AI conversations
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => router.push('/revival/connect')}>
              <Plus className="h-4 w-4 mr-2" />
              Connect GoHighLevel Account
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  const totalConversations = campaigns.reduce((sum, c) => sum + (c.metrics.total_conversations || 0), 0)
  const totalMessages = campaigns.reduce((sum, c) => sum + (c.metrics.total_messages || 0), 0)
  const avgResponseRate = campaigns.length > 0
    ? campaigns.reduce((sum, c) => sum + (c.metrics.response_rate || 0), 0) / campaigns.length
    : 0

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Dead Lead Revival Engine</h1>
          <p className="text-muted-foreground">
            Connected to {connection.account_name || 'GoHighLevel'}
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => router.push('/revival/connect')}>
            <Settings className="h-4 w-4 mr-2" />
            Settings
          </Button>
          <Button onClick={handleSync} disabled={syncing}>
            <RefreshCw className={`h-4 w-4 mr-2 ${syncing ? 'animate-spin' : ''}`} />
            {syncing ? 'Syncing...' : 'Sync Now'}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Campaigns</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <TrendingUp className="h-8 w-8 text-primary" />
              <div className="text-3xl font-bold">{campaigns.length}</div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Conversations</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <MessageSquare className="h-8 w-8 text-primary" />
              <div className="text-3xl font-bold">{totalConversations}</div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Avg Response Rate</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Users className="h-8 w-8 text-primary" />
              <div className="text-3xl font-bold">{avgResponseRate.toFixed(1)}%</div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Your Campaigns</CardTitle>
          <CardDescription>
            {connection.last_synced_at 
              ? `Last synced ${new Date(connection.last_synced_at).toLocaleString()}`
              : 'Not synced yet'
            }
          </CardDescription>
        </CardHeader>
        <CardContent>
          {campaigns.length === 0 ? (
            <div className="text-center py-12">
              <MessageSquare className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground mb-4">No campaigns found</p>
              <Button onClick={handleSync}>
                <RefreshCw className="h-4 w-4 mr-2" />
                Sync Campaigns
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {campaigns.map((campaign) => (
                <div
                  key={campaign.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <div className="flex-1">
                    <h3 className="font-semibold">{campaign.name}</h3>
                    <div className="flex gap-4 mt-2 text-sm text-muted-foreground">
                      <span>{campaign.metrics.total_conversations || 0} conversations</span>
                      <span>{campaign.metrics.total_messages || 0} messages</span>
                      {campaign.metrics.response_rate && (
                        <span>{campaign.metrics.response_rate}% response rate</span>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => router.push(`/revival/campaign/${campaign.id}`)}
                    >
                      View Details
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDownloadCampaign(campaign.id, campaign.name)}
                    >
                      <Download className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
