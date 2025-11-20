"use client"

import { useState, useEffect } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { createClient } from "@/lib/supabase/client"
import { useToast } from "@/hooks/use-toast"
import { Star, Lightbulb, Copy, Check, Loader2, Table2, LayoutGrid } from "lucide-react"
import { cn } from "@/lib/utils"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

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
  }
}

const STATUSES = ["Not Reviewed", "Shortlisted", "Outreach In Progress", "Proposal Sent", "Won", "Dropped"]

export default function OpportunitiesPage() {
  const [view, setView] = useState<"table" | "board">("table")
  const [industries, setIndustries] = useState<Industry[]>([])
  const [niches, setNiches] = useState<Niche[]>([])
  const [filteredNiches, setFilteredNiches] = useState<Niche[]>([])
  const [selectedNiche, setSelectedNiche] = useState<Niche | null>(null)
  const [loading, setLoading] = useState(true)

  // Filters
  const [industryFilter, setIndustryFilter] = useState<string>("all")
  const [scaleFilter, setScaleFilter] = useState<string[]>([])
  const [sizeFilter, setSizeFilter] = useState<string[]>([])
  const [statusFilter, setStatusFilter] = useState<string[]>([])
  const [favouritesOnly, setFavouritesOnly] = useState(false)

  // AI generation states
  const [generatingOffer, setGeneratingOffer] = useState(false)
  const [generatingToolkit, setGeneratingToolkit] = useState(false)
  const [generatingDemo, setGeneratingDemo] = useState(false)
  const [generatingChecklist, setGeneratingChecklist] = useState(false)
  const [aiOffer, setAiOffer] = useState<string>("")
  const [aiToolkit, setAiToolkit] = useState<string>("")
  const [aiDemo, setAiDemo] = useState<string>("")
  const [aiChecklist, setAiChecklist] = useState<string>("")
  const [copiedStates, setCopiedStates] = useState<Record<string, boolean>>({})

  const { toast } = useToast()
  const supabase = createClient()

  useEffect(() => {
    loadData()
  }, [])

  useEffect(() => {
    applyFilters()
  }, [niches, industryFilter, scaleFilter, sizeFilter, statusFilter, favouritesOnly])

  const loadData = async () => {
    try {
      setLoading(true)
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) return

      // Load industries
      const { data: industriesData } = await supabase.from("industries").select("*").order("name")

      setIndustries(industriesData || [])

      // Load niches with user state
      const { data: nichesData } = await supabase
        .from("niches")
        .select(`
          *,
          industry:industries(id, name),
          user_state:niche_user_state!niche_id(is_favourite, status, notes, expected_monthly_value)
        `)
        .order("niche_name")

      const processedNiches = (nichesData || []).map((niche) => ({
        ...niche,
        user_state: niche.user_state?.[0] || {
          is_favourite: false,
          status: "Not Reviewed",
          notes: null,
          expected_monthly_value: null,
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

    if (industryFilter !== "all") {
      filtered = filtered.filter((n) => n.industry?.id === industryFilter)
    }

    if (scaleFilter.length > 0) {
      filtered = filtered.filter((n) => scaleFilter.includes(n.scale))
    }

    if (sizeFilter.length > 0) {
      filtered = filtered.filter((n) => sizeFilter.includes(n.database_size))
    }

    if (statusFilter.length > 0) {
      filtered = filtered.filter((n) => statusFilter.includes(n.user_state?.status || "Not Reviewed"))
    }

    if (favouritesOnly) {
      filtered = filtered.filter((n) => n.user_state?.is_favourite)
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
          status: niche.user_state?.status || "Not Reviewed",
        },
        {
          onConflict: "niche_id,user_id",
        },
      )

      if (error) throw error

      // Update local state
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

  const updateStatus = async (nicheId: string, newStatus: string) => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) return

      const niche = niches.find((n) => n.id === nicheId)

      const { error } = await supabase.from("niche_user_state").upsert(
        {
          niche_id: nicheId,
          user_id: user.id,
          status: newStatus,
          is_favourite: niche?.user_state?.is_favourite || false,
        },
        {
          onConflict: "niche_id,user_id",
        },
      )

      if (error) throw error

      // Update local state
      setNiches(
        niches.map((n) => (n.id === nicheId ? { ...n, user_state: { ...n.user_state!, status: newStatus } } : n)),
      )

      if (selectedNiche?.id === nicheId) {
        setSelectedNiche({ ...selectedNiche, user_state: { ...selectedNiche.user_state!, status: newStatus } })
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      })
    }
  }

  const generateAIContent = async (type: "offer" | "toolkit" | "demo" | "checklist") => {
    if (!selectedNiche) return

    const setters = {
      offer: { loading: setGeneratingOffer, content: setAiOffer },
      toolkit: { loading: setGeneratingToolkit, content: setAiToolkit },
      demo: { loading: setGeneratingDemo, content: setAiDemo },
      checklist: { loading: setGeneratingChecklist, content: setAiChecklist },
    }

    const prompts = {
      offer: `Create a compelling 1-2 sentence dead-lead revival offer for businesses in the "${selectedNiche.niche_name}" niche.`,
      toolkit: `Generate a cold outreach toolkit for "${selectedNiche.niche_name}" businesses:\n- 3 compelling email subject lines\n- 1 professional cold email (150 words)\n- 3 DM openers for LinkedIn/Instagram`,
      demo: `Create a Coffee Date demo plan for "${selectedNiche.niche_name}" businesses, outlining what AI features and workflows to showcase in our Aether Revive platform.`,
      checklist: `Generate a GHL Snapshot setup checklist for "${selectedNiche.niche_name}" businesses, including recommended workflows, campaigns, tags, and automations.`,
    }

    try {
      setters[type].loading(true)
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [{ role: "user", content: prompts[type] }],
        }),
      })

      if (!response.ok) throw new Error("Failed to generate content")

      const data = await response.json()
      setters[type].content(data.message || "Generated content")

      toast({
        title: "Content Generated",
        description: `AI ${type} content ready to copy`,
      })
    } catch (error: any) {
      toast({
        title: "Generation Failed",
        description: error.message,
        variant: "destructive",
      })
    } finally {
      setters[type].loading(false)
    }
  }

  const copyToClipboard = async (text: string, key: string) => {
    await navigator.clipboard.writeText(text)
    setCopiedStates({ ...copiedStates, [key]: true })
    setTimeout(() => {
      setCopiedStates({ ...copiedStates, [key]: false })
    }, 2000)
    toast({
      title: "Copied!",
      description: "Content copied to clipboard",
    })
  }

  if (loading) {
    return (
      <div className="p-8 bg-black min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="bg-black min-h-screen">
      <div className="p-8 space-y-6 max-w-[1600px] mx-auto">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-[32px] font-bold text-white">Dead Lead Revival Opportunities</h1>
            <p className="text-[16px] text-white/60 mt-1">
              Browse {niches.length} niches and turn them into concrete revival opportunities
            </p>
          </div>

          <div className="flex gap-2">
            <Button
              variant={view === "table" ? "default" : "outline"}
              onClick={() => setView("table")}
              className={cn(
                "gap-2",
                view === "table" ? "bg-primary text-white" : "bg-white/5 border-white/10 text-white hover:bg-white/10",
              )}
            >
              <Table2 className="h-4 w-4" />
              Table
            </Button>
            <Button
              variant={view === "board" ? "default" : "outline"}
              onClick={() => setView("board")}
              className={cn(
                "gap-2",
                view === "board" ? "bg-primary text-white" : "bg-white/5 border-white/10 text-white hover:bg-white/10",
              )}
            >
              <LayoutGrid className="h-4 w-4" />
              Board
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-12 gap-6">
          {/* Filters Panel */}
          <div className="col-span-3 space-y-4">
            <Card className="border border-white/10 bg-white/5 p-4 space-y-4">
              <h3 className="text-[16px] font-semibold text-white">Filters</h3>

              <div className="space-y-2">
                <Label className="text-sm text-white">Industry</Label>
                <Select value={industryFilter} onValueChange={setIndustryFilter}>
                  <SelectTrigger className="bg-white/5 border-white/10 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-[#111] border-white/10">
                    <SelectItem value="all">All Industries</SelectItem>
                    {industries.map((ind) => (
                      <SelectItem key={ind.id} value={ind.id}>
                        {ind.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="text-sm text-white">Scale</Label>
                <div className="flex flex-wrap gap-2">
                  {["Local", "National", "Global"].map((scale) => (
                    <button
                      key={scale}
                      onClick={() =>
                        setScaleFilter(
                          scaleFilter.includes(scale)
                            ? scaleFilter.filter((s) => s !== scale)
                            : [...scaleFilter, scale],
                        )
                      }
                      className={cn(
                        "px-3 py-1 text-xs rounded-full transition-all",
                        scaleFilter.includes(scale)
                          ? "bg-primary text-white"
                          : "bg-white/5 text-white/60 hover:bg-white/10",
                      )}
                    >
                      {scale}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-sm text-white">Database Size</Label>
                <div className="flex flex-wrap gap-2">
                  {["Small", "Big"].map((size) => (
                    <button
                      key={size}
                      onClick={() =>
                        setSizeFilter(
                          sizeFilter.includes(size) ? sizeFilter.filter((s) => s !== size) : [...sizeFilter, size],
                        )
                      }
                      className={cn(
                        "px-3 py-1 text-xs rounded-full transition-all",
                        sizeFilter.includes(size)
                          ? "bg-primary text-white"
                          : "bg-white/5 text-white/60 hover:bg-white/10",
                      )}
                    >
                      {size}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-sm text-white">Status</Label>
                <div className="space-y-1">
                  {STATUSES.map((status) => (
                    <label key={status} className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={statusFilter.includes(status)}
                        onChange={() =>
                          setStatusFilter(
                            statusFilter.includes(status)
                              ? statusFilter.filter((s) => s !== status)
                              : [...statusFilter, status],
                          )
                        }
                        className="rounded border-white/20 bg-white/5 text-primary focus:ring-primary"
                      />
                      <span className="text-xs text-white/70">{status}</span>
                    </label>
                  ))}
                </div>
              </div>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={favouritesOnly}
                  onChange={(e) => setFavouritesOnly(e.target.checked)}
                  className="rounded border-white/20 bg-white/5 text-primary focus:ring-primary"
                />
                <span className="text-sm text-white">Only my favourites</span>
              </label>
            </Card>
          </div>

          {/* Main Content */}
          {view === "table" ? (
            <>
              {/* Niches Table */}
              <div className="col-span-6 space-y-4">
                <Card className="border border-white/10 bg-white/5">
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-white/10">
                          <th className="p-3 text-left text-xs font-semibold text-white">Niche</th>
                          <th className="p-3 text-left text-xs font-semibold text-white">Industry</th>
                          <th className="p-3 text-left text-xs font-semibold text-white">Scale</th>
                          <th className="p-3 text-left text-xs font-semibold text-white">Size</th>
                          <th className="p-3 text-left text-xs font-semibold text-white">Status</th>
                          <th className="p-3 text-center text-xs font-semibold text-white">★</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredNiches.map((niche) => (
                          <tr
                            key={niche.id}
                            onClick={() => setSelectedNiche(niche)}
                            className={cn(
                              "border-b border-white/5 cursor-pointer transition-colors",
                              selectedNiche?.id === niche.id ? "bg-primary/20" : "hover:bg-white/5",
                            )}
                          >
                            <td className="p-3 text-sm text-white">{niche.niche_name}</td>
                            <td className="p-3 text-xs text-white/60">{niche.industry?.name}</td>
                            <td className="p-3">
                              <span className="text-xs px-2 py-1 rounded-full bg-white/5 text-white/70">
                                {niche.scale}
                              </span>
                            </td>
                            <td className="p-3">
                              <span className="text-xs px-2 py-1 rounded-full bg-white/5 text-white/70">
                                {niche.database_size}
                              </span>
                            </td>
                            <td className="p-3">
                              <Select
                                value={niche.user_state?.status || "Not Reviewed"}
                                onValueChange={(value) => updateStatus(niche.id, value)}
                              >
                                <SelectTrigger className="h-7 text-xs bg-white/5 border-white/10 text-white">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent className="bg-[#111] border-white/10">
                                  {STATUSES.map((status) => (
                                    <SelectItem key={status} value={status}>
                                      {status}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </td>
                            <td className="p-3 text-center">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation()
                                  toggleFavourite(niche)
                                }}
                                className="hover:scale-110 transition-transform"
                              >
                                <Star
                                  className={cn(
                                    "h-5 w-5",
                                    niche.user_state?.is_favourite
                                      ? "fill-yellow-400 text-yellow-400"
                                      : "text-white/30",
                                  )}
                                />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </Card>
              </div>

              {/* Details & AI Panel */}
              <div className="col-span-3 space-y-4">
                {selectedNiche ? (
                  <>
                    <Card className="border border-white/10 bg-white/5 p-4 space-y-4">
                      <div className="flex items-start justify-between">
                        <div>
                          <h3 className="text-[16px] font-semibold text-white">{selectedNiche.niche_name}</h3>
                          <p className="text-xs text-white/60 mt-1">{selectedNiche.industry?.name}</p>
                        </div>
                        <button
                          onClick={() => toggleFavourite(selectedNiche)}
                          className="hover:scale-110 transition-transform"
                        >
                          <Star
                            className={cn(
                              "h-5 w-5",
                              selectedNiche.user_state?.is_favourite
                                ? "fill-yellow-400 text-yellow-400"
                                : "text-white/30",
                            )}
                          />
                        </button>
                      </div>

                      <div className="flex gap-2">
                        <span className="text-xs px-2 py-1 rounded-full bg-white/5 text-white/70">
                          {selectedNiche.scale}
                        </span>
                        <span className="text-xs px-2 py-1 rounded-full bg-white/5 text-white/70">
                          {selectedNiche.database_size}
                        </span>
                      </div>

                      <div className="space-y-3 pt-2">
                        <div className="space-y-1">
                          <Label className="text-xs text-white">Status</Label>
                          <Select
                            value={selectedNiche.user_state?.status || "Not Reviewed"}
                            onValueChange={(value) => updateStatus(selectedNiche.id, value)}
                          >
                            <SelectTrigger className="bg-white/5 border-white/10 text-white">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent className="bg-[#111] border-white/10">
                              {STATUSES.map((status) => (
                                <SelectItem key={status} value={status}>
                                  {status}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="space-y-1">
                          <Label className="text-xs text-white">Notes</Label>
                          <Textarea
                            value={selectedNiche.user_state?.notes || ""}
                            placeholder="Add your notes..."
                            className="bg-white/5 border-white/10 text-white placeholder:text-white/40 min-h-[80px]"
                          />
                        </div>

                        <div className="space-y-1">
                          <Label className="text-xs text-white">Expected Monthly Value ($)</Label>
                          <Input
                            type="number"
                            value={selectedNiche.user_state?.expected_monthly_value || ""}
                            placeholder="5000"
                            className="bg-white/5 border-white/10 text-white placeholder:text-white/40"
                          />
                        </div>
                      </div>
                    </Card>

                    <Card className="border border-white/10 bg-white/5 p-4 space-y-4">
                      <div className="flex items-center gap-2">
                        <Lightbulb className="h-5 w-5 text-primary" />
                        <h3 className="text-[16px] font-semibold text-white">AI Actions</h3>
                      </div>

                      <div className="space-y-3">
                        <Button
                          onClick={() => generateAIContent("offer")}
                          disabled={generatingOffer}
                          className="w-full justify-start bg-white/5 hover:bg-white/10 text-white border border-white/10"
                        >
                          {generatingOffer ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                          Generate Dead-Lead Offer
                        </Button>
                        {aiOffer && (
                          <div className="p-3 bg-white/5 rounded-md border border-white/10 space-y-2">
                            <p className="text-xs text-white/80">{aiOffer}</p>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => copyToClipboard(aiOffer, "offer")}
                              className="h-7 text-xs"
                            >
                              {copiedStates["offer"] ? (
                                <Check className="h-3 w-3 mr-1" />
                              ) : (
                                <Copy className="h-3 w-3 mr-1" />
                              )}
                              {copiedStates["offer"] ? "Copied!" : "Copy"}
                            </Button>
                          </div>
                        )}

                        <Button
                          onClick={() => generateAIContent("toolkit")}
                          disabled={generatingToolkit}
                          className="w-full justify-start bg-white/5 hover:bg-white/10 text-white border border-white/10"
                        >
                          {generatingToolkit ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                          Cold Outreach Toolkit
                        </Button>
                        {aiToolkit && (
                          <div className="p-3 bg-white/5 rounded-md border border-white/10 space-y-2">
                            <p className="text-xs text-white/80 whitespace-pre-wrap">{aiToolkit}</p>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => copyToClipboard(aiToolkit, "toolkit")}
                              className="h-7 text-xs"
                            >
                              {copiedStates["toolkit"] ? (
                                <Check className="h-3 w-3 mr-1" />
                              ) : (
                                <Copy className="h-3 w-3 mr-1" />
                              )}
                              {copiedStates["toolkit"] ? "Copied!" : "Copy"}
                            </Button>
                          </div>
                        )}

                        <Button
                          onClick={() => generateAIContent("demo")}
                          disabled={generatingDemo}
                          className="w-full justify-start bg-white/5 hover:bg-white/10 text-white border border-white/10"
                        >
                          {generatingDemo ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                          Coffee Date Demo Plan
                        </Button>
                        {aiDemo && (
                          <div className="p-3 bg-white/5 rounded-md border border-white/10 space-y-2">
                            <p className="text-xs text-white/80 whitespace-pre-wrap">{aiDemo}</p>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => copyToClipboard(aiDemo, "demo")}
                              className="h-7 text-xs"
                            >
                              {copiedStates["demo"] ? (
                                <Check className="h-3 w-3 mr-1" />
                              ) : (
                                <Copy className="h-3 w-3 mr-1" />
                              )}
                              {copiedStates["demo"] ? "Copied!" : "Copy"}
                            </Button>
                          </div>
                        )}

                        <Button
                          onClick={() => generateAIContent("checklist")}
                          disabled={generatingChecklist}
                          className="w-full justify-start bg-white/5 hover:bg-white/10 text-white border border-white/10"
                        >
                          {generatingChecklist ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                          GHL Snapshot Checklist
                        </Button>
                        {aiChecklist && (
                          <div className="p-3 bg-white/5 rounded-md border border-white/10 space-y-2">
                            <p className="text-xs text-white/80 whitespace-pre-wrap">{aiChecklist}</p>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => copyToClipboard(aiChecklist, "checklist")}
                              className="h-7 text-xs"
                            >
                              {copiedStates["checklist"] ? (
                                <Check className="h-3 w-3 mr-1" />
                              ) : (
                                <Copy className="h-3 w-3 mr-1" />
                              )}
                              {copiedStates["checklist"] ? "Copied!" : "Copy"}
                            </Button>
                          </div>
                        )}
                      </div>
                    </Card>
                  </>
                ) : (
                  <Card className="border border-white/10 bg-white/5 p-8 text-center">
                    <p className="text-sm text-white/60">Select a niche to view details and generate AI content</p>
                  </Card>
                )}
              </div>
            </>
          ) : (
            /* Board View */
            <div className="col-span-9 space-y-4">
              <div className="grid grid-cols-6 gap-4">
                {STATUSES.map((status) => {
                  const statusNiches = filteredNiches.filter((n) => (n.user_state?.status || "Not Reviewed") === status)

                  return (
                    <div key={status} className="space-y-3">
                      <div className="flex items-center justify-between">
                        <h3 className="text-sm font-semibold text-white">{status}</h3>
                        <span className="text-xs text-white/60">{statusNiches.length}</span>
                      </div>
                      <div className="space-y-2 min-h-[400px] p-3 bg-white/5 rounded-md border border-white/10">
                        {statusNiches.map((niche) => (
                          <Card
                            key={niche.id}
                            onClick={() => setSelectedNiche(niche)}
                            className={cn(
                              "border border-white/10 bg-card p-3 cursor-pointer hover:bg-white/10 transition-colors",
                              selectedNiche?.id === niche.id && "ring-2 ring-primary",
                            )}
                          >
                            <div className="space-y-2">
                              <p className="text-xs font-medium text-white">{niche.niche_name}</p>
                              <p className="text-[10px] text-white/60">{niche.industry?.name}</p>
                              <div className="flex gap-1">
                                <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-white/5 text-white/70">
                                  {niche.scale}
                                </span>
                                <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-white/5 text-white/70">
                                  {niche.database_size}
                                </span>
                              </div>
                            </div>
                          </Card>
                        ))}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
