"use client"

import { useState, useEffect, useCallback } from "react"
import { createBrowserClient } from "@supabase/ssr"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { cn } from "@/lib/utils"
import {
  Star,
  X,
  Search,
  ChevronRight,
  CheckCircle,
  Target,
  MessageSquare,
  Mail,
  Phone,
  Users,
  TrendingUp,
  AlertTriangle,
  Lightbulb,
  Zap,
  Flame,
  Snowflake,
} from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

const STATUSES = ["Research", "Shortlisted", "Outreach in Progress", "Coffee Date Demo", "Win"]

const STAGE_SCORES: Record<string, number> = {
  Research: 10,
  Shortlisted: 25,
  "Outreach in Progress": 40,
  "Coffee Date Demo": 70,
  Win: 100,
}

// Define the structure for industry
type Industry = {
  id: string
  name: string
}

// Define the structure for outreach_channels
type OutreachChannels = {
  LinkedIn?: number
  Facebook?: number
  "Cold Calling"?: number
  Email?: number
  linkedin_messages?: number
  facebook_groups?: number
  facebook_dms?: number
  cold_calls?: number
  meetings_booked?: number
  objections?: string | null
  emails?: number
}

// Define the structure for niche_user_state
type NicheUserState = {
  id: string
  niche_id: string
  user_id: string
  is_favourite: boolean
  status: string | null
  notes: string | null
  expected_monthly_value: number | null
  research_notes: string | null
  aov_input: number | null
  database_size_input: number | null
  cpl_calculated: number | null
  cpa_calculated: number | null
  potential_retainer: number | null
  profit_split_potential: number | null
  customer_profile: {
    decision_maker?: string
    pain_points?: string
    gathering_places?: string
  } | null
  research_notes_added: boolean | null
  aov_calculator_completed: boolean | null
  customer_profile_generated: boolean | null
  messaging_scripts: any | null
  messaging_prepared: boolean | null
  outreach_start_date: string | null
  outreach_channels: OutreachChannels | null
  outreach_messages_sent: number
  outreach_notes: string | null
  demo_script_created: boolean | null
  demo_script: string | null
  coffee_date_completed: boolean | null
  ghl_sub_account_id: string | null
  active_monthly_retainer: number | null
  monthly_profit_split: number | null
  target_monthly_recurring: number | null
  win_completed: boolean | null
  updated_at?: string
}

// Define the structure for a Niche
type Niche = {
  id: string
  niche_name: string
  industry_id: string | null
  scale: string | null
  database_size: string | null
  default_priority: number | null
  industry?: Industry
  user_state: NicheUserState | null
}

type AISuggestions = {
  topPriorityAction: string
  messageIdea: string
  risk: string
  opportunity: string
  suggestion: string
}

function calculatePipelineScore(userState: NicheUserState | null): {
  stageScore: number
  activityScore: number
  pipelineScore: number
} {
  if (!userState) {
    return { stageScore: 10, activityScore: 0, pipelineScore: 10 }
  }

  // Stage Score
  const status = userState.status || "Research"
  const stageScore = STAGE_SCORES[status] ?? 10

  // Activity Score from outreach_channels
  const channels = userState.outreach_channels || {}
  const totalActivity =
    (channels.linkedin_messages || 0) +
    (channels.facebook_dms || 0) +
    (channels.cold_calls || 0) +
    (channels.emails || 0) +
    (channels.meetings_booked || 0)

  const activityScore = Math.min(totalActivity * 5, 50)
  const pipelineScore = stageScore + activityScore

  return { stageScore, activityScore, pipelineScore }
}

function getPriorityTier(pipelineScore: number): "hot" | "warm" | "cold" {
  if (pipelineScore >= 70) return "hot"
  if (pipelineScore >= 40) return "warm"
  return "cold"
}

