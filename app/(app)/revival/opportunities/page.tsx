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
    // Coffee Date phase
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

  // AI generation states
  const [generatingProfile, setGeneratingProfile] = useState(false)
  const [generatingMessaging, setGeneratingMessaging] = useState(false)
  const [generatingDemo, setGeneratingDemo] = useState(false)

  const { toast } = useToast()
  const supabase = createClient()

  useEffect(() => {
    loadData()
  }, [])

  useEffect(() => {
    applyFilters()
  }, [niches, searchTerm, industryFilter, statusFilter, favouritesOnly, sortBy])

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
    const cpl = (aov / 3) * 0.05
    const cpa = aov / 3
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
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [
            {
              role: "user",
              content: `Generate a detailed customer profile for "${selectedNiche.niche_name}" businesses. Include: decision maker, pain points, objections, buying triggers, language style, and where they gather online. Format as JSON.`,
            },
          ],
        }),
      })

      const data = await response.json()
      await updateNicheState({
        customer_profile: JSON.parse(data.message || "{}"),
        customer_profile_generated: true,
      })
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" })
    } finally {
      setGeneratingProfile(false)
    }
  }

  const generateMessaging = async () => {
    if (!selectedNiche) return

    setGeneratingMessaging(true)
    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [
            {
              role: "user",
              content: `Generate outreach messaging for "${selectedNiche.niche_name}": LinkedIn messages, Facebook Group posts, Email scripts, Forum posts, and lead magnet angles. Format as JSON.`,
            },
          ],
        }),
      })

      const data = await response.json()
      await updateNicheState({
        messaging_scripts: JSON.parse(data.message || "{}"),
      })
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" })
    } finally {
      setGeneratingMessaging(false)
    }
  }

  const generateDemoScript = async () => {
    if (!selectedNiche) return

    setGeneratingDemo(true)
    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [
            {
              role: "user",
              content: `Create a Coffee Date Demo script for "${selectedNiche.niche_name}" showcasing Aether Revive's dead lead revival features.`,
            },
          ],
        }),
      })

      const data = await response.json()
      await updateNicheState({
        demo_script: data.message,
        demo_script_created: true,
        status: "Coffee Date Demo",
      })
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" })
    } finally {
      setGeneratingDemo(false)
    }
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
            <div className="space-y-2 max-h-[calc(100vh-180px)] overflow-y-auto pr-2">
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
              <Card className="border border-white/10 bg-white/5 p-6 space-y-6 max-h-[calc(100vh-180px)] overflow-y-auto">
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
                <div className="flex items-center gap-2">
                  {STATUSES.map((status, idx) => (
                    <div key={status} className="flex items-center gap-2">
                      <div
                        className={cn(
                          "px-3 py-1 rounded-full text-xs font-medium",
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

                {currentStatus === "Research" && (
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                      <Calculator className="h-5 w-5 text-primary" />
                      Research Phase
                    </h3>

                    {/* Research Notes */}
                    <div className="space-y-2">
                      <Label className="text-white">Research Notes</Label>
                      <Textarea
                        value={selectedNiche.user_state?.research_notes || ""}
                        onChange={(e) => updateNicheState({ research_notes: e.target.value })}
                        placeholder="Add your research notes..."
                        className="bg-white/5 border-white/10 text-white min-h-[100px]"
                      />
                      <Checkbox
                        checked={selectedNiche.user_state?.research_notes_added || false}
                        onCheckedChange={(checked) => updateNicheState({ research_notes_added: checked as boolean })}
                        className="border-white/20"
                      />
                      <span className="text-sm text-white/70 ml-2">Notes Added</span>
                    </div>

                    {/* AOV Calculator */}
                    <div className="space-y-3 p-4 bg-white/5 rounded-lg border border-white/10">
                      <h4 className="text-sm font-semibold text-white">AOV Calculator</h4>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <Label className="text-xs text-white/70">Average Order Value</Label>
                          <Input
                            type="number"
                            value={selectedNiche.user_state?.aov_input || ""}
                            onChange={(e) => {
                              const aov = Number(e.target.value)
                              const calc = calculateAOV(aov)
                              updateNicheState({
                                aov_input: aov,
                                cpl_calculated: calc.cpl,
                                cpa_calculated: calc.cpa,
                                potential_retainer: calc.potentialRetainer,
                                profit_split_potential: calc.profitSplit,
                              })
                            }}
                            placeholder="5000"
                            className="bg-white/5 border-white/10 text-white mt-1"
                          />
                        </div>
                        <div>
                          <Label className="text-xs text-white/70">Database Size (optional)</Label>
                          <Input
                            type="number"
                            value={selectedNiche.user_state?.database_size_input || ""}
                            onChange={(e) => updateNicheState({ database_size_input: Number(e.target.value) })}
                            placeholder="1000"
                            className="bg-white/5 border-white/10 text-white mt-1"
                          />
                        </div>
                      </div>

                      {selectedNiche.user_state?.aov_input && (
                        <div className="grid grid-cols-2 gap-3 pt-2 border-t border-white/10">
                          <div>
                            <p className="text-[10px] text-white/50">CPL</p>
                            <p className="text-sm font-semibold text-white">
                              ${selectedNiche.user_state.cpl_calculated?.toFixed(2)}
                            </p>
                          </div>
                          <div>
                            <p className="text-[10px] text-white/50">CPA</p>
                            <p className="text-sm font-semibold text-white">
                              ${selectedNiche.user_state.cpa_calculated?.toFixed(2)}
                            </p>
                          </div>
                          <div>
                            <p className="text-[10px] text-white/50">Potential Retainer</p>
                            <p className="text-sm font-semibold text-primary">
                              ${selectedNiche.user_state.potential_retainer?.toFixed(0)}/mo
                            </p>
                          </div>
                          <div>
                            <p className="text-[10px] text-white/50">50% Profit Split</p>
                            <p className="text-sm font-semibold text-primary">
                              ${selectedNiche.user_state.profit_split_potential?.toFixed(0)}/mo
                            </p>
                          </div>
                        </div>
                      )}

                      <div className="flex items-center gap-2">
                        <Checkbox
                          checked={selectedNiche.user_state?.aov_calculator_completed || false}
                          onCheckedChange={(checked) =>
                            updateNicheState({ aov_calculator_completed: checked as boolean })
                          }
                          className="border-white/20"
                        />
                        <span className="text-sm text-white/70">AOV Calculator Completed</span>
                      </div>
                    </div>

                    {/* Customer Profile Generator */}
                    <div className="space-y-3 p-4 bg-white/5 rounded-lg border border-white/10">
                      <h4 className="text-sm font-semibold text-white">Customer Profile Generator</h4>
                      <Button
                        onClick={generateCustomerProfile}
                        disabled={generatingProfile}
                        className="w-full bg-primary hover:bg-primary/90"
                      >
                        {generatingProfile ? (
                          <>
                            <Loader2 className="h-4 w-4 animate-spin mr-2" />
                            Generating...
                          </>
                        ) : (
                          "Generate Customer Profile"
                        )}
                      </Button>

                      {selectedNiche.user_state?.customer_profile && (
                        <div className="text-xs text-white/80 space-y-1">
                          <p>
                            <strong>Decision Maker:</strong> {selectedNiche.user_state.customer_profile.decision_maker}
                          </p>
                          <p>
                            <strong>Pain Points:</strong> {selectedNiche.user_state.customer_profile.pain_points}
                          </p>
                        </div>
                      )}

                      <div className="flex items-center gap-2">
                        <Checkbox
                          checked={selectedNiche.user_state?.customer_profile_generated || false}
                          onCheckedChange={(checked) =>
                            updateNicheState({ customer_profile_generated: checked as boolean })
                          }
                          className="border-white/20"
                        />
                        <span className="text-sm text-white/70">Customer Profile Generated</span>
                      </div>
                    </div>

                    {/* Advance Button */}
                    {canAdvanceFromResearch() && (
                      <Button
                        onClick={() => advanceStatus("Shortlisted")}
                        className="w-full bg-primary hover:bg-primary/90"
                      >
                        Move to Shortlisted <ChevronRight className="ml-2 h-4 w-4" />
                      </Button>
                    )}
                  </div>
                )}

                {currentStatus === "Shortlisted" && (
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                      <MessageSquare className="h-5 w-5 text-primary" />
                      Messaging Preparation
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
                      <div className="p-4 bg-white/5 rounded-lg border border-white/10 text-xs text-white/80 space-y-2">
                        <p>
                          <strong>LinkedIn:</strong> {selectedNiche.user_state.messaging_scripts.linkedin}
                        </p>
                        <p>
                          <strong>Email:</strong> {selectedNiche.user_state.messaging_scripts.email}
                        </p>
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

                    {canAdvanceFromShortlisted() && (
                      <Button
                        onClick={() => advanceStatus("Outreach in Progress")}
                        className="w-full bg-primary hover:bg-primary/90"
                      >
                        Begin Outreach <ChevronRight className="ml-2 h-4 w-4" />
                      </Button>
                    )}
                  </div>
                )}

                {currentStatus === "Outreach in Progress" && (
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                      <Calendar className="h-5 w-5 text-primary" />
                      Outreach Tracker
                    </h3>

                    <div className="space-y-3">
                      <div>
                        <Label className="text-white">Outreach Start Date</Label>
                        <Input
                          type="date"
                          value={selectedNiche.user_state?.outreach_start_date || ""}
                          onChange={(e) => updateNicheState({ outreach_start_date: e.target.value })}
                          className="bg-white/5 border-white/10 text-white mt-1"
                        />
                      </div>

                      <div>
                        <Label className="text-white">Messages Sent</Label>
                        <Input
                          type="number"
                          value={selectedNiche.user_state?.outreach_messages_sent || 0}
                          onChange={(e) => updateNicheState({ outreach_messages_sent: Number(e.target.value) })}
                          className="bg-white/5 border-white/10 text-white mt-1"
                        />
                      </div>

                      <div>
                        <Label className="text-white">Outreach Notes</Label>
                        <Textarea
                          value={selectedNiche.user_state?.outreach_notes || ""}
                          onChange={(e) => updateNicheState({ outreach_notes: e.target.value })}
                          className="bg-white/5 border-white/10 text-white"
                        />
                      </div>
                    </div>

                    {canAdvanceFromOutreach() && (
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
                          "Create Coffee Date Demo Prompt"
                        )}
                      </Button>
                    )}
                  </div>
                )}

                {currentStatus === "Coffee Date Demo" && (
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                      <CheckCircle2 className="h-5 w-5 text-primary" />
                      Coffee Date Demo
                    </h3>

                    {selectedNiche.user_state?.demo_script && (
                      <div className="p-4 bg-white/5 rounded-lg border border-white/10">
                        <p className="text-sm text-white/80 whitespace-pre-wrap">
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

                    {selectedNiche.user_state?.coffee_date_completed && (
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
                            }
                          }}
                          placeholder="Enter GHL Sub-Account ID"
                          className="bg-white/5 border-white/10 text-white"
                        />
                      </div>
                    )}
                  </div>
                )}

                {currentStatus === "Win" && (
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                      <Trophy className="h-5 w-5 text-primary" />
                      Win - Active Client
                    </h3>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <Label className="text-white">Active Monthly Retainer</Label>
                        <Input
                          type="number"
                          value={selectedNiche.user_state?.active_monthly_retainer || ""}
                          onChange={(e) => updateNicheState({ active_monthly_retainer: Number(e.target.value) })}
                          placeholder="5000"
                          className="bg-white/5 border-white/10 text-white mt-1"
                        />
                      </div>
                      <div>
                        <Label className="text-white">Monthly Profit Split</Label>
                        <Input
                          type="number"
                          value={selectedNiche.user_state?.monthly_profit_split || ""}
                          onChange={(e) => updateNicheState({ monthly_profit_split: Number(e.target.value) })}
                          placeholder="2500"
                          className="bg-white/5 border-white/10 text-white mt-1"
                        />
                      </div>
                    </div>

                    <div>
                      <Label className="text-white">Target Monthly Recurring Revenue</Label>
                      <Input
                        type="number"
                        value={selectedNiche.user_state?.target_monthly_recurring || ""}
                        onChange={(e) => updateNicheState({ target_monthly_recurring: Number(e.target.value) })}
                        placeholder="10000"
                        className="bg-white/5 border-white/10 text-white mt-1"
                      />
                    </div>

                    <div className="p-4 bg-green-500/10 rounded-lg border border-green-500/20">
                      <p className="text-sm text-green-400 font-semibold">This opportunity is now a Win! 🎉</p>
                      <p className="text-xs text-white/60 mt-1">
                        GHL Sub-Account: {selectedNiche.user_state?.ghl_sub_account_id}
                      </p>
                    </div>
                  </div>
                )}
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
