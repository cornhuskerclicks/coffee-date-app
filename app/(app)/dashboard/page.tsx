import { Card, CardContent } from "@/components/ui/card"
import { MessageSquare, PlayCircle, Sparkles, Zap, TrendingUp, Target } from "lucide-react"
import Link from "next/link"
import Image from "next/image"
import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"

const quickActions = [
  { label: "Start Coffee Date Demo", href: "/demo", icon: PlayCircle },
  { label: "Build AI Readiness Quiz", href: "/quiz", icon: Sparkles },
  { label: "GHL Dead Lead Accounts", href: "/revival", icon: TrendingUp },
  { label: "Browse Niches", href: "/revival/opportunities", icon: Target },
  { label: "Generate AI Audit", href: "/audit", icon: MessageSquare },
]

export default async function DashboardPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/login")
  }

  const { data: ghlConnections } = await supabase.from("ghl_connections").select("id").eq("user_id", user.id)

  const { data: demosData } = await supabase.from("sessions").select("id").eq("user_id", user.id)

  const { data: androidsData } = await supabase.from("androids").select("id").eq("user_id", user.id)

  const { data: quizzesData } = await supabase.from("quiz_templates").select("id").eq("user_id", user.id)

  // Calculate real stats
  const ghlAccountCount = ghlConnections?.length || 0
  const demosCount = demosData?.length || 0
  const androidsCount = androidsData?.length || 0
  const quizzesCount = quizzesData?.length || 0

  const { data: nichesData } = await supabase.from("niche_user_state").select("id, is_favourite").eq("user_id", user.id)

  const totalFavourites = nichesData?.filter((n) => n.is_favourite).length || 0

  const stats = [
    { label: "GHL Accounts", value: ghlAccountCount.toString(), icon: MessageSquare },
    { label: "Coffee Date Demos", value: demosCount.toString(), icon: PlayCircle },
    { label: "AI Androids", value: androidsCount.toString(), icon: Zap },
    { label: "Quizzes Created", value: quizzesCount.toString(), icon: Sparkles },
    { label: "Favourite Niches", value: totalFavourites.toString(), icon: Target },
  ]

  return (
    <div className="p-8 space-y-8 max-w-7xl mx-auto bg-black">
      <div className="flex items-center gap-4 pb-6 border-b border-white/10">
        <Image src="/images/aether-logo.png" alt="Aether" width={48} height={48} />
        <div className="space-y-1">
          <h1 className="text-[26px] font-semibold text-white">Welcome to Aether AI Lab</h1>
          <p className="text-[15px] text-white/60">
            Your AI agency platform for demos, lead revival, and client tools.
          </p>
        </div>
      </div>

      <section className="space-y-4">
        <h2 className="text-[18px] font-semibold text-white">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {quickActions.map((action) => {
            const Icon = action.icon
            return (
              <Link key={action.label} href={action.href}>
                <Card className="group hover:shadow-lg hover:shadow-primary/20 transition-all duration-200 hover:-translate-y-0.5 cursor-pointer border border-white/10 bg-card">
                  <CardContent className="p-6 space-y-4">
                    <div className="h-12 w-12 rounded-md bg-primary/10 flex items-center justify-center border border-primary/20">
                      <Icon className="h-6 w-6 text-primary" />
                    </div>
                    <h3 className="font-medium text-[15px] text-white group-hover:text-primary transition-colors">
                      {action.label}
                    </h3>
                  </CardContent>
                </Card>
              </Link>
            )
          })}
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-[18px] font-semibold text-white">Your Metrics</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {stats.map((stat) => {
            const Icon = stat.icon
            return (
              <Card key={stat.label} className="border border-white/10 bg-card">
                <CardContent className="p-6 space-y-3">
                  <div className="flex items-center justify-between">
                    <Icon className="h-5 w-5 text-primary" />
                  </div>
                  <div className="space-y-1">
                    <div className="text-[26px] font-semibold text-white">{stat.value}</div>
                    <div className="text-[15px] text-white/60">{stat.label}</div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      </section>

      {demosCount > 0 || ghlAccountCount > 0 || quizzesCount > 0 || totalFavourites > 0 ? (
        <section className="space-y-4">
          <h2 className="text-[18px] font-semibold text-white">Get Started</h2>
          <Card className="border border-white/10 bg-card">
            <CardContent className="p-8 text-center space-y-4">
              <Sparkles className="h-12 w-12 text-primary mx-auto" />
              <h3 className="text-[18px] font-semibold text-white">Welcome to Aether AI Lab</h3>
              <p className="text-[15px] text-white/60 max-w-md mx-auto">
                Get started by creating your first Coffee Date demo, connecting a GHL account, building an AI quiz for
                your clients, or exploring niches.
              </p>
              <div className="flex gap-3 justify-center pt-2">
                <Link href="/demo">
                  <button className="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary/90 transition-all">
                    Start Demo
                  </button>
                </Link>
                <Link href="/revival">
                  <button className="px-4 py-2 bg-white/5 text-white rounded-md hover:bg-white/10 border border-white/10 transition-all">
                    Connect GHL
                  </button>
                </Link>
                <Link href="/revival/opportunities">
                  <button className="px-4 py-2 bg-white/5 text-white rounded-md hover:bg-white/10 border border-white/10 transition-all">
                    Browse Niches
                  </button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </section>
      ) : (
        <section className="space-y-4">
          <h2 className="text-[18px] font-semibold text-white">Get Started</h2>
          <Card className="border border-white/10 bg-card">
            <CardContent className="p-8 text-center space-y-4">
              <Sparkles className="h-12 w-12 text-primary mx-auto" />
              <h3 className="text-[18px] font-semibold text-white">Welcome to Aether AI Lab</h3>
              <p className="text-[15px] text-white/60 max-w-md mx-auto">
                Get started by creating your first Coffee Date demo, connecting a GHL account, building an AI quiz for
                your clients, or exploring niches.
              </p>
              <div className="flex gap-3 justify-center pt-2">
                <Link href="/demo">
                  <button className="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary/90 transition-all">
                    Start Demo
                  </button>
                </Link>
                <Link href="/revival">
                  <button className="px-4 py-2 bg-white/5 text-white rounded-md hover:bg-white/10 border border-white/10 transition-all">
                    Connect GHL
                  </button>
                </Link>
                <Link href="/revival/opportunities">
                  <button className="px-4 py-2 bg-white/5 text-white rounded-md hover:bg-white/10 border border-white/10 transition-all">
                    Browse Niches
                  </button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </section>
      )}
    </div>
  )
}
