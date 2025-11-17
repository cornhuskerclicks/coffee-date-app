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
        <p className="text-muted-foreground">Enter your API credentials to sync campaigns and conversations</p>
      </div>

      <div className="grid gap-6 max-w-2xl">
        <Card>
          <CardHeader>
            <CardTitle>API Credentials</CardTitle>
            <CardDescription>
              You can find your API key in your GoHighLevel account settings
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="accountName">Account Name (Optional)</Label>
              <Input
                id="accountName"
                placeholder="My GHL Account"
                value={accountName}
                onChange={(e) => setAccountName(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="apiKey">API Key *</Label>
              <Input
                id="apiKey"
                type="password"
                placeholder="Enter your GoHighLevel API key"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="locationId">Location ID (Optional)</Label>
              <Input
                id="locationId"
                placeholder="Enter location ID if using sub-account"
                value={locationId}
                onChange={(e) => setLocationId(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Required only if you're using a sub-account
              </p>
            </div>

            <Button onClick={handleConnect} disabled={loading} className="w-full">
              {loading ? 'Connecting...' : 'Connect Account'}
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>How to Get Your API Key</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <ol className="list-decimal list-inside space-y-2 text-muted-foreground">
              <li>Log in to your GoHighLevel account</li>
              <li>Go to Settings → Integrations</li>
              <li>Find the API section and generate a new API key</li>
              <li>Copy the key and paste it above</li>
            </ol>
            <Button variant="outline" size="sm" asChild>
              <a href="https://marketplace.gohighlevel.com/docs" target="_blank" rel="noopener noreferrer">
                View API Documentation
                <ExternalLink className="h-4 w-4 ml-2" />
              </a>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
