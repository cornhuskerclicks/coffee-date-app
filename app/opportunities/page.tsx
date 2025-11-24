"use client"

import { useEffect, useState, useMemo } from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Star, Search, Filter } from "lucide-react"
import { cn } from "@/lib/utils"
import { getStatusOptions, getStatusConfig, type StatusValue } from "@/lib/status-map"

type Niche = {
  id: string
  name: string
  industry_id: string
  industry_name: string
  scale: string
  database_size: string
  is_favourite: boolean
  status: string | null
  created_at: string | null
}

type Industry = {
  id: string
  name: string
}

export default function OpportunitiesPage() {
  const [allNiches, setAllNiches] = useState<Niche[]>([])
  const [industries, setIndustries] = useState<Industry[]>([])
  const [loading, setLoading] = useState(true)

  // Filter states
  const [searchQuery, setSearchQuery] = useState("")
  const [industryFilter, setIndustryFilter] = useState("all")
  const [statusFilter, setStatusFilter] = useState("all")
  const [favouritesOnly, setFavouritesOnly] = useState(false)
  const [sortBy, setSortBy] = useState<"alphabetical" | "newest">("alphabetical")

  // Load data once on mount
  useEffect(() => {
    async function loadData() {
      const supabase = createClient()

      try {
        // Load niches, industries, and user states in parallel
        const [nichesRes, industriesRes, userStatesRes] = await Promise.all([
          supabase.from("niches").select("id, niche_name, industry_id, scale, database_size, created_at"),
          supabase.from("industries").select("id, name").order("name"),
          supabase.from("niche_user_state").select("niche_id, is_favourite, status"),
        ])

        if (nichesRes.error) throw nichesRes.error
        if (industriesRes.error) throw industriesRes.error

        const nichesData = nichesRes.data || []
        const industriesData = industriesRes.data || []
        const userStatesData = userStatesRes.data || []

        console.log("[v0] Loaded niches:", nichesData.length)
        console.log("[v0] Loaded industries:", industriesData.length, "industries")

        // Create lookup maps
        const industryMap = new Map(industriesData.map((i) => [i.id, i.name]))
        const userStateMap = new Map(userStatesData.map((s) => [s.niche_id, s]))

        // Enrich niches with industry names and user state
        const enrichedNiches: Niche[] = nichesData.map((n) => {
          const userState = userStateMap.get(n.id)
          return {
            id: n.id,
            name: n.niche_name,
            industry_id: n.industry_id, // <-- UUID preserved here
            industry_name: industryMap.get(n.industry_id) || "Unknown",
            scale: n.scale || "Local",
            database_size: n.database_size || "Small",
            is_favourite: userState?.is_favourite || false,
            status: userState?.status || null,
            created_at: n.created_at,
          }
        })

        console.log("[v0] Sample niche:", enrichedNiches[0])

        setIndustries(industriesData)
        setAllNiches(enrichedNiches)
      } catch (error) {
        console.error("[v0] Error loading data:", error)
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [])

  // Filter niches client-side
  const filteredNiches = useMemo(() => {
    console.log("[v0] Starting filter - total niches:", allNiches.length)

    let result = allNiches

    // Industry filter
    if (industryFilter !== "all") {
      console.log("[v0] Filtering by industry_id:", industryFilter)
      result = result.filter((n) => n.industry_id === industryFilter)
      console.log("[v0] After industry filter:", result.length, "niches")
    }

    // Status filter
    if (statusFilter !== "all") {
      if (statusFilter === "none") {
        result = result.filter((n) => !n.status)
      } else {
        result = result.filter((n) => n.status === statusFilter)
      }
    }

    // Favourites filter
    if (favouritesOnly) {
      result = result.filter((n) => n.is_favourite)
    }

    // Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      result = result.filter((n) => n.name.toLowerCase().includes(query))
    }

    // Sort
    if (sortBy === "alphabetical") {
      result = result.sort((a, b) => a.name.localeCompare(b.name))
    } else {
      result = result.sort((a, b) => {
        const dateA = a.created_at ? new Date(a.created_at).getTime() : 0
        const dateB = b.created_at ? new Date(b.created_at).getTime() : 0
        return dateB - dateA
      })
    }

    console.log("[v0] final filtered niches:", result.length)
    return result
  }, [allNiches, industryFilter, statusFilter, favouritesOnly, searchQuery, sortBy])

  const handleToggleFavourite = async (nicheId: string) => {
    const supabase = createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) return

    const niche = allNiches.find((n) => n.id === nicheId)
    if (!niche) return

    const newFavStatus = !niche.is_favourite

    // Optimistic update
    setAllNiches((prev) => prev.map((n) => (n.id === nicheId ? { ...n, is_favourite: newFavStatus } : n)))

    const { error } = await supabase.from("niche_user_state").upsert(
      {
        user_id: user.id,
        niche_id: nicheId,
        is_favourite: newFavStatus,
        status: niche.status || undefined,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id,niche_id" },
    )

    if (error) {
      console.error("[v0] Error toggling favourite:", error)
      // Revert on error
      setAllNiches((prev) => prev.map((n) => (n.id === nicheId ? { ...n, is_favourite: !newFavStatus } : n)))
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-[#00A8FF] border-r-transparent"></div>
          <p className="mt-4 text-gray-400">Loading opportunities...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header */}
      <header className="border-b border-white/10">
        <div className="max-w-7xl mx-auto px-6 py-5">
          <h1 className="text-2xl font-bold text-white">Opportunities - Niche List</h1>
          <p className="text-sm text-gray-400 mt-1">
            Browse {allNiches.length} business niches across {industries.length} industries
          </p>
        </div>
      </header>

      {/* Filters */}
      <div className="border-b border-white/10 bg-white/5">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            {/* Search */}
            <div className="lg:col-span-2">
              <Label className="text-sm text-gray-400 mb-2 block">Search Niches</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search by name..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 h-10 bg-black border-white/20 text-white placeholder:text-gray-500"
                />
              </div>
            </div>

            {/* Industry Filter */}
            <div>
              <Label className="text-sm text-gray-400 mb-2 block">Industry</Label>
              <Select
                value={industryFilter}
                onValueChange={(value: string) => {
                  console.log("[v0] ===== INDUSTRY DROPDOWN DEBUG =====")
                  console.log("[v0] RAW value received:", value)
                  console.log("[v0] Type of value:", typeof value)
                  console.log("[v0] Value length:", value.length)

                  // Test if it's a UUID
                  const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value)
                  console.log("[v0] Is UUID format?", isUUID)

                  // Show what we have in industries array
                  const automotive = industries.find((i) => i.name === "Automotive")
                  if (automotive) {
                    console.log("[v0] Automotive UUID from data:", automotive.id)
                    console.log("[v0] Does value match Automotive UUID?", value === automotive.id)
                    console.log("[v0] Does value match Automotive NAME?", value === automotive.name)
                  }

                  // Show all industry IDs
                  console.log("[v0] All industry IDs:", industries.map((i) => i.id).join(", "))
                  console.log("[v0] All industry NAMES:", industries.map((i) => i.name).join(", "))
                  console.log("[v0] ===================================")

                  setIndustryFilter(value)
                }}
              >
                <SelectTrigger className="h-10 bg-black border-white/20 text-white">
                  <SelectValue placeholder="All Industries" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Industries</SelectItem>
                  {industries.map((industry) => {
                    if (industry.name === "Automotive") {
                      console.log("[v0] Automotive industry mapping - ID:", industry.id, "Name:", industry.name)
                    }
                    return (
                      <SelectItem key={industry.id} value={industry.id}>
                        {industry.name}
                      </SelectItem>
                    )
                  })}
                </SelectContent>
              </Select>
            </div>

            {/* Status Filter */}
            <div>
              <Label className="text-sm text-gray-400 mb-2 block">Status</Label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="h-10 bg-black border-white/20 text-white">
                  <SelectValue placeholder="All Statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="none">Not Started</SelectItem>
                  {getStatusOptions().map((status) => (
                    <SelectItem key={status} value={status}>
                      {status}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Sort */}
            <div>
              <Label className="text-sm text-gray-400 mb-2 block">Sort By</Label>
              <Select value={sortBy} onValueChange={(v) => setSortBy(v as any)}>
                <SelectTrigger className="h-10 bg-black border-white/20 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="alphabetical">Alphabetical</SelectItem>
                  <SelectItem value="newest">Newest First</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Favourites Checkbox */}
          <div className="mt-4 flex items-center gap-2">
            <Checkbox
              id="favourites"
              checked={favouritesOnly}
              onCheckedChange={(checked) => setFavouritesOnly(!!checked)}
              className="border-white/20"
            />
            <Label htmlFor="favourites" className="text-sm text-gray-400 cursor-pointer">
              Show favourites only
            </Label>
          </div>
        </div>
      </div>

      {/* Results */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="mb-4 text-sm text-gray-400">
          Showing {filteredNiches.length} of {allNiches.length} niches
        </div>

        {filteredNiches.length === 0 ? (
          <div className="text-center py-12">
            <Filter className="h-12 w-12 text-gray-600 mx-auto mb-4" />
            <p className="text-gray-400">No niches match your filters</p>
            <Button
              variant="outline"
              className="mt-4 border-white/20 text-white hover:bg-white/5 bg-transparent"
              onClick={() => {
                setSearchQuery("")
                setIndustryFilter("all")
                setStatusFilter("all")
                setFavouritesOnly(false)
              }}
            >
              Clear Filters
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filteredNiches.map((niche) => {
              const statusConfig = getStatusConfig(niche.status as StatusValue)

              return (
                <div
                  key={niche.id}
                  className="bg-white/5 backdrop-blur-sm rounded-lg p-5 border border-white/10 hover:bg-white/10 transition-all cursor-pointer"
                >
                  <div className="flex items-start justify-between mb-3">
                    <h3 className="font-semibold text-white text-sm leading-tight flex-1">
                      <span className="text-[#00A8FF]">[{niche.industry_name}]</span> {niche.name}
                    </h3>
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        handleToggleFavourite(niche.id)
                      }}
                      className="ml-2 flex-shrink-0"
                    >
                      <Star
                        className={cn(
                          "h-4 w-4 transition-colors",
                          niche.is_favourite
                            ? "fill-yellow-400 text-yellow-400"
                            : "text-gray-400 hover:text-yellow-400",
                        )}
                      />
                    </button>
                  </div>

                  <div className="space-y-2 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="text-gray-400">Scale:</span>
                      <span className="text-gray-300">{niche.scale}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-400">Database:</span>
                      <span className="text-gray-300">{niche.database_size}</span>
                    </div>
                    <div className="flex items-center justify-between pt-2 border-t border-white/10">
                      <span className="text-gray-400">Status:</span>
                      <span className={cn("px-2 py-0.5 rounded text-xs font-medium", statusConfig.color)}>
                        {statusConfig.label}
                      </span>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
