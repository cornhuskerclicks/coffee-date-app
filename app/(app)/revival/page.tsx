"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Plus, Trash2, ExternalLink, TrendingUp } from 'lucide-react'
import { useState, useEffect } from "react"
import { useToast } from "@/hooks/use-toast"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from 'next/navigation'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

type GHLConnection = {
  id: string
  account_name: string | null
  location_id: string | null
  connected_at: string
}

export default function DeadLeadRevivalPage() {
  const [accounts, setAccounts] = useState<GHLConnection[]>([])
  const [loading, setLoading] = useState(true)
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [accountToDelete, setAccountToDelete] = useState<string | null>(null)
  
  // Form state
  const [accountName, setAccountName] = useState("")
  const [locationId, setLocationId] = useState("")
  const [privateIntegrationToken, setPrivateIntegrationToken] = useState("")
  const [connecting, setConnecting] = useState(false)
  
  const { toast } = useToast()
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    loadAccounts()
  }, [])

  const loadAccounts = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('ghl_connections')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error
      setAccounts(data || [])
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to load accounts",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const handleAddAccount = async () => {
    if (!accountName.trim() || !locationId.trim() || !privateIntegrationToken.trim()) {
      toast({
        title: "Missing Fields",
        description: "Please fill in all required fields",
        variant: "destructive"
      })
      return
    }

    setConnecting(true)
    try {
      console.log('[v0] Testing connection with location ID:', locationId.trim())
      
      const testResponse = await fetch('/api/revival/test-connection', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          privateIntegrationToken: privateIntegrationToken.trim(), 
          locationId: locationId.trim() 
        })
      })

      const responseData = await testResponse.json()
      console.log('[v0] Test response:', responseData)

      if (!testResponse.ok) {
        throw new Error(responseData.details || responseData.message || 'Invalid credentials')
      }

      // Save connection
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      const { error } = await supabase.from('ghl_connections').insert({
        user_id: user.id,
        api_key: privateIntegrationToken.trim(),
        location_id: locationId.trim(),
        account_name: accountName.trim()
      })

      if (error) throw error

      toast({
        title: "Account Connected",
        description: `${accountName} connected successfully`
      })

      // Reset form and reload
      setAccountName("")
      setLocationId("")
      setPrivateIntegrationToken("")
      setIsAddModalOpen(false)
      await loadAccounts()

    } catch (error: any) {
      console.error('[v0] Connection error:', error)
      toast({
        title: "Connection Failed",
        description: error.message,
        variant: "destructive",
        duration: 10000
      })
    } finally {
      setConnecting(false)
    }
  }

  const handleDeleteAccount = async () => {
    if (!accountToDelete) return

    try {
      const response = await fetch(`/api/revival/delete-account?id=${accountToDelete}`, {
        method: 'DELETE'
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message)
      }

      toast({
        title: "Account Deleted",
        description: "Account and all related data removed"
      })

      setAccountToDelete(null)
      await loadAccounts()
    } catch (error: any) {
      toast({
        title: "Delete Failed",
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

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">GHL Dead Lead Accounts</h1>
          <p className="text-muted-foreground">
            Manage your GoHighLevel sub-account connections
          </p>
        </div>
        
        <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Add GHL Dead Lead Account
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Add GHL Dead Lead Account</DialogTitle>
              <DialogDescription>
                Connect a GoHighLevel sub-account using a Private Integration token
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="accountName">Account Name (Friendly Business Name) *</Label>
                <Input
                  id="accountName"
                  placeholder="Friendly Business Name"
                  value={accountName}
                  onChange={(e) => setAccountName(e.target.value)}
                  autoComplete="off"
                />
                <p className="text-xs text-muted-foreground">
                  This is the label you'll see inside your dashboard.
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="locationId">Location ID *</Label>
                <Input
                  id="locationId"
                  placeholder="Paste your GoHighLevel Location ID"
                  value={locationId}
                  onChange={(e) => setLocationId(e.target.value)}
                  autoComplete="off"
                />
                <p className="text-xs text-muted-foreground">
                  In the client sub-account, go to Settings → Business Profile and copy the Location ID.
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="privateIntegrationToken">Private Integration Token *</Label>
                <Input
                  id="privateIntegrationToken"
                  type="password"
                  placeholder="Paste your Private Integration Token"
                  value={privateIntegrationToken}
                  onChange={(e) => setPrivateIntegrationToken(e.target.value)}
                  autoComplete="new-password"
                  name="ghl-private-integration-token"
                />
                <p className="text-xs text-muted-foreground">
                  In the client sub-account, go to Settings → Private Integrations. Create a new integration, select scopes for Contacts, Conversations, Opportunities, and Campaigns. Copy the token and paste it here.
                </p>
              </div>

              <div className="flex gap-2 items-center p-3 bg-muted rounded-lg">
                <ExternalLink className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                <p className="text-xs text-muted-foreground">
                  Need help? Visit{" "}
                  <a 
                    href="https://help.leadconnectorhq.com/support/solutions/articles/155000002774" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="underline"
                  >
                    Private Integrations Guide
                  </a>
                </p>
              </div>

              <Button 
                onClick={handleAddAccount} 
                disabled={connecting}
                className="w-full"
              >
                {connecting ? 'Connecting...' : 'Connect Account'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {accounts.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <TrendingUp className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground mb-4 text-center">
              No GHL accounts connected yet.<br />
              Add your first account to start tracking dead lead revivals.
            </p>
            <Button onClick={() => setIsAddModalOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Add Your First Account
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {accounts.map((account) => (
            <Card key={account.id} className="relative">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-lg">{account.account_name}</CardTitle>
                    <CardDescription className="text-xs mt-1">
                      Location: {account.location_id?.substring(0, 12)}...
                    </CardDescription>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                    onClick={() => setAccountToDelete(account.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <div className="h-2 w-2 rounded-full bg-green-500"></div>
                  Connected {new Date(account.connected_at).toLocaleDateString()}
                </div>
                <div className="flex gap-2">
                  <Button 
                    variant="outline" 
                    size="sm"
                    className="flex-1"
                    onClick={() => router.push(`/revival/account/${account.id}`)}
                  >
                    View Data
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <AlertDialog open={!!accountToDelete} onOpenChange={() => setAccountToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Account?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete this GHL account connection and all associated campaign and conversation data. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteAccount} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete Account
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