function getAutomationAlerts(
  userState: NicheUserState | null,
): { type: "warning" | "info" | "success"; message: string }[] {
  const alerts: { type: "warning" | "info" | "success"; message: string }[] = []

  if (!userState) return alerts

  const status = userState.status || "Research"
  const channels = userState.outreach_channels || {}
  const totalActivity =
    (channels.linkedin_messages || 0) +
    (channels.facebook_dms || 0) +
    (channels.cold_calls || 0) +
    (channels.emails || 0)

  // Check for stale leads
  if (userState.updated_at) {
    const lastUpdate = new Date(userState.updated_at)
    const daysSinceUpdate = Math.floor((Date.now() - lastUpdate.getTime()) / (1000 * 60 * 60 * 24))

    if (status === "Outreach in Progress" && daysSinceUpdate > 5) {
      alerts.push({ type: "warning", message: `No activity in ${daysSinceUpdate} days - lead going cold` })
    }
    if (status === "Coffee Date Demo" && daysSinceUpdate > 3) {
      alerts.push({ type: "warning", message: "Demo scheduled but no follow-up in 3+ days" })
    }
  }

  // Check for low activity in outreach
  if (status === "Outreach in Progress" && totalActivity < 5) {
    alerts.push({ type: "info", message: "Low outreach activity - increase touchpoints" })
  }

  // Check for stuck in research
  if (status === "Research" && userState.aov_calculator_completed && userState.customer_profile_generated) {
    alerts.push({ type: "info", message: "Research complete - ready to shortlist" })
  }

  // Positive alert for high activity
  if (totalActivity >= 15) {
    alerts.push({ type: "success", message: "Strong engagement - prioritize follow-ups" })
  }

  return alerts
}

