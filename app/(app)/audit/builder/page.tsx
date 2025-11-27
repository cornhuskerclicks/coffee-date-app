"use client"

import type React from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import {
  Save,
  ArrowLeft,
  Download,
  CheckCircle2,
  ChevronRight,
  ChevronLeft,
  Building2,
  Megaphone,
  DollarSign,
  Cog,
  HeadphonesIcon,
  Brain,
  Sparkles,
  Lightbulb,
  Target,
  TrendingUp,
  AlertTriangle,
  RotateCcw,
  FileText,
  Upload,
  Loader2,
} from "lucide-react"
import { useState, useEffect, Suspense, useCallback, useRef } from "react"
import { useToast } from "@/hooks/use-toast"
import { useRouter, useSearchParams } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import Link from "next/link"
import { AI_AUDIT_QUESTIONS, getQuestionsByCategory, type AuditQuestion } from "@/lib/audit-questions"

const STEP_ICONS: Record<string, React.ElementType> = {
  "Business Overview": Building2,
  "Marketing & Lead Generation": Megaphone,
  "Sales & Customer Journey": DollarSign,
  "Operations & Delivery": Cog,
  "Customer Service & Retention": HeadphonesIcon,
  "AI Awareness & Readiness": Brain,
}

interface Niche {
  id: string
  niche_name: string
  industry?: { name: string }
}

