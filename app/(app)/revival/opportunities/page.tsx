"use client"

import { useState, useEffect, useRef } from "react"
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
  Send,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Checkbox } from "@/components/ui/checkbox"
import React from "react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

const STATUSES = ["Research", "Shortlisted", "Outreach in Progress", "Coffee Date Demo", "Win"]

type Industry = {
  id: string
  name: string
}

// Define the structure for outreach_channels, allowing for specific keys and counts
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
  emails?: number // Added for email tracking
}

type Niche = {
  id: string
  niche_name: string
  industry_id: string | null
  scale: string | null
  database_size: string | null
  default_priority: number | null
  industry?: Industry // Kept for display
  user_state: {
    id: string // Added to match Supabase response
    niche_id: string // Added to match Supabase response
    user_id: string // Added to match Supabase response
    is_favourite: boolean
    status: string | null
    notes: string | null
    expected_monthly_value: number | null
    // Research phase
    research_notes: string | null
    aov_input: number | null
    database_size_input: number | null
    // REMOVED: conversation_rate: number | null
    // REMOVED: sales_conversion: number | null
    // REMOVED: retainer_pct: number | null // Kept for reference but not used in new calc
    // REMOVED: profit_pct: number | null
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
    // Shortlisted phase
    messaging_scripts: any | null
    messaging_prepared: boolean | null
    // Outreach phase
    outreach_start_date: string | null
    outreach_channels: OutreachChannels | null
    outreach_messages_sent: number
    outreach_notes: string | null
    demo_script_created: boolean | null
    demo_script: string | null
    coffee_date_completed: boolean | null
    ghl_sub_account_id: string | null
    // Win phase
    active_monthly_retainer: number | null
    monthly_profit_split: number | null
    target_monthly_recurring: number | null
    win_completed: boolean | null
  } | null
}

