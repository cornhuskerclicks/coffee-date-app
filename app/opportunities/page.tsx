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

type NicheRow = {
  id: string
  niche_name: string
  industry_id: string
  created_at: string | null
}

type IndustryRow = {
  id: string
  name: string
}

type NicheUserStateRow = {
  niche_id: string
  is_favourite: boolean | null
  status: string | null
  notes: string | null
}

type EnrichedNiche = NicheRow & {
  industry_name: string
  is_favourite: boolean
  status: string | null
  notes: string | null
  scale: string
  database_size: string
}

const ALL_INDUSTRIES = "all"
const ALL_STATUSES = "all"

export default function OpportunitiesPage() {
  const supabase = createClient()

  const [allNiches, setAllNiches] = useState<EnrichedNiche[]>([])
  const [industries, setIndustries] = useState<IndustryRow[]>([])
  const [loading, setLoading] = useState(true)

  const [selectedIndustryId, setSelectedIndustryId] = useState<string>(ALL_INDUSTRIES)
  const [selectedStatus, setSelectedStatus] = useState<string>(ALL_STATUSES)
  const [searchQuery, setSearchQuery] = useState("")
  const [favouritesOnly, setFavouritesOnly] = useState(false)
  const [sortBy, setSortBy] = useState<"alphabetical" | "newest">("alphabetical")
  const [selectedNiche, setSelectedNiche] = useState<EnrichedNiche | null>(null)

  useEffect(() => {
    const load = async () => {
      setLoading(true)

      const [{ data: nichesData, error: nichesError }, { data: industriesData, error: industriesError }] =
        await Promise.all([
          supabase
            .from("niches")
            .select("id, niche_name, industry_id, scale, database_size, created_at")
            .order("niche_name", { ascending: true }),
          supabase.from("industries").select("id, name").order("name", { ascending: true }),
        ])

      if (nichesError) {
        console.error("[opps] niches error", nichesError)
        setLoading(false)
        return
      }
      if (industriesError) {
        console.error("[opps] industries error", industriesError)
        setLoading(false)
        return
      }

      const { data: userStatesData, error: userStatesError } = await supabase
        .from("niche_user_state")
        .select("niche_id, is_favourite, status, notes")

      if (userStatesError) {
        console.error("[opps] niche_user_state error", userStatesError)
      }

      const inds = (industriesData ?? []) as IndustryRow[]
      const niches = (nichesData ?? []) as NicheRow[]
      const userStates = (userStatesData ?? []) as NicheUserStateRow[]

      console.log("[opps] Loaded industries:", inds.length)
      console.log("[opps] Loaded niches:", niches.length)

      const industryMap = new Map<string, string>()
      inds.forEach((i) => {
        industryMap.set(i.id, i.name)
      })

      const userStateMap = new Map<string, NicheUserStateRow>()
      userStates.forEach((s) => {
        userStateMap.set(s.niche_id, s)
      })

      const enriched: EnrichedNiche[] = niches.map((n) => {
        const state = userStateMap.get(n.id)

        return {
          id: n.id,
          niche_name: n.niche_name,
          industry_id: n.industry_id,
          created_at: n.created_at,
          scale: (n as any).scale || "Local",
          database_size: (n as any).database_size || "Small",
          industry_name: industryMap.get(n.industry_id) ?? "Unknown",
          is_favourite: state?.is_favourite ?? false,
          status: state?.status ?? null,
          notes: state?.notes ?? "",
        }
      })

      console.log("[opps] Sample enriched niche:", enriched[0])
      console.log(
        "[opps] Distinct industry_ids in enriched:",
        Array.from(new Set(enriched.map((n) => n.industry_id))).slice(0, 10),
      )

      setIndustries(inds)
      setAllNiches(enriched)
      setLoading(false)
    }

    load()
  }, [])

  const filteredNiches = useMemo(() => {
    console.log("DEBUG SelectedIndustryId:", selectedIndustryId)
    console.log("DEBUG Sample industry_id from enriched data:", allNiches[0]?.industry_id)
    console.log("DEBUG Distinct loaded industry_ids:", [...new Set(allNiches.map((n) => n.industry_id))].slice(0, 10))

    console.log("[opps] Starting filter – total niches:", allNiches.length)
    let result = [...allNiches]

    if (selectedIndustryId !== ALL_INDUSTRIES) {
      result = result.filter((n) => n.industry_id === selectedIndustryId)
      console.log("[opps] After industry filter:", result.length, "niches (industryId:", selectedIndustryId, ")")
    }

    if (selectedStatus !== ALL_STATUSES) {
      result = result.filter((n) => n.status === selectedStatus)
    }

    if (favouritesOnly) {
      result = result.filter((n) => n.is_favourite)
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase()
      result = result.filter((n) => n.niche_name.toLowerCase().includes(q))
    }

    if (sortBy === "alphabetical") {
      result.sort((a, b) => a.niche_name.localeCompare(b.niche_name))
    } else {
      result.sort((a, b) => new Date(b.created_at ?? 0).getTime() - new Date(a.created_at ?? 0).getTime())
    }

    console.log("[opps] Final filtered niches:", result.length)
    return result
  }, [allNiches, selectedIndustryId, selectedStatus, favouritesOnly, searchQuery, sortBy])

  const handleToggleFavourite = async (nicheId: string) => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) return

      const niche = allNiches.find((n) => n.id === nicheId)
      if (!niche) return

      const newFavouriteStatus = !niche.is_favourite

      setAllNiches((prev) => prev.map((n) => (n.id === nicheId ? { ...n, is_favourite: newFavouriteStatus } : n)))

      const upsertData: any = {
        user_id: user.id,
        niche_id: nicheId,
        is_favourite: newFavouriteStatus,
        updated_at: new Date().toISOString(),
      }

      if (niche.status) {
        upsertData.status = niche.status
      }

      const { error } = await supabase.from("niche_user_state").upsert(upsertData, {
        onConflict: "user_id,niche_id",
      })

      if (error) {
        console.error("Error toggling favourite:", error)
        setAllNiches((prev) => prev.map((n) => (n.id === nicheId ? { ...n, is_favourite: !newFavouriteStatus } : n)))
      }
    } catch (error) {
      console.error("Error in handleToggleFavourite:", error)
    }
  }

  return (
    <div className="min-h-screen bg-black text-white">
      <header className="border-b border-white/10">
        <div className="max-w-7xl mx-auto px-6 py-5">
          <h1 className="text-2xl font-bold text-white">Opportunities - Niche List</h1>
          <p className="text-sm text-gray-400 mt-1">
            Browse and manage {allNiches.length} business niches across {industries.length} industries
          </p>
        </div>
      </header>

      <div className="border-b border-white/10 bg-white/5">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <div className="lg:col-span-2">
              <Label htmlFor="search" className="text-sm text-gray-400 mb-2 block">
                Search Niches
              </Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  id="search"
                  placeholder="Search by name..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 h-10 bg-black border-white/20 text-white placeholder:text-gray-500"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="industry" className="text-sm text-gray-400 mb-2 block">
                Industry
              </Label>
              <Select
                value={selectedIndustryId}
                onValueChange={(val) => {
                  console.log("SELECTED INDUSTRY VALUE RAW:", val)
                  console.log("SELECTED INDUSTRY VALUE TYPE:", typeof val)
                  console.log(
                    "IS UUID FORMAT:",
                    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(val),
                  )
                  setSelectedIndustryId(val)
                }}
              >
                <SelectTrigger className="h-10 bg-black border-white/20 text-white">
                  <SelectValue placeholder="All Industries" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={ALL_INDUSTRIES}>All Industries</SelectItem>
                  {industries.map((industry) => (
                    <SelectItem key={industry.id} value={industry.id}>
                      {industry.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="status" className="text-sm text-gray-400 mb-2 block">
                Status
              </Label>
              <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                <SelectTrigger className="h-10 bg-black border-white/20 text-white">
                  <SelectValue placeholder="All Statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={ALL_STATUSES}>All Statuses</SelectItem>
                  <SelectItem value="none">Not Started</SelectItem>
                  {getStatusOptions().map((status) => (
                    <SelectItem key={status} value={status}>
                      {status}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="sort" className="text-sm text-gray-400 mb-2 block">
                Sort By
              </Label>
              <Select value={sortBy} onValueChange={(v) => setSortBy(v as "alphabetical" | "newest")}>
                <SelectTrigger className="h-10 bg-black border-white/20 text-white">
                  <SelectValue placeholder="Sort by..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="alphabetical">Alphabetical</SelectItem>
                  <SelectItem value="newest">Newest First</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

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
                    setSelectedIndustryId(ALL_INDUSTRIES)
                    setSelectedStatus(ALL_STATUSES)
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
          </>
        )}
      </div>
    </div>
  )
}
