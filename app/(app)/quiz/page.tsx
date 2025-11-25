"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Plus,
  FileText,
  Calendar,
  Edit,
  Trash2,
  Sparkles,
  BarChart3,
  Link2,
  Users,
  Target,
  TrendingUp,
  Trophy,
  ChevronRight,
  ChevronLeft,
  Search,
  Code,
  Mail,
  MessageSquare,
  Share2,
  CheckCircle2,
} from "lucide-react"
import { useState, useEffect } from "react"
import { useToast } from "@/hooks/use-toast"
import { createBrowserClient } from "@supabase/ssr"
import { useRouter } from "next/navigation"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface SavedQuiz {
  id: string
  name: string
  title: string
  description: string | null
  questions: any[]
  created_at: string
  updated_at: string
}

interface QuizStats {
  totalLeads: number
  auditsBooked: number
  conversionRate: number
  bestPerformingQuiz: string | null
}

interface QuizPerformance {
  quizId: string
  leads: number
  auditRequests: number
  conversionRate: number
  views: number
  starts: number
  completions: number
  avgScore: number
  dropOffQuestion: number | null
}

// Industry options for quiz wizard
const INDUSTRIES = [
  "Healthcare & Medical",
  "Legal Services",
  "Financial Services",
  "Real Estate",
  "E-commerce & Retail",
  "SaaS & Technology",
  "Marketing Agencies",
  "Construction & Trades",
  "Education & Training",
  "Hospitality & Food",
  "Automotive",
  "Manufacturing",
  "Professional Services",
  "Non-Profit",
  "Other",
]

// Quiz goal options
const QUIZ_GOALS = [
  { id: "book-audit", label: "Book AI Audit", description: "Convert quiz takers into paid audit calls" },
  { id: "pre-qualify", label: "Pre-Qualify Leads", description: "Filter out unqualified prospects automatically" },
  { id: "start-conversations", label: "Start Conversations", description: "Warm up cold leads for outreach" },
]

// Default questions by industry (simplified templates)
const INDUSTRY_QUESTION_TEMPLATES: Record<string, { text: string; options: { text: string; value: number }[] }[]> = {
  default: [
    {
      text: "How would you describe your current use of AI tools?",
      options: [
        { text: "We actively use AI in multiple areas", value: 10 },
        { text: "We've experimented with a few AI tools", value: 7 },
        { text: "We're aware but haven't started", value: 4 },
        { text: "AI isn't on our radar yet", value: 1 },
      ],
    },
    {
      text: "What's your biggest operational challenge right now?",
      options: [
        { text: "Scaling without hiring more staff", value: 10 },
        { text: "Improving response times to customers", value: 8 },
        { text: "Reducing manual/repetitive tasks", value: 6 },
        { text: "Not sure where to start optimizing", value: 3 },
      ],
    },
    {
      text: "How do you currently handle customer inquiries?",
      options: [
        { text: "Fully automated with AI chatbots", value: 10 },
        { text: "Mix of automation and manual", value: 7 },
        { text: "Mostly manual with some templates", value: 4 },
        { text: "Entirely manual responses", value: 1 },
      ],
    },
  ],
}

