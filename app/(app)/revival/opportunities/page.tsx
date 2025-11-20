"use client"

import { useState, useEffect } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { createClient } from "@/lib/supabase/client"
import { useToast } from "@/hooks/use-toast"
import {
  Star,
  Search,
  ChevronRight,
  CheckCircle2,
  Loader2,
  Calculator,
  MessageSquare,
  Calendar,
  Trophy,
  X,
  ChevronDown,
  ChevronUp,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"

const STATUSES = ["Research", "Shortlisted", "Outreach in Progress", "Coffee Date Demo", "Win"]

type Industry = {
  id: string
  name: string
}

type Niche = {
  id: string
  industry_id: string
  niche_name: string
  scale: string
  database_size: string
  default_priority: number
  industry?: Industry
  user_state?: {
    is_favourite: boolean
    status: string
    notes: string | null
    expected_monthly_value: number | null
    // Research phase
    research_notes: string | null
    aov_input: number | null
    database_size_input: number | null
    cpl_calculated: number | null
    cpa_calculated: number | null
    potential_retainer: number | null
    profit_split_potential: number | null
    customer_profile: any | null
    research_notes_added: boolean
    aov_calculator_completed: boolean
    customer_profile_generated: boolean
    // Shortlisted phase
    messaging_scripts: any | null
    messaging_prepared: boolean
    // Outreach phase
    outreach_start_date: string | null
    outreach_channels: any | null
    outreach_messages_sent: number
    outreach_notes: string | null
    demo_script_created: boolean
    demo_script: string | null
    coffee_date_completed: boolean
    ghl_sub_account_id: string | null
    // Win phase
    active_monthly_retainer: number | null
    monthly_profit_split: number | null
    target_monthly_recurring: number | null
    win_completed: boolean
  }
}

export default function OpportunitiesV2() {
  const [industries, setIndustries] = useState<Industry[]>([])
  const [niches, setNiches] = useState<Niche[]>([])
  const [filteredNiches, setFilteredNiches] = useState<Niche[]>([])
  const [selectedNiche, setSelectedNiche] = useState<Niche | null>(null)
  const [loading, setLoading] = useState(true)

  const [searchTerm, setSearchTerm] = useState("")
  const [industryFilter, setIndustryFilter] = useState<string>("all")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [favouritesOnly, setFavouritesOnly] = useState(false)
  const [sortBy, setSortBy] = useState<string>("alphabetical")

  const [localInputs, setLocalInputs] = useState({
    researchNotes: "",
    aovInput: "",
    databaseSizeInput: "",
    outreachNotes: "",
  })

  // AI generation states
  const [generatingProfile, setGeneratingProfile] = useState(false)
  const [generatingMessaging, setGeneratingMessaging] = useState(false)
  const [generatingDemo, setGeneratingDemo] = useState(false)

  const [profileChatMessages, setProfileChatMessages] = useState<Array<{ role: string; content: string }>>([])
  const [profileChatInput, setProfileChatInput] = useState("")
  const [isProfileChatActive, setIsProfileChatActive] = useState(false)
  const [isProfileChatLoading, setIsProfileChatLoading] = useState(false)

  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    research: true,
    calculator: true,
    profile: true,
  })

  const { toast } = useToast()
  const supabase = createClient()

  useEffect(() => {
    loadData()
  }, [])

  useEffect(() => {
    applyFilters()
  }, [niches, searchTerm, industryFilter, statusFilter, favouritesOnly, sortBy])

  useEffect(() => {
    if (selectedNiche) {
      setLocalInputs({
        researchNotes: selectedNiche.user_state?.research_notes || "",
        aovInput: selectedNiche.user_state?.aov_input?.toString() || "",
        databaseSizeInput: selectedNiche.user_state?.database_size_input?.toString() || "",
        outreachNotes: selectedNiche.user_state?.outreach_notes || "",
      })
    }
  }, [selectedNiche])

  const loadData = async () => {
    try {
      setLoading(true)
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) return

      const { data: industriesData } = await supabase.from("industries").select("*").order("name")
      setIndustries(industriesData || [])

      const { data: nichesData } = await supabase
        .from("niches")
        .select(`
          *,
          industry:industries(id, name),
          user_state:niche_user_state!niche_id(*)
        `)
        .order("niche_name")

      const processedNiches = (nichesData || []).map((niche) => ({
        ...niche,
        user_state: niche.user_state?.[0] || {
          is_favourite: false,
          status: "Research",
          notes: null,
          expected_monthly_value: null,
          research_notes: null,
          aov_input: null,
          database_size_input: null,
          cpl_calculated: null,
          cpa_calculated: null,
          potential_retainer: null,
          profit_split_potential: null,
          customer_profile: null,
          research_notes_added: false,
          aov_calculator_completed: false,
          customer_profile_generated: false,
          messaging_scripts: null,
          messaging_prepared: false,
          outreach_start_date: null,
          outreach_channels: null,
          outreach_messages_sent: 0,
          outreach_notes: null,
          demo_script_created: false,
          demo_script: null,
          coffee_date_completed: false,
          ghl_sub_account_id: null,
          active_monthly_retainer: null,
          monthly_profit_split: null,
          target_monthly_recurring: null,
          win_completed: false,
        },
      }))

      setNiches(processedNiches)
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const applyFilters = () => {
    let filtered = [...niches]

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter((n) => n.niche_name.toLowerCase().includes(searchTerm.toLowerCase()))
    }

    // Industry filter
    if (industryFilter !== "all") {
      filtered = filtered.filter((n) => n.industry?.id === industryFilter)
    }

    // Status filter
    if (statusFilter !== "all") {
      filtered = filtered.filter((n) => (n.user_state?.status || "Research") === statusFilter)
    }

    // Favourites filter
    if (favouritesOnly) {
      filtered = filtered.filter((n) => n.user_state?.is_favourite)
    }

    // Sort
    if (sortBy === "alphabetical") {
      filtered.sort((a, b) => a.niche_name.localeCompare(b.niche_name))
    } else if (sortBy === "status") {
      const statusOrder = { Win: 0, "Coffee Date Demo": 1, "Outreach in Progress": 2, Shortlisted: 3, Research: 4 }
      filtered.sort((a, b) => {
        const aStatus = a.user_state?.status || "Research"
        const bStatus = b.user_state?.status || "Research"
        return statusOrder[aStatus as keyof typeof statusOrder] - statusOrder[bStatus as keyof typeof statusOrder]
      })
    } else if (sortBy === "potential") {
      filtered.sort((a, b) => (b.user_state?.potential_retainer || 0) - (a.user_state?.potential_retainer || 0))
    }

    setFilteredNiches(filtered)
  }

  const toggleFavourite = async (niche: Niche) => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) return

      const newFavState = !niche.user_state?.is_favourite

      const { error } = await supabase.from("niche_user_state").upsert(
        {
          niche_id: niche.id,
          user_id: user.id,
          is_favourite: newFavState,
          status: niche.user_state?.status || "Research",
        },
        {
          onConflict: "niche_id,user_id",
        },
      )

      if (error) throw error

      setNiches(
        niches.map((n) =>
          n.id === niche.id ? { ...n, user_state: { ...n.user_state!, is_favourite: newFavState } } : n,
        ),
      )

      if (selectedNiche?.id === niche.id) {
        setSelectedNiche({ ...selectedNiche, user_state: { ...selectedNiche.user_state!, is_favourite: newFavState } })
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      })
    }
  }

  const calculateAOV = (aov: number) => {
    const cpl = aov * 0.05 // 5% of AOV for cost per lead
    const cpa = aov / 3 // Customer acquisition cost is 1/3 of AOV
    const potentialRetainer = cpl * 100 // Estimate for 100 leads/month
    const profitSplit = potentialRetainer * 0.5

    return { cpl, cpa, potentialRetainer, profitSplit }
  }

  const updateNicheState = async (updates: Partial<Niche["user_state"]>) => {
    if (!selectedNiche) return

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) return

      const { error } = await supabase.from("niche_user_state").upsert(
        {
          niche_id: selectedNiche.id,
          user_id: user.id,
          ...selectedNiche.user_state,
          ...updates,
        },
        {
          onConflict: "niche_id,user_id",
        },
      )

      if (error) throw error

      const updatedNiche = {
        ...selectedNiche,
        user_state: { ...selectedNiche.user_state!, ...updates },
      }

      setSelectedNiche(updatedNiche)
      setNiches(niches.map((n) => (n.id === selectedNiche.id ? updatedNiche : n)))

      toast({
        title: "Saved",
        description: "Changes saved successfully",
      })
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      })
    }
  }

  const canAdvanceFromResearch = () => {
    if (!selectedNiche?.user_state) return false
    return (
      selectedNiche.user_state.research_notes_added &&
      selectedNiche.user_state.aov_calculator_completed &&
      selectedNiche.user_state.customer_profile_generated
    )
  }

  const canAdvanceFromShortlisted = () => {
    if (!selectedNiche?.user_state) return false
    return selectedNiche.user_state.messaging_prepared
  }

  const canAdvanceFromOutreach = () => {
    if (!selectedNiche?.user_state) return false
    return (
      selectedNiche.user_state.outreach_start_date &&
      selectedNiche.user_state.outreach_channels &&
      Object.keys(selectedNiche.user_state.outreach_channels).length > 0
    )
  }

  const advanceStatus = async (newStatus: string) => {
    await updateNicheState({ status: newStatus })
  }

  const generateCustomerProfile = async () => {
    if (!selectedNiche) return

    setGeneratingProfile(true)
    try {
      const response = await fetch("/api/opportunities/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "customer_profile",
          nicheName: selectedNiche.niche_name,
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to generate customer profile")
      }

      const result = await response.json()

      if (result.success && result.data) {
        await updateNicheState({
          customer_profile: result.data,
          customer_profile_generated: true,
        })
      } else {
        throw new Error("Invalid response format")
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to generate customer profile",
        variant: "destructive",
      })
    } finally {
      setGeneratingProfile(false)
    }
  }

  const generateMessaging = async () => {
    if (!selectedNiche) return

    setGeneratingMessaging(true)
    try {
      const response = await fetch("/api/opportunities/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "messaging",
          nicheName: selectedNiche.niche_name,
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to generate messaging scripts")
      }

      const result = await response.json()

      if (result.success && result.data) {
        await updateNicheState({
          messaging_scripts: result.data,
          messaging_prepared: true,
        })
      } else {
        throw new Error("Invalid response format")
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to generate messaging scripts",
        variant: "destructive",
      })
    } finally {
      setGeneratingMessaging(false)
    }
  }

  const generateDemoScript = async () => {
    if (!selectedNiche) return

    setGeneratingDemo(true)
    try {
      const response = await fetch("/api/opportunities/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "demo_script",
          nicheName: selectedNiche.niche_name,
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to generate demo script")
      }

      const result = await response.json()

      if (result.success && result.data) {
        await updateNicheState({
          demo_script: result.data,
          demo_script_created: true,
        })
      } else {
        throw new Error("Invalid response format")
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to generate demo script",
        variant: "destructive",
      })
    } finally {
      setGeneratingDemo(false)
    }
  }

  const startProfileChat = async () => {
    setIsProfileChatActive(true)
    setProfileChatMessages([
      {
        role: "assistant",
        content:
          "Hi! I'm here to help you define your Ideal Customer Profile for this niche. Let's start with your business - who do you currently serve in this space?",
      },
    ])
  }

  const sendProfileChatMessage = async () => {
    if (!profileChatInput.trim() || !selectedNiche) return

    const userMessage = { role: "user", content: profileChatInput }
    const updatedMessages = [...profileChatMessages, userMessage]
    setProfileChatMessages(updatedMessages)
    setProfileChatInput("")
    setIsProfileChatLoading(true)

    try {
      const response = await fetch("/api/opportunities/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: updatedMessages,
          nicheName: selectedNiche.niche_name,
        }),
      })

      if (!response.ok) throw new Error("Failed to get chat response")

      const result = await response.json()

      if (result.success) {
        const assistantMessage = { role: "assistant", content: result.message }
        setProfileChatMessages([...updatedMessages, assistantMessage])

        // If we have the complete ICP, save it
        if (result.icpComplete && result.customerProfile) {
          await updateNicheState({
            customer_profile: result.customerProfile,
            customer_profile_generated: true,
          })
          setIsProfileChatActive(false)
          toast({
            title: "Customer Profile Saved",
            description: "Your ICP has been generated and saved successfully!",
          })
        }
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to send message",
        variant: "destructive",
      })
    } finally {
      setIsProfileChatLoading(false)
    }
  }

  // Add toggleSection function
  const toggleSection = (section: string) => {
    setExpandedSections((prev) => ({ ...prev, [section]: !prev[section] }))
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-white" />
      </div>
    )
  }

  const currentStatus = selectedNiche?.user_state?.status || "Research"

  return (
    <div className="min-h-screen bg-black">
      <div className="border-b border-white/10 bg-black/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-[1800px] mx-auto px-6 py-4">
          <div className="flex items-center gap-4 flex-wrap">
            {/* Search */}
            <div className="relative flex-1 min-w-[240px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/40" />
              <Input
                placeholder="Search niches..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 bg-white/5 border-white/10 text-white placeholder:text-white/40"
              />
            </div>

            {/* Industry */}
            <Select value={industryFilter} onValueChange={setIndustryFilter}>
              <SelectTrigger className="w-[200px] bg-white/5 border-white/10 text-white">
                <SelectValue placeholder="All Industries" />
              </SelectTrigger>
              <SelectContent className="bg-[#111] border-white/10">
                <SelectItem value="all" className="text-white hover:bg-white/10">
                  All Industries
                </SelectItem>
                {industries.map((ind) => (
                  <SelectItem key={ind.id} value={ind.id} className="text-white hover:bg-white/10">
                    {ind.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Status */}
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[200px] bg-white/5 border-white/10 text-white">
                <SelectValue placeholder="All Statuses" />
              </SelectTrigger>
              <SelectContent className="bg-[#111] border-white/10">
                <SelectItem value="all" className="text-white hover:bg-white/10">
                  All Statuses
                </SelectItem>
                {STATUSES.map((status) => (
                  <SelectItem key={status} value={status} className="text-white hover:bg-white/10">
                    {status}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Sort */}
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-[200px] bg-white/5 border-white/10 text-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-[#111] border-white/10">
                <SelectItem value="alphabetical" className="text-white hover:bg-white/10">
                  Alphabetical
                </SelectItem>
                <SelectItem value="status" className="text-white hover:bg-white/10">
                  Status Order
                </SelectItem>
                <SelectItem value="potential" className="text-white hover:bg-white/10">
                  Highest Potential Value
                </SelectItem>
              </SelectContent>
            </Select>

            {/* Favourites */}
            <label className="flex items-center gap-2 cursor-pointer">
              <Checkbox
                checked={favouritesOnly}
                onCheckedChange={(checked) => setFavouritesOnly(checked as boolean)}
                className="border-white/20"
              />
              <span className="text-sm text-white">Favourites</span>
            </label>
          </div>
        </div>
      </div>

      <div className="max-w-[1800px] mx-auto px-6 py-6">
        <div className="grid grid-cols-12 gap-6">
          {/* Niche List */}
          <div className="col-span-5 space-y-3">
            <h2 className="text-sm font-semibold text-white/60 px-2">
              {filteredNiches.length} {filteredNiches.length === 1 ? "Niche" : "Niches"}
            </h2>
            <div className="space-y-2 max-h-[calc(100vh-180px)] overflow-y-auto pr-2 [&::-webkit-scrollbar]:w-1 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-white/10 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:hover:bg-white/20">
              {filteredNiches.map((niche) => (
                <Card
                  key={niche.id}
                  onClick={() => setSelectedNiche(niche)}
                  className={cn(
                    "p-4 cursor-pointer transition-all border",
                    selectedNiche?.id === niche.id
                      ? "bg-white/10 border-primary"
                      : "bg-white/5 border-white/10 hover:bg-white/8",
                  )}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <h3 className="text-sm font-medium text-white truncate">{niche.niche_name}</h3>
                      <p className="text-xs text-white/60 mt-1">{niche.industry?.name}</p>
                      <div className="flex items-center gap-2 mt-2">
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/5 text-white/70">
                          {niche.user_state?.status || "Research"}
                        </span>
                        {niche.user_state?.potential_retainer && (
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-primary/20 text-primary">
                            ${Math.round(niche.user_state.potential_retainer)}/mo
                          </span>
                        )}
                      </div>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        toggleFavourite(niche)
                      }}
                      className="shrink-0"
                    >
                      <Star
                        className={cn(
                          "h-4 w-4",
                          niche.user_state?.is_favourite ? "fill-yellow-400 text-yellow-400" : "text-white/30",
                        )}
                      />
                    </button>
                  </div>
                </Card>
              ))}
            </div>
          </div>

          <div className="col-span-7">
            {selectedNiche ? (
              <Card className="border border-white/10 bg-white/5 p-6 space-y-6 max-h-[calc(100vh-180px)] overflow-y-auto [&::-webkit-scrollbar]:w-1 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-white/10 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:hover:bg-white/20">
                {/* Header */}
                <div className="flex items-start justify-between">
                  <div>
                    <h2 className="text-xl font-bold text-white">{selectedNiche.niche_name}</h2>
                    <p className="text-sm text-white/60 mt-1">{selectedNiche.industry?.name}</p>
                  </div>
                  <button onClick={() => setSelectedNiche(null)} className="text-white/60 hover:text-white">
                    <X className="h-5 w-5" />
                  </button>
                </div>

                {/* Status Pipeline */}
                <div className="flex items-center gap-2 flex-wrap">
                  {STATUSES.map((status, idx) => (
                    <div key={status} className="flex items-center gap-2">
                      <div
                        className={cn(
                          "px-3 py-1 rounded-full text-xs font-medium transition-colors",
                          currentStatus === status
                            ? "bg-primary text-white"
                            : STATUSES.indexOf(currentStatus) > idx
                              ? "bg-green-500/20 text-green-400"
                              : "bg-white/5 text-white/40",
                        )}
                      >
                        {status}
                      </div>
                      {idx < STATUSES.length - 1 && <ChevronRight className="h-4 w-4 text-white/20" />}
                    </div>
                  ))}
                </div>

                <div className="space-y-4">
                  {/* Research Phase - Always Available */}
                  <div className="border border-white/10 rounded-lg overflow-hidden">
                    <button
                      onClick={() => toggleSection("research")}
                      className="w-full p-4 bg-white/5 hover:bg-white/8 transition-colors flex items-center justify-between"
                    >
                      <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                        <Calculator className="h-5 w-5 text-primary" />
                        Research Phase
                        {selectedNiche.user_state?.research_notes_added &&
                          selectedNiche.user_state?.aov_calculator_completed &&
                          selectedNiche.user_state?.customer_profile_generated && (
                            <CheckCircle2 className="h-4 w-4 text-green-400 ml-2" />
                          )}
                      </h3>
                      {expandedSections.research ? (
                        <ChevronUp className="h-5 w-5 text-white/60" />
                      ) : (
                        <ChevronDown className="h-5 w-5 text-white/60" />
                      )}
                    </button>

                    {expandedSections.research && (
                      <div className="p-4 space-y-4">
                        {/* Research Notes */}
                        <div className="space-y-2">
                          <Label className="text-white">Research Notes</Label>
                          <Textarea
                            value={localInputs.researchNotes}
                            onChange={(e) => setLocalInputs({ ...localInputs, researchNotes: e.target.value })}
                            onBlur={() => {
                              updateNicheState({
                                research_notes: localInputs.researchNotes,
                                research_notes_added: !!localInputs.researchNotes,
                              })
                            }}
                            placeholder="Add your research notes..."
                            className="bg-white/5 border-white/10 text-white placeholder:text-white/40 min-h-[100px]"
                          />
                          <div className="flex items-center gap-2">
                            <Checkbox
                              checked={selectedNiche.user_state?.research_notes_added || false}
                              disabled={!localInputs.researchNotes}
                              onCheckedChange={(checked) =>
                                updateNicheState({ research_notes_added: checked as boolean })
                              }
                              className="border-white/20 disabled:opacity-30 disabled:cursor-not-allowed"
                            />
                            <span
                              className={cn("text-sm", localInputs.researchNotes ? "text-white/70" : "text-white/40")}
                            >
                              Notes Added {!localInputs.researchNotes && "(add notes first)"}
                            </span>
                          </div>
                        </div>

                        {/* AOV Calculator */}
                        <div className="space-y-3 p-4 bg-black/20 rounded-lg border border-white/10">
                          <h4 className="text-sm font-semibold text-white">AOV Calculator</h4>
                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <Label className="text-xs text-white/70">Average Order Value ($)</Label>
                              <Input
                                type="number"
                                value={localInputs.aovInput}
                                onChange={(e) => setLocalInputs({ ...localInputs, aovInput: e.target.value })}
                                onBlur={() => {
                                  const aov = localInputs.aovInput === "" ? 0 : Number(localInputs.aovInput)

                                  if (aov > 0) {
                                    const calc = calculateAOV(aov)
                                    updateNicheState({
                                      aov_input: aov,
                                      cpl_calculated: calc.cpl,
                                      cpa_calculated: calc.cpa,
                                      potential_retainer: calc.potentialRetainer,
                                      profit_split_potential: calc.profitSplit,
                                      aov_calculator_completed: true,
                                    })
                                  } else if (localInputs.aovInput === "") {
                                    updateNicheState({
                                      aov_input: null,
                                      aov_calculator_completed: false, // Reset if cleared
                                    })
                                  }
                                }}
                                placeholder="5000"
                                min="0"
                                step="100"
                                className="bg-white/5 border-white/10 text-white placeholder:text-white/40 mt-1"
                              />
                            </div>
                            <div>
                              <Label className="text-xs text-white/70">Database Size (optional)</Label>
                              <Input
                                type="number"
                                value={localInputs.databaseSizeInput}
                                onChange={(e) => setLocalInputs({ ...localInputs, databaseSizeInput: e.target.value })}
                                onBlur={() => {
                                  updateNicheState({
                                    database_size_input:
                                      localInputs.databaseSizeInput === ""
                                        ? null
                                        : Number(localInputs.databaseSizeInput),
                                  })
                                }}
                                placeholder="1000"
                                min="0"
                                step="100"
                                className="bg-white/5 border-white/10 text-white placeholder:text-white/40 mt-1"
                              />
                            </div>
                          </div>

                          {selectedNiche.user_state?.aov_input && selectedNiche.user_state.aov_input > 0 && (
                            <div className="grid grid-cols-2 gap-3 pt-3 border-t border-white/10">
                              <div>
                                <p className="text-[10px] text-white/50 uppercase tracking-wider">Cost Per Lead</p>
                                <p className="text-lg font-semibold text-white">
                                  ${selectedNiche.user_state.cpl_calculated?.toFixed(2)}
                                </p>
                              </div>
                              <div>
                                <p className="text-[10px] text-white/50 uppercase tracking-wider">
                                  Cost Per Acquisition
                                </p>
                                <p className="text-lg font-semibold text-white">
                                  ${selectedNiche.user_state.cpa_calculated?.toFixed(2)}
                                </p>
                              </div>
                              <div>
                                <p className="text-[10px] text-white/50 uppercase tracking-wider">Potential Retainer</p>
                                <p className="text-lg font-semibold text-primary">
                                  ${selectedNiche.user_state.potential_retainer?.toFixed(0)}
                                  <span className="text-xs text-white/60">/mo</span>
                                </p>
                              </div>
                              <div>
                                <p className="text-[10px] text-white/50 uppercase tracking-wider">50% Profit Split</p>
                                <p className="text-lg font-semibold text-primary">
                                  ${selectedNiche.user_state.profit_split_potential?.toFixed(0)}
                                  <span className="text-xs text-white/60">/mo</span>
                                </p>
                              </div>
                            </div>
                          )}

                          <div className="flex items-center gap-2 pt-2">
                            <Checkbox
                              checked={selectedNiche.user_state?.aov_calculator_completed || false}
                              disabled={!selectedNiche.user_state?.aov_input || selectedNiche.user_state.aov_input <= 0}
                              onCheckedChange={(checked) =>
                                updateNicheState({ aov_calculator_completed: checked as boolean })
                              }
                              className="border-white/20 disabled:opacity-30 disabled:cursor-not-allowed"
                            />
                            <span
                              className={cn(
                                "text-sm",
                                selectedNiche.user_state?.aov_input ? "text-white/70" : "text-white/40",
                              )}
                            >
                              AOV Calculator Completed{" "}
                              {(!selectedNiche.user_state?.aov_input || selectedNiche.user_state.aov_input <= 0) &&
                                "(enter AOV first)"}
                            </span>
                          </div>
                        </div>

                        <div className="space-y-3 p-4 bg-black/20 rounded-lg border border-white/10">
                          <h4 className="text-sm font-semibold text-white">Customer Profile Generator</h4>

                          {!isProfileChatActive && !selectedNiche.user_state?.customer_profile && (
                            <Button
                              onClick={startProfileChat}
                              disabled={generatingProfile}
                              className="w-full bg-primary hover:bg-primary/90"
                            >
                              Start ICP Interview
                            </Button>
                          )}

                          {isProfileChatActive && (
                            <div className="space-y-3">
                              <div className="max-h-[300px] overflow-y-auto space-y-3 p-3 bg-black/40 rounded border border-white/5 [&::-webkit-scrollbar]:w-1 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-white/10 [&::-webkit-scrollbar-thumb]:rounded-full">
                                {profileChatMessages.map((msg, idx) => (
                                  <div
                                    key={idx}
                                    className={cn(
                                      "p-3 rounded-lg text-sm",
                                      msg.role === "assistant"
                                        ? "bg-primary/10 text-white/90 border border-primary/20"
                                        : "bg-white/5 text-white/80 ml-8",
                                    )}
                                  >
                                    {msg.content}
                                  </div>
                                ))}
                                {isProfileChatLoading && (
                                  <div className="p-3 rounded-lg text-sm bg-primary/10 text-white/90 border border-primary/20">
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                  </div>
                                )}
                              </div>

                              <div className="flex gap-2">
                                <Input
                                  value={profileChatInput}
                                  onChange={(e) => setProfileChatInput(e.target.value)}
                                  onKeyDown={(e) => {
                                    if (e.key === "Enter" && !e.shiftKey) {
                                      e.preventDefault()
                                      sendProfileChatMessage()
                                    }
                                  }}
                                  placeholder="Type your answer..."
                                  disabled={isProfileChatLoading}
                                  className="flex-1 bg-white/5 border-white/10 text-white placeholder:text-white/40"
                                />
                                <Button
                                  onClick={sendProfileChatMessage}
                                  disabled={isProfileChatLoading || !profileChatInput.trim()}
                                  size="sm"
                                  className="bg-primary hover:bg-primary/90"
                                >
                                  Send
                                </Button>
                              </div>

                              <Button
                                onClick={() => {
                                  setIsProfileChatActive(false)
                                  setProfileChatMessages([])
                                }}
                                variant="outline"
                                size="sm"
                                className="w-full border-white/10 text-white/60 hover:text-white hover:bg-white/5"
                              >
                                Cancel Interview
                              </Button>
                            </div>
                          )}

                          {selectedNiche.user_state?.customer_profile && (
                            <div className="space-y-2">
                              <div className="text-xs text-white/80 space-y-2 p-3 bg-white/5 rounded border border-white/5">
                                <p>
                                  <strong className="text-white">Decision Maker:</strong>{" "}
                                  {selectedNiche.user_state.customer_profile.decision_maker}
                                </p>
                                <p>
                                  <strong className="text-white">Pain Points:</strong>{" "}
                                  {selectedNiche.user_state.customer_profile.pain_points}
                                </p>
                                {selectedNiche.user_state.customer_profile.gathering_places && (
                                  <p>
                                    <strong className="text-white">Where to Find Them:</strong>{" "}
                                    {selectedNiche.user_state.customer_profile.gathering_places}
                                  </p>
                                )}
                              </div>
                              <Button
                                onClick={startProfileChat}
                                variant="outline"
                                size="sm"
                                className="w-full border-white/10 text-white/60 hover:text-white hover:bg-white/5 bg-transparent"
                              >
                                Refine ICP
                              </Button>
                            </div>
                          )}

                          <div className="flex items-center gap-2">
                            <Checkbox
                              checked={selectedNiche.user_state?.customer_profile_generated || false}
                              disabled={!selectedNiche.user_state?.customer_profile}
                              onCheckedChange={(checked) =>
                                updateNicheState({ customer_profile_generated: checked as boolean })
                              }
                              className="border-white/20 disabled:opacity-30 disabled:cursor-not-allowed"
                            />
                            <span
                              className={cn(
                                "text-sm",
                                selectedNiche.user_state?.customer_profile ? "text-white/70" : "text-white/40",
                              )}
                            >
                              Customer Profile Generated{" "}
                              {!selectedNiche.user_state?.customer_profile && "(generate profile first)"}
                            </span>
                          </div>
                        </div>

                        {currentStatus === "Research" && (
                          <Button
                            onClick={() => advanceStatus("Shortlisted")}
                            disabled={!canAdvanceFromResearch()}
                            className={cn(
                              "w-full",
                              canAdvanceFromResearch()
                                ? "bg-primary hover:bg-primary/90"
                                : "bg-white/5 text-white/40 cursor-not-allowed",
                            )}
                          >
                            {canAdvanceFromResearch() ? (
                              <>
                                Complete Research & Move to Shortlisted <ChevronRight className="ml-2 h-4 w-4" />
                              </>
                            ) : (
                              <>Complete All Research Tasks First</>
                            )}
                          </Button>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Shortlisted Phase */}
                  {(currentStatus === "Shortlisted" ||
                    STATUSES.indexOf(currentStatus) > STATUSES.indexOf("Shortlisted")) && (
                    <div className="space-y-4 p-4 bg-white/5 rounded-lg border border-white/10">
                      <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                        <MessageSquare className="h-5 w-5 text-primary" />
                        Messaging Preparation
                        {selectedNiche.user_state?.messaging_prepared && (
                          <CheckCircle2 className="h-4 w-4 text-green-400 ml-2" />
                        )}
                      </h3>

                      <Button
                        onClick={generateMessaging}
                        disabled={generatingMessaging}
                        className="w-full bg-primary hover:bg-primary/90"
                      >
                        {generatingMessaging ? (
                          <>
                            <Loader2 className="h-4 w-4 animate-spin mr-2" />
                            Generating Messaging...
                          </>
                        ) : (
                          "Generate Outreach Scripts"
                        )}
                      </Button>

                      {selectedNiche.user_state?.messaging_scripts && (
                        <div className="p-4 bg-black/20 rounded-lg border border-white/10 text-xs text-white/80 space-y-3">
                          <div>
                            <strong className="text-white block mb-1">LinkedIn:</strong>
                            <p className="text-white/70">{selectedNiche.user_state.messaging_scripts.linkedin}</p>
                          </div>
                          <div>
                            <strong className="text-white block mb-1">Email:</strong>
                            <p className="text-white/70">{selectedNiche.user_state.messaging_scripts.email}</p>
                          </div>
                        </div>
                      )}

                      <div className="flex items-center gap-2">
                        <Checkbox
                          checked={selectedNiche.user_state?.messaging_prepared || false}
                          onCheckedChange={(checked) => updateNicheState({ messaging_prepared: checked as boolean })}
                          className="border-white/20"
                        />
                        <span className="text-sm text-white/70">Messaging Prepared</span>
                      </div>

                      {currentStatus === "Shortlisted" && canAdvanceFromShortlisted() && (
                        <Button
                          onClick={() => advanceStatus("Outreach in Progress")}
                          className="w-full bg-primary hover:bg-primary/90"
                        >
                          Begin Outreach <ChevronRight className="ml-2 h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  )}

                  {/* Outreach Phase */}
                  {(currentStatus === "Outreach in Progress" ||
                    STATUSES.indexOf(currentStatus) > STATUSES.indexOf("Outreach in Progress")) && (
                    <div className="space-y-4 p-4 bg-white/5 rounded-lg border border-white/10">
                      <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                        <Calendar className="h-5 w-5 text-primary" />
                        Outreach Tracker
                        {canAdvanceFromOutreach() && <CheckCircle2 className="h-4 w-4 text-green-400 ml-2" />}
                      </h3>

                      <div className="space-y-3">
                        <div>
                          <Label className="text-white">Outreach Start Date</Label>
                          <Input
                            type="date"
                            value={selectedNiche.user_state?.outreach_start_date || ""}
                            onChange={(e) => updateNicheState({ outreach_start_date: e.target.value })}
                            className="bg-white/5 border-white/10 text-white placeholder:text-white/40 mt-1"
                          />
                        </div>

                        <div>
                          <Label className="text-white">Messages Sent</Label>
                          <Input
                            type="number"
                            value={selectedNiche.user_state?.outreach_messages_sent || 0}
                            onChange={(e) => updateNicheState({ outreach_messages_sent: Number(e.target.value) })}
                            className="bg-white/5 border-white/10 text-white placeholder:text-white/40 mt-1"
                          />
                        </div>

                        <div>
                          <Label className="text-white">Outreach Notes</Label>
                          <Textarea
                            value={localInputs.outreachNotes}
                            onChange={(e) => setLocalInputs({ ...localInputs, outreachNotes: e.target.value })}
                            onBlur={() => updateNicheState({ outreach_notes: localInputs.outreachNotes })}
                            placeholder="Track responses, scheduling, etc..."
                            className="bg-white/5 border-white/10 text-white placeholder:text-white/40"
                          />
                        </div>
                      </div>

                      {currentStatus === "Outreach in Progress" && canAdvanceFromOutreach() && (
                        <Button
                          onClick={generateDemoScript}
                          disabled={generatingDemo}
                          className="w-full bg-primary hover:bg-primary/90"
                        >
                          {generatingDemo ? (
                            <>
                              <Loader2 className="h-4 w-4 animate-spin mr-2" />
                              Creating Demo Script...
                            </>
                          ) : (
                            "Create Coffee Date Demo Script"
                          )}
                        </Button>
                      )}
                    </div>
                  )}

                  {/* Coffee Date Demo Phase */}
                  {(currentStatus === "Coffee Date Demo" ||
                    STATUSES.indexOf(currentStatus) > STATUSES.indexOf("Coffee Date Demo")) && (
                    <div className="space-y-4 p-4 bg-white/5 rounded-lg border border-white/10">
                      <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                        <CheckCircle2 className="h-5 w-5 text-primary" />
                        Coffee Date Demo
                        {selectedNiche.user_state?.coffee_date_completed && (
                          <CheckCircle2 className="h-4 w-4 text-green-400 ml-2" />
                        )}
                      </h3>

                      {selectedNiche.user_state?.demo_script && (
                        <div className="p-4 bg-black/20 rounded-lg border border-white/10">
                          <p className="text-sm text-white/80 whitespace-pre-wrap leading-relaxed">
                            {selectedNiche.user_state.demo_script}
                          </p>
                        </div>
                      )}

                      <div className="flex items-center gap-2">
                        <Checkbox
                          checked={selectedNiche.user_state?.coffee_date_completed || false}
                          onCheckedChange={(checked) => updateNicheState({ coffee_date_completed: checked as boolean })}
                          className="border-white/20"
                        />
                        <span className="text-sm text-white/70">Coffee Date Completed</span>
                      </div>

                      {currentStatus === "Coffee Date Demo" && selectedNiche.user_state?.coffee_date_completed && (
                        <div className="space-y-2">
                          <Label className="text-white">GHL Sub-Account ID (triggers Win status)</Label>
                          <Input
                            value={selectedNiche.user_state?.ghl_sub_account_id || ""}
                            onChange={(e) => {
                              const ghlId = e.target.value
                              if (ghlId) {
                                updateNicheState({
                                  ghl_sub_account_id: ghlId,
                                  status: "Win",
                                  win_completed: true,
                                })
                              } else {
                                updateNicheState({
                                  ghl_sub_account_id: null,
                                  status: "Coffee Date Demo",
                                  win_completed: false,
                                })
                              }
                            }}
                            placeholder="Enter GHL Sub-Account ID"
                            className="bg-white/5 border-white/10 text-white placeholder:text-white/40"
                          />
                        </div>
                      )}
                    </div>
                  )}

                  {/* Win Phase */}
                  {currentStatus === "Win" && (
                    <div className="space-y-4 p-4 bg-green-500/10 rounded-lg border border-green-500/20">
                      <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                        <Trophy className="h-5 w-5 text-green-400" />
                        Win - Active Client 🎉
                      </h3>

                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <Label className="text-white">Active Monthly Retainer ($)</Label>
                          <Input
                            type="number"
                            value={selectedNiche.user_state?.active_monthly_retainer || ""}
                            onChange={(e) => updateNicheState({ active_monthly_retainer: Number(e.target.value) })}
                            placeholder="5000"
                            className="bg-white/5 border-white/10 text-white placeholder:text-white/40 mt-1"
                          />
                        </div>
                        <div>
                          <Label className="text-white">Monthly Profit Split ($)</Label>
                          <Input
                            type="number"
                            value={selectedNiche.user_state?.monthly_profit_split || ""}
                            onChange={(e) => updateNicheState({ monthly_profit_split: Number(e.target.value) })}
                            placeholder="2500"
                            className="bg-white/5 border-white/10 text-white placeholder:text-white/40 mt-1"
                          />
                        </div>
                      </div>

                      <div>
                        <Label className="text-white">Target Monthly Recurring Revenue ($)</Label>
                        <Input
                          type="number"
                          value={selectedNiche.user_state?.target_monthly_recurring || ""}
                          onChange={(e) => updateNicheState({ target_monthly_recurring: Number(e.target.value) })}
                          placeholder="10000"
                          className="bg-white/5 border-white/10 text-white placeholder:text-white/40 mt-1"
                        />
                      </div>

                      {selectedNiche.user_state?.ghl_sub_account_id && (
                        <div className="p-3 bg-green-500/10 rounded border border-green-500/20">
                          <p className="text-xs text-green-400 font-mono">
                            GHL Sub-Account: {selectedNiche.user_state.ghl_sub_account_id}
                          </p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </Card>
            ) : (
              <Card className="border border-white/10 bg-white/5 p-12 text-center h-full flex items-center justify-center">
                <div>
                  <Search className="h-12 w-12 text-white/20 mx-auto mb-4" />
                  <p className="text-white/60">Select a niche to view details and manage the workflow</p>
                </div>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
