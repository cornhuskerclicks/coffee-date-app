import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Coffee, Sparkles, Plus, Pencil, BarChart3, Clock, Users, Target } from "lucide-react"
import DemoStartButton from "@/components/demo-start-button"
import Link from "next/link"
import DeleteAndroidButton from "@/components/delete-android-button"
import LogDemoButton from "@/components/log-demo-button"
import DemoModeCards from "@/components/demo-mode-cards"

export default async function DemoPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/login")
  }

  // Fetch androids
  const { data: androids, error } = await supabase
    .from("androids")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })

  if (error) {
    console.error("Error fetching androids:", error)
  }

  // Fetch demo logs for accurate counting
  const { data: demoLogs, error: logsError } = await supabase
    .from("demo_logs")
    .select(`
      *,
      androids (id, name),
      niches (id, niche_name)
    `)
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })

  if (logsError) {
    console.error("Error fetching demo logs:", logsError)
  }

  // Calculate stats from demo_logs
  const allLogs = demoLogs || []
  const totalDemos = allLogs.length
  const clientDemos = allLogs.filter((log) => log.type === "client").length
  const testSessions = allLogs.filter((log) => log.type === "test").length
  const lastDemoLog = allLogs[0]

  // Per-android counts
  const androidDemoCounts: Record<string, { total: number; client: number; test: number }> = {}
  allLogs.forEach((log) => {
    const aid = log.android_id
    if (!androidDemoCounts[aid]) {
      androidDemoCounts[aid] = { total: 0, client: 0, test: 0 }
    }
    androidDemoCounts[aid].total++
    if (log.type === "client") {
      androidDemoCounts[aid].client++
    } else {
      androidDemoCounts[aid].test++
    }
  })

  // Recent client demos (last 5)
  const recentClientDemos = allLogs.filter((log) => log.type === "client").slice(0, 5)

  // Format last demo display
  const formatLastDemo = () => {
    if (!lastDemoLog) return "No demos yet"
    const date = new Date(lastDemoLog.created_at)
    const android = lastDemoLog.androids as any
    const niche = lastDemoLog.niches as any
    const type = lastDemoLog.type === "client" ? "Client" : "Test"
    const name = lastDemoLog.type === "client" && niche?.niche_name ? niche.niche_name : android?.name || "Unknown"

    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
    const diffDays = Math.floor(diffHours / 24)

    let timeAgo = ""
    if (diffDays > 0) {
      timeAgo = `${diffDays}d ago`
    } else if (diffHours > 0) {
      timeAgo = `${diffHours}h ago`
    } else {
      timeAgo = "Just now"
    }

    return `${type} · ${name.substring(0, 20)} · ${timeAgo}`
  }

  return (
    <div className="bg-black min-h-screen">
      <div className="p-8 space-y-8 max-w-7xl mx-auto">
        {/* Header */}
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
            <DemoModeCards />

            {/* Your Androids Section */}
            <div>
              <h2 className="text-lg font-semibold text-white mb-4">Your Androids</h2>

              {!androids || androids.length === 0 ? (
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
                <div className="space-y-3">
                  {androids.map((android) => {
                    const companyName =
                      android.business_context?.company_name || android.business_context?.businessName || "My Business"
                    const niche = android.business_context?.niche || android.business_context?.industry || "General"
                    const counts = androidDemoCounts[android.id] || { total: 0, client: 0, test: 0 }

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
                              <div className="flex items-center gap-3 mt-2 text-xs text-white/40">
                                <span>{counts.total} demos</span>
                                <span className="text-[#00A8FF]">{counts.client} client</span>
                                <span>{counts.test} test</span>
                              </div>
                            </div>

                            {/* Action Icons */}
                            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                              <LogDemoButton androidId={android.id} androidName={android.name} />
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
                    <p className="text-xs font-medium text-white leading-tight">{formatLastDemo()}</p>
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
                    No client demos logged yet. Run a live demo and classify it as a client session to see it here.
                  </p>
                ) : (
                  <div className="space-y-2">
                    {recentClientDemos.map((log) => {
                      const android = log.androids as any
                      const niche = log.niches as any
                      const androidName = android?.name || "Unknown"
                      const nicheName = niche?.niche_name || log.niche_name || "Other"
                      const date = new Date(log.created_at)

                      return (
                        <div
                          key={log.id}
                          className="flex items-center justify-between p-3 rounded-lg bg-white/5 hover:bg-white/10 transition-colors"
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-[#00A8FF]/10 flex items-center justify-center">
                              <Coffee className="h-4 w-4 text-[#00A8FF]" />
                            </div>
                            <div>
                              <p className="text-sm font-medium text-white">{androidName}</p>
                              <p className="text-xs text-white/50">{nicheName}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-white/40">
                              {date.toLocaleDateString("en-US", {
                                month: "short",
                                day: "numeric",
                              })}
                            </span>
                            <span className="text-[10px] font-medium text-[#00A8FF] bg-[#00A8FF]/10 px-2 py-1 rounded-full">
                              Client
                            </span>
                          </div>
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
      </div>
    </div>
  )
}