export default function OpportunitiesV2() {
  const [industries, setIndustries] = useState<Industry[]>([])
  const [industryMap, setIndustryMap] = useState<Map<string, Industry>>(new Map())
  const [allNiches, setAllNiches] = useState<Niche[]>([])
  const [filteredNiches, setFilteredNiches] = useState<Niche[]>([])
  const [selectedNiche, setSelectedNiche] = useState<Niche | null>(null)
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [industryFilter, setIndustryFilter] = useState<string>("all")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [favouritesOnly, setFavouritesOnly] = useState(false)
  const [sortBy, setSortBy] = useState<string>("score") // Default sort by pipeline score

  const [aiSuggestions, setAiSuggestions] = useState<AISuggestions | null>(null)
  const [loadingSuggestions, setLoadingSuggestions] = useState(false)

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  )

  const fetchAiSuggestions = useCallback(async (niche: Niche) => {
    setLoadingSuggestions(true)
    try {
      const response = await fetch("/api/opportunities/suggestions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nicheId: niche.id,
          nicheName: niche.niche_name,
          status: niche.user_state?.status || "Research",
          outreachChannels: niche.user_state?.outreach_channels,
        }),
      })
      if (response.ok) {
        const data = await response.json()
        setAiSuggestions(data)
      }
    } catch (error) {
      console.error("Failed to fetch AI suggestions:", error)
    } finally {
      setLoadingSuggestions(false)
    }
  }, [])

  const loadIndustries = useCallback(async () => {
    const { data, error } = await supabase.from("industries").select("id, name").order("name")

    if (!error && data) {
      setIndustries(data)
      const map = new Map<string, Industry>()
      data.forEach((ind) => map.set(ind.id, ind))
      setIndustryMap(map)
    }
  }, [supabase])

  const loadNiches = useCallback(async () => {
    setLoading(true)
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) {
      setLoading(false)
      return
    }

    // Load niches with user state
    const { data: niches, error } = await supabase
      .from("niches")
      .select(`
        id,
        niche_name,
        industry_id,
        scale,
        database_size,
        default_priority
      `)
      .order("niche_name")
      .limit(1000)

    if (error || !niches) {
      setLoading(false)
      return
    }

    // Load user states
    const { data: userStates } = await supabase.from("niche_user_state").select("*").eq("user_id", user.id)

    const stateMap = new Map<string, NicheUserState>()
    userStates?.forEach((state) => stateMap.set(state.niche_id, state))

    // Enrich niches with user state and industry
    const enrichedNiches: Niche[] = niches.map((niche) => ({
      ...niche,
      industry: industryMap.get(niche.industry_id) || undefined,
      user_state: stateMap.get(niche.id) || null,
    }))

    setAllNiches(enrichedNiches)
    setLoading(false)
  }, [supabase, industryMap])

  useEffect(() => {
    loadIndustries()
  }, [loadIndustries])

  useEffect(() => {
    if (industryMap.size > 0) {
      loadNiches()
    }
  }, [industryMap, loadNiches])

  useEffect(() => {
    if (selectedNiche) {
      fetchAiSuggestions(selectedNiche)
    } else {
      setAiSuggestions(null)
    }
  }, [selectedNiche, fetchAiSuggestions])

  useEffect(() => {
    let filtered = [...allNiches]

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(
        (n) =>
          n.niche_name.toLowerCase().includes(query) ||
          (industryMap.get(n.industry_id || "")?.name || "").toLowerCase().includes(query),
      )
    }

    // Industry filter
    if (industryFilter !== "all") {
      filtered = filtered.filter((n) => n.industry_id === industryFilter)
    }

    // Status filter
    if (statusFilter !== "all") {
      filtered = filtered.filter((n) => (n.user_state?.status || "Research") === statusFilter)
    }

    // Favourites filter
    if (favouritesOnly) {
      filtered = filtered.filter((n) => n.user_state?.is_favourite)
    }

    if (sortBy === "score") {
      filtered.sort((a, b) => {
        const scoreA = calculatePipelineScore(a.user_state).pipelineScore
        const scoreB = calculatePipelineScore(b.user_state).pipelineScore
        return scoreB - scoreA
      })
    } else if (sortBy === "alphabetical") {
      filtered.sort((a, b) => a.niche_name.localeCompare(b.niche_name))
    } else if (sortBy === "newest") {
      filtered.sort((a, b) => {
        const dateA = a.user_state?.updated_at ? new Date(a.user_state.updated_at).getTime() : 0
        const dateB = b.user_state?.updated_at ? new Date(b.user_state.updated_at).getTime() : 0
        return dateB - dateA
      })
    }

    setFilteredNiches(filtered)
  }, [allNiches, searchQuery, industryFilter, statusFilter, favouritesOnly, sortBy, industryMap])

  const handleNicheSelect = (niche: Niche) => {
    setSelectedNiche(niche)
  }

  const toggleFavourite = async (niche: Niche) => {
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
      },
      { onConflict: "niche_id,user_id" },
    )

    if (!error) {
      setAllNiches((prev) =>
        prev.map((n) =>
          n.id === niche.id ? { ...n, user_state: { ...n.user_state!, is_favourite: newFavState } } : n,
        ),
      )
      if (selectedNiche?.id === niche.id) {
        setSelectedNiche((prev) =>
          prev ? { ...prev, user_state: { ...prev.user_state!, is_favourite: newFavState } } : null,
        )
      }
    }
  }

  const updateStatus = async (newStatus: string) => {
    if (!selectedNiche) return
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) return

    const { error } = await supabase.from("niche_user_state").upsert(
      {
        niche_id: selectedNiche.id,
        user_id: user.id,
        status: newStatus,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "niche_id,user_id" },
    )

    if (!error) {
      const updatedNiche = {
        ...selectedNiche,
        user_state: { ...selectedNiche.user_state!, status: newStatus, updated_at: new Date().toISOString() },
      }
      setSelectedNiche(updatedNiche)
      setAllNiches((prev) => prev.map((n) => (n.id === selectedNiche.id ? updatedNiche : n)))
      // Refetch AI suggestions for new status
      fetchAiSuggestions(updatedNiche)
    }
  }

  const currentStatus = selectedNiche?.user_state?.status || "Research"
  const currentStatusIndex = STATUSES.indexOf(currentStatus)

  const selectedNicheScore = selectedNiche ? calculatePipelineScore(selectedNiche.user_state) : null
  const selectedNicheTier = selectedNicheScore ? getPriorityTier(selectedNicheScore.pipelineScore) : "cold"
  const selectedNicheAlerts = selectedNiche ? getAutomationAlerts(selectedNiche.user_state) : []

  return (
    <div className="flex-1 p-6 space-y-6">
      {/* Filter Bar */}
      <div className="flex flex-wrap items-center gap-4 p-4 bg-zinc-900/50 rounded-xl border border-white/10">
        {/* Search */}
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/40" />
          <Input
            placeholder="Search niches..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 bg-zinc-800 border-zinc-700 text-white placeholder:text-white/40"
          />
        </div>

        {/* Industry Filter */}
        <Select value={industryFilter} onValueChange={setIndustryFilter}>
          <SelectTrigger className="w-[180px] bg-zinc-800 border-zinc-700 text-white">
            <SelectValue placeholder="All Industries" />
          </SelectTrigger>
          <SelectContent className="bg-zinc-800 border-zinc-700">
            <SelectItem value="all" className="text-white hover:bg-zinc-700">
              All Industries
            </SelectItem>
            {industries.map((industry) => (
              <SelectItem key={industry.id} value={industry.id} className="text-white hover:bg-zinc-700">
                {industry.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Status Filter */}
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[180px] bg-zinc-800 border-zinc-700 text-white">
            <SelectValue placeholder="All Statuses" />
          </SelectTrigger>
          <SelectContent className="bg-zinc-800 border-zinc-700">
            <SelectItem value="all" className="text-white hover:bg-zinc-700">
              All Statuses
            </SelectItem>
            {STATUSES.map((status) => (
              <SelectItem key={status} value={status} className="text-white hover:bg-zinc-700">
                {status}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Sort By */}
        <Select value={sortBy} onValueChange={setSortBy}>
          <SelectTrigger className="w-[160px] bg-zinc-800 border-zinc-700 text-white">
            <SelectValue placeholder="Sort by" />
          </SelectTrigger>
          <SelectContent className="bg-zinc-800 border-zinc-700">
            <SelectItem value="score" className="text-white hover:bg-zinc-700">
              Pipeline Score
            </SelectItem>
            <SelectItem value="alphabetical" className="text-white hover:bg-zinc-700">
              Alphabetical
            </SelectItem>
            <SelectItem value="newest" className="text-white hover:bg-zinc-700">
              Recently Updated
            </SelectItem>
          </SelectContent>
        </Select>

        {/* Favourites Toggle */}
        <div className="flex items-center gap-2">
          <Checkbox
            id="favourites"
            checked={favouritesOnly}
            onCheckedChange={(checked) => setFavouritesOnly(checked as boolean)}
            className="border-zinc-600 data-[state=checked]:bg-primary data-[state=checked]:border-primary"
          />
          <Label htmlFor="favourites" className="text-white/70 text-sm cursor-pointer">
            Favourites
          </Label>
        </div>
      </div>

      {/* Main Content */}
      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      ) : (
        <div className="grid grid-cols-12 gap-6">
          {/* Niche List - Left Panel */}
          <div className="col-span-5 space-y-3">
            <h2 className="text-sm font-semibold text-white/60 px-2">
              {filteredNiches.length} {filteredNiches.length === 1 ? "Niche" : "Niches"}
            </h2>
            <div className="space-y-2 max-h-[calc(100vh-220px)] overflow-y-auto pr-2 [&::-webkit-scrollbar]:w-1 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-white/10 [&::-webkit-scrollbar-thumb]:rounded-full">
              {filteredNiches.map((niche) => {
                const industry = niche.industry_id ? industryMap.get(niche.industry_id) : null
                const industryName = industry?.name ?? "Unknown"
                const { pipelineScore } = calculatePipelineScore(niche.user_state)
                const tier = getPriorityTier(pipelineScore)
                const alerts = getAutomationAlerts(niche.user_state)

                return (
                  <Card
                    key={niche.id}
                    onClick={() => handleNicheSelect(niche)}
                    className={cn(
                      "w-full text-left px-4 py-3 rounded-xl border cursor-pointer transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg",
                      selectedNiche?.id === niche.id
                        ? "bg-primary/10 border-primary shadow-lg shadow-primary/10"
                        : tier === "hot"
                          ? "bg-gradient-to-r from-orange-500/10 to-red-500/10 border-orange-500/30 hover:border-orange-500/50"
                          : tier === "warm"
                            ? "bg-gradient-to-r from-yellow-500/10 to-orange-500/10 border-yellow-500/30 hover:border-yellow-500/50"
                            : "bg-zinc-900/50 border-white/10 hover:border-white/20",
                    )}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <h3 className="text-sm font-medium text-white truncate">{niche.niche_name}</h3>
                          {tier === "hot" && <Flame className="h-3.5 w-3.5 text-orange-400 shrink-0" />}
                          {tier === "warm" && <TrendingUp className="h-3.5 w-3.5 text-yellow-400 shrink-0" />}
                          {tier === "cold" && <Snowflake className="h-3.5 w-3.5 text-blue-400 shrink-0" />}
                        </div>
                        <p className="text-xs text-white/60 mt-1">{industryName}</p>
                        <div className="flex items-center gap-2 mt-2 flex-wrap">
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/5 text-white/70">
                            {niche.user_state?.status || "Research"}
                          </span>
                          <span
                            className={cn(
                              "text-[10px] px-2 py-0.5 rounded-full font-medium",
                              tier === "hot"
                                ? "bg-orange-500/20 text-orange-400"
                                : tier === "warm"
                                  ? "bg-yellow-500/20 text-yellow-400"
                                  : "bg-blue-500/20 text-blue-400",
                            )}
                          >
                            Score: {pipelineScore}
                          </span>
                          {/* Alert indicator */}
                          {alerts.some((a) => a.type === "warning") && (
                            <AlertTriangle className="h-3.5 w-3.5 text-amber-400" />
                          )}
                        </div>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          toggleFavourite(niche)
                        }}
                        className="shrink-0 transition-transform hover:scale-110"
                      >
                        <Star
                          className={cn(
                            "h-4 w-4 transition-colors",
                            niche.user_state?.is_favourite
                              ? "fill-yellow-400 text-yellow-400"
                              : "text-white/30 hover:text-white/50",
                          )}
                        />
                      </button>
                    </div>
                  </Card>
                )
              })}
            </div>
          </div>

          {/* Detail Panel - Right */}
          <div className="col-span-7">
            {selectedNiche ? (
              <Card className="border border-white/10 bg-zinc-900/50 p-6 space-y-6 max-h-[calc(100vh-220px)] overflow-y-auto rounded-xl [&::-webkit-scrollbar]:w-1 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-white/10 [&::-webkit-scrollbar-thumb]:rounded-full">
                {/* Header with Pipeline Score */}
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <h2 className="text-xl font-bold text-white">{selectedNiche.niche_name}</h2>
                      <span
                        className={cn(
                          "flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold",
                          selectedNicheTier === "hot"
                            ? "bg-gradient-to-r from-orange-500 to-red-500 text-white"
                            : selectedNicheTier === "warm"
                              ? "bg-gradient-to-r from-yellow-500 to-orange-500 text-black"
                              : "bg-gradient-to-r from-blue-500 to-cyan-500 text-white",
                        )}
                      >
                        {selectedNicheTier === "hot" && <Flame className="h-3 w-3" />}
                        {selectedNicheTier === "warm" && <TrendingUp className="h-3 w-3" />}
                        {selectedNicheTier === "cold" && <Snowflake className="h-3 w-3" />}
                        {selectedNicheTier.toUpperCase()}
                      </span>
                    </div>
                    <p className="text-sm text-white/60 mt-1">{selectedNiche.industry?.name}</p>
                    {selectedNicheScore && (
                      <div className="flex items-center gap-4 mt-3 text-sm">
                        <div className="flex items-center gap-2">
                          <span className="text-white/40">Pipeline Score:</span>
                          <span className="text-white font-semibold">{selectedNicheScore.pipelineScore}</span>
                        </div>
                        <div className="flex items-center gap-2 text-white/40">
                          <span>Stage: {selectedNicheScore.stageScore}</span>
                          <span>+</span>
                          <span>Activity: {selectedNicheScore.activityScore}</span>
                        </div>
                      </div>
                    )}
                  </div>
                  <button
                    onClick={() => setSelectedNiche(null)}
                    className="text-white/60 hover:text-white transition-colors"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>

                {selectedNicheAlerts.length > 0 && (
                  <div className="space-y-2">
                    {selectedNicheAlerts.map((alert, idx) => (
                      <div
                        key={idx}
                        className={cn(
                          "flex items-center gap-3 px-4 py-3 rounded-lg text-sm",
                          alert.type === "warning"
                            ? "bg-amber-500/10 border border-amber-500/30 text-amber-300"
                            : alert.type === "success"
                              ? "bg-green-500/10 border border-green-500/30 text-green-300"
                              : "bg-blue-500/10 border border-blue-500/30 text-blue-300",
                        )}
                      >
                        {alert.type === "warning" && <AlertTriangle className="h-4 w-4 shrink-0" />}
                        {alert.type === "success" && <CheckCircle className="h-4 w-4 shrink-0" />}
                        {alert.type === "info" && <Lightbulb className="h-4 w-4 shrink-0" />}
                        {alert.message}
                      </div>
                    ))}
                  </div>
                )}

                {/* Status Pipeline */}
                <div className="flex items-center gap-2 flex-wrap">
                  {STATUSES.map((status, idx) => (
                    <div key={status} className="flex items-center gap-2">
                      <button
                        onClick={() => updateStatus(status)}
                        className={cn(
                          "px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-200 hover:scale-105",
                          currentStatus === status
                            ? "bg-primary text-white shadow-lg shadow-primary/20"
                            : currentStatusIndex > idx
                              ? "bg-green-500/20 text-green-400"
                              : "bg-white/5 text-white/40 hover:bg-white/10 hover:text-white/60",
                        )}
                      >
                        {status}
                      </button>
                      {idx < STATUSES.length - 1 && <ChevronRight className="h-4 w-4 text-white/20" />}
                    </div>
                  ))}
                </div>

                <div className="bg-gradient-to-br from-purple-500/10 to-blue-500/10 border border-purple-500/20 rounded-xl p-5 space-y-4">
                  <div className="flex items-center gap-2">
                    <Zap className="h-5 w-5 text-purple-400" />
                    <h3 className="text-sm font-semibold text-white">AI Insights</h3>
                  </div>

                  {loadingSuggestions ? (
                    <div className="flex items-center gap-3 py-4">
                      <div className="animate-spin rounded-full h-5 w-5 border-2 border-purple-400 border-t-transparent"></div>
                      <span className="text-sm text-white/60">Generating insights...</span>
                    </div>
                  ) : aiSuggestions ? (
                    <div className="space-y-4">
                      {/* Top Priority Action */}
                      <div className="space-y-1.5">
                        <div className="flex items-center gap-2 text-xs font-medium text-purple-300">
                          <Target className="h-3.5 w-3.5" />
                          Top Priority Action
                        </div>
                        <p className="text-sm text-white/80 bg-white/5 rounded-lg px-3 py-2">
                          {aiSuggestions.topPriorityAction}
                        </p>
                      </div>

                      {/* Suggested Message */}
                      <div className="space-y-1.5">
                        <div className="flex items-center gap-2 text-xs font-medium text-blue-300">
                          <MessageSquare className="h-3.5 w-3.5" />
                          Message Idea
                        </div>
                        <p className="text-sm text-white/80 bg-white/5 rounded-lg px-3 py-2 italic">
                          {aiSuggestions.messageIdea}
                        </p>
                      </div>

                      {/* Risk & Opportunity */}
                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1.5">
                          <div className="flex items-center gap-2 text-xs font-medium text-amber-300">
                            <AlertTriangle className="h-3.5 w-3.5" />
                            Risk
                          </div>
                          <p className="text-xs text-white/70 bg-amber-500/10 rounded-lg px-3 py-2">
                            {aiSuggestions.risk}
                          </p>
                        </div>
                        <div className="space-y-1.5">
                          <div className="flex items-center gap-2 text-xs font-medium text-green-300">
                            <TrendingUp className="h-3.5 w-3.5" />
                            Opportunity
                          </div>
                          <p className="text-xs text-white/70 bg-green-500/10 rounded-lg px-3 py-2">
                            {aiSuggestions.opportunity}
                          </p>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <p className="text-sm text-white/40">No suggestions available</p>
                  )}
                </div>

                {/* Outreach Activity Summary */}
                {selectedNiche.user_state?.outreach_channels && (
                  <div className="bg-white/5 rounded-xl p-4 space-y-3">
                    <h3 className="text-sm font-semibold text-white/80">Outreach Activity</h3>
                    <div className="grid grid-cols-4 gap-3">
                      <div className="flex flex-col items-center gap-1 p-3 bg-white/5 rounded-lg">
                        <MessageSquare className="h-4 w-4 text-blue-400" />
                        <span className="text-lg font-bold text-white">
                          {selectedNiche.user_state.outreach_channels.linkedin_messages || 0}
                        </span>
                        <span className="text-[10px] text-white/50">LinkedIn</span>
                      </div>
                      <div className="flex flex-col items-center gap-1 p-3 bg-white/5 rounded-lg">
                        <Users className="h-4 w-4 text-indigo-400" />
                        <span className="text-lg font-bold text-white">
                          {selectedNiche.user_state.outreach_channels.facebook_dms || 0}
                        </span>
                        <span className="text-[10px] text-white/50">Facebook</span>
                      </div>
                      <div className="flex flex-col items-center gap-1 p-3 bg-white/5 rounded-lg">
                        <Phone className="h-4 w-4 text-green-400" />
                        <span className="text-lg font-bold text-white">
                          {selectedNiche.user_state.outreach_channels.cold_calls || 0}
                        </span>
                        <span className="text-[10px] text-white/50">Calls</span>
                      </div>
                      <div className="flex flex-col items-center gap-1 p-3 bg-white/5 rounded-lg">
                        <Mail className="h-4 w-4 text-purple-400" />
                        <span className="text-lg font-bold text-white">
                          {selectedNiche.user_state.outreach_channels.emails || 0}
                        </span>
                        <span className="text-[10px] text-white/50">Emails</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Notes Section */}
                <div className="space-y-3">
                  <h3 className="text-sm font-semibold text-white/80">Notes</h3>
                  <Textarea
                    placeholder="Add notes about this niche..."
                    value={selectedNiche.user_state?.notes || ""}
                    className="bg-zinc-800 border-zinc-700 text-white placeholder:text-white/40 min-h-[100px]"
                    readOnly
                  />
                </div>
              </Card>
            ) : (
              <Card className="border border-white/10 bg-zinc-900/50 h-full min-h-[400px] flex flex-col items-center justify-center text-center p-8 rounded-xl">
                <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mb-4">
                  <Search className="h-8 w-8 text-white/20" />
                </div>
                <h3 className="text-lg font-medium text-white/60">Select a niche to view details</h3>
                <p className="text-sm text-white/40 mt-2 max-w-sm">
                  Click on any niche from the list to view its pipeline score, automation alerts, and AI-powered
                  insights.
                </p>
              </Card>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
