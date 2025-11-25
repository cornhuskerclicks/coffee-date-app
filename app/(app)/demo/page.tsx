import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Coffee, Sparkles, Share2, Plus, Calendar, Pencil, BarChart3, Clock, Users, Target } from "lucide-react"
import DemoStartButton from "@/components/demo-start-button"
import Link from "next/link"
import DeleteAndroidButton from "@/components/delete-android-button"
import MarkDemoCompleteButton from "@/components/mark-demo-complete-button"

export default async function DemoPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/login")
  }

  const { data: androids, error } = await supabase
    .from("androids")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })

  if (error) {
    console.error("Error fetching androids:", error)
  }

  const { data: sessions, error: sessionsError } = await supabase
    .from("sessions")
    .select(`
      *,
      androids (
        id,
        name,
        business_context
      )
    `)
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })

  if (sessionsError) {
    console.error("Error fetching sessions:", sessionsError)
  }

  const totalDemos = sessions?.length || 0
  const clientDemos = sessions?.filter((s) => s.status === "completed")?.length || 0
  const testSessions = totalDemos - clientDemos
  const lastDemo = sessions?.[0]?.created_at ? new Date(sessions[0].created_at) : null

  const androidSessionCounts: Record<string, number> = {}
  const androidClientCounts: Record<string, number> = {}
  sessions?.forEach((session) => {
    const aid = session.android_id
    androidSessionCounts[aid] = (androidSessionCounts[aid] || 0) + 1
    if (session.status === "completed") {
      androidClientCounts[aid] = (androidClientCounts[aid] || 0) + 1
    }
  })

  const recentClientDemos = sessions?.filter((s) => s.status === "completed")?.slice(0, 5) || []

  // Demo modes data
  const demoModes = [
    {
      id: "interactive",
      icon: Coffee,
      title: "Interactive Demos",
      description: "Live AI-powered conversations with prospects",
      isDefault: true,
    },
    {
      id: "spin",
      icon: Sparkles,
      title: "SPIN Selling",
      description: "Guided by proven sales methodologies",
      isDefault: false,
    },
    {
      id: "save",
      icon: Share2,
      title: "Save & Share",
      description: "Record and share demos with your team",
      isDefault: false,
    },
  ]

  return (
    <div className="bg-black min-h-screen">
      <div className="p-8 space-y-8 max-w-7xl mx-auto">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-[32px] font-bold text-white">Coffee Date Demo</h1>
            <p className="text-white/60 text-[16px]">
              Start interactive AI demos with your prospects and track real client sessions.
            </p>
          </div>
          <div className="flex gap-3">
            <Button asChild variant="outline" className="border-white/20 text-white hover:bg-white/10 bg-transparent">
              <Link href="/prompt-generator">
                <Plus className="h-4 w-4 mr-2" />
                Create Android
              </Link>
            </Button>
            <DemoStartButton androids={androids || []} />
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Left Column - Androids & Modes (55-60%) */}
          <div className="lg:col-span-7 space-y-6">
            {/* Demo Modes Row */}
            <div>
              <h2 className="text-lg font-semibold text-white mb-4">Demo Modes</h2>
              <div className="grid grid-cols-3 gap-4">
                {demoModes.map((mode) => (
                  <Card
                    key={mode.id}
                    className={`border bg-white/5 hover:bg-white/10 hover:border-[#00A8FF]/50 transition-all cursor-pointer ${
                      mode.isDefault ? "border-[#00A8FF]/50 bg-[#00A8FF]/5" : "border-white/10"
                    }`}
                  >
                    <CardHeader className="pb-2">
                      <div className="flex items-center gap-2">
                        <mode.icon className={`h-5 w-5 ${mode.isDefault ? "text-[#00A8FF]" : "text-white/60"}`} />
                        {mode.isDefault && (
                          <span className="text-[10px] font-medium text-[#00A8FF] bg-[#00A8FF]/10 px-2 py-0.5 rounded-full">
                            DEFAULT
                          </span>
                        )}
                      </div>
                      <CardTitle className="text-sm text-white">{mode.title}</CardTitle>
                      <CardDescription className="text-xs text-white/50">{mode.description}</CardDescription>
                    </CardHeader>
                  </Card>
                ))}
              </div>
            </div>

            {/* Your Androids Section */}
            <div>
              <h2 className="text-lg font-semibold text-white mb-4">Your Androids</h2>

              {!androids || androids.length === 0 ? (
                /* Empty State */
                <Card className="border border-white/10 bg-white/5">
                  <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                    <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mb-4">
                      <Coffee className="h-8 w-8 text-white/30" />
                    </div>
                    <p className="text-white/60 mb-4">You have no Androids yet.</p>
                    <Button asChild className="bg-[#00A8FF] text-white hover:bg-[#00A8FF]/90">
                      <Link href="/prompt-generator">
                        <Plus className="h-4 w-4 mr-2" />
                        Create your first Android
                      </Link>
                    </Button>
                  </CardContent>
                </Card>
              ) : (
                /* Androids List */
                <div className="space-y-3">
                  {androids.map((android) => {
                    const companyName =
                      android.business_context?.company_name || android.business_context?.businessName || "My Business"
                    const niche = android.business_context?.niche || android.business_context?.industry || "General"
                    const sessionCount = androidSessionCounts[android.id] || 0
                    const clientCount = androidClientCounts[android.id] || 0

                    return (
                      <Card
                        key={android.id}
                        className="border border-white/10 bg-white/5 hover:bg-white/10 hover:border-[#00A8FF]/30 transition-all group"
                      >
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <h3 className="font-semibold text-white truncate">{android.name}</h3>
                                <span className="text-[10px] font-medium text-emerald-400 bg-emerald-400/10 px-2 py-0.5 rounded-full">
                                  Active
                                </span>
                              </div>
                              <p className="text-sm text-white/50 truncate">
                                {companyName} • {niche}
                              </p>
                              <div className="flex items-center gap-4 mt-2 text-xs text-white/40">
                                <span>{sessionCount} demos</span>
                                <span>{clientCount} client</span>
                              </div>
                            </div>

                            {/* Action Icons */}
                            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                              <Button
                                asChild
                                size="icon"
                                variant="ghost"
                                className="h-8 w-8 text-white/40 hover:text-white hover:bg-white/10"
                              >
                                <Link href="/prompt-generator">
                                  <Pencil className="h-4 w-4" />
                                </Link>
                              </Button>
                              <DeleteAndroidButton androidId={android.id} androidName={android.name} />
                            </div>
                          </div>

                          {/* Start Demo Button */}
                          <Button asChild className="w-full mt-4 bg-[#00A8FF] text-white hover:bg-[#00A8FF]/90">
                            <Link href={`/demo/${android.id}`}>
                              <Coffee className="h-4 w-4 mr-2" />
                              Start Demo
                            </Link>
                          </Button>
                        </CardContent>
                      </Card>
                    )
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Right Column - Demo Overview & History (40-45%) */}
          <div className="lg:col-span-5 space-y-6">
            {/* Demo Overview Card */}
            <Card className="border border-white/10 bg-white/5">
              <CardHeader className="pb-4">
                <CardTitle className="text-white flex items-center gap-2">
                  <BarChart3 className="h-5 w-5 text-[#00A8FF]" />
                  Demo Overview
                </CardTitle>
                <CardDescription className="text-white/50">Your demo activity and performance</CardDescription>
              </CardHeader>
              <CardContent>
                {/* Metrics Row */}
                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div className="p-3 rounded-lg bg-white/5 border border-white/10">
                    <div className="flex items-center gap-2 text-white/50 text-xs mb-1">
                      <Target className="h-3 w-3" />
                      Total Demos
                    </div>
                    <p className="text-2xl font-bold text-white">{totalDemos}</p>
                  </div>
                  <div className="p-3 rounded-lg bg-white/5 border border-white/10">
                    <div className="flex items-center gap-2 text-white/50 text-xs mb-1">
                      <Users className="h-3 w-3" />
                      Client Demos
                    </div>
                    <p className="text-2xl font-bold text-[#00A8FF]">{clientDemos}</p>
                  </div>
                  <div className="p-3 rounded-lg bg-white/5 border border-white/10">
                    <div className="flex items-center gap-2 text-white/50 text-xs mb-1">
                      <Coffee className="h-3 w-3" />
                      Test Sessions
                    </div>
                    <p className="text-2xl font-bold text-white">{testSessions}</p>
                  </div>
                  <div className="p-3 rounded-lg bg-white/5 border border-white/10">
                    <div className="flex items-center gap-2 text-white/50 text-xs mb-1">
                      <Clock className="h-3 w-3" />
                      Last Demo
                    </div>
                    <p className="text-sm font-medium text-white">
                      {lastDemo
                        ? lastDemo.toLocaleDateString("en-US", { month: "short", day: "numeric" })
                        : "No demos yet"}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Recent Client Demos */}
            <Card className="border border-white/10 bg-white/5">
              <CardHeader className="pb-4">
                <CardTitle className="text-white text-base">Recent Client Demos</CardTitle>
              </CardHeader>
              <CardContent>
                {recentClientDemos.length === 0 ? (
                  <p className="text-sm text-white/50 text-center py-6">
                    No client demos logged yet. Run a live demo and mark it as a client session to see it here.
                  </p>
                ) : (
                  <div className="space-y-2">
                    {recentClientDemos.map((session) => {
                      const android = session.androids as any
                      const androidName = android?.name || "Unknown"
                      const date = new Date(session.created_at)

                      return (
                        <div
                          key={session.id}
                          className="flex items-center justify-between p-3 rounded-lg bg-white/5 hover:bg-white/10 transition-colors"
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-[#00A8FF]/10 flex items-center justify-center">
                              <Coffee className="h-4 w-4 text-[#00A8FF]" />
                            </div>
                            <div>
                              <p className="text-sm font-medium text-white">{androidName}</p>
                              <p className="text-xs text-white/50">
                                {date.toLocaleDateString("en-US", {
                                  month: "short",
                                  day: "numeric",
                                  year: "numeric",
                                })}
                              </p>
                            </div>
                          </div>
                          <span className="text-[10px] font-medium text-emerald-400 bg-emerald-400/10 px-2 py-1 rounded-full">
                            Completed
                          </span>
                        </div>
                      )
                    })}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Prompt Generator Quick Link */}
            <Card className="border border-white/10 bg-gradient-to-br from-[#00A8FF]/10 to-transparent">
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-lg bg-[#00A8FF]/20 flex items-center justify-center shrink-0">
                    <Sparkles className="h-5 w-5 text-[#00A8FF]" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-white mb-1">Prompt Generator</h3>
                    <p className="text-sm text-white/50 mb-3">
                      Create or refine your Android's prompt to improve future demos.
                    </p>
                    <Button
                      asChild
                      variant="outline"
                      size="sm"
                      className="border-[#00A8FF]/50 text-[#00A8FF] hover:bg-[#00A8FF]/10 bg-transparent"
                    >
                      <Link href="/prompt-generator">Open Prompt Generator</Link>
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Saved Demo Sessions - Full Width Below */}
        {sessions && sessions.length > 0 && (
          <Card className="border border-white/10 bg-white/5">
            <CardHeader>
              <CardTitle className="text-white">Saved Demo Sessions</CardTitle>
              <CardDescription className="text-white/50">
                View and manage your previous demo conversations
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {sessions.slice(0, 10).map((session) => {
                  const android = session.androids as any
                  const companyName =
                    android?.business_context?.company_name || android?.business_context?.businessName || "Unknown"
                  const androidName = android?.name || "Unknown Android"

                  return (
                    <div
                      key={session.id}
                      className="flex items-center justify-between p-4 rounded-lg border border-white/10 bg-white/5 hover:bg-white/10 hover:border-[#00A8FF]/30 transition-all"
                    >
                      <div className="flex items-start gap-3 flex-1">
                        <Calendar className="h-5 w-5 text-[#00A8FF] mt-0.5" />
                        <div className="flex-1 min-w-0">
                          <h4 className="font-medium truncate text-white">{session.title || "Untitled Session"}</h4>
                          <p className="text-sm text-white/50">
                            {androidName} — {companyName}
                          </p>
                          <p className="text-xs text-white/40 mt-1">{new Date(session.created_at).toLocaleString()}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {session.status === "completed" && (
                          <span className="text-[10px] font-medium text-emerald-400 bg-emerald-400/10 px-2 py-1 rounded-full mr-2">
                            Client Demo
                          </span>
                        )}
                        <MarkDemoCompleteButton sessionId={session.id} />
                        <Button
                          asChild
                          size="sm"
                          variant="outline"
                          className="border-white/20 text-white hover:bg-white/10 bg-transparent"
                        >
                          <Link href={`/demo/${session.android_id}`}>View</Link>
                        </Button>
                      </div>
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
