"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Download, RefreshCw, MessageSquare, TrendingUp, Users } from 'lucide-react'
import { useState, useEffect } from "react"
import { useToast } from "@/hooks/use-toast"
import { createClient } from "@/lib/supabase/client"
import { useRouter, useParams } from 'next/navigation'

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

export default function AccountDetailPage() {
  const params = useParams()
  const accountId = params.id as string
  
  const [account, setAccount] = useState<any>(null)
  const [campaigns, setCampaigns] = useState<Campaign[]>([])
  const [loading, setLoading] = useState(true)
  const [syncing, setSyncing] = useState(false)
  const { toast } = useToast()
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    if (accountId) {
      loadData()
    }
  }, [accountId])

  const loadData = async () => {
    try {
      setLoading(true)

      // Load account details
      const { data: accountData, error: accError } = await supabase
        .from('ghl_connections')
        .select('*')
        .eq('id', accountId)
        .single()

      if (accError) throw accError
      setAccount(accountData)

      // Load campaigns for this account
      const { data: campaignsData, error: campaignsError } = await supabase
        .from('revival_campaigns')
        .select('*')
        .eq('ghl_connection_id', accountId)
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
    setSyncing(true)
    try {
      console.log('[v0] Starting sync for account:', accountId)
      
      const response = await fetch('/api/revival/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ connectionId: accountId })
      })

      if (!response.ok) {
        const error = await response.json()
        console.error('[v0] Sync failed:', error)
        
        let errorMessage = error.message || 'Sync failed'
        
        // Add helpful messages based on error type
        if (errorMessage.includes('401') || errorMessage.includes('Unauthorized')) {
          errorMessage = 'Authentication failed. Please check your Private Integration token has the correct scopes: conversations.readonly, contacts.readonly, opportunities.readonly, campaigns.readonly'
        } else if (errorMessage.includes('403') || errorMessage.includes('Forbidden')) {
          errorMessage = 'Access denied. Ensure your Private Integration has been granted all required permissions in the GoHighLevel sub-account.'
        } else if (errorMessage.includes('404')) {
          errorMessage = 'Location not found. Please verify the Location ID is correct.'
        }
        
        throw new Error(errorMessage)
      }

      const result = await response.json()
      console.log('[v0] Sync result:', result)
      
      toast({
        title: "Sync Complete",
        description: `Synced ${result.campaignsCount} campaigns and ${result.conversationsCount} conversations`
      })

      await loadData()
    } catch (error: any) {
      console.error('[v0] Sync error:', error)
      toast({
        title: "Sync Failed",
        description: error.message,
        variant: "destructive",
        duration: 10000
      })
    } finally {
      setSyncing(false)
    }
  }

  if (loading || !account) {
    return (
      <div className="p-8 bg-black min-h-screen">
        <div className="animate-pulse space-y-4 max-w-7xl mx-auto">
          <div className="h-8 bg-white/10 rounded w-1/3"></div>
          <div className="h-32 bg-white/10 rounded"></div>
        </div>
      </div>
    )
  }

  const totalConversations = campaigns.reduce((sum, c) => sum + (c.metrics.total_conversations || 0), 0)
  const totalMessages = campaigns.reduce((sum, c) => sum + (c.metrics.total_messages || 0), 0)
  const avgResponseRate = campaigns.length > 0
    ? campaigns.reduce((sum, c) => sum + (c.metrics.response_rate || 0), 0) / campaigns.length
    : 0

  return (
    <div className="bg-black min-h-screen">
      <div className="p-8 space-y-6 max-w-7xl mx-auto">
        <Button variant="ghost" onClick={() => router.push('/revival')} className="text-white hover:text-[#00A8FF] hover:bg-white/5">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Accounts
        </Button>

        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-[32px] font-bold text-white">{account.account_name}</h1>
            <p className="text-white/60 text-[15px]">
              Location ID: {account.location_id}
            </p>
          </div>
          <Button onClick={handleSync} disabled={syncing} className="bg-[#00A8FF] text-white hover:bg-[#00A8FF]/90">
            <RefreshCw className={`h-4 w-4 mr-2 ${syncing ? 'animate-spin' : ''}`} />
            {syncing ? 'Syncing...' : 'Sync Now'}
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="border border-white/10 bg-white/5">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-white/60">Total Campaigns</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <TrendingUp className="h-8 w-8 text-[#00A8FF]" />
                <div className="text-3xl font-bold text-white">{campaigns.length}</div>
              </div>
            </CardContent>
          </Card>

          <Card className="border border-white/10 bg-white/5">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-white/60">Total Conversations</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <MessageSquare className="h-8 w-8 text-[#00A8FF]" />
                <div className="text-3xl font-bold text-white">{totalConversations}</div>
              </div>
            </CardContent>
          </Card>

          <Card className="border border-white/10 bg-white/5">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-white/60">Avg Response Rate</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <Users className="h-8 w-8 text-[#00A8FF]" />
                <div className="text-3xl font-bold text-white">{avgResponseRate.toFixed(1)}%</div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card className="border border-white/10 bg-white/5">
          <CardHeader>
            <CardTitle className="text-white">Campaigns</CardTitle>
            <CardDescription className="text-white/60">
              {account.last_synced_at 
                ? `Last synced ${new Date(account.last_synced_at).toLocaleString()}`
                : 'Not synced yet'
              }
            </CardDescription>
          </CardHeader>
          <CardContent>
            {campaigns.length === 0 ? (
              <div className="text-center py-12">
                <MessageSquare className="h-12 w-12 mx-auto text-[#00A8FF] mb-4" />
                <p className="text-white/60 mb-4">No campaigns found</p>
                <Button onClick={handleSync} className="bg-[#00A8FF] text-white hover:bg-[#00A8FF]/90">
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Sync Campaigns
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                {campaigns.map((campaign) => (
                  <div
                    key={campaign.id}
                    className="flex items-center justify-between p-4 border border-white/10 rounded-lg bg-white/5 hover:bg-white/10 hover:border-[#00A8FF]/50 transition-all"
                  >
                    <div className="flex-1">
                      <h3 className="font-semibold text-white">{campaign.name}</h3>
                      <div className="flex gap-4 mt-2 text-sm text-white/60">
                        <span>{campaign.metrics.total_conversations || 0} conversations</span>
                        <span>{campaign.metrics.total_messages || 0} messages</span>
                        {campaign.metrics.response_rate && (
                          <span>{campaign.metrics.response_rate}% response rate</span>
                        )}
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      className="border-white/10 text-white hover:bg-[#00A8FF] hover:text-white hover:border-[#00A8FF]"
                      onClick={() => router.push(`/revival/campaign/${campaign.id}`)}
                    >
                      View Details
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
