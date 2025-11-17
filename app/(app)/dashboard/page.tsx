import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ArrowUp, MessageSquare, Calendar, PlayCircle, Sparkles, Zap, TrendingUp } from 'lucide-react'
import Link from "next/link"

const stats = [
  { label: "Leads Revived", value: "247", change: "+12%", icon: MessageSquare, color: "text-primary" },
  { label: "Replies Generated", value: "1,432", change: "+18%", icon: Zap, color: "text-secondary" },
  { label: "Calls Booked", value: "89", change: "+24%", icon: Calendar, color: "text-primary" },
  { label: "Demos Completed", value: "34", change: "+8%", icon: PlayCircle, color: "text-secondary" },
]

const activities = [
  { type: "revival", message: "Lead responded to revival campaign", time: "2 minutes ago" },
  { type: "demo", message: "Coffee Date Demo generated for TechCorp", time: "15 minutes ago" },
  { type: "quiz", message: "AI Readiness Quiz completed by client", time: "1 hour ago" },
  { type: "revival", message: "5 new leads added to revival campaign", time: "2 hours ago" },
  { type: "audit", message: "AI Audit generated for startup", time: "3 hours ago" },
]

const quickActions = [
  { label: "Start Coffee Date Demo", href: "/demo", icon: PlayCircle, gradient: "from-primary to-primary/80" },
  { label: "Build AI Readiness Quiz", href: "/quiz", icon: Sparkles, gradient: "from-secondary to-secondary/80" },
  { label: "Upload Dead Leads", href: "/revival", icon: TrendingUp, gradient: "from-primary to-secondary" },
  { label: "Generate AI Audit", href: "/audit", icon: MessageSquare, gradient: "from-secondary to-primary" },
]

export default function DashboardPage() {
  return (
    <div className="p-6 space-y-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="space-y-2">
        <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
          Dashboard
        </h1>
        <p className="text-muted-foreground text-lg">Welcome back! Here's what's happening with your AI tools.</p>
      </div>

      {/* Quick Actions */}
      <section className="space-y-4">
        <h2 className="text-2xl font-semibold">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {quickActions.map((action) => {
            const Icon = action.icon
            return (
              <Link key={action.label} href={action.href}>
                <Card className="group hover:shadow-lg hover:shadow-primary/20 transition-all duration-300 hover:-translate-y-1 cursor-pointer border-border/50 hover:border-primary/50">
                  <CardContent className="p-6 space-y-4">
                    <div className={`h-14 w-14 rounded-xl bg-gradient-to-br ${action.gradient} flex items-center justify-center shadow-lg`}>
                      <Icon className="h-7 w-7 text-white" />
                    </div>
                    <h3 className="font-semibold text-lg group-hover:text-primary transition-colors">
                      {action.label}
                    </h3>
                  </CardContent>
                </Card>
              </Link>
            )
          })}
        </div>
      </section>

      {/* Metrics */}
      <section className="space-y-4">
        <h2 className="text-2xl font-semibold">Metrics</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {stats.map((stat) => {
            const Icon = stat.icon
            return (
              <Card key={stat.label} className="border-border/50 hover:border-primary/30 transition-colors">
                <CardContent className="p-6 space-y-3">
                  <div className="flex items-center justify-between">
                    <Icon className={`h-5 w-5 ${stat.color}`} />
                    <span className="text-sm font-semibold text-emerald-500 flex items-center gap-1">
                      <ArrowUp className="h-3 w-3" />
                      {stat.change}
                    </span>
                  </div>
                  <div className="space-y-1">
                    <div className="text-3xl font-bold">{stat.value}</div>
                    <div className="text-sm text-muted-foreground">{stat.label}</div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      </section>

      {/* Activity Feed */}
      <section className="space-y-4">
        <h2 className="text-2xl font-semibold">Recent Activity</h2>
        <Card className="border-border/50">
          <CardContent className="p-6">
            <div className="space-y-6">
              {activities.map((activity, index) => (
                <div key={index} className="flex items-start gap-4 pb-6 border-b border-border/50 last:border-0 last:pb-0">
                  <div className="h-10 w-10 rounded-full bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center flex-shrink-0">
                    <MessageSquare className="h-5 w-5 text-primary" />
                  </div>
                  <div className="flex-1 space-y-1">
                    <p className="font-medium leading-relaxed">{activity.message}</p>
                    <p className="text-sm text-muted-foreground">{activity.time}</p>
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
