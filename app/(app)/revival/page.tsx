"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Plus, Trash2, ExternalLink, TrendingUp, Search } from "lucide-react"
import { useState, useEffect } from "react"
import { useToast } from "@/hooks/use-toast"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
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
import { ScrollArea } from "@/components/ui/scroll-area"

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

  // Niche assignment modal state
  const [showNicheAssignmentModal, setShowNicheAssignmentModal] = useState(false)
  const [nicheAssignmentSearch, setNicheAssignmentSearch] = useState("")
  const [availableNiches, setAvailableNiches] = useState<
    Array<{ id: string; niche_name: string; industry_name: string }>
  >([])
  const [newlyConnectedAccountName, setNewlyConnectedAccountName] = useState("")

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
        .from("ghl_connections")
        .select("*")
        .order("created_at", { ascending: false })

      if (error) throw error
      setAccounts(data || [])
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to load accounts",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const loadNichesForAssignment = async () => {
    try {
      const { data: niches } = await supabase
        .from("niches")
        .select("id, niche_name, industry:industries(name)")
        .order("niche_name")
        .limit(1000)

      if (niches) {
        setAvailableNiches(
          niches.map((n: any) => ({
            id: n.id,
            niche_name: n.niche_name,
            industry_name: n.industry?.[0]?.name || n.industry?.name || "Unknown",
          })),
        )
      }
    } catch (error) {
      console.error("Error loading niches:", error)
    }
  }

  const handleAddAccount = async () => {
    if (!accountName.trim() || !locationId.trim() || !privateIntegrationToken.trim()) {
      toast({
        title: "Missing Fields",
        description: "Please fill in all required fields",
        variant: "destructive",
      })
      return
    }

    setConnecting(true)
    try {
      const testResponse = await fetch("/api/revival/test-connection", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          privateIntegrationToken: privateIntegrationToken.trim(),
          locationId: locationId.trim(),
        }),
      })

      const responseData = await testResponse.json()

      if (!testResponse.ok) {
        throw new Error(responseData.details || responseData.message || "Invalid credentials")
      }

      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) throw new Error("Not authenticated")

      const { error } = await supabase.from("ghl_connections").insert({
        user_id: user.id,
        api_key: privateIntegrationToken.trim(),
        location_id: locationId.trim(),
        account_name: accountName.trim(),
      })

      if (error) throw error

      setNewlyConnectedAccountName(accountName.trim())

      // Reset form
      const savedAccountName = accountName.trim()
      setAccountName("")
      setLocationId("")
      setPrivateIntegrationToken("")
      setIsAddModalOpen(false)

      // Load niches and show assignment modal
      await loadNichesForAssignment()
      await loadAccounts()
      setShowNicheAssignmentModal(true)
    } catch (error: any) {
      console.error("Connection error:", error)
      toast({
        title: "Connection Failed",
        description: error.message,
        variant: "destructive",
        duration: 10000,
      })
    } finally {
      setConnecting(false)
    }
  }

  const handleDeleteAccount = async () => {
    if (!accountToDelete) return

    try {
      const response = await fetch(`/api/revival/delete-account?id=${accountToDelete}`, {
        method: "DELETE",
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message)
      }

      toast({
        title: "Account Deleted",
        description: "Account and all related data removed",
      })

      setAccountToDelete(null)
      await loadAccounts()
    } catch (error: any) {
      toast({
        title: "Delete Failed",
        description: error.message,
        variant: "destructive",
      })
    }
  }

  const handleNicheAssignment = async (nicheId: string | null, nicheName: string) => {
    if (!nicheId) {
      toast({
        title: "Account Connected",
        description: `${newlyConnectedAccountName} connected (no niche assigned)`,
      })
      setShowNicheAssignmentModal(false)
      return
    }

    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) return

    const { error } = await supabase.from("niche_user_state").upsert(
      {
        niche_id: nicheId,
        user_id: user.id,
        win_completed: true,
        status: "Win",
        updated_at: new Date().toISOString(),
      },
      { onConflict: "niche_id,user_id" },
    )

    if (!error) {
      toast({
        title: "Win Recorded",
        description: `Win recorded for ${nicheName}`,
      })
    }

    setShowNicheAssignmentModal(false)
  }

  if (loading) {
    return (
      <div className="p-8 bg-black min-h-screen">
        <div className="animate-pulse space-y-4 max-w-7xl mx-auto">
          <div className="h-8 bg-white/10 rounded w-1/3"></div>
          <div className="h-32 bg-white/10 rounded"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-black min-h-screen">
      <div className="p-8 space-y-6 max-w-7xl mx-auto">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-[32px] font-bold text-white">GHL Dead Lead Accounts</h1>
            <p className="text-[16px] text-white/60 mt-1">
              Connect multiple client sub-accounts to track revivals and AI conversations
            </p>
          </div>

          <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
            <DialogTrigger asChild>
              <Button className="bg-[#00A8FF] text-white hover:bg-[#00A8FF]/90 transition-all">
                <Plus className="h-4 w-4 mr-2" />
                Add GHL Dead Lead Account
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl bg-[#0A0A0A] border border-white/10">
              <DialogHeader>
                <DialogTitle className="text-[20px] font-semibold text-white">Add GHL Dead Lead Account</DialogTitle>
                <DialogDescription className="text-[15px] text-white/60">
                  Connect a GoHighLevel sub-account using a Private Integration token
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="accountName" className="text-sm font-medium text-white">
                    Account Name (Friendly Business Name) *
                  </Label>
                  <Input
                    id="accountName"
                    placeholder="Friendly Business Name"
                    value={accountName}
                    onChange={(e) => setAccountName(e.target.value)}
                    autoComplete="off"
                    className="h-11 bg-white/5 border-white/10 text-white placeholder:text-white/40"
                  />
                  <p className="text-xs text-white/50">This is the label you'll see inside your dashboard.</p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="locationId" className="text-sm font-medium text-white">
                    Location ID *
                  </Label>
                  <Input
                    id="locationId"
                    placeholder="Paste your GoHighLevel Location ID"
                    value={locationId}
                    onChange={(e) => setLocationId(e.target.value)}
                    autoComplete="off"
                    className="h-11 bg-white/5 border-white/10 text-white placeholder:text-white/40"
                  />
                  <p className="text-xs text-white/50">
                    In the client sub-account, go to Settings → Business Profile and copy the Location ID.
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="privateIntegrationToken" className="text-sm font-medium text-white">
                    Private Integration Token *
                  </Label>
                  <Input
                    id="privateIntegrationToken"
                    type="password"
                    placeholder="Paste your Private Integration Token"
                    value={privateIntegrationToken}
                    onChange={(e) => setPrivateIntegrationToken(e.target.value)}
                    autoComplete="new-password"
                    name="ghl-private-integration-token"
                    className="h-11 bg-white/5 border-white/10 text-white placeholder:text-white/40"
                  />
                  <p className="text-xs text-white/50">
                    In the client sub-account, go to Settings → Private Integrations. Create a new integration and
                    select the required scopes below.
                  </p>
                </div>

                <div className="p-4 bg-white/5 border border-white/10 rounded-md space-y-2">
                  <p className="text-sm font-semibold text-white">Required Scopes for Private Integration:</p>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <p className="font-medium text-white/70">Conversations:</p>
                      <ul className="ml-4 list-disc text-white/60">
                        <li>conversations.readonly</li>
                        <li>conversations.write</li>
                      </ul>
                    </div>
                    <div>
                      <p className="font-medium text-white/70">Contacts:</p>
                      <ul className="ml-4 list-disc text-white/60">
                        <li>contacts.readonly</li>
                        <li>contacts.write</li>
                      </ul>
                    </div>
                    <div>
                      <p className="font-medium text-white/70">Opportunities:</p>
                      <ul className="ml-4 list-disc text-white/60">
                        <li>opportunities.readonly</li>
                        <li>opportunities.write</li>
                      </ul>
                    </div>
                    <div>
                      <p className="font-medium text-white/70">Campaigns:</p>
                      <ul className="ml-4 list-disc text-white/60">
                        <li>campaigns.readonly</li>
                      </ul>
                    </div>
                  </div>
                </div>

                <div className="flex gap-2 items-center p-3 bg-white/5 rounded-md border border-white/10">
                  <ExternalLink className="h-4 w-4 text-white/60 flex-shrink-0" />
                  <p className="text-xs text-white/60">
                    Need help? Visit{" "}
                    <a
                      href="https://help.leadconnectorhq.com/support/solutions/articles/155000002774"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="underline text-[#00A8FF] hover:text-[#00A8FF]/80"
                    >
                      Private Integrations Guide
                    </a>
                  </p>
                </div>

                <Button
                  onClick={handleAddAccount}
                  disabled={connecting}
                  className="w-full h-11 bg-[#00A8FF] text-white hover:bg-[#00A8FF]/90 transition-all"
                >
                  {connecting ? "Connecting..." : "Connect Account"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {accounts.length === 0 ? (
          <Card className="border border-white/10 bg-white/5">
            <CardContent className="flex flex-col items-center justify-center py-16">
              <TrendingUp className="h-16 w-16 text-[#00A8FF] mb-4" />
              <p className="text-[15px] text-white/60 mb-4 text-center max-w-md">
                No GHL accounts connected yet. Add your first account to start tracking dead lead revivals.
              </p>
              <Button onClick={() => setIsAddModalOpen(true)} className="bg-[#00A8FF] text-white hover:bg-[#00A8FF]/90">
                <Plus className="h-4 w-4 mr-2" />
                Add Your First Account
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {accounts.map((account) => (
              <Card
                key={account.id}
                className="border border-white/10 bg-white/5 hover:bg-white/10 hover:border-[#00A8FF]/50 transition-all cursor-pointer"
              >
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-[16px] font-semibold text-white">{account.account_name}</CardTitle>
                      <CardDescription className="text-xs mt-1 text-white/50">
                        Location: {account.location_id?.substring(0, 12)}...
                      </CardDescription>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0 text-red-400 hover:text-red-300 hover:bg-red-500/10"
                      onClick={() => setAccountToDelete(account.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center gap-2 text-sm text-white/60">
                    <div className="h-2 w-2 rounded-full bg-[#00A8FF]"></div>
                    Connected {new Date(account.connected_at).toLocaleDateString()}
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1 h-9 border-white/10 text-white hover:bg-[#00A8FF] hover:text-white hover:border-[#00A8FF] bg-transparent"
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
          <AlertDialogContent className="bg-[#0A0A0A] border border-white/10">
            <AlertDialogHeader>
              <AlertDialogTitle className="text-white">Delete Account?</AlertDialogTitle>
              <AlertDialogDescription className="text-white/60">
                This will permanently delete this GHL account connection and all associated campaign and conversation
                data. This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel className="bg-white/5 border-white/10 text-white hover:bg-white/10">
                Cancel
              </AlertDialogCancel>
              <AlertDialogAction onClick={handleDeleteAccount} className="bg-red-500 text-white hover:bg-red-600">
                Delete Account
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        <Dialog open={showNicheAssignmentModal} onOpenChange={setShowNicheAssignmentModal}>
          <DialogContent className="sm:max-w-[500px] bg-zinc-900 border-zinc-700">
            <DialogHeader>
              <DialogTitle className="text-white">Which niche does this GHL account belong to?</DialogTitle>
              <DialogDescription className="text-white/60">
                Select a niche to mark it as a Win, or choose "Other" to skip
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-white/40" />
                <Input
                  placeholder="Search niches..."
                  value={nicheAssignmentSearch}
                  onChange={(e) => setNicheAssignmentSearch(e.target.value)}
                  className="pl-9 bg-zinc-800 border-zinc-700 text-white placeholder:text-white/40"
                />
              </div>

              <ScrollArea className="h-[300px] rounded-lg border border-zinc-700 bg-zinc-800">
                <div className="p-2 space-y-1">
                  {/* Other option */}
                  <button
                    onClick={() => handleNicheAssignment(null, "Other")}
                    className="w-full text-left p-3 rounded-lg hover:bg-white/10 transition-colors border border-zinc-600"
                  >
                    <div className="font-medium text-white">Other</div>
                    <div className="text-sm text-white/60">Not in the list</div>
                  </button>

                  {/* Filtered niches */}
                  {availableNiches
                    .filter(
                      (n) =>
                        n.niche_name.toLowerCase().includes(nicheAssignmentSearch.toLowerCase()) ||
                        n.industry_name.toLowerCase().includes(nicheAssignmentSearch.toLowerCase()),
                    )
                    .slice(0, 30)
                    .map((niche) => (
                      <button
                        key={niche.id}
                        onClick={() => handleNicheAssignment(niche.id, niche.niche_name)}
                        className="w-full text-left p-3 rounded-lg hover:bg-white/10 transition-colors"
                      >
                        <div className="font-medium text-white">{niche.niche_name}</div>
                        <div className="text-sm text-white/60">{niche.industry_name}</div>
                      </button>
                    ))}
                </div>
              </ScrollArea>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
}
