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
  FileText,
  Eye,
  Activity,
} from "lucide-react"
import Link from "next/link"
import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { cn } from "@/lib/utils"

// Journey steps configuration
const JOURNEY_STEPS = [
  { id: "ghl", label: "Connect GHL", href: "/revival", icon: MessageSquare, time: "5 min" },
  { id: "quiz", label: "Build AI Readiness Quiz", href: "/quiz/builder", icon: Sparkles, time: "10 min" },
  { id: "niches", label: "Browse Niches", href: "/revival/opportunities", icon: Target, time: "3 min" },
  { id: "android", label: "Create Android", href: "/prompt-generator", icon: Zap, time: "8 min" },
  { id: "campaign", label: "Launch Campaign", href: "/revival", icon: PlayCircle, time: "5 min" },
]

// Achievement badges configuration
const ACHIEVEMENTS = [
  { id: "first_ghl", label: "First GHL Account Connected", action: "Connect a GHL account", time: "5 min" },
  { id: "first_quiz", label: "First Quiz Built", action: "Create a quiz", time: "10 min" },
  { id: "first_niche", label: "First Niche Saved", action: "Save a niche to favourites", time: "2 min" },
  { id: "first_android", label: "First Android Created", action: "Create an Android", time: "8 min" },
  { id: "first_campaign", label: "First Campaign Launched", action: "Sync a GHL campaign", time: "5 min" },
  { id: "first_lead", label: "First Lead Revived", action: "Get a conversation response", time: "varies" },
  { id: "first_win", label: "First Client Win", action: "Mark a niche as Won", time: "varies" },
  { id: "streak_7", label: "7-Day Streak", action: "Log in for 7 consecutive days", time: "7 days" },
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
  const nichesViewedCount = nichesData?.length || 0

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
    streak_7: false,
  }

  // Get recommended next action
  const getNextRecommendation = () => {
    if (ghlCount === 0)
      return {
        text: "Connect a GHL account to start tracking revivals.",
        href: "/revival",
        benefit: "Start tracking dead lead revivals",
      }
    if (quizzesCount === 0)
      return {
        text: "Build an AI quiz to qualify leads automatically.",
        href: "/quiz/builder",
        benefit: "Qualify leads on autopilot",
      }
    if (favouritesCount === 0)
      return {
        text: "Browse niches to find client-ready opportunities.",
        href: "/revival/opportunities",
        benefit: "Find your next paying client",
      }
    if (androidsCount === 0)
      return {
        text: "Create an Android to power your demos.",
        href: "/prompt-generator",
        benefit: "Demo ready in minutes",
      }
    if (campaignsCount === 0)
      return {
        text: "Sync your first campaign to start revivals.",
        href: "/revival",
        benefit: "Automate your outreach",
      }
    return {
      text: "Keep building momentum. Explore more niches.",
      href: "/revival/opportunities",
      benefit: "Scale your agency",
    }
  }

  const nextRecommendation = getNextRecommendation()

  // Metrics for snapshot with descriptions
  const metrics = [
    {
      label: "GHL Accounts",
      value: ghlCount,
      desc: ghlCount > 0 ? "Connected and tracking" : "Connect to start",
      icon: MessageSquare,
      href: "/revival",
    },
    {
      label: "Quizzes Created",
      value: quizzesCount,
      desc: quizzesCount > 0 ? "Ready to qualify leads" : "Build your first quiz",
      icon: FileText,
      href: "/quiz",
    },
    {
      label: "AI Androids",
      value: androidsCount,
      desc: androidsCount > 0 ? "Demo ready to send" : "Create your first",
      icon: Zap,
      href: "/demo",
    },
    {
      label: "Favourite Niches",
      value: favouritesCount,
      desc: favouritesCount > 0 ? "Pipeline started" : "Pipeline starts here",
      icon: Star,
      href: "/revival/opportunities",
    },
  ]

  // Build recent activity feed
  const activityFeed = []
  if (androidsCount > 0)
    activityFeed.push({ icon: CheckCircle2, text: "Created first Android", color: "text-green-400" })
  if (ghlCount > 0) activityFeed.push({ icon: CheckCircle2, text: "Connected GHL", color: "text-green-400" })
  if (nichesViewedCount > 0)
    activityFeed.push({ icon: Eye, text: `Viewed ${nichesViewedCount} niches`, color: "text-blue-400" })
  if (quizzesCount > 0) activityFeed.push({ icon: CheckCircle2, text: "Built first quiz", color: "text-green-400" })
  if (activityFeed.length === 0)
    activityFeed.push({ icon: Activity, text: "No recent activity yet", color: "text-white/40" })

  return (
    <div className="min-h-screen bg-black">
      <div className="max-w-7xl mx-auto p-6 md:p-8 space-y-10">
        <div className="absolute inset-0 bg-gradient-to-b from-[#00A8FF]/5 to-transparent pointer-events-none" />

        {/* A) HEADER with sticky CTA */}
        <header className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 pb-6 border-b border-white/10 relative">
          <div className="flex items-center gap-4">
            <div className="relative">
              <div className="h-14 w-14 rounded-full bg-gradient-to-br from-[#00A8FF] to-[#0066FF] flex items-center justify-center text-white text-xl font-bold uppercase shadow-lg shadow-[#00A8FF]/20">
                {firstName[0]}
              </div>
              {completedSteps > 0 && (
                <div className="absolute -bottom-1 -right-1 h-5 w-5 rounded-full bg-[#00A8FF] flex items-center justify-center">
                  <Flame className="h-3 w-3 text-white" />
                </div>
              )}
            </div>
            <div className="flex items-center gap-3 text-sm text-white/50">
              <Clock className="h-4 w-4" />
              <span>Last login: Today</span>
            </div>
          </div>
          {firstIncompleteStep && (
            <Button asChild className="bg-[#00A8FF] hover:bg-[#00A8FF]/90 text-white shadow-lg shadow-[#00A8FF]/20">
              <Link href={firstIncompleteStep.href}>
                Continue Next Step
                <ChevronRight className="h-4 w-4 ml-1" />
              </Link>
            </Button>
          )}
        </header>

        {/* B) WELCOME BLOCK */}
        <section className="space-y-3">
          <h1 className="text-3xl md:text-4xl font-bold text-white">Welcome back, {firstName}</h1>
          <p className="text-white/60 text-lg">You're just a few steps away from unlocking your full potential.</p>
          <p className="text-[#00A8FF] text-sm font-medium">
            {completedSteps === 0
              ? "Users who complete the next step launch faster."
              : completedSteps < totalSteps
                ? `You're ahead of 82% of new users this week.`
                : "Amazing! You've mastered the platform."}
          </p>
        </section>

        {/* C) USER JOURNEY PROGRESS BAR */}
        <section className="space-y-6 bg-white/5 rounded-2xl p-6 border border-white/10">
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
              {JOURNEY_STEPS.map((step) => {
                const isComplete = journeyProgress[step.id as keyof typeof journeyProgress]
                const isNext = step.id === firstIncompleteStep?.id
                const Icon = step.icon

                return (
                  <Link
                    key={step.id}
                    href={step.href}
                    title={`${step.label} - ${step.time}`}
                    className={cn(
                      "flex flex-col items-center gap-2 group transition-all hover:scale-105",
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
                      {isComplete ? (
                        <CheckCircle2 className="h-6 w-6" />
                      ) : isNext ? (
                        <Icon className="h-5 w-5" />
                      ) : (
                        <Lock className="h-4 w-4" />
                      )}
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
            <div className="flex items-center justify-center gap-3 pt-4 border-t border-white/10">
              <span className="text-white/60 text-sm">
                Next Step: <span className="text-white font-medium">{firstIncompleteStep.label}</span>
              </span>
              <Button asChild size="sm" className="bg-[#00A8FF] hover:bg-[#00A8FF]/90 text-white">
                <Link href={firstIncompleteStep.href}>
                  Start Now
                  <ChevronRight className="h-4 w-4 ml-1" />
                </Link>
              </Button>
            </div>
          )}
        </section>

        {/* D) QUICK ACTIONS ROW */}
        <section className="space-y-4">
          <h2 className="text-lg font-semibold text-white">Quick Actions</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Browse Niches */}
            <Link href="/revival/opportunities">
              <Card className="group h-full border border-white/10 bg-white/5 hover:bg-white/10 hover:border-[#00A8FF]/50 transition-all duration-300 hover:scale-[1.02] hover:-translate-y-1 hover:shadow-lg hover:shadow-[#00A8FF]/10 cursor-pointer">
                <CardContent className="p-6 space-y-4">
                  <div className="flex items-start justify-between">
                    <div className="h-12 w-12 rounded-lg bg-[#00A8FF]/10 flex items-center justify-center border border-[#00A8FF]/20 group-hover:bg-[#00A8FF]/20 transition-colors">
                      <Target className="h-6 w-6 text-[#00A8FF]" />
                    </div>
                    <span className="text-xs text-[#00A8FF] bg-[#00A8FF]/10 px-2 py-1 rounded-full">3 min</span>
                  </div>
                  <div>
                    <h3 className="font-semibold text-white group-hover:text-[#00A8FF] transition-colors">
                      Browse Niches
                    </h3>
                    <p className="text-sm text-white/50 mt-1">Find client-ready opportunities</p>
                  </div>
                  <div className="flex items-center text-[#00A8FF] text-sm font-medium opacity-0 group-hover:opacity-100 transition-opacity">
                    Get Started <ChevronRight className="h-4 w-4 ml-1" />
                  </div>
                </CardContent>
              </Card>
            </Link>

            {/* Create Android */}
            <Link href="/prompt-generator">
              <Card className="group h-full border border-white/10 bg-white/5 hover:bg-white/10 hover:border-[#00A8FF]/50 transition-all duration-300 hover:scale-[1.02] hover:-translate-y-1 hover:shadow-lg hover:shadow-[#00A8FF]/10 cursor-pointer">
                <CardContent className="p-6 space-y-4">
                  <div className="flex items-start justify-between">
                    <div className="h-12 w-12 rounded-lg bg-[#00A8FF]/10 flex items-center justify-center border border-[#00A8FF]/20 group-hover:bg-[#00A8FF]/20 transition-colors">
                      <Zap className="h-6 w-6 text-[#00A8FF]" />
                    </div>
                    <span className="text-xs text-[#00A8FF] bg-[#00A8FF]/10 px-2 py-1 rounded-full">10 min</span>
                  </div>
                  <div>
                    <h3 className="font-semibold text-white group-hover:text-[#00A8FF] transition-colors">
                      Create Android
                    </h3>
                    <p className="text-sm text-white/50 mt-1">Build your first AI agent</p>
                  </div>
                  <div className="flex items-center text-[#00A8FF] text-sm font-medium opacity-0 group-hover:opacity-100 transition-opacity">
                    Get Started <ChevronRight className="h-4 w-4 ml-1" />
                  </div>
                </CardContent>
              </Card>
            </Link>

            {/* Start Coffee Date Demo */}
            <Link href="/demo">
              <Card className="group h-full border border-white/10 bg-white/5 hover:bg-white/10 hover:border-[#00A8FF]/50 transition-all duration-300 hover:scale-[1.02] hover:-translate-y-1 hover:shadow-lg hover:shadow-[#00A8FF]/10 cursor-pointer">
                <CardContent className="p-6 space-y-4">
                  <div className="flex items-start justify-between">
                    <div className="h-12 w-12 rounded-lg bg-[#00A8FF]/10 flex items-center justify-center border border-[#00A8FF]/20 group-hover:bg-[#00A8FF]/20 transition-colors">
                      <PlayCircle className="h-6 w-6 text-[#00A8FF]" />
                    </div>
                    <span className="text-xs text-[#00A8FF] bg-[#00A8FF]/10 px-2 py-1 rounded-full">2 min</span>
                  </div>
                  <div>
                    <h3 className="font-semibold text-white group-hover:text-[#00A8FF] transition-colors">
                      Start Coffee Date Demo
                    </h3>
                    <p className="text-sm text-white/50 mt-1">Test conversations instantly</p>
                  </div>
                  <div className="flex items-center text-[#00A8FF] text-sm font-medium opacity-0 group-hover:opacity-100 transition-opacity">
                    Get Started <ChevronRight className="h-4 w-4 ml-1" />
                  </div>
                </CardContent>
              </Card>
            </Link>
          </div>
        </section>

        {/* E) ACHIEVEMENTS SECTION */}
        <section className="space-y-4">
          <h2 className="text-lg font-semibold text-white">Achievements</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {ACHIEVEMENTS.map((achievement) => {
              const isUnlocked = unlockedAchievements[achievement.id as keyof typeof unlockedAchievements]
              return (
                <div
                  key={achievement.id}
                  className={cn(
                    "relative p-4 rounded-xl border transition-all group cursor-default",
                    isUnlocked
                      ? "bg-gradient-to-br from-[#00A8FF]/20 to-transparent border-[#00A8FF]/30 shadow-lg shadow-[#00A8FF]/10"
                      : "bg-white/5 border-white/10 opacity-60 hover:opacity-80",
                  )}
                  title={isUnlocked ? "Unlocked!" : `How to unlock: ${achievement.action} (~${achievement.time})`}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={cn(
                        "h-10 w-10 rounded-full flex items-center justify-center shrink-0",
                        isUnlocked ? "bg-[#00A8FF]" : "bg-white/10",
                      )}
                    >
                      {isUnlocked ? (
                        <Trophy className="h-5 w-5 text-white" />
                      ) : (
                        <Lock className="h-4 w-4 text-white/40" />
                      )}
                    </div>
                    <span
                      className={cn("text-xs font-medium leading-tight", isUnlocked ? "text-white" : "text-white/40")}
                    >
                      {achievement.label}
                    </span>
                  </div>
                  {isUnlocked && (
                    <div className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-[#00A8FF] flex items-center justify-center shadow-lg">
                      <CheckCircle2 className="h-3 w-3 text-white" />
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </section>

        {/* F) YOUR METRICS */}
        <section className="space-y-4">
          <h2 className="text-lg font-semibold text-white">Your Metrics</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {metrics.map((metric) => {
              const Icon = metric.icon
              return (
                <Link key={metric.label} href={metric.href}>
                  <Card className="border border-white/10 bg-white/5 hover:bg-white/10 hover:border-[#00A8FF]/50 transition-all cursor-pointer hover:scale-[1.02] hover:-translate-y-1">
                    <CardContent className="p-5">
                      <div className="flex items-start gap-3">
                        <div className="h-10 w-10 rounded-lg bg-[#00A8FF]/10 flex items-center justify-center shrink-0">
                          <Icon className="h-5 w-5 text-[#00A8FF]" />
                        </div>
                        <div className="min-w-0">
                          <div className="text-2xl font-bold text-white">{metric.value}</div>
                          <div className="text-xs text-white/50 truncate">{metric.label}</div>
                          <div className="text-xs text-white/30 mt-1 truncate">{metric.desc}</div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              )
            })}
          </div>
        </section>

        {/* G) ACTIVITY FEED */}
        <section className="space-y-4">
          <h2 className="text-lg font-semibold text-white">Recent Activity</h2>
          <Card className="border border-white/10 bg-white/5">
            <CardContent className="p-4 space-y-3">
              {activityFeed.slice(0, 3).map((item, index) => {
                const Icon = item.icon
                return (
                  <div key={index} className="flex items-center gap-3 text-sm">
                    <Icon className={cn("h-4 w-4 shrink-0", item.color)} />
                    <span className="text-white/70">{item.text}</span>
                  </div>
                )
              })}
            </CardContent>
          </Card>
        </section>

        {/* H) YOUR NEXT MOVE - Priority Card */}
        <section className="space-y-4">
          <h2 className="text-lg font-semibold text-white">Your Next Move</h2>
          <Card className="border-2 border-[#00A8FF]/50 bg-gradient-to-r from-[#00A8FF]/10 via-[#00A8FF]/5 to-transparent shadow-lg shadow-[#00A8FF]/10">
            <CardContent className="p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="h-14 w-14 rounded-full bg-[#00A8FF]/20 flex items-center justify-center border border-[#00A8FF]/30">
                  <Target className="h-7 w-7 text-[#00A8FF]" />
                </div>
                <div>
                  <p className="text-sm text-white/60">Recommended Next Action</p>
                  <p className="text-white font-medium text-lg">{nextRecommendation.text}</p>
                  <p className="text-[#00A8FF] text-sm mt-1">{nextRecommendation.benefit}</p>
                </div>
              </div>
              <Button
                asChild
                size="lg"
                className="bg-[#00A8FF] hover:bg-[#00A8FF]/90 text-white shrink-0 shadow-lg shadow-[#00A8FF]/20"
              >
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
    </div>
  )
}
