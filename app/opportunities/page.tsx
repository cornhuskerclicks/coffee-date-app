"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Star, Search, Filter } from "lucide-react"
import { cn } from "@/lib/utils"

type Niche = {
  id: string
  niche_name: string
  industry_name: string
  scale: string
  database_size: string
  status: string | null
  is_favourite: boolean
  created_at: string
}

const STATUS_OPTIONS = ["Research", "Shortlisted", "Outreach in Progress", "Coffee Date Demo", "Win"] as const

export default function OpportunitiesPage() {
  const [allNiches, setAllNiches] = useState<Niche[]>([])
  const [loading, setLoading] = useState(true)

  // Filter states
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedIndustry, setSelectedIndustry] = useState("all")
  const [selectedStatus, setSelectedStatus] = useState("all")
  const [sortBy, setSortBy] = useState("alphabetical")
  const [favouritesOnly, setFavouritesOnly] = useState(false)

  const [industries, setIndustries] = useState<string[]>([])
  const [selectedNiche, setSelectedNiche] = useState<Niche | null>(null)

  const supabase = createClient()

  useEffect(() => {
    async function loadAllData() {
      try {
        setLoading(true)
        console.log("[v0] Loading all niches from database...")

        // Get current user
        const {
          data: { user },
        } = await supabase.auth.getUser()
        console.log("[v0] Current user:", user?.id)

        // Fetch ALL niches
        const { data: nichesData, error: nichesError } = await supabase
          .from("niches")
          .select("*")
          .order("niche_name", { ascending: true })

        if (nichesError) {
          console.error("[v0] Error loading niches:", nichesError)
          throw nichesError
        }
        console.log("[v0] Loaded niches:", nichesData?.length)

        // Fetch ALL industries
        const { data: industriesData, error: industriesError } = await supabase.from("industries").select("*")

        if (industriesError) {
          console.error("[v0] Error loading industries:", industriesError)
          throw industriesError
        }
        console.log("[v0] Loaded industries:", industriesData?.length)

        // Create industry lookup map
        const industryMap = new Map((industriesData || []).map((ind: any) => [ind.id, ind.name]))

        // Fetch user's niche states if logged in
        let userStates: any[] = []
        if (user) {
          const { data: statesData, error: statesError } = await supabase
            .from("niche_user_state")
            .select("niche_id, status, is_favourite")
            .eq("user_id", user.id)

          if (statesError) {
            console.error("[v0] Error loading user states:", statesError)
          } else {
            userStates = statesData || []
            console.log("[v0] Loaded user states:", userStates.length)
          }
        }

        // Create user state lookup map
        const stateMap = new Map(userStates.map((state) => [state.niche_id, state]))

        const enrichedNiches: Niche[] = (nichesData || []).map((niche: any) => {
          const userState = stateMap.get(niche.id)
          const industryName = industryMap.get(niche.industry_id) || "Unknown"

          return {
            id: niche.id,
            niche_name: niche.niche_name,
            industry_name: industryName,
            scale: niche.scale || "Local",
            database_size: niche.database_size || "Small",
            status: userState?.status || null,
            is_favourite: userState?.is_favourite || false,
            created_at: niche.created_at,
          }
        })

        console.log("[v0] Enriched niches:", enrichedNiches.length)
        console.log("[v0] Sample niche:", enrichedNiches[0])
        setAllNiches(enrichedNiches)

        // Extract unique industries for filter dropdown
        const uniqueIndustries = Array.from(new Set(enrichedNiches.map((n) => n.industry_name))).sort()
        setIndustries(uniqueIndustries)
        console.log("[v0] Unique industries:", uniqueIndustries.length)
      } catch (error) {
        console.error("[v0] Fatal error loading data:", error)
      } finally {
        setLoading(false)
      }
    }

    loadAllData()
  }, [])

  const filteredNiches = (() => {
    console.log("[v0] === FILTERING START ===")
    console.log("[v0] Total niches:", allNiches.length)
    console.log("[v0] Search query:", searchQuery)
    console.log("[v0] Selected industry:", selectedIndustry)
    console.log("[v0] Selected status:", selectedStatus)
    console.log("[v0] Favourites only:", favouritesOnly)

    let filtered = [...allNiches]

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim()
      const beforeCount = filtered.length
      filtered = filtered.filter(
        (n) => n.niche_name.toLowerCase().includes(query) || n.industry_name.toLowerCase().includes(query),
      )
      console.log("[v0] After search filter:", filtered.length, "(removed", beforeCount - filtered.length, ")")
    }

    // Apply industry filter
    if (selectedIndustry !== "all") {
      const beforeCount = filtered.length
      console.log("[v0] Filtering by industry:", selectedIndustry)
      filtered = filtered.filter((n) => {
        const matches = n.industry_name === selectedIndustry
        if (!matches) {
          console.log("[v0] Filtered out:", n.niche_name, "- industry:", n.industry_name)
        }
        return matches
      })
      console.log("[v0] After industry filter:", filtered.length, "(removed", beforeCount - filtered.length, ")")
    }

    // Apply status filter
    if (selectedStatus !== "all") {
      const beforeCount = filtered.length
      if (selectedStatus === "none") {
        filtered = filtered.filter((n) => n.status === null)
      } else {
        filtered = filtered.filter((n) => n.status === selectedStatus)
      }
      console.log("[v0] After status filter:", filtered.length, "(removed", beforeCount - filtered.length, ")")
    }

    // Apply favourites filter
    if (favouritesOnly) {
      const beforeCount = filtered.length
      filtered = filtered.filter((n) => n.is_favourite === true)
      console.log("[v0] After favourites filter:", filtered.length, "(removed", beforeCount - filtered.length, ")")
    }

    // Apply sorting
    if (sortBy === "alphabetical") {
      filtered.sort((a, b) => a.niche_name.localeCompare(b.niche_name))
    } else if (sortBy === "industry") {
      filtered.sort((a, b) => {
        const indCompare = a.industry_name.localeCompare(b.industry_name)
        if (indCompare !== 0) return indCompare
        return a.niche_name.localeCompare(b.niche_name)
      })
    } else if (sortBy === "newest") {
      filtered.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    }

    console.log("[v0] Final filtered count:", filtered.length)
    console.log("[v0] === FILTERING END ===")
    return filtered
  })()

  const handleToggleFavourite = async (nicheId: string) => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) {
        console.log("[v0] No user logged in, cannot toggle favourite")
        return
      }

      const niche = allNiches.find((n) => n.id === nicheId)
      if (!niche) return

      const newFavouriteStatus = !niche.is_favourite

      // Optimistically update local state first
      setAllNiches((prev) => prev.map((n) => (n.id === nicheId ? { ...n, is_favourite: newFavouriteStatus } : n)))

      // Then sync to database
      const { error } = await supabase.from("niche_user_state").upsert(
        {
          user_id: user.id,
          niche_id: nicheId,
          is_favourite: newFavouriteStatus,
          updated_at: new Date().toISOString(),
        },
        {
          onConflict: "user_id,niche_id",
        },
      )

      if (error) {
        console.error("[v0] Error toggling favourite:", error)
        // Revert on error
        setAllNiches((prev) => prev.map((n) => (n.id === nicheId ? { ...n, is_favourite: !newFavouriteStatus } : n)))
      }
    } catch (error) {
      console.error("[v0] Error in handleToggleFavourite:", error)
    }
  }

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header */}
      <header className="border-b border-white/10">
        <div className="max-w-7xl mx-auto px-6 py-5">
          <h1 className="text-2xl font-bold text-white">Opportunities - Niche List</h1>
          <p className="text-sm text-gray-400 mt-1">
            Browse and manage {allNiches.length} business niches across {industries.length} industries
          </p>
        </div>
      </header>

      {/* Filters Section */}
      <div className="border-b border-white/10 bg-white/5">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            {/* Search */}
            <div className="lg:col-span-2">
              <Label htmlFor="search" className="text-sm text-gray-400 mb-2 block">
                Search Niches
              </Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  id="search"
                  placeholder="Search by name or industry..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 h-10 bg-black border-white/20 text-white placeholder:text-gray-500"
                />
              </div>
            </div>

            {/* Industry Filter */}
            <div>
              <Label htmlFor="industry" className="text-sm text-gray-400 mb-2 block">
                Industry
              </Label>
              <Select value={selectedIndustry} onValueChange={setSelectedIndustry}>
                <SelectTrigger className="h-10 bg-black border-white/20 text-white">
                  <SelectValue placeholder="All Industries" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Industries</SelectItem>
                  {industries.map((industry) => (
                    <SelectItem key={industry} value={industry}>
                      {industry}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Status Filter */}
            <div>
              <Label htmlFor="status" className="text-sm text-gray-400 mb-2 block">
                Status
              </Label>
              <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                <SelectTrigger className="h-10 bg-black border-white/20 text-white">
                  <SelectValue placeholder="All Statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="none">Not Started</SelectItem>
                  {STATUS_OPTIONS.map((status) => (
                    <SelectItem key={status} value={status}>
                      {status}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Sort */}
            <div>
              <Label htmlFor="sort" className="text-sm text-gray-400 mb-2 block">
                Sort By
              </Label>
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="h-10 bg-black border-white/20 text-white">
                  <SelectValue placeholder="Sort by..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="alphabetical">Alphabetical</SelectItem>
                  <SelectItem value="industry">By Industry</SelectItem>
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
              onCheckedChange={(checked) => setFavouritesOnly(checked as boolean)}
              className="border-white/20"
            />
            <Label htmlFor="favourites" className="text-sm text-gray-400 cursor-pointer">
              Show favourites only
            </Label>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-[#00A8FF] border-r-transparent"></div>
            <p className="mt-4 text-gray-400">Loading niches...</p>
          </div>
        ) : (
          <>
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
                    setSelectedIndustry("all")
                    setSelectedStatus("all")
                    setFavouritesOnly(false)
                  }}
                >
                  Clear Filters
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {filteredNiches.map((niche) => (
                  <div
                    key={niche.id}
                    onClick={() => setSelectedNiche(niche)}
                    className={cn(
                      "bg-white/5 backdrop-blur-sm rounded-lg p-5 border border-white/10",
                      "hover:bg-white/10 transition-all cursor-pointer",
                      selectedNiche?.id === niche.id && "ring-2 ring-[#00A8FF] border-[#00A8FF]/50",
                    )}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <h3 className="font-semibold text-white text-sm leading-tight flex-1">
                        <span className="text-[#00A8FF]">[{niche.industry_name}]</span> {niche.niche_name}
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
                        <span
                          className={cn(
                            "px-2 py-0.5 rounded text-xs font-medium",
                            niche.status === "Win" && "bg-green-500/20 text-green-400",
                            niche.status === "Coffee Date Demo" && "bg-purple-500/20 text-purple-400",
                            niche.status === "Outreach in Progress" && "bg-blue-500/20 text-blue-400",
                            niche.status === "Shortlisted" && "bg-yellow-500/20 text-yellow-400",
                            niche.status === "Research" && "bg-cyan-500/20 text-cyan-400",
                            !niche.status && "bg-gray-500/20 text-gray-400",
                          )}
                        >
                          {niche.status || "Not Started"}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