export default function OpportunitiesV2() {
  const [industries, setIndustries] = useState<Industry[]>([])
  const [niches, setNiches] = useState<Niche[]>([])
  const [filteredNiches, setFilteredNiches] = useState<Niche[]>([])
  const [selectedNiche, setSelectedNiche] = useState<Niche | null>(null)
  const [loading, setLoading] = useState(true)
  const [isLoading, setIsLoading] = useState(false) // General loading state

  // Renamed to avoid confusion with the general `isLoading` state
  const [isGeneratingDemo, setIsGeneratingDemo] = useState(false)

  const [searchTerm, setSearchTerm] = useState("")
  const [industryFilter, setIndustryFilter] = useState<string>("all")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [favouritesOnly, setFavouritesOnly] = useState(false)
  const [sortBy, setSortBy] = useState<string>("alphabetical")

  const handleIndustryChange = (value: string) => {
    console.log("[DEBUG] Industry filter changed to:", value)
    setIndustryFilter(value)
  }

  const handleStatusChange = (value: string) => {
    console.log("[v0] Status dropdown changed to:", value)
    setStatusFilter(value)
  }

  const handleSortChange = (value: string) => {
    console.log("[v0] Sort dropdown changed to:", value)
    setSortBy(value)
  }

  const [localInputs, setLocalInputs] = useState({
    researchNotes: "",
    aovInput: "",
    databaseSizeInput: "",
    conversationRate: "40", // Local only, not stored in DB
    salesConversion: "10", // Local only, not stored in DB
    profitSplit: "50", // Local only, not stored in DB
    outreachNotes: "",
    profileChatInput: "",
    objectionsHeard: "", // Added for outreach objections
  })

  // AI generation states
  const [generatingProfile, setGeneratingProfile] = useState(false)
  // CHANGE: Removed generateMessaging state
  // const [generatingDemo, setGeneratingDemo] = useState(false) // Moved to top level

  const [profileChatMessagesByNiche, setProfileChatMessagesByNiche] = useState<
    Record<string, Array<{ role: string; content: string }>>
  >({}) // Use string for niche ID
  const [isProfileChatActive, setIsProfileChatActive] = useState(false)
  const [isProfileChatLoading, setIsProfileChatLoading] = useState(false)

  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    research: true,
    calculator: true,
    profile: true,
  })

  // CHANGE: Initialize checkbox states from selectedNiche
  const [checkboxStates, setCheckboxStates] = React.useState({
    research_notes_added: false,
    aov_calculator_completed: false,
    customer_profile_generated: false,
    messaging_prepared: false, // Added for messaging_prepared
  })

  const chatEndRef = useRef<HTMLDivElement>(null)

  const { toast } = useToast()
  const supabase = createClient()

  useEffect(() => {
    loadIndustries()
    loadNiches()
  }, [])

  useEffect(() => {
    applyFilters()
  }, [niches, searchTerm, industryFilter, statusFilter, favouritesOnly, sortBy])

  const profileChatMessages = selectedNiche?.id ? profileChatMessagesByNiche[selectedNiche.id] || [] : []

  // CHANGE: Simplified useEffect - only update when switching niches, never reset during interaction
  useEffect(() => {
    if (selectedNiche?.user_state) {
      console.log("[v0] Loading niche data:", selectedNiche.niche_name)

      setCheckboxStates({
        research_notes_added: selectedNiche.user_state.research_notes_added ?? false,
        aov_calculator_completed: selectedNiche.user_state.aov_calculator_completed ?? false,
        customer_profile_generated: selectedNiche.user_state.customer_profile_generated ?? false,
        messaging_prepared: selectedNiche.user_state.messaging_prepared ?? false,
      })

      setIsProfileChatActive(false)

      setLocalInputs({
        researchNotes: selectedNiche.user_state.research_notes || "",
        aovInput: selectedNiche.user_state.aov_input?.toString() || "",
        databaseSizeInput: selectedNiche.user_state.database_size_input?.toString() || "",
        conversationRate: "40", // Always use default
        salesConversion: "10", // Always use default
        profitSplit: "50", // Always use default
        outreachNotes: selectedNiche.user_state.outreach_notes || "",
        profileChatInput: "",
        objectionsHeard: (selectedNiche.user_state.outreach_channels as OutreachChannels)?.objections || "", // Load objections
      })
    } else {
      // Reset local inputs and checkboxes when no niche is selected or user_state is null
      setLocalInputs({
        researchNotes: "",
        aovInput: "",
        databaseSizeInput: "",
        conversationRate: "40",
        salesConversion: "10",
        profitSplit: "50",
        outreachNotes: "",
        profileChatInput: "",
        objectionsHeard: "",
      })
      setCheckboxStates({
        research_notes_added: false,
        aov_calculator_completed: false,
        customer_profile_generated: false,
        messaging_prepared: false,
      })
      setIsProfileChatActive(false)
    }
  }, [selectedNiche?.id]) // Only trigger when niche ID changes, not on every selectedNiche update

  useEffect(() => {
    if (chatEndRef.current && isProfileChatActive) {
      chatEndRef.current.scrollIntoView({ behavior: "smooth" })
    }
  }, [profileChatMessages, isProfileChatActive])

  const loadIndustries = async () => {
    try {
      const { data: industriesData } = await supabase.from("industries").select("*").order("name")
      console.log("[DEBUG] Industries loaded:", industriesData?.length)
      setIndustries(industriesData || [])
    } catch (error: any) {
      console.error("[v0] Error loading industries:", error)
      toast({
        title: "Error loading industries",
        description: error.message,
        variant: "destructive",
      })
    }
  }

  const loadNiches = async () => {
    try {
      setLoading(true)
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) return

      const { data: nichesData } = await supabase
        .from("niches")
        .select(`
          *,
          industry:industries(id, name),
          user_state:niche_user_state!niche_id(*)
        `)
        .order("niche_name")

      console.log("[DEBUG] Niches loaded:", nichesData?.length)
      if (nichesData && nichesData.length > 0) {
        console.log("[v0] Sample niche with industry:", {
          niche_name: nichesData[0].niche_name,
          raw_industry: nichesData[0].industry,
          industry_is_array: Array.isArray(nichesData[0].industry),
        })
      }

      const processedNiches = (nichesData || []).map((niche) => ({
        ...niche,
        industry: niche.industry?.[0] || null, // Ensure industry is correctly assigned
        user_state: niche.user_state?.[0] || {
          id: "", // Default to empty string if no user_state exists
          niche_id: niche.id,
          user_id: user.id,
          is_favourite: false,
          status: "Research",
          notes: null,
          expected_monthly_value: null,
          research_notes: null,
          aov_input: null,
          database_size_input: null,
          // Add default values for new fields
          // REMOVED: conversation_rate: null,
          // REMOVED: sales_conversion: null,
          // REMOVED: retainer_pct: null, // Kept for reference
          // REMOVED: profit_pct: null,
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
          outreach_channels: null, // Initialize as null
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

      if (processedNiches.length > 0) {
        console.log("[v0] Sample processed niche:", {
          niche_name: processedNiches[0].niche_name,
          industry: processedNiches[0].industry,
          industry_id: processedNiches[0].industry?.id,
          industry_name: processedNiches[0].industry?.name,
        })
        // Count niches by industry
        const byIndustry = processedNiches.reduce((acc: any, n: any) => {
          const id = n.industry?.id || "unknown"
          acc[id] = (acc[id] || 0) + 1
          return acc
        }, {})
        console.log("[v0] Niches by industry ID:", byIndustry)
      }

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

    console.log("[DEBUG] industryFilter:", industryFilter)

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter((n) => n.niche_name.toLowerCase().includes(searchTerm.toLowerCase()))
      console.log("[v0] After search filter:", filtered.length, "niches (search:", searchTerm, ")")
    }

    if (industryFilter !== "all") {
      console.log("[v0] Filtering by industry ID:", industryFilter)
      console.log("[v0] Sample niche industry before filter:", filtered[0]?.industry)
      filtered = filtered.filter((n) => n.industry?.id === industryFilter)
      console.log("[v0] After industry filter:", filtered.length, "niches")
      if (filtered.length > 0) {
        console.log("[v0] Sample filtered niche:", {
          name: filtered[0].niche_name,
          industry_id: filtered[0].industry?.id,
          industry_name: filtered[0].industry?.name,
        })
      }
    }

    // Status filter
    if (statusFilter !== "all") {
      filtered = filtered.filter((n) => (n.user_state?.status || "Research") === statusFilter)
      console.log("[v0] After status filter:", filtered.length, "niches (status:", statusFilter, ")")
    }

    // Favourites filter
    if (favouritesOnly) {
      filtered = filtered.filter((n) => n.user_state?.is_favourite)
      console.log("[v0] After favourites filter:", filtered.length, "niches")
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
      // Sorting by potential retainer, which is now tiered based on DB size
      filtered.sort((a, b) => {
        const aPotential = a.user_state?.potential_retainer || 0
        const bPotential = b.user_state?.potential_retainer || 0
        return bPotential - aPotential
      })
    }

    console.log("[DEBUG] filteredNiches count:", filtered.length)
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
          // Ensure other fields are preserved if they exist, or set to null if not
          research_notes: niche.user_state?.research_notes ?? null,
          aov_input: niche.user_state?.aov_input ?? null,
          database_size_input: niche.user_state?.database_size_input ?? null,
          outreach_notes: niche.user_state?.outreach_notes ?? null,
          // Add other relevant fields that might be modified and should be preserved
          // For example, if you toggle favorite while other fields are being edited
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

  const calculateAOVOutputs = () => {
    const aov = Number.parseFloat(localInputs.aovInput) || 0
    const db = Number.parseFloat(localInputs.databaseSizeInput) || 0
    const convRate = Number.parseFloat(localInputs.conversationRate) || 40
    const salesFromConversations = Number.parseFloat(localInputs.salesConversion) || 10
    const profitPct = Number.parseFloat(localInputs.profitSplit) || 50 // Corrected field name

    // Constants
    const MAX_CAPACITY = 3000 // 100 SMS/day * 30 days

    // Formula: CPA = AOV / 3 (no ceiling limit)
    const cpa = aov > 0 ? aov / 3 : 0

    // Formula: CPL = CPA * 0.05 (5% of CPA, NOT AOV)
    const cpl = cpa * 0.05

    // Formula: Max Reachable Contacts = min(DB, 3000)
    const maxReachable = db > 0 ? Math.min(db, MAX_CAPACITY) : 0

    // Formula: Months Needed = ceil(DB / 3000)
    const monthsNeeded = db > 0 ? Math.ceil(db / MAX_CAPACITY) : 0

    // Formula: Conversations = Reachable * (ConvRate / 100)
    const conversations = maxReachable * (convRate / 100)

    // Formula: Sales = Conversations * (SalesFromConversations / 100)
    const sales = conversations * (salesFromConversations / 100)

    // Formula: Client Revenue = Sales * AOV
    const clientRevenue = sales * aov

    // Formula: Tiered Retainer based on DB size
    let suggestedRetainer = 0
    if (db < 1000) {
      suggestedRetainer = 0 // Not eligible
    } else if (db >= 1000 && db <= 2000) {
      suggestedRetainer = 2000
    } else if (db >= 2001) {
      suggestedRetainer = 3000
    }

    // Formula: Profit Split = ClientRevenue * (ProfitPct / 100)
    const potentialProfitSplit = clientRevenue * (profitPct / 100)

    return {
      cpl: cpl.toFixed(2),
      cpa: cpa.toFixed(2),
      maxReachable: maxReachable.toFixed(0),
      monthsNeeded: monthsNeeded.toString(),
      conversations: conversations.toFixed(0),
      sales: sales.toFixed(0),
      clientRevenue: clientRevenue.toFixed(2),
      suggestedRetainer: db < 1000 ? "Not eligible" : suggestedRetainer.toFixed(2),
      potentialProfitSplit: potentialProfitSplit.toFixed(2),
    }
  }

  const aovOutputs = calculateAOVOutputs()

  const handleAOVInputChange = (field: string, value: string) => {
    setLocalInputs((prev) => ({ ...prev, [field]: value }))
    // Mark the field as being edited
    // setActivelyEditing((prev) => new Set(prev).add(field)) // Removed this line
  }

  const saveCalculatorData = async () => {
    if (!selectedNiche) return

    const updates: any = {}

    const aovInput = Number.parseFloat(localInputs.aovInput)
    if (!isNaN(aovInput)) updates.aov_input = aovInput

    const dbSize = Number.parseFloat(localInputs.databaseSizeInput)
    if (!isNaN(dbSize)) updates.database_size_input = dbSize

    // Store calculated values (these exist in DB)
    const cpl = Number.parseFloat(aovOutputs.cpl)
    if (!isNaN(cpl)) updates.cpl_calculated = cpl

    const cpa = Number.parseFloat(aovOutputs.cpa)
    if (!isNaN(cpa)) updates.cpa_calculated = cpa

    if (aovOutputs.suggestedRetainer !== "Not eligible") {
      const retainer = Number.parseFloat(aovOutputs.suggestedRetainer)
      if (!isNaN(retainer)) updates.potential_retainer = retainer
    } else {
      updates.potential_retainer = 0
    }

    const profitSplit = Number.parseFloat(aovOutputs.potentialProfitSplit)
    if (!isNaN(profitSplit)) updates.profit_split_potential = profitSplit

    console.log("[v0] Saving calculator data:", updates)
    await updateNicheState(updates)
  }

  // CHANGE: Simplified update function - no complex state tracking
  const updateNicheState = async (updates: Partial<Niche["user_state"]>) => {
    if (!selectedNiche) return

    console.log("[v0] Updating niche state:", updates)

    try {
      const supabase = createClient()
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        console.error("[v0] No authenticated user")
        return
      }

      const { data, error } = await supabase
        .from("niche_user_state")
        .upsert(
          {
            user_id: user.id,
            niche_id: selectedNiche.id,
            ...updates,
          },
          {
            onConflict: "user_id,niche_id",
          },
        )
        .select()
        .single()

      if (error) {
        console.error("[v0] Error updating niche state:", error)
        toast({
          title: "Error",
          description: error.message,
          variant: "destructive",
        })
      } else {
        console.log("[v0] Successfully updated niche state")

        setSelectedNiche({
          ...selectedNiche,
          user_state: data,
        })

        // Update local checkbox state for instant feedback
        if (data.research_notes_added !== undefined) {
          setCheckboxStates((prev) => ({ ...prev, research_notes_added: data.research_notes_added ?? false }))
        }
        if (data.aov_calculator_completed !== undefined) {
          setCheckboxStates((prev) => ({ ...prev, aov_calculator_completed: data.aov_calculator_completed ?? false }))
        }
        if (data.customer_profile_generated !== undefined) {
          setCheckboxStates((prev) => ({
            ...prev,
            customer_profile_generated: data.customer_profile_generated ?? false,
          }))
        }
        if (data.messaging_prepared !== undefined) {
          setCheckboxStates((prev) => ({ ...prev, messaging_prepared: data.messaging_prepared ?? false }))
        }
      }
    } catch (error: any) {
      console.error("[v0] Exception updating niche state:", error)
    }
  }

  const handleCheckboxChange = async (field: string, checked: boolean) => {
    console.log(`[v0] Checkbox changed: ${field} = ${checked}`)

    // Update local state immediately for instant UI feedback
    setCheckboxStates((prev) => ({ ...prev, [field]: checked }))

    if (!selectedNiche) return

    const updateData: any = {
      [field]: checked,
      status: selectedNiche.user_state.status, // Preserve existing status
      research_notes: localInputs.researchNotes, // Include current research notes
    }

    // Only add numeric fields if they're valid
    const aovInput = Number.parseFloat(localInputs.aovInput)
    if (!isNaN(aovInput)) updateData.aov_input = aovInput

    const dbSize = Number.parseFloat(localInputs.databaseSizeInput)
    if (!isNaN(dbSize)) updateData.database_size_input = dbSize

    // Calculated outputs
    const cpl = Number.parseFloat(aovOutputs.cpl)
    if (!isNaN(cpl)) updateData.cpl_calculated = cpl

    const cpa = Number.parseFloat(aovOutputs.cpa)
    if (!isNaN(cpa)) updateData.cpa_calculated = cpa

    if (aovOutputs.suggestedRetainer !== "Not eligible") {
      const retainer = Number.parseFloat(aovOutputs.suggestedRetainer)
      if (!isNaN(retainer)) updateData.potential_retainer = retainer
    } else {
      updateData.potential_retainer = 0
    }

    const profitSplit = Number.parseFloat(aovOutputs.potentialProfitSplit)
    if (!isNaN(profitSplit)) updateData.profit_split_potential = profitSplit

    console.log("[v0] Saving checkbox with data:", updateData)
    await updateNicheState(updateData)
  }

  const saveFieldToDatabase = async (field: "researchNotes" | "outreachNotes" | "objectionsHeard") => {
    if (!selectedNiche) return

    let dbField: string
    let valueToSave: any = localInputs[field]

    if (field === "researchNotes") {
      dbField = "research_notes"
    } else if (field === "outreachNotes") {
      dbField = "outreach_notes"
    } else if (field === "objectionsHeard") {
      dbField = "outreach_channels"
      const currentOutreachChannels = (selectedNiche.user_state?.outreach_channels as OutreachChannels) || {}
      valueToSave = {
        ...currentOutreachChannels,
        objections: valueToSave,
      }
    } else {
      return // Should not happen with the current type
    }

    await updateNicheState({ [dbField]: valueToSave })
  }

  // CHANGE: Save before switching niches to prevent data loss
  const handleNicheSelect = async (niche: Niche) => {
    if (selectedNiche) {
      console.log("[v0] Saving current niche before switch")

      // Save all current inputs to DB
      const updates: any = {
        research_notes: localInputs.researchNotes,
        outreach_notes: localInputs.outreachNotes,
      }

      const aovInput = Number.parseFloat(localInputs.aovInput)
      if (!isNaN(aovInput)) updates.aov_input = aovInput

      const dbSize = Number.parseFloat(localInputs.databaseSizeInput)
      if (!isNaN(dbSize)) updates.database_size_input = dbSize

      // Handle objections save
      if (localInputs.objectionsHeard !== undefined) {
        const currentOutreachChannels = (selectedNiche.user_state?.outreach_channels as OutreachChannels) || {}
        updates.outreach_channels = {
          ...currentOutreachChannels,
          objections: localInputs.objectionsHeard,
        }
      }

      // saveCalculatorData() will handle calculated fields
      await updateNicheState(updates)
    }

    setSelectedNiche(niche)
  }

  // CHANGE: Changed to check checkboxStates instead of database values for instant feedback
  const canAdvanceFromResearch = () => {
    const canAdvance =
      checkboxStates.research_notes_added &&
      checkboxStates.aov_calculator_completed &&
      checkboxStates.customer_profile_generated

    console.log("[v0] Can advance from research?", canAdvance, checkboxStates)
    return canAdvance
  }

  const canAdvanceFromShortlisted = () => {
    return checkboxStates.messaging_prepared
  }

  // Modified to check for at least one channel and non-empty objections if they exist
  const canAdvanceFromOutreach = () => {
    if (!selectedNiche?.user_state) return false

    const outreachChannels = selectedNiche.user_state.outreach_channels as OutreachChannels
    if (!outreachChannels) return false

    // Check if any channel has been selected OR if any message count is > 0
    const hasAnyActivity =
      (outreachChannels.linkedin_messages || 0) > 0 ||
      (outreachChannels.facebook_dms || 0) > 0 ||
      (outreachChannels.cold_calls || 0) > 0 ||
      (outreachChannels.emails || 0) > 0 ||
      (outreachChannels.meetings_booked || 0) > 0

    const isDateSet = selectedNiche.user_state.outreach_start_date

    // Ensure date is set and there's been some outreach activity
    return isDateSet && hasAnyActivity
  }

  const advanceStatus = async (newStatus: string) => {
    if (!selectedNiche) return

    try {
      setIsLoading(true)

      // If advancing from Research to Shortlisted, save all research data first
      if (selectedNiche.user_state?.status === "Research" && newStatus === "Shortlisted") {
        console.log("[v0] Saving research data before advancing...")

        const updateData: any = {
          research_notes: localInputs.researchNotes,
          research_notes_added: checkboxStates.research_notes_added,
          aov_calculator_completed: checkboxStates.aov_calculator_completed,
          customer_profile_generated: checkboxStates.customer_profile_generated,
          status: newStatus,
        }

        // Only add numeric fields if they're valid
        const aovInput = Number.parseFloat(localInputs.aovInput)
        if (!isNaN(aovInput)) updateData.aov_input = aovInput

        const dbSize = Number.parseFloat(localInputs.databaseSizeInput)
        if (!isNaN(dbSize)) updateData.database_size_input = dbSize

        // Calculated fields
        const cpl = Number.parseFloat(aovOutputs.cpl)
        if (!isNaN(cpl)) updateData.cpl_calculated = cpl

        const cpa = Number.parseFloat(aovOutputs.cpa)
        if (!isNaN(cpa)) updateData.cpa_calculated = cpa

        if (aovOutputs.suggestedRetainer !== "Not eligible") {
          const retainer = Number.parseFloat(aovOutputs.suggestedRetainer)
          if (!isNaN(retainer)) updateData.potential_retainer = retainer
        } else {
          updateData.potential_retainer = 0
        }

        const profitSplit = Number.parseFloat(aovOutputs.potentialProfitSplit)
        if (!isNaN(profitSplit)) updateData.profit_split_potential = profitSplit

        await updateNicheState(updateData)
      } else {
        // For other status changes, just update the status
        await updateNicheState({ status: newStatus })
      }

      toast({
        title: "Success",
        description: `Advanced to ${newStatus}`,
      })
      await loadNiches()
    } catch (error: any) {
      console.error("[v0] Error advancing status:", error)
      if (!error?.message?.includes("violates check constraint")) {
        toast({
          title: "Error",
          description: error?.message || "Failed to advance status. Please try again.",
          variant: "destructive",
        })
      }
    } finally {
      setIsLoading(false)
    }
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

  // CHANGE: Removed generateMessaging function - users will manage messaging manually
  // const generateMessaging = async () => { ... }

  const generateDemo = async () => {
    // Renamed from generateDemoScript to generateDemo
    if (!selectedNiche) return

    setIsGeneratingDemo(true) // Use the renamed state variable
    try {
      const response = await fetch("/api/opportunities/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "demo_script",
          nicheName: selectedNiche.niche_name,
          // Pass relevant calculator outputs to the AI for context
          aov: Number.parseFloat(localInputs.aovInput) || 0,
          databaseSize: Number.parseFloat(localInputs.databaseSizeInput) || 0,
          // Include other relevant data if needed for prompt engineering
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
        // Automatically advance to Coffee Date Demo if generating demo script
        await advanceStatus("Coffee Date Demo")
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
      setIsGeneratingDemo(false) // Use the renamed state variable
    }
  }

  const startProfileChat = async () => {
    if (!selectedNiche?.id) return

    setIsProfileChatActive(true)
    setProfileChatMessagesByNiche((prev) => ({
      ...prev,
      [selectedNiche.id]: [
        {
          role: "assistant",
          content:
            "Hi! I'm here to help you define your Ideal Customer Profile for this niche. Let's start with your business - who do you currently serve in this space?",
        },
      ],
    }))
    // Ensure profile chat input is clear
    setLocalInputs((prev) => ({ ...prev, profileChatInput: "" }))
  }

  const sendProfileChatMessage = async (message: string) => {
    if (!selectedNiche?.id) return

    const currentMessages = profileChatMessagesByNiche[selectedNiche.id] || []
    const updatedMessages = [...currentMessages, { role: "user", content: message }]

    setProfileChatMessagesByNiche((prev) => ({
      ...prev,
      [selectedNiche.id]: updatedMessages,
    }))

    setLocalInputs((prev) => ({ ...prev, profileChatInput: "" }))
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

        setProfileChatMessagesByNiche((prev) => ({
          ...prev,
          [selectedNiche.id]: [...updatedMessages, assistantMessage],
        }))

        if (result.icpComplete && result.customerProfile) {
          await updateNicheState({
            customer_profile: result.customerProfile,
            customer_profile_generated: true,
          })

          // Update local checkbox state for instant UI feedback
          setCheckboxStates((prev) => ({
            ...prev,
            customer_profile_generated: true,
          }))

          // Also update selectedNiche state directly for UI consistency
          setSelectedNiche((prev) => {
            if (!prev) return prev
            return {
              ...prev,
              user_state: {
                ...prev.user_state,
                customer_profile: result.customerProfile,
                customer_profile_generated: true,
              },
            }
          })

          toast({
            title: "ICP Complete",
            description: "Your Ideal Customer Profile has been generated and saved.",
          })

          // Automatically close the chat after ICP is complete
          setIsProfileChatActive(false)
          setProfileChatMessagesByNiche((prev) => {
            const { [selectedNiche.id]: _, ...rest } = prev
            return rest
          })
        }
      } else {
        throw new Error(result.message || "Failed to get chat response")
      }
    } catch (error) {
      console.error("[v0] Error in ICP chat:", error)
      toast({
        title: "Chat Error",
        description: "Failed to send message. Please try again.",
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
      <div className="max-w-[1800px] mx-auto px-6 py-6">
        <div className="mb-6 flex flex-wrap items-center gap-4">
          {/* Search */}
          <div className="relative flex-1 min-w-[300px]">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search niches..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9"
            />
          </div>

          {/* Industry Filter */}
          <Select value={industryFilter} onValueChange={handleIndustryChange}>
            <SelectTrigger className="w-[200px] bg-background border-input text-foreground">
              <SelectValue placeholder="All Industries">
                {industryFilter === "all"
                  ? "All Industries"
                  : industries.find((i) => i.id === industryFilter)?.name || "All Industries"}
              </SelectValue>
            </SelectTrigger>
            <SelectContent className="bg-popover text-popover-foreground border-border">
              <SelectItem value="all">All Industries</SelectItem>
              {industries.map((industry) => (
                <SelectItem key={industry.id} value={industry.id}>
                  {industry.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Status Filter */}
          <Select value={statusFilter} onValueChange={handleStatusChange}>
            <SelectTrigger className="w-[200px] bg-background border-input text-foreground">
              <SelectValue placeholder="All Statuses">
                {statusFilter === "all" ? "All Statuses" : statusFilter}
              </SelectValue>
            </SelectTrigger>
            <SelectContent className="bg-popover text-popover-foreground border-border">
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="Research">Research</SelectItem>
              <SelectItem value="Shortlisted">Shortlisted</SelectItem>
              <SelectItem value="Outreach in Progress">Outreach in Progress</SelectItem>
              <SelectItem value="Coffee Date Demo">Coffee Date Demo</SelectItem>
              <SelectItem value="Win">Win</SelectItem>
            </SelectContent>
          </Select>

          {/* Sort By */}
          <Select value={sortBy} onValueChange={handleSortChange}>
            <SelectTrigger className="w-[180px] bg-background border-input text-foreground">
              <SelectValue placeholder="Alphabetical">
                {sortBy === "alphabetical" && "Alphabetical"}
                {sortBy === "status" && "By Status"}
                {sortBy === "potential" && "By Potential"}
              </SelectValue>
            </SelectTrigger>
            <SelectContent className="bg-popover text-popover-foreground border-border">
              <SelectItem value="alphabetical">Alphabetical</SelectItem>
              <SelectItem value="status">By Status</SelectItem>
              <SelectItem value="potential">By Potential</SelectItem>
            </SelectContent>
          </Select>

          {/* Favourites Toggle */}
          <div className="flex items-center gap-2">
            <Checkbox
              id="favourites"
              checked={favouritesOnly}
              onCheckedChange={(checked) => setFavouritesOnly(checked === true)}
            />
            <label htmlFor="favourites" className="text-sm font-medium cursor-pointer">
              Favourites
            </label>
          </div>
        </div>

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
                  onClick={() => handleNicheSelect(niche)}
                  className={cn(
                    "w-full text-left px-4 py-3 rounded-lg border transition-colors cursor-pointer",
                    selectedNiche?.id === niche.id
                      ? "bg-primary/10 border-primary"
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
                        {/* Display new tiered retainer value */}
                        {niche.user_state?.potential_retainer && niche.user_state.potential_retainer > 0 && (
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-primary/20 text-primary">
                            ${Math.round(niche.user_state.potential_retainer)}/mo
                          </span>
                        )}
                        {niche.user_state?.potential_retainer === 0 &&
                          niche.user_state?.database_size_input &&
                          niche.user_state.database_size_input >= 1000 && (
                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-yellow-500/20 text-yellow-400">
                              Needs Review
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
                          <Label className="text-white">
                            Research Notes{" "}
                            {localInputs.researchNotes.length < 200 &&
                              `(${localInputs.researchNotes.length}/200 characters minimum)`}
                          </Label>
                          <Textarea
                            value={localInputs.researchNotes}
                            onFocus={() => {
                              // setActivelyEditing((prev) => new Set(prev).add("researchNotes")) // Removed this line
                            }}
                            onChange={(e) => {
                              console.log("[v0] Research notes changed")
                              setLocalInputs({ ...localInputs, researchNotes: e.target.value })
                            }}
                            onBlur={() => {
                              console.log(
                                "[v0] Research notes blur - saving:",
                                localInputs.researchNotes.length,
                                "chars",
                              )
                              saveFieldToDatabase("researchNotes")
                              // Removed: .then(() => { ... setActivelyEditing(...) })
                            }}
                            placeholder="Add your research notes here (minimum 200 characters)..."
                            rows={6}
                            className="resize-none bg-white/5 border-white/10 text-white placeholder:text-white/40"
                          />
                          <div className="flex items-center gap-2">
                            <Checkbox
                              id="research-notes-checkbox"
                              checked={checkboxStates.research_notes_added}
                              disabled={!localInputs.researchNotes || localInputs.researchNotes.length < 200}
                              onCheckedChange={(checked) => {
                                if (checked !== "indeterminate") {
                                  handleCheckboxChange("research_notes_added", checked as boolean)
                                }
                              }}
                              className="border-white/20 data-[state=checked]:bg-primary data-[state=checked]:border-primary data-[state=checked]:text-white disabled:opacity-30 disabled:cursor-not-allowed"
                            />
                            <span
                              className={cn(
                                "text-sm",
                                localInputs.researchNotes.length >= 200 ? "text-white/70" : "text-white/40",
                              )}
                            >
                              Notes Added{" "}
                              {!localInputs.researchNotes ||
                                (localInputs.researchNotes.length < 200 && "(minimum 200 characters required)")}
                            </span>
                          </div>
                        </div>

                        {/* AOV Calculator */}
                        <div className="space-y-3 p-4 bg-black/20 rounded-lg border border-white/10">
                          <h4 className="text-sm font-semibold text-white">AOV Calculator</h4>

                          <div className="space-y-3 pb-3 border-b border-white/10">
                            <div>
                              <Label className="text-xs text-white/70">Average Order Value ($)</Label>
                              <Input
                                type="number"
                                value={localInputs.aovInput}
                                onChange={(e) => handleAOVInputChange("aovInput", e.target.value)}
                                onBlur={saveCalculatorData}
                                placeholder="e.g. 5000"
                                min="0"
                                step="100"
                                className="bg-white/5 border-white/10 text-white placeholder:text-white/40 mt-1"
                              />
                            </div>
                            <div>
                              <Label className="text-xs text-white/70">Database Size (contacts)</Label>
                              <Input
                                type="number"
                                value={localInputs.databaseSizeInput}
                                onChange={(e) => handleAOVInputChange("databaseSizeInput", e.target.value)}
                                onBlur={saveCalculatorData}
                                placeholder="e.g. 5000"
                                min="0"
                                step="100"
                                className="bg-white/5 border-white/10 text-white placeholder:text-white/40 mt-1"
                              />
                            </div>
                            <div>
                              <Label className="text-xs text-white/70">Expected Conversation Rate (%)</Label>
                              <Input
                                type="number"
                                value={localInputs.conversationRate}
                                onChange={(e) => handleAOVInputChange("conversationRate", e.target.value)}
                                onBlur={saveCalculatorData}
                                placeholder="40"
                                min="0"
                                max="100"
                                step="1"
                                className="bg-white/5 border-white/10 text-white placeholder:text-white/40 mt-1"
                              />
                              <p className="text-[10px] text-white/40 mt-1">
                                % of reachable contacts who reply or engage (default: 40%)
                              </p>
                            </div>
                            <div>
                              <Label className="text-xs text-white/70">Sales Conversion From Conversations (%)</Label>
                              <Input
                                type="number"
                                value={localInputs.salesConversion}
                                onChange={(e) => handleAOVInputChange("salesConversion", e.target.value)}
                                onBlur={saveCalculatorData}
                                placeholder="10"
                                min="0"
                                max="100"
                                step="1"
                                className="bg-white/5 border-white/10 text-white placeholder:text-white/40 mt-1"
                              />
                              <p className="text-[10px] text-white/40 mt-1">
                                % of conversations that turn into sales (default: 10%)
                              </p>
                            </div>
                            <div>
                              <Label className="text-xs text-white/70">Profit Split % (for revenue share deals)</Label>
                              <Input
                                type="number"
                                value={localInputs.profitSplit} // Corrected field name
                                onChange={(e) => handleAOVInputChange("profitSplit", e.target.value)}
                                onBlur={saveCalculatorData}
                                placeholder="50"
                                min="0"
                                max="100"
                                step="1"
                                className="bg-white/5 border-white/10 text-white placeholder:text-white/40 mt-1"
                              />
                              <p className="text-[10px] text-white/40 mt-1">Default: 50%</p>
                            </div>
                          </div>

                          <div className="space-y-2">
                            <div>
                              <Label className="text-xs text-white/70">Cost Per Acquisition ($)</Label>
                              <Input
                                type="text"
                                value={aovOutputs.cpa}
                                disabled
                                className="bg-white/5 border-white/10 text-white mt-1 opacity-60"
                              />
                            </div>
                            <div>
                              <Label className="text-xs text-white/70">Cost Per Lead ($)</Label>
                              <Input
                                type="text"
                                value={aovOutputs.cpl}
                                disabled
                                className="bg-white/5 border-white/10 text-white mt-1 opacity-60"
                              />
                            </div>
                            <div>
                              <Label className="text-xs text-white/70">Max Reachable Contacts Per Month</Label>
                              <Input
                                type="text"
                                value={aovOutputs.maxReachable}
                                disabled
                                className="bg-white/5 border-white/10 text-white mt-1 opacity-60"
                              />
                              <p className="text-[10px] text-white/40 mt-1">Limited to 3,000/month (100 SMS/day)</p>
                            </div>
                            <div>
                              <Label className="text-xs text-white/70">Months Needed To Reach Entire Database</Label>
                              <Input
                                type="text"
                                value={aovOutputs.monthsNeeded}
                                disabled
                                className="bg-white/5 border-white/10 text-white mt-1 opacity-60"
                              />
                            </div>
                            <div>
                              <Label className="text-xs text-white/70">Conversations Per Month</Label>
                              <Input
                                type="text"
                                value={aovOutputs.conversations}
                                disabled
                                className="bg-white/5 border-white/10 text-white mt-1 opacity-60"
                              />
                            </div>
                            <div>
                              <Label className="text-xs text-white/70">Sales Per Month</Label>
                              <Input
                                type="text"
                                value={aovOutputs.sales}
                                disabled
                                className="bg-white/5 border-white/10 text-white mt-1 opacity-60"
                              />
                            </div>
                            <div>
                              <Label className="text-xs text-white/70">Client Revenue Per Month ($)</Label>
                              <Input
                                type="text"
                                value={aovOutputs.clientRevenue}
                                disabled
                                className="bg-white/5 border-white/10 text-white mt-1 opacity-60"
                              />
                            </div>
                            <div>
                              <Label className="text-xs text-white/70">Suggested Retainer ($/mo)</Label>
                              <Input
                                type="text"
                                value={aovOutputs.suggestedRetainer}
                                disabled
                                className="bg-white/5 border-primary/30 text-primary mt-1 opacity-80 font-semibold"
                              />
                              <p className="text-[10px] text-white/40 mt-1">
                                Tiered: $0 (&lt;1k), $2k (1k-2k), $3k (2k+)
                              </p>
                            </div>
                            <div>
                              <Label className="text-xs text-white/70">Potential Profit Split ($/mo)</Label>
                              <Input
                                type="text"
                                value={aovOutputs.potentialProfitSplit}
                                disabled
                                className="bg-white/5 border-primary/30 text-primary mt-1 opacity-80 font-semibold"
                              />
                            </div>
                          </div>

                          <div className="flex items-center gap-2 pt-2">
                            <Checkbox
                              checked={checkboxStates.aov_calculator_completed}
                              disabled={!localInputs.aovInput || Number.parseFloat(localInputs.aovInput) <= 0}
                              onCheckedChange={(checked) => {
                                if (checked !== "indeterminate") {
                                  handleCheckboxChange("aov_calculator_completed", checked as boolean)
                                }
                              }}
                              className="border-white/20 data-[state=checked]:bg-primary data-[state=checked]:border-primary data-[state=checked]:text-white disabled:opacity-30 disabled:cursor-not-allowed"
                            />
                            <span
                              className={cn(
                                "text-sm",
                                localInputs.aovInput && Number.parseFloat(localInputs.aovInput) > 0
                                  ? "text-white/70"
                                  : "text-white/40",
                              )}
                            >
                              AOV Calculator Completed
                            </span>
                          </div>
                        </div>

                        <div className="space-y-3 p-4 bg-black/20 rounded-lg border border-white/10">
                          <h4 className="text-sm font-semibold text-white">Customer Profile Generator</h4>

                          {!isProfileChatActive && !selectedNiche.user_state?.customer_profile && (
                            <Button
                              onClick={startProfileChat}
                              disabled={isProfileChatLoading}
                              className="w-full bg-primary hover:bg-primary/90 text-white font-medium py-3 shadow-lg shadow-primary/20 transition-all"
                            >
                              {isProfileChatLoading ? (
                                <span className="flex items-center gap-2">
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                  Starting Interview...
                                </span>
                              ) : (
                                "Start ICP Interview"
                              )}
                            </Button>
                          )}

                          {isProfileChatActive && (
                            <div className="space-y-3">
                              <div className="max-h-[400px] overflow-y-auto space-y-3 p-4 bg-gradient-to-b from-black/40 to-black/60 rounded-lg border border-white/10 [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-track]:bg-black/20 [&::-webkit-scrollbar-thumb]:bg-primary/40 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:hover:bg-primary/60">
                                {profileChatMessages.map((msg, idx) => (
                                  <div
                                    key={idx}
                                    className={cn(
                                      "p-4 rounded-xl text-sm leading-relaxed transition-all",
                                      msg.role === "assistant"
                                        ? "bg-gradient-to-br from-primary/20 to-primary/10 text-white border border-primary/30 shadow-lg"
                                        : "bg-white/10 text-white/90 ml-8 border border-white/20",
                                    )}
                                  >
                                    {msg.content}
                                  </div>
                                ))}
                                {isProfileChatLoading && (
                                  <div className="p-4 rounded-xl text-sm bg-gradient-to-br from-primary/20 to-primary/10 text-white border border-primary/30 flex items-center gap-2">
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                    <span>Thinking...</span>
                                  </div>
                                )}
                                <div ref={chatEndRef} />
                              </div>

                              <div className="flex gap-2">
                                <Input
                                  // Use localInputs for profileChatInput
                                  value={localInputs.profileChatInput}
                                  onChange={(e) =>
                                    setLocalInputs((prev) => ({ ...prev, profileChatInput: e.target.value }))
                                  }
                                  onKeyDown={(e) => {
                                    if (e.key === "Enter" && !e.shiftKey) {
                                      e.preventDefault()
                                      // Pass localInputs.profileChatInput to the function
                                      sendProfileChatMessage(localInputs.profileChatInput)
                                    }
                                  }}
                                  placeholder="Type your answer and press Enter..."
                                  disabled={isProfileChatLoading}
                                  className="flex-1 bg-white/5 border-white/10 text-white placeholder:text-white/40 focus:border-primary/50 transition-colors"
                                />
                                <Button
                                  onClick={() => sendProfileChatMessage(localInputs.profileChatInput)} // Pass localInputs.profileChatInput
                                  disabled={isProfileChatLoading || !localInputs.profileChatInput.trim()}
                                  size="icon"
                                  className="shrink-0 bg-primary hover:bg-primary/90 disabled:bg-primary/30 shadow-md"
                                  title="Send message"
                                >
                                  <Send className="h-4 w-4" />
                                </Button>
                              </div>

                              <Button
                                onClick={() => {
                                  setIsProfileChatActive(false)
                                  setProfileChatMessagesByNiche((prev) => {
                                    const { [selectedNiche.id]: _, ...rest } = prev
                                    return rest
                                  })
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
                              <div className="text-sm text-white/80 space-y-2 p-3 bg-white/5 rounded border border-white/5">
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
                                onClick={() => {
                                  // Corrected action to start interview/refine ICP
                                  setIsProfileChatActive(true)
                                  setProfileChatMessagesByNiche((prev) => ({
                                    // Initialize chat for refinement
                                    ...prev,
                                    [selectedNiche.id]: [
                                      {
                                        role: "assistant",
                                        content:
                                          "Let's refine your Ideal Customer Profile. What specific challenges are they facing that your service can solve?",
                                      },
                                    ],
                                  }))
                                  // Ensure profile chat input is clear
                                  setLocalInputs((prev) => ({ ...prev, profileChatInput: "" }))
                                }}
                                variant="outline"
                                size="sm"
                                className="w-full border-white/10 text-white/60 hover:text-white hover:bg-white/5"
                              >
                                Refine ICP
                              </Button>
                            </div>
                          )}

                          <div className="flex items-center gap-2">
                            <Checkbox
                              checked={checkboxStates.customer_profile_generated}
                              disabled={!selectedNiche.user_state?.customer_profile}
                              onCheckedChange={(checked) => {
                                if (checked !== "indeterminate") {
                                  handleCheckboxChange("customer_profile_generated", checked as boolean)
                                }
                              }}
                              className="border-white/20 data-[state=checked]:bg-primary data-[state=checked]:border-primary data-[state=checked]:text-white disabled:opacity-30 disabled:cursor-not-allowed"
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
                            disabled={!canAdvanceFromResearch() || isLoading}
                            className={cn(
                              "w-full",
                              canAdvanceFromResearch() && !isLoading
                                ? "bg-primary hover:bg-primary/90 text-white"
                                : "bg-white/10 text-white/60 border border-white/20 hover:bg-white/15 cursor-not-allowed",
                            )}
                          >
                            {isLoading ? (
                              <span className="flex items-center gap-2">
                                <Loader2 className="h-4 w-4 animate-spin" />
                                Advancing...
                              </span>
                            ) : canAdvanceFromResearch() ? (
                              <>
                                Complete Research & Move to Shortlisted <ChevronRight className="ml-2 h-4 w-4" />
                              </>
                            ) : (
                              <>
                                Complete All Research Tasks First
                                <span className="ml-2 text-xs">
                                  (
                                  {[
                                    !checkboxStates.research_notes_added && "Notes",
                                    !checkboxStates.aov_calculator_completed && "AOV",
                                    !checkboxStates.customer_profile_generated && "ICP",
                                  ]
                                    .filter(Boolean)
                                    .join(", ")}{" "}
                                  needed)
                                </span>
                              </>
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

                      <div className="space-y-2">
                        <p className="text-sm text-white/70">
                          Prepare your outreach messaging for this niche (LinkedIn, email, social media, etc.)
                        </p>

                        <div className="flex items-center gap-2">
                          <Checkbox
                            checked={checkboxStates.messaging_prepared}
                            onCheckedChange={(checked) =>
                              handleCheckboxChange("messaging_prepared", checked as boolean)
                            }
                            className="border-white/20 data-[state=checked]:bg-primary data-[state=checked]:border-primary data-[state=checked]:text-white"
                          />
                          <span className="text-sm text-white/70">Messaging Created & Ready for Outreach</span>
                        </div>
                      </div>

                      {currentStatus === "Shortlisted" && canAdvanceFromShortlisted() && (
                        <Button
                          onClick={() => advanceStatus("Outreach in Progress")}
                          disabled={isLoading}
                          className={cn(
                            "w-full",
                            canAdvanceFromShortlisted() && !isLoading
                              ? "bg-green-600 hover:bg-green-700"
                              : "bg-white/10 text-white/60 border border-white/20 cursor-not-allowed",
                          )}
                        >
                          {isLoading ? (
                            <span className="flex items-center gap-2">
                              <Loader2 className="h-4 w-4 animate-spin" />
                              Advancing...
                            </span>
                          ) : (
                            "Complete Shortlisted & Move to Outreach"
                          )}
                        </Button>
                      )}
                    </div>
                  )}

                  {/* Outreach Phase */}
                  {(currentStatus === "Outreach in Progress" ||
                    STATUSES.indexOf(currentStatus) > STATUSES.indexOf("Outreach in Progress")) && (
                    <div className="space-y-4 p-6 bg-white/[0.08] rounded-lg border border-white/10">
                      <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                        <Calendar className="h-5 w-5 text-primary" />
                        Outreach Tracker
                        {canAdvanceFromOutreach() && <CheckCircle2 className="h-4 w-4 text-green-400 ml-2" />}
                      </h3>

                      <div className="space-y-6">
                        {/* Outreach Date */}
                        <div>
                          <Label className="text-white font-medium mb-2 block">Outreach Date</Label>
                          <Input
                            type="date"
                            value={selectedNiche.user_state?.outreach_start_date || ""}
                            onChange={(e) =>
                              updateNicheState({ outreach_start_date: e.target.value, status: currentStatus })
                            }
                            className="bg-white/5 border-white/20 text-white placeholder:text-white/40 h-11"
                            placeholder="mm/dd/yyyy"
                          />
                        </div>

                        {/* Simplified Tracking Metrics with +/- Buttons */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {[
                            { key: "linkedin_messages", label: "LinkedIn Messages" },
                            { key: "facebook_dms", label: "Facebook DMs" },
                            { key: "cold_calls", label: "Cold Calls" },
                            { key: "emails", label: "Emails" },
                          ].map((field) => {
                            const channels = (selectedNiche.user_state?.outreach_channels as OutreachChannels) || {}
                            const value = channels[field.key as keyof OutreachChannels] || 0
                            return (
                              <div key={field.key}>
                                <Label className="text-white font-medium mb-2 block">{field.label}</Label>
                                <div className="flex items-center gap-2">
                                  <Button
                                    onClick={() => {
                                      const updatedChannels = {
                                        ...channels,
                                        [field.key as keyof OutreachChannels]: Math.max(0, (value || 0) - 1),
                                      }
                                      updateNicheState({ outreach_channels: updatedChannels, status: currentStatus })
                                    }}
                                    className="bg-white/10 hover:bg-white/20 h-11 w-11 p-0 shrink-0 text-white"
                                    disabled={value === 0}
                                  >
                                    <span className="text-xl font-bold">−</span>
                                  </Button>
                                  <Input
                                    type="number"
                                    min="0"
                                    value={value}
                                    onChange={(e) => {
                                      const updatedChannels = {
                                        ...channels,
                                        [field.key]: Math.max(0, Number(e.target.value) || 0),
                                      }
                                      updateNicheState({ outreach_channels: updatedChannels, status: currentStatus })
                                    }}
                                    className="bg-white/5 border-white/20 text-white placeholder:text-white/40 h-11 flex-1 text-center"
                                  />
                                  <Button
                                    onClick={() => {
                                      const updatedChannels = {
                                        ...channels,
                                        [field.key as keyof OutreachChannels]: (value || 0) + 1,
                                      }
                                      updateNicheState({ outreach_channels: updatedChannels, status: currentStatus })
                                    }}
                                    className="bg-primary hover:bg-primary/90 h-11 w-11 p-0 shrink-0"
                                  >
                                    <span className="text-xl font-bold">+</span>
                                  </Button>
                                </div>
                              </div>
                            )
                          })}
                        </div>

                        {/* Text Areas */}
                        <div className="space-y-4">
                          <div>
                            <Label className="text-white font-medium mb-2 block">Objections Heard</Label>
                            <Textarea
                              value={localInputs.objectionsHeard || ""}
                              onChange={(e) => setLocalInputs({ ...localInputs, objectionsHeard: e.target.value })}
                              onBlur={() => {
                                updateNicheState({
                                  outreach_objections: localInputs.objectionsHeard,
                                  status: currentStatus,
                                })
                              }}
                              placeholder="Common concerns or questions from prospects..."
                              className="bg-white/5 border-white/20 text-white placeholder:text-white/40 min-h-[100px] resize-none"
                            />
                          </div>

                          <div>
                            <Label className="text-white font-medium mb-2 block">General Notes</Label>
                            <Textarea
                              value={localInputs.outreachNotes || ""}
                              onChange={(e) => setLocalInputs({ ...localInputs, outreachNotes: e.target.value })}
                              onBlur={() => {
                                updateNicheState({ outreach_notes: localInputs.outreachNotes, status: currentStatus })
                              }}
                              placeholder="Key insights, next steps, things to remember..."
                              className="bg-white/5 border-white/20 text-white placeholder:text-white/40 min-h-[100px] resize-none"
                            />
                          </div>
                        </div>
                      </div>
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

                      <div className="p-4 bg-white/5 rounded-lg border border-white/10">
                        <p className="text-sm text-white/70">
                          To complete this phase, go to the Coffee Date Demo page and mark a saved demo session as
                          complete by selecting this niche.
                        </p>
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
