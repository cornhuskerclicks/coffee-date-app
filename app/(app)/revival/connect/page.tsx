"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ArrowLeft, ExternalLink } from 'lucide-react'
import { useState } from "react"
import { useToast } from "@/hooks/use-toast"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from 'next/navigation'

export default function ConnectGHLPage() {
  const [apiKey, setApiKey] = useState("")
  const [locationId, setLocationId] = useState("")
  const [accountName, setAccountName] = useState("")
  const [loading, setLoading] = useState(false)
  const { toast } = useToast()
  const router = useRouter()
  const supabase = createClient()

  const handleConnect = async () => {
    if (!apiKey.trim()) {
      toast({
        title: "API Key Required",
        description: "Please enter your GoHighLevel API key",
        variant: "destructive"
      })
      return
    }

    setLoading(true)
    try {
      // Test the API key first
      const testResponse = await fetch('/api/revival/test-connection', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ apiKey, locationId })
      })

      if (!testResponse.ok) {
        const error = await testResponse.json()
        throw new Error(error.message || 'Invalid API credentials')
      }

      // Save connection
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      const { error } = await supabase.from('ghl_connections').insert({
        user_id: user.id,
        api_key: apiKey,
        location_id: locationId || null,
        account_name: accountName || null
      })

      if (error) throw error

      toast({
        title: "Connected",
        description: "GoHighLevel account connected successfully"
      })

      router.push('/revival')
    } catch (error: any) {
      toast({
        title: "Connection Failed",
        description: error.message,
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="p-6 space-y-6">
      <Button variant="ghost" onClick={() => router.back()}>
        <ArrowLeft className="h-4 w-4 mr-2" />
        Back
      </Button>

      <div>
        <h1 className="text-3xl font-bold">Connect GoHighLevel</h1>
        <p className="text-muted-foreground">Enter your agency API credentials to sync sub-account campaigns and conversations</p>
      </div>

      <div className="grid gap-6 max-w-2xl">
        <Card>
          <CardHeader>
            <CardTitle>Agency API Credentials</CardTitle>
            <CardDescription>
              Connect your agency account to access client sub-account data
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="accountName">Account Name (Optional)</Label>
              <Input
                id="accountName"
                placeholder="Client Name or Agency Account"
                value={accountName}
                onChange={(e) => setAccountName(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                A friendly name to identify this connection
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="apiKey">Agency API Key *</Label>
              <Input
                id="apiKey"
                type="password"
                placeholder="Enter your agency-level API key"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Your agency API key (not a sub-account key)
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="locationId">Sub-Account Location ID *</Label>
              <Input
                id="locationId"
                placeholder="Enter the client's sub-account location ID"
                value={locationId}
                onChange={(e) => setLocationId(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Required: The unique ID of the client sub-account you want to access
              </p>
            </div>

            <Button onClick={handleConnect} disabled={loading} className="w-full">
              {loading ? 'Connecting...' : 'Connect Agency Account'}
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>How to Connect Your Agency Account</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3 text-sm">
              <div>
                <p className="font-medium mb-2">Step 1: Get Your Agency API Key</p>
                <ol className="list-decimal list-inside space-y-1 text-muted-foreground ml-2">
                  <li>Log in to your GoHighLevel agency account</li>
                  <li>Go to Settings → Company → API Keys (or Integrations)</li>
                  <li>Create or copy your agency-level API key</li>
                </ol>
              </div>
              
              <div>
                <p className="font-medium mb-2">Step 2: Find the Sub-Account Location ID</p>
                <ol className="list-decimal list-inside space-y-1 text-muted-foreground ml-2">
                  <li>Navigate to the client's sub-account</li>
                  <li>Go to Settings → Business Profile</li>
                  <li>Copy the Location ID shown at the top</li>
                </ol>
              </div>

              <div className="p-3 bg-muted rounded-lg">
                <p className="text-xs font-medium mb-1">Important:</p>
                <p className="text-xs text-muted-foreground">
                  Both the agency API key AND the sub-account location ID are required to access client data. 
                  The system will automatically exchange your agency token for a location-specific access token.
                </p>
              </div>
            </div>
            
            <Button variant="outline" size="sm" asChild>
              <a href="https://help.gohighlevel.com/support/solutions/articles/48001204848" target="_blank" rel="noopener noreferrer">
                Learn More About Location IDs
                <ExternalLink className="h-4 w-4 ml-2" />
              </a>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
