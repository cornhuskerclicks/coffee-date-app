"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Download, MessageSquare, User, Mail, Phone } from 'lucide-react'
import { useState, useEffect } from "react"
import { useToast } from "@/hooks/use-toast"
import { createClient } from "@/lib/supabase/client"
import { useRouter, useParams } from 'next/navigation'
import { Badge } from "@/components/ui/badge"

type Campaign = {
  id: string
  name: string
  status: string | null
  metrics: any
}

type Conversation = {
  id: string
  contact_name: string | null
  contact_email: string | null
  contact_phone: string | null
  status: string | null
  last_message_at: string | null
  messages: any[]
}

export default function CampaignDetailPage() {
  const params = useParams()
  const campaignId = params.id as string
  const [campaign, setCampaign] = useState<Campaign | null>(null)
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [loading, setLoading] = useState(true)
  const { toast } = useToast()
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    loadData()
  }, [campaignId])

  const loadData = async () => {
    try {
      setLoading(true)

      // Load campaign
      const { data: campaignData, error: campaignError } = await supabase
        .from('revival_campaigns')
        .select('*')
        .eq('id', campaignId)
        .single()

      if (campaignError) throw campaignError
      setCampaign(campaignData)

      // Load conversations
      const { data: conversationsData, error: conversationsError } = await supabase
        .from('revival_conversations')
        .select('*')
        .eq('campaign_id', campaignId)
        .order('last_message_at', { ascending: false })

      if (conversationsError) throw conversationsError
      setConversations(conversationsData || [])
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to load campaign",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const handleDownloadConversations = () => {
    if (!campaign) return

    const csvContent = [
      ['Contact Name', 'Email', 'Phone', 'Status', 'Last Message', 'Messages Count'],
      ...conversations.map(conv => [
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
    a.download = `${campaign.name.replace(/\s+/g, '_')}_conversations.csv`
    a.click()
    window.URL.revokeObjectURL(url)

    toast({
      title: "Downloaded",
      description: "Conversations exported successfully"
    })
  }

  const handleDownloadMessages = (conversation: Conversation) => {
    const messagesText = [
      `Conversation with ${conversation.contact_name || 'Unknown'}`,
      `Email: ${conversation.contact_email || 'N/A'}`,
      `Phone: ${conversation.contact_phone || 'N/A'}`,
      ``,
      `Messages:`,
      `--------`,
      ...conversation.messages.map((msg: any) => 
        `[${msg.timestamp || 'Unknown time'}] ${msg.from || 'Unknown'}: ${msg.text || ''}`
      )
    ].join('\n')

    const blob = new Blob([messagesText], { type: 'text/plain' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `conversation_${conversation.contact_name?.replace(/\s+/g, '_') || conversation.id}.txt`
    a.click()
    window.URL.revokeObjectURL(url)

    toast({
      title: "Downloaded",
      description: "Messages exported successfully"
    })
  }

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-muted rounded w-1/3"></div>
          <div className="h-64 bg-muted rounded"></div>
        </div>
      </div>
    )
  }

  if (!campaign) {
    return (
      <div className="p-6">
        <p className="text-muted-foreground">Campaign not found</p>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
      </div>

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">{campaign.name}</h1>
          <p className="text-muted-foreground">{conversations.length} conversations</p>
        </div>
        <Button onClick={handleDownloadConversations}>
          <Download className="h-4 w-4 mr-2" />
          Download All
        </Button>
      </div>

      <div className="space-y-3">
        {conversations.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <MessageSquare className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">No conversations found for this campaign</p>
            </CardContent>
          </Card>
        ) : (
          conversations.map((conversation) => (
            <Card key={conversation.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="space-y-2">
                    <CardTitle className="flex items-center gap-2">
                      <User className="h-5 w-5" />
                      {conversation.contact_name || 'Unknown Contact'}
                    </CardTitle>
                    <div className="flex gap-4 text-sm text-muted-foreground">
                      {conversation.contact_email && (
                        <span className="flex items-center gap-1">
                          <Mail className="h-3 w-3" />
                          {conversation.contact_email}
                        </span>
                      )}
                      {conversation.contact_phone && (
                        <span className="flex items-center gap-1">
                          <Phone className="h-3 w-3" />
                          {conversation.contact_phone}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {conversation.status && (
                      <Badge variant="secondary">{conversation.status}</Badge>
                    )}
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleDownloadMessages(conversation)}
                    >
                      <Download className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="text-sm text-muted-foreground">
                    {Array.isArray(conversation.messages) && conversation.messages.length > 0 ? (
                      <>
                        {conversation.messages.length} messages
                        {conversation.last_message_at && (
                          <> · Last message {new Date(conversation.last_message_at).toLocaleString()}</>
                        )}
                      </>
                    ) : (
                      'No messages'
                    )}
                  </div>
                  {Array.isArray(conversation.messages) && conversation.messages.length > 0 && (
                    <div className="mt-4 p-3 bg-muted rounded-lg text-sm">
                      <p className="font-medium mb-1">Latest message:</p>
                      <p className="text-muted-foreground">
                        {conversation.messages[conversation.messages.length - 1]?.text || 'No text'}
                      </p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  )
}
