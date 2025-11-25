import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
  MessageSquare,
  PlayCircle,
  Sparkles,
  Zap,
  Target,
  CheckCircle2,
  Lock,
  Flame,
  Clock,
  ChevronRight,
  Trophy,
  Star,
  Users,
  FileText,
} from "lucide-react"
import Link from "next/link"
import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { cn } from "@/lib/utils"

// Journey steps configuration
const JOURNEY_STEPS = [
  { id: "ghl", label: "Connect GHL", href: "/revival", icon: MessageSquare },
  { id: "quiz", label: "Build AI Readiness Quiz", href: "/quiz/builder", icon: Sparkles },
  { id: "niches", label: "Browse Niches", href: "/revival/opportunities", icon: Target },
  { id: "android", label: "Create Android", href: "/prompt-generator", icon: Zap },
  { id: "campaign", label: "Launch a Campaign", href: "/revival", icon: PlayCircle },
]

// Achievement badges configuration
const ACHIEVEMENTS = [
  { id: "first_ghl", label: "First GHL Account Connected", action: "Connect a GHL account" },
  { id: "first_quiz", label: "First Quiz Built", action: "Create a quiz" },
  { id: "first_niche", label: "First Niche Saved", action: "Save a niche to favourites" },
  { id: "first_android", label: "First Android Created", action: "Create an Android" },
  { id: "first_campaign", label: "First Campaign Launched", action: "Sync a GHL campaign" },
  { id: "first_lead", label: "First Lead Revived", action: "Get a conversation response" },
  { id: "first_win", label: "First Client Win", action: "Mark a niche as Won" },
  { id: "streak_7", label: "7-Day Streak", action: "Log in for 7 consecutive days" },
]

