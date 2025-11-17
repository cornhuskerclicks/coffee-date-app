import { Card, CardContent } from "@/components/ui/card"
import { ArrowUp, MessageSquare, Calendar, PlayCircle, Sparkles, Zap, TrendingUp } from 'lucide-react'
import Link from "next/link"
import Image from 'next/image'

const stats = [
  { label: "Leads Revived", value: "247", change: "+12%", icon: MessageSquare },
  { label: "Replies Generated", value: "1,432", change: "+18%", icon: Zap },
  { label: "Calls Booked", value: "89", change: "+24%", icon: Calendar },
  { label: "Demos Completed", value: "34", change: "+8%", icon: PlayCircle },
]

const activities = [
  { type: "revival", message: "Lead responded to revival campaign", time: "2 minutes ago" },
  { type: "demo", message: "Coffee Date Demo generated for TechCorp", time: "15 minutes ago" },
  { type: "quiz", message: "AI Readiness Quiz completed by client", time: "1 hour ago" },
  { type: "revival", message: "5 new leads added to revival campaign", time: "2 hours ago" },
  { type: "audit", message: "AI Audit generated for startup", time: "3 hours ago" },
]

const quickActions = [
  { label: "Start Coffee Date Demo", href: "/demo", icon: PlayCircle },
  { label: "Build AI Readiness Quiz", href: "/quiz", icon: Sparkles },
  { label: "GHL Dead Lead Accounts", href: "/revival", icon: TrendingUp },
  { label: "Generate AI Audit", href: "/audit", icon: MessageSquare },
]

export default function DashboardPage() {
  return (
    <div className="p-8 space-y-8 max-w-7xl mx-auto bg-black">
      <div className="flex items-center gap-4 pb-6 border-b border-white/10">
        <Image 
          src="/images/aether-logo.png" 
          alt="Aether" 
          width={48} 
          height={48}
        />
        <div className="space-y-1">
          <h1 className="text-[26px] font-semibold text-white">
            Welcome to Aether AI Lab
          </h1>
          <p className="text-[15px] text-white/60">Your AI agency platform for demos, lead revival, and client tools.</p>
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
        <h2 className="text-[18px] font-semibold text-white">Metrics</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {stats.map((stat) => {
            const Icon = stat.icon
            return (
              <Card key={stat.label} className="border border-white/10 bg-card">
                <CardContent className="p-6 space-y-3">
                  <div className="flex items-center justify-between">
                    <Icon className="h-5 w-5 text-primary" />
                    <span className="text-sm font-semibold text-emerald-400 flex items-center gap-1">
                      <ArrowUp className="h-3 w-3" />
                      {stat.change}
                    </span>
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

      <section className="space-y-4">
        <h2 className="text-[18px] font-semibold text-white">Recent Activity</h2>
        <Card className="border border-white/10 bg-card">
          <CardContent className="p-6">
            <div className="space-y-6">
              {activities.map((activity, index) => (
                <div key={index} className="flex items-start gap-4 pb-6 border-b border-white/10 last:border-0 last:pb-0">
                  <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 border border-primary/20">
                    <MessageSquare className="h-5 w-5 text-primary" />
                  </div>
                  <div className="flex-1 space-y-1">
                    <p className="font-medium text-[15px] text-white leading-relaxed">{activity.message}</p>
                    <p className="text-sm text-white/60">{activity.time}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </section>
    </div>
  )
}
