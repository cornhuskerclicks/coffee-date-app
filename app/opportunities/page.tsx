"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Star } from "lucide-react"
import { cn } from "@/lib/utils"
import { getStatusConfig, type StatusValue } from "@/lib/status-map"

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
            Showing {allNiches.length} business niches across {industries.length} industries
          </p>
        </div>
      </header>

      {/* Results */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {allNiches.map((niche) => {
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
                        niche.is_favourite ? "fill-yellow-400 text-yellow-400" : "text-gray-400 hover:text-yellow-400",
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
      </div>
    </div>
  )
}