export default async function DashboardPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/login")
  }

  // Fetch user profile
  const { data: profile } = await supabase.from("profiles").select("full_name, email").eq("id", user.id).single()

  // Fetch all metrics in parallel
  const [
    { data: ghlConnections },
    { data: sessions },
    { data: androids },
    { data: quizzes },
    { data: nichesData },
    { data: campaigns },
    { data: conversations },
  ] = await Promise.all([
    supabase.from("ghl_connections").select("id").eq("user_id", user.id),
    supabase.from("sessions").select("id").eq("user_id", user.id),
    supabase.from("androids").select("id").eq("user_id", user.id),
    supabase.from("quiz_templates").select("id").eq("user_id", user.id),
    supabase.from("niche_user_state").select("id, is_favourite, status").eq("user_id", user.id),
    supabase.from("revival_campaigns").select("id, metrics").eq("user_id", user.id),
    supabase.from("revival_conversations").select("id, status").eq("user_id", user.id),
  ])

  // Calculate counts
  const ghlCount = ghlConnections?.length || 0
  const sessionsCount = sessions?.length || 0
  const androidsCount = androids?.length || 0
  const quizzesCount = quizzes?.length || 0
  const favouritesCount = nichesData?.filter((n) => n.is_favourite).length || 0
  const campaignsCount = campaigns?.length || 0
  const conversationsCount = conversations?.length || 0
  const winsCount = nichesData?.filter((n) => n.status === "Win").length || 0

  // Get first name from profile or email
  const firstName = profile?.full_name?.split(" ")[0] || user.email?.split("@")[0] || "there"

  // Calculate journey progress
  const journeyProgress = {
    ghl: ghlCount > 0,
    quiz: quizzesCount > 0,
    niches: favouritesCount > 0,
    android: androidsCount > 0,
    campaign: campaignsCount > 0,
  }

  const completedSteps = Object.values(journeyProgress).filter(Boolean).length
  const totalSteps = JOURNEY_STEPS.length

  // Find first incomplete step
  const firstIncompleteStep = JOURNEY_STEPS.find((step) => !journeyProgress[step.id as keyof typeof journeyProgress])

  // Calculate achievements
  const unlockedAchievements = {
    first_ghl: ghlCount > 0,
    first_quiz: quizzesCount > 0,
    first_niche: favouritesCount > 0,
    first_android: androidsCount > 0,
    first_campaign: campaignsCount > 0,
    first_lead: conversationsCount > 0,
    first_win: winsCount > 0,
    streak_7: false, // TODO: Implement streak tracking
  }

  // Generate dynamic quick actions based on progress
  const getQuickActions = () => {
    const actions = []

    if (ghlCount === 0) {
      actions.push({
        title: "Connect Your First GHL Account",
        benefit: "Start tracking dead lead revivals",
        time: "5 min",
        href: "/revival",
        icon: MessageSquare,
      })
    }

    if (quizzesCount === 0) {
      actions.push({
        title: "Build Your First AI Quiz",
        benefit: "Qualify leads automatically",
        time: "10 min",
        href: "/quiz/builder",
        icon: Sparkles,
      })
    }

    if (favouritesCount === 0) {
      actions.push({
        title: "Browse Niches to Find Opportunities",
        benefit: "Discover profitable markets",
        time: "3 min",
        href: "/revival/opportunities",
        icon: Target,
      })
    }

    if (androidsCount === 0) {
      actions.push({
        title: "Create Your First Android",
        benefit: "Build AI sales assistants",
        time: "8 min",
        href: "/prompt-generator",
        icon: Zap,
      })
    }

    // If all onboarding complete, show advanced actions
    if (actions.length === 0) {
      actions.push(
        {
          title: "Launch a Revival Campaign",
          benefit: "Revive dead leads with AI",
          time: "5 min",
          href: "/revival",
          icon: PlayCircle,
        },
        {
          title: "Add a New Client",
          benefit: "Expand your portfolio",
          time: "5 min",
          href: "/revival",
          icon: Users,
        },
        {
          title: "Browse More Niches",
          benefit: "Find new opportunities",
          time: "3 min",
          href: "/revival/opportunities",
          icon: Target,
        },
      )
    }

    return actions.slice(0, 3)
  }

  const quickActions = getQuickActions()

  // Get recommended next action
  const getNextRecommendation = () => {
    if (ghlCount === 0) return { text: "Connect a GHL account to start tracking revivals.", href: "/revival" }
    if (quizzesCount === 0) return { text: "Build an AI quiz to qualify leads automatically.", href: "/quiz/builder" }
    if (favouritesCount === 0)
      return { text: "Browse niches to find client-ready opportunities.", href: "/revival/opportunities" }
    if (androidsCount === 0) return { text: "Create an Android to power your demos.", href: "/prompt-generator" }
    if (campaignsCount === 0) return { text: "Sync your first campaign to start revivals.", href: "/revival" }
    return { text: "Keep building momentum. Explore more niches.", href: "/revival/opportunities" }
  }

  const nextRecommendation = getNextRecommendation()

  // Progress message based on completion
  const getProgressMessage = () => {
    if (completedSteps === 0) return "Let's get started! Your AI agency journey begins now."
    if (completedSteps < 3) return "You're making progress in your AI Lab. Your next win is just a few minutes away."
    if (completedSteps < totalSteps) return "Almost there! Just a few more steps to unlock your full potential."
    return "Amazing! You've completed all onboarding steps. Time to scale."
  }

  // Metrics for snapshot
  const metrics = [
    { label: "GHL Accounts", value: ghlCount, icon: MessageSquare, href: "/revival" },
    { label: "Quizzes Created", value: quizzesCount, icon: FileText, href: "/quiz" },
    { label: "AI Androids", value: androidsCount, icon: Zap, href: "/demo" },
    { label: "Favourite Niches", value: favouritesCount, icon: Star, href: "/revival/opportunities" },
  ]

  return (
    <div className="min-h-screen bg-black p-6 md:p-8 space-y-8 max-w-7xl mx-auto">
      {/* HERO SECTION */}
      <section className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 pb-8 border-b border-white/10">
        <div className="flex items-center gap-4">
          <div className="relative">
            <div className="h-16 w-16 rounded-full bg-gradient-to-br from-[#00A8FF] to-[#0066FF] flex items-center justify-center text-white text-2xl font-bold uppercase">
              {firstName[0]}
            </div>
            {completedSteps > 0 && (
              <div className="absolute -bottom-1 -right-1 h-6 w-6 rounded-full bg-[#00A8FF] flex items-center justify-center">
                <Flame className="h-3 w-3 text-white" />
              </div>
            )}
          </div>
          <div>
            <h1 className="text-3xl md:text-4xl font-bold text-white">Welcome back, {firstName}</h1>
            <p className="text-white/60 text-base md:text-lg mt-1">{getProgressMessage()}</p>
          </div>
        </div>
        <div className="flex items-center gap-4 text-sm text-white/50">
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4" />
            <span>Last login: Today</span>
          </div>
          {completedSteps > 0 && (
            <div className="flex items-center gap-2 text-[#00A8FF]">
              <Flame className="h-4 w-4" />
              <span>{completedSteps} steps complete</span>
            </div>
          )}
        </div>
      </section>

      {/* JOURNEY PROGRESS BAR */}
      <section className="space-y-4">
        <h2 className="text-lg font-semibold text-white">Your Journey</h2>
        <div className="relative">
          {/* Progress line */}
          <div className="absolute top-6 left-0 right-0 h-1 bg-white/10 rounded-full">
            <div
              className="h-full bg-gradient-to-r from-[#00A8FF] to-[#0066FF] rounded-full transition-all duration-500"
              style={{ width: `${(completedSteps / totalSteps) * 100}%` }}
            />
          </div>

          {/* Steps */}
          <div className="relative flex justify-between">
            {JOURNEY_STEPS.map((step, index) => {
              const isComplete = journeyProgress[step.id as keyof typeof journeyProgress]
              const isNext = step.id === firstIncompleteStep?.id
              const Icon = step.icon

              return (
                <Link
                  key={step.id}
                  href={step.href}
                  className={cn(
                    "flex flex-col items-center gap-2 group transition-all",
                    isComplete ? "opacity-100" : isNext ? "opacity-100" : "opacity-40",
                  )}
                >
                  <div
                    className={cn(
                      "h-12 w-12 rounded-full flex items-center justify-center transition-all",
                      isComplete
                        ? "bg-[#00A8FF] text-white shadow-lg shadow-[#00A8FF]/30"
                        : isNext
                          ? "bg-white/10 text-[#00A8FF] border-2 border-[#00A8FF] animate-pulse"
                          : "bg-white/5 text-white/40 border border-white/10",
                    )}
                  >
                    {isComplete ? <CheckCircle2 className="h-6 w-6" /> : <Icon className="h-5 w-5" />}
                  </div>
                  <span
                    className={cn(
                      "text-xs text-center max-w-[80px] hidden md:block",
                      isComplete ? "text-white" : isNext ? "text-[#00A8FF]" : "text-white/40",
                    )}
                  >
                    {step.label}
                  </span>
                </Link>
              )
            })}
          </div>
        </div>

        {/* Next step CTA */}
        {firstIncompleteStep && (
          <div className="flex items-center justify-center gap-3 pt-4">
            <span className="text-white/60 text-sm">Next Step: {firstIncompleteStep.label}</span>
            <Button asChild size="sm" className="bg-[#00A8FF] hover:bg-[#00A8FF]/90 text-white">
              <Link href={firstIncompleteStep.href}>
                Start Now
                <ChevronRight className="h-4 w-4 ml-1" />
              </Link>
            </Button>
          </div>
        )}
      </section>

      {/* SMART QUICK ACTIONS */}
      <section className="space-y-4">
        <h2 className="text-lg font-semibold text-white">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {quickActions.map((action, index) => {
            const Icon = action.icon
            return (
              <Link key={index} href={action.href}>
                <Card className="group h-full border border-white/10 bg-white/5 hover:bg-white/10 hover:border-[#00A8FF]/50 transition-all duration-300 hover:scale-[1.02] hover:shadow-lg hover:shadow-[#00A8FF]/10 cursor-pointer">
                  <CardContent className="p-6 space-y-4">
                    <div className="flex items-start justify-between">
                      <div className="h-12 w-12 rounded-lg bg-[#00A8FF]/10 flex items-center justify-center border border-[#00A8FF]/20 group-hover:bg-[#00A8FF]/20 transition-colors">
                        <Icon className="h-6 w-6 text-[#00A8FF]" />
                      </div>
                      <span className="text-xs text-[#00A8FF] bg-[#00A8FF]/10 px-2 py-1 rounded-full">
                        {action.time}
                      </span>
                    </div>
                    <div>
                      <h3 className="font-semibold text-white group-hover:text-[#00A8FF] transition-colors">
                        {action.title}
                      </h3>
                      <p className="text-sm text-white/50 mt-1">{action.benefit}</p>
                    </div>
                    <div className="flex items-center text-[#00A8FF] text-sm font-medium opacity-0 group-hover:opacity-100 transition-opacity">
                      Get Started <ChevronRight className="h-4 w-4 ml-1" />
                    </div>
                  </CardContent>
                </Card>
              </Link>
            )
          })}
        </div>
      </section>

      {/* ACHIEVEMENT BADGES */}
      <section className="space-y-4">
        <h2 className="text-lg font-semibold text-white">Achievements</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {ACHIEVEMENTS.map((achievement) => {
            const isUnlocked = unlockedAchievements[achievement.id as keyof typeof unlockedAchievements]
            return (
              <div
                key={achievement.id}
                className={cn(
                  "relative p-4 rounded-xl border transition-all",
                  isUnlocked
                    ? "bg-gradient-to-br from-[#00A8FF]/20 to-transparent border-[#00A8FF]/30"
                    : "bg-white/5 border-white/10 opacity-50",
                )}
                title={isUnlocked ? "Unlocked!" : `Unlock by: ${achievement.action}`}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={cn(
                      "h-10 w-10 rounded-full flex items-center justify-center",
                      isUnlocked ? "bg-[#00A8FF]" : "bg-white/10",
                    )}
                  >
                    {isUnlocked ? (
                      <Trophy className="h-5 w-5 text-white" />
                    ) : (
                      <Lock className="h-4 w-4 text-white/40" />
                    )}
                  </div>
                  <span className={cn("text-xs font-medium", isUnlocked ? "text-white" : "text-white/40")}>
                    {achievement.label}
                  </span>
                </div>
                {isUnlocked && (
                  <div className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-[#00A8FF] flex items-center justify-center">
                    <CheckCircle2 className="h-3 w-3 text-white" />
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </section>

      {/* METRICS SNAPSHOT */}
      <section className="space-y-4">
        <h2 className="text-lg font-semibold text-white">Your Metrics</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {metrics.map((metric) => {
            const Icon = metric.icon
            return (
              <Link key={metric.label} href={metric.href}>
                <Card className="border border-white/10 bg-white/5 hover:bg-white/10 hover:border-[#00A8FF]/50 transition-all cursor-pointer">
                  <CardContent className="p-5">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-lg bg-[#00A8FF]/10 flex items-center justify-center">
                        <Icon className="h-5 w-5 text-[#00A8FF]" />
                      </div>
                      <div>
                        <div className="text-2xl font-bold text-white">{metric.value}</div>
                        <div className="text-xs text-white/50">{metric.label}</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            )
          })}
        </div>
      </section>

      {/* YOUR NEXT MOVE */}
      <section className="space-y-4">
        <h2 className="text-lg font-semibold text-white">Your Next Move</h2>
        <Card className="border border-[#00A8FF]/30 bg-gradient-to-r from-[#00A8FF]/10 to-transparent">
          <CardContent className="p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-full bg-[#00A8FF]/20 flex items-center justify-center">
                <Target className="h-6 w-6 text-[#00A8FF]" />
              </div>
              <div>
                <p className="text-sm text-white/60">Recommended Next Action</p>
                <p className="text-white font-medium">{nextRecommendation.text}</p>
              </div>
            </div>
            <Button asChild className="bg-[#00A8FF] hover:bg-[#00A8FF]/90 text-white shrink-0">
              <Link href={nextRecommendation.href}>
                Start Now
                <ChevronRight className="h-4 w-4 ml-1" />
              </Link>
            </Button>
          </CardContent>
        </Card>
      </section>

      {/* FOOTER CTA */}
      <section className="pt-8 border-t border-white/10">
        <div className="text-center space-y-6">
          <p className="text-white/60 text-lg italic">"Build momentum. One action at a time."</p>
          <div className="flex flex-wrap justify-center gap-3">
            <Button variant="outline" className="border-white/20 text-white hover:bg-white/10 bg-transparent" asChild>
              <Link href="/demo">
                <PlayCircle className="h-4 w-4 mr-2" />
                Start Guided Tour
              </Link>
            </Button>
            <Button variant="outline" className="border-white/20 text-white hover:bg-white/10 bg-transparent" asChild>
              <Link href="/revival/opportunities">
                <Target className="h-4 w-4 mr-2" />
                Browse Niches
              </Link>
            </Button>
            <Button className="bg-[#00A8FF] hover:bg-[#00A8FF]/90 text-white" asChild>
              <Link href="/prompt-generator">
                <Zap className="h-4 w-4 mr-2" />
                Create Android
              </Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  )
}