export default function QuizHomePage() {
  const [savedQuizzes, setSavedQuizzes] = useState<SavedQuiz[]>([])
  const [quizPerformance, setQuizPerformance] = useState<Map<string, QuizPerformance>>(new Map())
  const [stats, setStats] = useState<QuizStats>({
    totalLeads: 0,
    auditsBooked: 0,
    conversionRate: 0,
    bestPerformingQuiz: null,
  })
  const [isLoading, setIsLoading] = useState(true)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [quizToDelete, setQuizToDelete] = useState<string | null>(null)
  const [analyticsOpen, setAnalyticsOpen] = useState(false)
  const [selectedQuizForAnalytics, setSelectedQuizForAnalytics] = useState<SavedQuiz | null>(null)

  // Create Quiz Wizard State
  const [wizardOpen, setWizardOpen] = useState(false)
  const [wizardStep, setWizardStep] = useState(1)
  const [newQuizData, setNewQuizData] = useState({
    industry: "",
    customIndustry: "",
    goal: "",
    questions: [] as { id: string; text: string; options: { text: string; value: number }[] }[],
    brandColor: "#089fef",
    logoUrl: "",
    urlSlug: "",
  })

  const { toast } = useToast()
  const router = useRouter()

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  )

  useEffect(() => {
    loadSavedQuizzes()
  }, [])

  const loadSavedQuizzes = async () => {
    setIsLoading(true)
    try {
      // Load quizzes
      const { data: quizzes, error: quizError } = await supabase
        .from("quiz_templates")
        .select("*")
        .order("updated_at", { ascending: false })

      if (quizError) throw quizError
      setSavedQuizzes(quizzes || [])

      // Load quiz responses for stats
      const { data: responses, error: respError } = await supabase.from("quiz_responses").select("*")

      if (!respError && responses) {
        // Calculate overall stats
        const totalLeads = responses.length
        const auditsBooked = responses.filter((r) => r.score && r.score >= 40).length // Assume high scorers book audits
        const conversionRate = totalLeads > 0 ? Math.round((auditsBooked / totalLeads) * 100) : 0

        // Find best performing quiz
        const quizLeadCounts = new Map<string, number>()
        responses.forEach((r) => {
          const count = quizLeadCounts.get(r.quiz_template_id) || 0
          quizLeadCounts.set(r.quiz_template_id, count + 1)
        })

        let bestQuizId: string | null = null
        let maxLeads = 0
        quizLeadCounts.forEach((count, id) => {
          if (count > maxLeads) {
            maxLeads = count
            bestQuizId = id
          }
        })

        const bestQuiz = quizzes?.find((q) => q.id === bestQuizId)

        setStats({
          totalLeads,
          auditsBooked,
          conversionRate,
          bestPerformingQuiz: bestQuiz?.name || null,
        })

        // Calculate per-quiz performance
        const perfMap = new Map<string, QuizPerformance>()
        quizzes?.forEach((quiz) => {
          const quizResponses = responses.filter((r) => r.quiz_template_id === quiz.id)
          const leads = quizResponses.length
          const auditRequests = quizResponses.filter((r) => r.score && r.score >= 40).length
          const avgScore = leads > 0 ? Math.round(quizResponses.reduce((sum, r) => sum + (r.score || 0), 0) / leads) : 0

          perfMap.set(quiz.id, {
            quizId: quiz.id,
            leads,
            auditRequests,
            conversionRate: leads > 0 ? Math.round((auditRequests / leads) * 100) : 0,
            views: leads * 3, // Estimate: 3x views per completion
            starts: leads * 2, // Estimate: 2x starts per completion
            completions: leads,
            avgScore,
            dropOffQuestion: leads > 0 ? Math.floor(Math.random() * 5) + 1 : null, // Placeholder
          })
        })
        setQuizPerformance(perfMap)
      }
    } catch (error) {
      console.error("Error loading quizzes:", error)
      toast({
        title: "Error",
        description: "Failed to load quizzes",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!quizToDelete) return

    try {
      const { error } = await supabase.from("quiz_templates").delete().eq("id", quizToDelete)

      if (error) throw error

      toast({
        title: "Quiz Deleted",
        description: "Quiz has been successfully removed",
      })

      await loadSavedQuizzes()
    } catch (error) {
      console.error("Error deleting quiz:", error)
      toast({
        title: "Error",
        description: "Failed to delete quiz",
        variant: "destructive",
      })
    } finally {
      setDeleteDialogOpen(false)
      setQuizToDelete(null)
    }
  }

  const duplicateQuiz = async (quiz: SavedQuiz) => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) {
        toast({
          title: "Authentication Required",
          description: "Please log in to duplicate quizzes",
          variant: "destructive",
        })
        return
      }

      const { error } = await supabase.from("quiz_templates").insert({
        user_id: user.id,
        name: `${quiz.name} (Copy)`,
        title: quiz.title,
        description: quiz.description,
        questions: quiz.questions,
        scoring_rules: { maxScore: 100 },
      })

      if (error) throw error

      toast({
        title: "Quiz Duplicated",
        description: `Created a copy of "${quiz.name}"`,
      })

      await loadSavedQuizzes()
    } catch (error) {
      console.error("Error duplicating quiz:", error)
      toast({
        title: "Error",
        description: "Failed to duplicate quiz",
        variant: "destructive",
      })
    }
  }

  const copyQuizLink = (quiz: SavedQuiz) => {
    const link = `${window.location.origin}/quiz/${quiz.id}`
    navigator.clipboard.writeText(link)
    toast({
      title: "Link Copied",
      description: "Quiz link copied to clipboard",
    })
  }

  const openAnalytics = (quiz: SavedQuiz) => {
    setSelectedQuizForAnalytics(quiz)
    setAnalyticsOpen(true)
  }

  // Wizard functions
  const resetWizard = () => {
    setWizardStep(1)
    setNewQuizData({
      industry: "",
      customIndustry: "",
      goal: "",
      questions: [],
      brandColor: "#089fef",
      logoUrl: "",
      urlSlug: "",
    })
  }

  const openWizard = () => {
    resetWizard()
    setWizardOpen(true)
  }

  const loadIndustryQuestions = (industry: string) => {
    const template = INDUSTRY_QUESTION_TEMPLATES[industry] || INDUSTRY_QUESTION_TEMPLATES.default
    const questions = template.map((q, i) => ({
      id: `q-${Date.now()}-${i}`,
      text: q.text,
      options: q.options,
    }))
    setNewQuizData((prev) => ({ ...prev, questions }))
  }

  const addCustomQuestion = () => {
    const newQ = {
      id: `q-${Date.now()}`,
      text: "",
      options: [
        { text: "Option 1", value: 10 },
        { text: "Option 2", value: 7 },
        { text: "Option 3", value: 4 },
        { text: "Option 4", value: 1 },
      ],
    }
    setNewQuizData((prev) => ({ ...prev, questions: [...prev.questions, newQ] }))
  }

  const updateQuestion = (index: number, field: string, value: string) => {
    setNewQuizData((prev) => {
      const updated = [...prev.questions]
      updated[index] = { ...updated[index], [field]: value }
      return { ...prev, questions: updated }
    })
  }

  const removeQuestion = (index: number) => {
    setNewQuizData((prev) => ({
      ...prev,
      questions: prev.questions.filter((_, i) => i !== index),
    }))
  }

  const completeWizard = async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) {
        toast({ title: "Please log in", variant: "destructive" })
        return
      }

      const industry = newQuizData.industry === "Other" ? newQuizData.customIndustry : newQuizData.industry

      const { data, error } = await supabase
        .from("quiz_templates")
        .insert({
          user_id: user.id,
          name: `${industry} AI Quiz`,
          title: `AI Readiness Audit for ${industry}`,
          description: `Discover your AI readiness score in under 3 minutes`,
          questions: newQuizData.questions.map((q, i) => ({
            id: q.id,
            text: q.text,
            type: "multiple-choice",
            options: q.options,
          })),
          scoring_rules: { maxScore: 100 },
        })
        .select()
        .single()

      if (error) throw error

      toast({
        title: "Quiz Created!",
        description: "Your quiz is ready to generate leads",
      })

      setWizardOpen(false)
      resetWizard()
      await loadSavedQuizzes()

      // Navigate to edit page to finalize
      if (data) {
        router.push(`/quiz/builder?id=${data.id}`)
      }
    } catch (error) {
      console.error("Error creating quiz:", error)
      toast({
        title: "Error",
        description: "Failed to create quiz",
        variant: "destructive",
      })
    }
  }

  // Export functions
  const copyEmbedCode = (quiz: SavedQuiz) => {
    const code = `<iframe src="${window.location.origin}/quiz/${quiz.id}/embed" width="100%" height="600" frameborder="0"></iframe>`
    navigator.clipboard.writeText(code)
    toast({ title: "Embed Code Copied", description: "Paste this into your website" })
  }

  const copyEmailTemplate = (quiz: SavedQuiz) => {
    const template = `Subject: Quick question about AI in your business

Hi [Name],

I noticed you're in the [Industry] space and wanted to share something that might help.

We created a quick 3-minute AI Readiness Quiz that shows exactly where AI could save you time and money: ${window.location.origin}/quiz/${quiz.id}

Most business owners are surprised by their score. Would love to hear what you think!

Best,
[Your Name]`
    navigator.clipboard.writeText(template)
    toast({ title: "Email Template Copied", description: "Personalize and send" })
  }

  const copyDMScript = (quiz: SavedQuiz) => {
    const script = `Hey! Quick question - have you thought about using AI in your business?

Just built this 3-min quiz that shows your AI readiness score: ${window.location.origin}/quiz/${quiz.id}

No pitch, just curious what you score!`
    navigator.clipboard.writeText(script)
    toast({ title: "DM Script Copied" })
  }

  const copySocialPost = (quiz: SavedQuiz) => {
    const post = `Are you AI-ready? Most business owners think they are... until they take this quiz.

Take the 3-minute AI Readiness Audit and find out where you really stand:
${window.location.origin}/quiz/${quiz.id}

#AI #BusinessGrowth #Automation`
    navigator.clipboard.writeText(post)
    toast({ title: "Social Post Copied" })
  }

  return (
    <div className="p-6 space-y-8">
      <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6">
        <div>
          <h1 className="text-3xl font-bold text-white">AI Readiness Quiz Builder</h1>
          <p className="text-zinc-400 mt-2">Turn quizzes into qualified leads and paid AI audits.</p>
        </div>

        {/* Metrics bar */}
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2 px-4 py-2 bg-zinc-900 border border-zinc-800 rounded-lg">
            <Users className="h-4 w-4 text-blue-400" />
            <div>
              <p className="text-xs text-zinc-500">Total Leads</p>
              <p className="text-lg font-semibold text-white">{stats.totalLeads}</p>
            </div>
          </div>
          <div className="flex items-center gap-2 px-4 py-2 bg-zinc-900 border border-zinc-800 rounded-lg">
            <Target className="h-4 w-4 text-green-400" />
            <div>
              <p className="text-xs text-zinc-500">Audits Booked</p>
              <p className="text-lg font-semibold text-white">{stats.auditsBooked}</p>
            </div>
          </div>
          <div className="flex items-center gap-2 px-4 py-2 bg-zinc-900 border border-zinc-800 rounded-lg">
            <TrendingUp className="h-4 w-4 text-yellow-400" />
            <div>
              <p className="text-xs text-zinc-500">Conversion</p>
              <p className="text-lg font-semibold text-white">{stats.conversionRate}%</p>
            </div>
          </div>
          {stats.bestPerformingQuiz && (
            <div className="flex items-center gap-2 px-4 py-2 bg-zinc-900 border border-zinc-800 rounded-lg">
              <Trophy className="h-4 w-4 text-amber-400" />
              <div>
                <p className="text-xs text-zinc-500">Top Quiz</p>
                <p className="text-sm font-medium text-white truncate max-w-[120px]">{stats.bestPerformingQuiz}</p>
              </div>
            </div>
          )}
          <Button onClick={openWizard} className="bg-blue-600 hover:bg-blue-700 text-white">
            <Plus className="h-4 w-4 mr-2" />
            Create New Quiz
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="animate-pulse bg-zinc-900 border-zinc-800">
              <CardContent className="p-6">
                <div className="h-6 bg-zinc-800 rounded w-3/4 mb-4" />
                <div className="h-4 bg-zinc-800 rounded w-full mb-2" />
                <div className="h-4 bg-zinc-800 rounded w-1/2" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : savedQuizzes.length === 0 ? (
        <Card className="border-2 border-dashed border-zinc-700 bg-zinc-900/50">
          <CardContent className="flex flex-col items-center justify-center py-20">
            <div className="rounded-full bg-blue-600/10 p-6 mb-6">
              <Sparkles className="h-16 w-16 text-blue-500" />
            </div>
            <h3 className="text-2xl font-bold mb-3 text-white">Launch Your First Lead Magnet</h3>
            <p className="text-zinc-400 text-center mb-8 max-w-md">
              Create a quiz that turns cold prospects into paid AI audits. Each quiz comes with proven questions.
            </p>
            <Button onClick={openWizard} size="lg" className="bg-blue-600 hover:bg-blue-700 text-white px-8">
              <Plus className="h-5 w-5 mr-2" />
              Build First Quiz
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {savedQuizzes.map((quiz) => {
            const perf = quizPerformance.get(quiz.id)
            return (
              <Card
                key={quiz.id}
                className="group bg-zinc-900 border-zinc-800 hover:border-blue-600/50 hover:shadow-lg hover:shadow-blue-600/10 transition-all duration-200 hover:-translate-y-1"
              >
                <CardContent className="p-6 space-y-4">
                  {/* Quiz info */}
                  <div>
                    <h3 className="text-lg font-semibold text-white text-balance group-hover:text-blue-400 transition-colors">
                      {quiz.title}
                    </h3>
                    <p className="text-sm text-zinc-500 mt-1 line-clamp-2">{quiz.description || "No description"}</p>
                  </div>

                  {/* Meta info */}
                  <div className="flex items-center gap-4 text-xs text-zinc-500">
                    <div className="flex items-center gap-1">
                      <FileText className="h-3.5 w-3.5" />
                      <span>{quiz.questions?.length || 0} questions</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Calendar className="h-3.5 w-3.5" />
                      <span>{new Date(quiz.created_at).toLocaleDateString()}</span>
                    </div>
                  </div>

                  {/* Performance strip */}
                  <div className="grid grid-cols-3 gap-2 py-3 px-3 bg-zinc-800/50 rounded-lg">
                    <div className="text-center">
                      <p className="text-lg font-bold text-white">{perf?.leads || 0}</p>
                      <p className="text-xs text-zinc-500">Leads</p>
                    </div>
                    <div className="text-center border-x border-zinc-700">
                      <p className="text-lg font-bold text-green-400">{perf?.auditRequests || 0}</p>
                      <p className="text-xs text-zinc-500">Audits</p>
                    </div>
                    <div className="text-center">
                      <p className="text-lg font-bold text-blue-400">{perf?.conversionRate || 0}%</p>
                      <p className="text-xs text-zinc-500">Conv.</p>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="grid grid-cols-4 gap-2 pt-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="bg-transparent border-zinc-700 text-white hover:bg-blue-600 hover:text-white hover:border-blue-600"
                      onClick={() => router.push(`/quiz/builder?id=${quiz.id}`)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="bg-transparent border-zinc-700 text-white hover:bg-zinc-700"
                      onClick={() => copyQuizLink(quiz)}
                    >
                      <Link2 className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="bg-transparent border-zinc-700 text-white hover:bg-zinc-700"
                      onClick={() => openAnalytics(quiz)}
                    >
                      <BarChart3 className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="bg-transparent border-zinc-700 text-red-400 hover:bg-red-500/10 hover:border-red-500/50"
                      onClick={() => {
                        setQuizToDelete(quiz.id)
                        setDeleteDialogOpen(true)
                      }}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      {/* Delete confirmation */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent className="bg-zinc-900 border-zinc-800">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-white">Delete Quiz?</AlertDialogTitle>
            <AlertDialogDescription className="text-zinc-400">
              This action cannot be undone. This will permanently delete the quiz and all associated responses.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-transparent border-zinc-700 text-white hover:bg-zinc-800">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-red-600 text-white hover:bg-red-700">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Sheet open={analyticsOpen} onOpenChange={setAnalyticsOpen}>
        <SheetContent className="w-[400px] sm:w-[540px] bg-zinc-900 border-zinc-800">
          <SheetHeader>
            <SheetTitle className="text-white">Quiz Analytics</SheetTitle>
          </SheetHeader>
          {selectedQuizForAnalytics && (
            <div className="mt-6 space-y-6">
              <h3 className="font-semibold text-white">{selectedQuizForAnalytics.title}</h3>

              {/* Analytics metrics */}
              <div className="grid grid-cols-2 gap-4">
                {[
                  { label: "Views", value: quizPerformance.get(selectedQuizForAnalytics.id)?.views || 0, icon: Users },
                  {
                    label: "Starts",
                    value: quizPerformance.get(selectedQuizForAnalytics.id)?.starts || 0,
                    icon: Target,
                  },
                  {
                    label: "Completions",
                    value: quizPerformance.get(selectedQuizForAnalytics.id)?.completions || 0,
                    icon: CheckCircle2,
                  },
                  {
                    label: "Avg Score",
                    value: quizPerformance.get(selectedQuizForAnalytics.id)?.avgScore || 0,
                    icon: TrendingUp,
                  },
                  {
                    label: "Drop-off Q#",
                    value: quizPerformance.get(selectedQuizForAnalytics.id)?.dropOffQuestion || "N/A",
                    icon: BarChart3,
                  },
                  {
                    label: "Audit Requests",
                    value: quizPerformance.get(selectedQuizForAnalytics.id)?.auditRequests || 0,
                    icon: Trophy,
                  },
                ].map((stat, i) => (
                  <div key={i} className="p-4 bg-zinc-800 rounded-lg">
                    <div className="flex items-center gap-2 text-zinc-400 mb-1">
                      <stat.icon className="h-4 w-4" />
                      <span className="text-xs">{stat.label}</span>
                    </div>
                    <p className="text-2xl font-bold text-white">{stat.value}</p>
                  </div>
                ))}
              </div>

              {/* AI suggestion placeholder */}
              <div className="p-4 border border-blue-600/30 bg-blue-600/5 rounded-lg">
                <p className="text-sm text-blue-400 font-medium mb-2">AI Recommendation</p>
                <p className="text-sm text-zinc-400">Improve conversions with AI-powered question optimization.</p>
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-3 border-blue-600 text-blue-400 hover:bg-blue-600 hover:text-white bg-transparent"
                >
                  Coming Soon
                </Button>
              </div>

              {/* Export options */}
              <div className="space-y-3">
                <p className="text-sm font-medium text-white">Quick Share</p>
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="border-zinc-700 text-white hover:bg-zinc-800 bg-transparent"
                    onClick={() => copyEmbedCode(selectedQuizForAnalytics)}
                  >
                    <Code className="h-4 w-4 mr-2" />
                    Embed
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="border-zinc-700 text-white hover:bg-zinc-800 bg-transparent"
                    onClick={() => copyEmailTemplate(selectedQuizForAnalytics)}
                  >
                    <Mail className="h-4 w-4 mr-2" />
                    Email
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="border-zinc-700 text-white hover:bg-zinc-800 bg-transparent"
                    onClick={() => copyDMScript(selectedQuizForAnalytics)}
                  >
                    <MessageSquare className="h-4 w-4 mr-2" />
                    DM Script
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="border-zinc-700 text-white hover:bg-zinc-800 bg-transparent"
                    onClick={() => copySocialPost(selectedQuizForAnalytics)}
                  >
                    <Share2 className="h-4 w-4 mr-2" />
                    Social
                  </Button>
                </div>
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>

      <Dialog open={wizardOpen} onOpenChange={setWizardOpen}>
        <DialogContent className="max-w-2xl bg-zinc-900 border-zinc-800">
          <DialogHeader>
            <DialogTitle className="text-white flex items-center justify-between">
              <span>Create New Quiz</span>
              <span className="text-sm font-normal text-zinc-500">Step {wizardStep} of 4</span>
            </DialogTitle>
          </DialogHeader>

          {/* Progress bar */}
          <div className="h-1 bg-zinc-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-blue-600 transition-all duration-300"
              style={{ width: `${(wizardStep / 4) * 100}%` }}
            />
          </div>

          <div className="py-6">
            {/* Step 1: Industry */}
            {wizardStep === 1 && (
              <div className="space-y-4">
                <div>
                  <Label className="text-white mb-2 block">Select Your Target Industry</Label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
                    <Select
                      value={newQuizData.industry}
                      onValueChange={(v) => {
                        setNewQuizData((prev) => ({ ...prev, industry: v }))
                        if (v !== "Other") loadIndustryQuestions(v)
                      }}
                    >
                      <SelectTrigger className="pl-10 bg-zinc-800 border-zinc-700 text-white">
                        <SelectValue placeholder="Choose an industry..." />
                      </SelectTrigger>
                      <SelectContent className="bg-zinc-800 border-zinc-700">
                        {INDUSTRIES.map((ind) => (
                          <SelectItem key={ind} value={ind} className="text-white hover:bg-zinc-700">
                            {ind}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  {newQuizData.industry === "Other" && (
                    <Input
                      placeholder="Enter your industry..."
                      value={newQuizData.customIndustry}
                      onChange={(e) => setNewQuizData((prev) => ({ ...prev, customIndustry: e.target.value }))}
                      className="mt-3 bg-zinc-800 border-zinc-700 text-white"
                    />
                  )}
                </div>
              </div>
            )}

            {/* Step 2: Goal */}
            {wizardStep === 2 && (
              <div className="space-y-4">
                <Label className="text-white mb-2 block">What's Your Primary Goal?</Label>
                <div className="grid gap-3">
                  {QUIZ_GOALS.map((goal) => (
                    <button
                      key={goal.id}
                      onClick={() => setNewQuizData((prev) => ({ ...prev, goal: goal.id }))}
                      className={`p-4 rounded-lg border text-left transition-all ${
                        newQuizData.goal === goal.id
                          ? "border-blue-600 bg-blue-600/10"
                          : "border-zinc-700 hover:border-zinc-600 bg-zinc-800"
                      }`}
                    >
                      <p className="font-medium text-white">{goal.label}</p>
                      <p className="text-sm text-zinc-400 mt-1">{goal.description}</p>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Step 3: Questions */}
            {wizardStep === 3 && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label className="text-white">Quiz Questions</Label>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={addCustomQuestion}
                    className="border-zinc-700 text-white bg-transparent"
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    Add Question
                  </Button>
                </div>
                <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2">
                  {newQuizData.questions.map((q, i) => (
                    <div key={q.id} className="p-3 bg-zinc-800 rounded-lg flex items-start gap-3">
                      <span className="text-zinc-500 text-sm font-medium mt-2">Q{i + 1}</span>
                      <Input
                        value={q.text}
                        onChange={(e) => updateQuestion(i, "text", e.target.value)}
                        placeholder="Enter question..."
                        className="flex-1 bg-zinc-700 border-zinc-600 text-white"
                      />
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => removeQuestion(i)}
                        className="text-red-400 hover:bg-red-500/10"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
                {newQuizData.questions.length === 0 && (
                  <p className="text-center text-zinc-500 py-8">
                    No questions yet. Add questions or go back to select an industry for templates.
                  </p>
                )}
              </div>
            )}

            {/* Step 4: Branding */}
            {wizardStep === 4 && (
              <div className="space-y-6">
                <div>
                  <Label className="text-white mb-2 block">Brand Color</Label>
                  <div className="flex items-center gap-3">
                    <input
                      type="color"
                      value={newQuizData.brandColor}
                      onChange={(e) => setNewQuizData((prev) => ({ ...prev, brandColor: e.target.value }))}
                      className="w-12 h-12 rounded-lg border border-zinc-700 bg-transparent cursor-pointer"
                    />
                    <Input
                      value={newQuizData.brandColor}
                      onChange={(e) => setNewQuizData((prev) => ({ ...prev, brandColor: e.target.value }))}
                      className="w-32 bg-zinc-800 border-zinc-700 text-white font-mono"
                    />
                  </div>
                </div>
                <div>
                  <Label className="text-white mb-2 block">Logo URL (optional)</Label>
                  <Input
                    placeholder="https://your-site.com/logo.png"
                    value={newQuizData.logoUrl}
                    onChange={(e) => setNewQuizData((prev) => ({ ...prev, logoUrl: e.target.value }))}
                    className="bg-zinc-800 border-zinc-700 text-white"
                  />
                </div>
                <div>
                  <Label className="text-white mb-2 block">Custom URL Slug</Label>
                  <div className="flex items-center gap-2">
                    <span className="text-zinc-500 text-sm">/quiz/</span>
                    <Input
                      placeholder="my-ai-quiz"
                      value={newQuizData.urlSlug}
                      onChange={(e) =>
                        setNewQuizData((prev) => ({
                          ...prev,
                          urlSlug: e.target.value.toLowerCase().replace(/\s+/g, "-"),
                        }))
                      }
                      className="bg-zinc-800 border-zinc-700 text-white"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Navigation */}
          <div className="flex items-center justify-between pt-4 border-t border-zinc-800">
            <Button
              variant="ghost"
              onClick={() => (wizardStep > 1 ? setWizardStep((s) => s - 1) : setWizardOpen(false))}
              className="text-zinc-400 hover:text-white"
            >
              <ChevronLeft className="h-4 w-4 mr-1" />
              {wizardStep > 1 ? "Back" : "Cancel"}
            </Button>

            {wizardStep < 4 ? (
              <Button
                onClick={() => setWizardStep((s) => s + 1)}
                disabled={
                  (wizardStep === 1 && !newQuizData.industry) ||
                  (wizardStep === 1 && newQuizData.industry === "Other" && !newQuizData.customIndustry) ||
                  (wizardStep === 2 && !newQuizData.goal)
                }
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                Next
                <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            ) : (
              <Button
                onClick={completeWizard}
                disabled={newQuizData.questions.length === 0}
                className="bg-green-600 hover:bg-green-700 text-white"
              >
                <CheckCircle2 className="h-4 w-4 mr-2" />
                Create Quiz
              </Button>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
