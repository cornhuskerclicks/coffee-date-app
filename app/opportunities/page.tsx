"use client"

import { useEffect, useState, useMemo } from "react"
import { createClient } from "@/lib/supabase/client"
import { Star, Search } from "lucide-react"
import { cn } from "@/lib/utils"
import { getStatusConfig, getStatusOptions, type StatusValue } from "@/lib/status-map"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"

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

  const [searchQuery, setSearchQuery] = useState("")
  const [selectedIndustryId, setSelectedIndustryId] = useState<string>("all")
  const [selectedStatus, setSelectedStatus] = useState<string>("all")
  const [showFavouritesOnly, setShowFavouritesOnly] = useState(false)

  // Load data once on mount
  useEffect(() => {
    async function loadData() {
      const supabase = createClient()

      try {
        // Load niches, industries, and user states in parallel
        const [nichesRes, industriesRes, userStatesRes] = await Promise.all([
          supabase
            .from("niches")
            .select("id, niche_name, industry_id, scale, database_size, created_at")
            .order("niche_name"),
          supabase.from("industries").select("id, name").order("name"),
          supabase.from("niche_user_state").select("niche_id, is_favourite, status"),
        ])

        if (nichesRes.error) throw nichesRes.error
        if (industriesRes.error) throw industriesRes.error

        const nichesData = nichesRes.data || []
        const industriesData = industriesRes.data || []
        const userStatesData = userStatesRes.data || []

        // Create lookup maps
        const industryMap = new Map(industriesData.map((i) => [i.id, i.name]))
        const userStateMap = new Map(userStatesData.map((s) => [s.niche_id, s]))

        // Enrich niches with industry names and user state
        const enrichedNiches: Niche[] = nichesData.map((n) => {
          const userState = userStateMap.get(n.id)
          return {
            id: n.id,
            name: n.niche_name,
            industry_id: n.industry_id,
            industry_name: industryMap.get(n.industry_id) || "Unknown",
            scale: n.scale || "Local",
            database_size: n.database_size || "Small",
            is_favourite: userState?.is_favourite || false,
            status: userState?.status || null,
            created_at: n.created_at,
          }
        })

        setIndustries(industriesData)
        setAllNiches(enrichedNiches)
      } catch (error) {
        console.error("Error loading data:", error)
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [])

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
      console.error("Error toggling favourite:", error)
      // Revert on error
      setAllNiches((prev) => prev.map((n) => (n.id === nicheId ? { ...n, is_favourite: !newFavStatus } : n)))
    }
  }

  const filteredNiches = useMemo(() => {
    let filtered = allNiches

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(
        (n) => n.name.toLowerCase().includes(query) || n.industry_name.toLowerCase().includes(query),
      )
    }

    // Filter by industry
    if (selectedIndustryId !== "all") {
      filtered = filtered.filter((n) => n.industry_id === selectedIndustryId)
    }

    // Filter by status
    if (selectedStatus !== "all") {
      filtered = filtered.filter((n) => n.status === selectedStatus)
    }

    // Filter by favourites
    if (showFavouritesOnly) {
      filtered = filtered.filter((n) => n.is_favourite)
    }

    return filtered
  }, [allNiches, searchQuery, selectedIndustryId, selectedStatus, showFavouritesOnly])

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
            Showing {filteredNiches.length} of {allNiches.length} business niches across {industries.length} industries
          </p>
        </div>
      </header>

      <div className="border-b border-white/10 bg-white/5 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                type="text"
                placeholder="Search niches..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 bg-black/50 border-white/20 text-white placeholder:text-gray-500 focus:border-[#00A8FF]"
              />
            </div>

            {/* Industry Filter */}
            <Select value={selectedIndustryId} onValueChange={setSelectedIndustryId}>
              <SelectTrigger className="bg-black/50 border-white/20 text-white">
                <SelectValue placeholder="All Industries" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Industries</SelectItem>
                {industries.map((industry) => (
                  <SelectItem key={industry.id} value={industry.id}>
                    {industry.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Status Filter */}
            <Select value={selectedStatus} onValueChange={setSelectedStatus}>
              <SelectTrigger className="bg-black/50 border-white/20 text-white">
                <SelectValue placeholder="All Statuses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="null">Not Started</SelectItem>
                {getStatusOptions().map((status) => (
                  <SelectItem key={status} value={status}>
                    {getStatusConfig(status).label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Favourites Toggle */}
            <button
              onClick={() => setShowFavouritesOnly(!showFavouritesOnly)}
              className={cn(
                "flex items-center justify-center gap-2 px-4 py-2 rounded-md border transition-all font-medium text-sm",
                showFavouritesOnly
                  ? "bg-[#00A8FF] border-[#00A8FF] text-white"
                  : "bg-black/50 border-white/20 text-gray-400 hover:text-white hover:border-white/40",
              )}
            >
              <Star className={cn("h-4 w-4", showFavouritesOnly && "fill-current")} />
              {showFavouritesOnly ? "Favourites Only" : "Show Favourites"}
            </button>
          </div>
        </div>
      </div>

      {/* Results */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        {filteredNiches.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-gray-400 text-lg">No niches match your filters</p>
            <button
              onClick={() => {
                setSearchQuery("")
                setSelectedIndustryId("all")
                setSelectedStatus("all")
                setShowFavouritesOnly(false)
              }}
              className="mt-4 px-6 py-2 bg-[#00A8FF] text-white rounded-md hover:bg-[#0090DD] transition-colors"
            >
              Clear All Filters
            </button>
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