function AuditBuilderContent() {
  const [auditId, setAuditId] = useState<string | null>(null)
  const [auditName, setAuditName] = useState("")
  const [websiteUrl, setWebsiteUrl] = useState("")
  const [selectedNiche, setSelectedNiche] = useState<string>("other")
  const [businessSize, setBusinessSize] = useState("")
  const [responses, setResponses] = useState<Record<string, string>>({})
  const [questions, setQuestions] = useState<AuditQuestion[]>(AI_AUDIT_QUESTIONS)
  const [currentStep, setCurrentStep] = useState(0)
  const [saving, setSaving] = useState(false)
  const [loading, setLoading] = useState(true)
  const [niches, setNiches] = useState<Niche[]>([])
  const [nicheSearch, setNicheSearch] = useState("")
  const [showAIInsights, setShowAIInsights] = useState(false)
  const [aiInsights, setAiInsights] = useState<{
    bottlenecks: string[]
    quickWins: string[]
    roadmap: string[]
    financialImpact: string
  } | null>(null)
  const [industries, setIndustries] = useState<{ id: string; name: string }[]>([])
  const [logoUrl, setLogoUrl] = useState("")
  const [logoUploading, setLogoUploading] = useState(false)
  const [winTriggerEnabled, setWinTriggerEnabled] = useState(false)

  const { toast } = useToast()
  const router = useRouter()
  const searchParams = useSearchParams()
  const supabase = createClient()
  const autoSaveTimeout = useRef<NodeJS.Timeout>()

  const categorizedQuestions = getQuestionsByCategory()
  const steps = [
    { name: "Business Info", icon: Building2 },
    ...categorizedQuestions.map(([category]) => ({
      name: category,
      icon: STEP_ICONS[category] || FileText,
    })),
  ]

  useEffect(() => {
    const id = searchParams?.get("id")
    if (id) {
      setAuditId(id)
      loadAudit(id)
    } else {
      setLoading(false)
    }
    loadNiches()
    loadIndustries()
  }, [searchParams, loadIndustries])

  async function loadNiches() {
    const { data } = await supabase
      .from("niches")
      .select("id, niche_name, industry:industries(name)")
      .order("niche_name")
    if (data) setNiches(data as Niche[])
  }

  async function loadAudit(id: string) {
    try {
      const { data, error } = await supabase.from("audits").select("*").eq("id", id).single()

      if (error) throw error

      if (data) {
        setAuditName(data.name)
        setWebsiteUrl(data.website_url || "")
        setSelectedNiche(data.niche_id || "other")
        setBusinessSize(data.business_size || "")
        setResponses(data.responses || {})
        if (data.ai_insights) setAiInsights(data.ai_insights)
        setLogoUrl(data.logo_url || "")
        setWinTriggerEnabled(data.win_trigger_enabled || false)
      }
    } catch (error) {
      console.error("Error loading audit:", error)
      toast({ title: "Error", description: "Failed to load audit", variant: "destructive" })
    } finally {
      setLoading(false)
    }
  }

  async function loadIndustries() {
    const { data, error } = await supabase.from("industries").select("id, name").order("name")
    if (!error && data) {
      setIndustries(data)
    }
  }

  const triggerAutoSave = useCallback(() => {
    if (autoSaveTimeout.current) clearTimeout(autoSaveTimeout.current)
    autoSaveTimeout.current = setTimeout(() => {
      handleSave(true)
    }, 10000) // Auto-save every 10 seconds of inactivity
  }, [auditName, responses])

  useEffect(() => {
    if (auditName && Object.keys(responses).length > 0) {
      triggerAutoSave()
    }
    return () => {
      if (autoSaveTimeout.current) clearTimeout(autoSaveTimeout.current)
    }
  }, [responses, triggerAutoSave])

  async function handleSave(isAutoSave = false) {
    if (!auditName.trim()) {
      if (!isAutoSave) {
        toast({ title: "Validation Error", description: "Please enter a business name", variant: "destructive" })
      }
      return
    }

    setSaving(true)

    try {
      const completion = calculateCompletion()
      const status = completion === 100 ? "completed" : "in_progress"

      const auditData = {
        name: auditName,
        website_url: websiteUrl,
        niche_id: selectedNiche !== "other" ? selectedNiche : null,
        business_size: businessSize,
        responses,
        completion_percentage: completion,
        status,
        ai_insights: aiInsights,
        logo_url: logoUrl,
        win_trigger_enabled: winTriggerEnabled,
        updated_at: new Date().toISOString(),
        ...(status === "completed" ? { completed_at: new Date().toISOString() } : {}),
      }

      if (auditId) {
        const { error } = await supabase.from("audits").update(auditData).eq("id", auditId)
        if (error) throw error
      } else {
        const { data, error } = await supabase.from("audits").insert(auditData).select().single()
        if (error) throw error
        if (data) setAuditId(data.id)
      }

      if (selectedNiche !== "other" && status === "completed" && winTriggerEnabled) {
        await markNicheAsWin(selectedNiche)
      }

      if (!isAutoSave) {
        toast({ title: "Saved", description: "Audit saved successfully" })
      }
    } catch (error) {
      console.error("Error saving audit:", error)
      if (!isAutoSave) {
        toast({ title: "Error", description: "Failed to save audit", variant: "destructive" })
      }
    } finally {
      setSaving(false)
    }
  }

  async function markNicheAsWin(nicheId: string) {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) return

      const { data: existingState } = await supabase
        .from("niche_user_state")
        .select("win_completed, win_type")
        .eq("niche_id", nicheId)
        .eq("user_id", user.id)
        .single()

      if (existingState?.win_completed) {
        return
      }

      const now = new Date().toISOString()
      const { error } = await supabase.from("niche_user_state").upsert(
        {
          user_id: user.id,
          niche_id: nicheId,
          status: "Win",
          win_completed: true,
          win_completed_at: now,
          win_type: "audit",
          research_notes_added: true,
          aov_calculator_completed: true,
          customer_profile_generated: true,
          messaging_prepared: true,
          coffee_date_completed: true,
          coffee_date_completed_at: now,
          updated_at: now,
        },
        { onConflict: "niche_id,user_id" },
      )

      if (!error) {
        toast({
          title: "Win Recorded!",
          description: "This niche has been marked as a WIN in Opportunities",
        })
      }
    } catch (error) {
      console.error("Error marking niche as win:", error)
    }
  }

  function calculateCompletion() {
    const answeredQuestions = Object.values(responses).filter((v) => v && v.trim()).length
    return Math.round((answeredQuestions / questions.length) * 100)
  }

  function handleExportPDF() {
    const answeredQuestions = questions.filter((q) => responses[q.id]?.trim())

    const content = `
═══════════════════════════════════════════════════════════════
                    AI READINESS AUDIT REPORT
                    Aether AI Lab
═══════════════════════════════════════════════════════════════

CLIENT: ${auditName}
WEBSITE: ${websiteUrl || "N/A"}
BUSINESS SIZE: ${businessSize || "N/A"}
DATE: ${new Date().toLocaleDateString()}
COMPLETION: ${calculateCompletion()}%

═══════════════════════════════════════════════════════════════
                    AUDIT RESPONSES
═══════════════════════════════════════════════════════════════

${answeredQuestions
  .map(
    (q, i) => `
${i + 1}. ${q.question}

${responses[q.id] || "No response provided"}

───────────────────────────────────────────────────────────────
`,
  )
  .join("")}

${
  aiInsights
    ? `
═══════════════════════════════════════════════════════════════
                    AI INSIGHTS & RECOMMENDATIONS
═══════════════════════════════════════════════════════════════

TOP 3 BOTTLENECKS:
${aiInsights.bottlenecks.map((b, i) => `${i + 1}. ${b}`).join("\n")}

TOP 3 QUICK WINS:
${aiInsights.quickWins.map((w, i) => `${i + 1}. ${w}`).join("\n")}

90-DAY ROADMAP:
${aiInsights.roadmap.map((r, i) => `${i + 1}. ${r}`).join("\n")}

ESTIMATED FINANCIAL IMPACT:
${aiInsights.financialImpact}

`
    : ""
}
═══════════════════════════════════════════════════════════════

Signature: ____________________________________________________

Date: _________________________________________________________

═══════════════════════════════════════════════════════════════
                    Powered by Aether AI Lab
═══════════════════════════════════════════════════════════════
`

    const blob = new Blob([content], { type: "text/plain" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `${auditName.replace(/\s+/g, "-")}-AI-Audit-Report.txt`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)

    toast({ title: "Exported", description: "Audit report exported successfully" })
  }

  function generateAIInsights() {
    const insights = {
      bottlenecks: [
        "Manual lead follow-up process causing delayed response times",
        "Lack of automated customer communication systems",
        "Time-consuming repetitive administrative tasks",
      ],
      quickWins: [
        "Implement AI chatbot for instant lead capture and qualification",
        "Set up automated email sequences for lead nurturing",
        "Deploy AI-powered scheduling to reduce admin overhead",
      ],
      roadmap: [
        "Week 1-4: Deploy AI chatbot and lead capture automation",
        "Week 5-8: Implement CRM integration and email automation",
        "Week 9-12: Roll out AI-powered analytics and optimization",
      ],
      financialImpact:
        "Estimated 15-25% reduction in operational costs and 30-40% improvement in lead conversion rates within 90 days",
    }

    setAiInsights(insights)
    setShowAIInsights(true)
    toast({ title: "AI Insights Generated", description: "Review recommendations in the panel" })
  }

  function restoreDefaultQuestions() {
    setQuestions(AI_AUDIT_QUESTIONS)
    toast({ title: "Questions Restored", description: "Default question set restored" })
  }

  const completion = calculateCompletion()
  const currentCategory = currentStep === 0 ? null : categorizedQuestions[currentStep - 1]
  const filteredNiches = niches
    .filter((n) => n.niche_name.toLowerCase().includes(nicheSearch.toLowerCase()))
    .slice(0, 50)

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setLogoUploading(true)
    try {
      const formData = new FormData()
      formData.append("file", file)

      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Upload failed")
      }

      const { url } = await response.json()
      setLogoUrl(url)
      toast({
        title: "Logo uploaded",
        description: "Your logo has been uploaded successfully.",
      })
    } catch (error) {
      toast({
        title: "Upload failed",
        description: error instanceof Error ? error.message : "Failed to upload logo",
        variant: "destructive",
      })
    } finally {
      setLogoUploading(false)
    }
  }

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-[400px]">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#3a8bff] mx-auto" />
          <p className="text-white/60">Loading audit...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="sticky top-0 z-50 bg-background/95 backdrop-blur-sm border-b border-white/10">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/audit">
                <Button variant="ghost" size="icon" className="hover:bg-[#3a8bff]/10 hover:text-[#3a8bff] text-white">
                  <ArrowLeft className="h-5 w-5" />
                </Button>
              </Link>
              <div>
                <h1 className="text-2xl font-bold text-white">{auditId ? "Edit Audit" : "New Audit"}</h1>
                <p className="text-white/60 text-sm">{auditName || "Untitled Audit"}</p>
              </div>
            </div>

            <div className="hidden md:flex items-center gap-4">
              <div className="text-right">
                <p className="text-sm text-white/60">Progress</p>
                <p className="text-lg font-semibold text-white">{completion}%</p>
              </div>
              <div className="w-32 h-2 bg-white/10 rounded-full overflow-hidden">
                <div className="h-full bg-[#3a8bff] rounded-full transition-all" style={{ width: `${completion}%` }} />
              </div>
            </div>

            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={handleExportPDF}
                disabled={!auditName}
                className="border-white/20 hover:border-[#3a8bff]/60 hover:bg-[#3a8bff]/10 text-white bg-transparent"
              >
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
              <Button
                onClick={() => handleSave(false)}
                disabled={saving}
                className="bg-[#3a8bff] hover:bg-[#2d6ed4] text-white shadow-lg shadow-[#3a8bff]/30"
              >
                <Save className="h-4 w-4 mr-2" />
                {saving ? "Saving..." : "Save"}
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="flex gap-8">
          <div className="hidden lg:block w-64 flex-shrink-0">
            <div className="sticky top-28 space-y-2">
              {steps.map((step, index) => {
                const Icon = step.icon
                const isActive = currentStep === index
                const isCompleted =
                  index === 0
                    ? auditName && websiteUrl && businessSize
                    : index > 0 && categorizedQuestions[index - 1]?.[1].every((q) => responses[q.id]?.trim())

                return (
                  <button
                    key={step.name}
                    onClick={() => setCurrentStep(index)}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left transition-all ${
                      isActive
                        ? "bg-[#3a8bff]/20 border border-[#3a8bff]/50 text-white"
                        : "hover:bg-white/5 text-white/60 hover:text-white"
                    }`}
                  >
                    <div className={`p-2 rounded-lg ${isActive ? "bg-[#3a8bff]" : "bg-white/10"}`}>
                      <Icon className={`h-4 w-4 ${isActive ? "text-white" : "text-white/60"}`} />
                    </div>
                    <span className="text-sm font-medium flex-1">{step.name}</span>
                    {isCompleted && <CheckCircle2 className="h-4 w-4 text-emerald-400" />}
                  </button>
                )
              })}

              {completion >= 60 && (
                <button
                  onClick={generateAIInsights}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left transition-all bg-purple-500/20 border border-purple-500/50 text-purple-300 hover:bg-purple-500/30 mt-4"
                >
                  <div className="p-2 rounded-lg bg-purple-500">
                    <Sparkles className="h-4 w-4 text-white" />
                  </div>
                  <span className="text-sm font-medium">Generate AI Insights</span>
                </button>
              )}

              <button
                onClick={restoreDefaultQuestions}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left transition-all text-white/40 hover:text-white/60 hover:bg-white/5"
              >
                <RotateCcw className="h-4 w-4" />
                <span className="text-sm">Restore Default Questions</span>
              </button>
            </div>
          </div>

          <div className="flex-1 space-y-6">
            <div className="lg:hidden">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-white/60">Progress</span>
                <span className="text-sm font-semibold text-white">{completion}%</span>
              </div>
              <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                <div className="h-full bg-[#3a8bff] rounded-full transition-all" style={{ width: `${completion}%` }} />
              </div>
            </div>

            {currentStep === 0 ? (
              <Card className="bg-black/40 border-white/10 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="text-white text-2xl flex items-center gap-3">
                    <Building2 className="h-6 w-6 text-[#3a8bff]" />
                    Business Information
                  </CardTitle>
                  <CardDescription className="text-white/60">
                    Enter the basic details about the business being audited
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-2">
                    <Label className="text-white">Business Name *</Label>
                    <Input
                      placeholder="Enter business name"
                      value={auditName}
                      onChange={(e) => setAuditName(e.target.value)}
                      className="bg-zinc-900 border-zinc-700 text-white placeholder:text-white/40 h-12"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className="text-white">Website URL</Label>
                    <Input
                      placeholder="https://example.com"
                      value={websiteUrl}
                      onChange={(e) => setWebsiteUrl(e.target.value)}
                      className="bg-zinc-900 border-zinc-700 text-white placeholder:text-white/40 h-12"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className="text-white">Industry</Label>
                    <Select value={selectedNiche} onValueChange={setSelectedNiche}>
                      <SelectTrigger className="bg-zinc-900 border-zinc-700 text-white h-12">
                        <SelectValue placeholder="Select an industry" />
                      </SelectTrigger>
                      <SelectContent className="bg-zinc-900 border-zinc-700 max-h-60">
                        {industries.map((ind) => (
                          <SelectItem key={ind.id} value={ind.id} className="text-white hover:bg-zinc-800">
                            {ind.name}
                          </SelectItem>
                        ))}
                        <SelectItem value="other" className="text-white hover:bg-zinc-800">
                          Other
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-white">Business Logo (optional)</Label>
                    <div className="mt-2 space-y-3">
                      {logoUrl && (
                        <div className="flex items-center gap-3 p-3 bg-zinc-800 rounded-lg border border-zinc-700">
                          <img
                            src={logoUrl || "/placeholder.svg"}
                            alt="Logo preview"
                            className="h-10 w-10 object-contain rounded"
                          />
                          <span className="text-sm text-zinc-400 flex-1 truncate">{logoUrl}</span>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => setLogoUrl("")}
                            className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
                          >
                            Remove
                          </Button>
                        </div>
                      )}
                      <div className="flex gap-3">
                        <label className="flex-1">
                          <div className="flex items-center justify-center gap-2 px-4 py-3 bg-zinc-800 border border-zinc-700 border-dashed rounded-lg cursor-pointer hover:border-zinc-600 transition-colors">
                            {logoUploading ? (
                              <>
                                <Loader2 className="h-4 w-4 animate-spin text-zinc-400" />
                                <span className="text-sm text-zinc-400">Uploading...</span>
                              </>
                            ) : (
                              <>
                                <Upload className="h-4 w-4 text-zinc-400" />
                                <span className="text-sm text-zinc-400">Upload logo</span>
                              </>
                            )}
                          </div>
                          <input
                            type="file"
                            accept="image/*"
                            onChange={handleLogoUpload}
                            className="hidden"
                            disabled={logoUploading}
                          />
                        </label>
                      </div>
                      <p className="text-xs text-zinc-500">PNG, JPG, GIF, WebP or SVG. Max 5MB.</p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between p-4 bg-zinc-800/50 rounded-lg border border-zinc-700">
                    <div>
                      <Label className="text-white">Link to Niche Win Tracker</Label>
                      <p className="text-xs text-white/60 mt-1">
                        When client signs, automatically trigger "Audit Win" in Dead Lead Revival
                      </p>
                    </div>
                    <Switch
                      checked={winTriggerEnabled}
                      onCheckedChange={setWinTriggerEnabled}
                      className="data-[state=checked]:bg-emerald-500"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className="text-white">Business Size</Label>
                    <Select value={businessSize} onValueChange={setBusinessSize}>
                      <SelectTrigger className="bg-zinc-900 border-zinc-700 text-white h-12">
                        <SelectValue placeholder="Select business size" />
                      </SelectTrigger>
                      <SelectContent className="bg-zinc-900 border-zinc-700">
                        <SelectItem value="solo" className="text-white hover:bg-zinc-800">
                          Solo / Freelancer
                        </SelectItem>
                        <SelectItem value="small" className="text-white hover:bg-zinc-800">
                          Small (2-10 employees)
                        </SelectItem>
                        <SelectItem value="medium" className="text-white hover:bg-zinc-800">
                          Medium (11-50 employees)
                        </SelectItem>
                        <SelectItem value="large" className="text-white hover:bg-zinc-800">
                          Large (51-200 employees)
                        </SelectItem>
                        <SelectItem value="enterprise" className="text-white hover:bg-zinc-800">
                          Enterprise (200+ employees)
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </CardContent>
              </Card>
            ) : (
              currentCategory && (
                <Card className="bg-black/40 border-white/10 backdrop-blur-sm">
                  <CardHeader>
                    <CardTitle className="text-white text-2xl flex items-center gap-3">
                      {(() => {
                        const Icon = STEP_ICONS[currentCategory[0]] || FileText
                        return <Icon className="h-6 w-6 text-[#3a8bff]" />
                      })()}
                      {currentCategory[0]}
                    </CardTitle>
                    <CardDescription className="text-white/60">
                      {currentCategory[1].length} questions in this section
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-8">
                    {currentCategory[1].map((question, qIndex) => (
                      <div key={question.id} className="space-y-3">
                        <Label className="text-white text-base font-medium flex items-start gap-2">
                          <span className="text-[#3a8bff] font-semibold">{qIndex + 1}.</span>
                          {question.question}
                        </Label>
                        {question.type === "text" ? (
                          <Input
                            placeholder="Your answer..."
                            value={responses[question.id] || ""}
                            onChange={(e) => setResponses({ ...responses, [question.id]: e.target.value })}
                            onBlur={() => triggerAutoSave()}
                            className="bg-zinc-900 border-zinc-700 text-white placeholder:text-white/40 h-12"
                          />
                        ) : (
                          <Textarea
                            placeholder="Your answer..."
                            rows={4}
                            value={responses[question.id] || ""}
                            onChange={(e) => setResponses({ ...responses, [question.id]: e.target.value })}
                            onBlur={() => triggerAutoSave()}
                            className="bg-zinc-900 border-zinc-700 text-white placeholder:text-white/40 resize-none"
                          />
                        )}
                      </div>
                    ))}
                  </CardContent>
                </Card>
              )
            )}

            <div className="flex justify-between pt-4">
              <Button
                variant="outline"
                onClick={() => setCurrentStep(Math.max(0, currentStep - 1))}
                disabled={currentStep === 0}
                className="border-white/20 hover:border-white/40 text-white"
              >
                <ChevronLeft className="h-4 w-4 mr-2" />
                Previous
              </Button>

              {currentStep < steps.length - 1 ? (
                <Button
                  onClick={() => setCurrentStep(currentStep + 1)}
                  className="bg-[#3a8bff] hover:bg-[#2d6ed4] text-white"
                >
                  Next
                  <ChevronRight className="h-4 w-4 ml-2" />
                </Button>
              ) : (
                <Button
                  onClick={() => {
                    handleSave(false)
                    router.push("/audit")
                  }}
                  className="bg-emerald-500 hover:bg-emerald-600 text-white"
                >
                  <CheckCircle2 className="h-4 w-4 mr-2" />
                  Complete Audit
                </Button>
              )}
            </div>
          </div>

          {showAIInsights && aiInsights && (
            <div className="hidden xl:block w-80 flex-shrink-0">
              <div className="sticky top-28 space-y-4">
                <Card className="bg-purple-500/10 border-purple-500/30 backdrop-blur-sm">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-white text-lg flex items-center gap-2">
                      <Sparkles className="h-5 w-5 text-purple-400" />
                      AI Recommendations
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div>
                      <div className="flex items-center gap-2 mb-3">
                        <AlertTriangle className="h-4 w-4 text-amber-400" />
                        <span className="text-sm font-semibold text-white">Top 3 Bottlenecks</span>
                      </div>
                      <ul className="space-y-2">
                        {aiInsights.bottlenecks.map((b, i) => (
                          <li key={i} className="text-sm text-white/70 pl-4 border-l-2 border-amber-500/50">
                            {b}
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div>
                      <div className="flex items-center gap-2 mb-3">
                        <Lightbulb className="h-4 w-4 text-emerald-400" />
                        <span className="text-sm font-semibold text-white">Top 3 Quick Wins</span>
                      </div>
                      <ul className="space-y-2">
                        {aiInsights.quickWins.map((w, i) => (
                          <li key={i} className="text-sm text-white/70 pl-4 border-l-2 border-emerald-500/50">
                            {w}
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div>
                      <div className="flex items-center gap-2 mb-3">
                        <Target className="h-4 w-4 text-[#3a8bff]" />
                        <span className="text-sm font-semibold text-white">90-Day Roadmap</span>
                      </div>
                      <ul className="space-y-2">
                        {aiInsights.roadmap.map((r, i) => (
                          <li key={i} className="text-sm text-white/70 pl-4 border-l-2 border-[#3a8bff]/50">
                            {r}
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div className="pt-4 border-t border-white/10">
                      <div className="flex items-center gap-2 mb-2">
                        <TrendingUp className="h-4 w-4 text-green-400" />
                        <span className="text-sm font-semibold text-white">Financial Impact</span>
                      </div>
                      <p className="text-sm text-white/70">{aiInsights.financialImpact}</p>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default function AuditBuilderPage() {
  return (
    <Suspense
      fallback={
        <div className="p-6 flex items-center justify-center min-h-[400px]">
          <div className="text-center space-y-4">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#3a8bff] mx-auto" />
            <p className="text-white/60">Loading audit builder...</p>
          </div>
        </div>
      }
    >
      <AuditBuilderContent />
    </Suspense>
  )
}
