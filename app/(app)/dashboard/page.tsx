import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ArrowUp, MessageSquare, Calendar, PlayCircle } from 'lucide-react'
import Link from "next/link"

const stats = [
  { label: "Leads Revived", value: "247", change: "+12%", icon: MessageSquare },
  { label: "Replies Generated", value: "1,432", change: "+18%", icon: MessageSquare },
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
  { label: "Start a Demo", href: "/demo", color: "bg-primary" },
  { label: "Build a Quiz", href: "/quiz", color: "bg-secondary" },
  { label: "Upload Leads", href: "/revival", color: "bg-primary" },
  { label: "Generate an Audit", href: "/audit", color: "bg-secondary" },
]

export default function DashboardPage() {
  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground">Welcome back! Here's what's happening.</p>
      </div>

      <section>
        <h2 className="text-xl font-semibold mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {quickActions.map((action) => (
            <Link key={action.label} href={action.href}>
              <Card className="hover:shadow-lg transition-shadow cursor-pointer">
                <CardContent className="p-6">
                  <div className={`h-12 w-12 rounded-lg ${action.color} flex items-center justify-center mb-4`}>
                    <PlayCircle className="h-6 w-6 text-white" />
                  </div>
                  <h3 className="font-semibold">{action.label}</h3>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </section>

      <section>
        <h2 className="text-xl font-semibold mb-4">Metrics</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {stats.map((stat) => {
            const Icon = stat.icon
            return (
              <Card key={stat.label}>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-2">
                    <Icon className="h-5 w-5 text-muted-foreground" />
                    <span className="text-sm font-medium text-green-600 flex items-center gap-1">
                      <ArrowUp className="h-3 w-3" />
                      {stat.change}
                    </span>
                  </div>
                  <div className="text-3xl font-bold">{stat.value}</div>
                  <div className="text-sm text-muted-foreground">{stat.label}</div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      </section>

      <section>
        <h2 className="text-xl font-semibold mb-4">Activity Feed</h2>
        <Card>
          <CardContent className="p-6">
            <div className="space-y-4">
              {activities.map((activity, index) => (
                <div key={index} className="flex items-start gap-4 pb-4 border-b last:border-0 last:pb-0">
                  <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <MessageSquare className="h-5 w-5 text-primary" />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium">{activity.message}</p>
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
