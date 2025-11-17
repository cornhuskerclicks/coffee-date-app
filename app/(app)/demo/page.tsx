import { createClient } from "@/lib/supabase/server"
import { redirect } from 'next/navigation'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Coffee, Sparkles, Plus, Trash2, Calendar } from 'lucide-react'
import DemoStartButton from "@/components/demo-start-button"
import Link from "next/link"
import DeleteDemoButton from "@/components/delete-demo-button"
import DeleteAndroidButton from "@/components/delete-android-button"

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

  return (
    <div className="bg-black min-h-screen">
      <div className="p-8 space-y-6 max-w-7xl mx-auto">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-[32px] font-bold text-white">Coffee Date Demo</h1>
            <p className="text-white/60 text-[16px]">
              Start an interactive AI demo session with your prospect
            </p>
          </div>
          <div className="flex gap-2">
            <Button asChild variant="outline" className="border-white/10 text-white hover:bg-white/10">
              <Link href="/prompt-generator">
                <Plus className="h-4 w-4 mr-2" />
                Create Android
              </Link>
            </Button>
            <DemoStartButton androids={androids || []} />
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <Card className="border border-white/10 bg-white/5">
            <CardHeader>
              <Coffee className="h-8 w-8 text-[#00A8FF] mb-2" />
              <CardTitle className="text-white">Interactive Demos</CardTitle>
              <CardDescription className="text-white/60">
                Simulate real conversations with prospects using AI-powered androids
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="border border-white/10 bg-white/5">
            <CardHeader>
              <Sparkles className="h-8 w-8 text-[#00A8FF] mb-2" />
              <CardTitle className="text-white">SPIN Selling</CardTitle>
              <CardDescription className="text-white/60">
                Powered by proven sales methodologies like SPIN Selling and The Challenger Sale
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="border border-white/10 bg-white/5">
            <CardHeader>
              <Coffee className="h-8 w-8 text-[#00A8FF] mb-2" />
              <CardTitle className="text-white">Save & Share</CardTitle>
              <CardDescription className="text-white/60">
                Save demo sessions and share them with your team or prospects
              </CardDescription>
            </CardHeader>
          </Card>
        </div>

        {androids && androids.length > 0 && (
          <Card className="border border-white/10 bg-white/5">
            <CardHeader>
              <CardTitle className="text-white">Your Androids</CardTitle>
              <CardDescription className="text-white/60">Select an android to start a demo session</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {androids.map((android) => {
                  const companyName =
                    android.business_context?.company_name || android.business_context?.businessName || "My Business"
                  const niche = android.business_context?.niche || android.business_context?.industry || "General"

                  return (
                    <Card key={android.id} className="border border-white/10 bg-white/5 hover:bg-white/10 hover:border-[#00A8FF]/50 transition-all">
                      <CardHeader>
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            <CardTitle className="text-lg text-white">{android.name}</CardTitle>
                            <CardDescription className="text-white/60">
                              {companyName} • {niche}
                            </CardDescription>
                          </div>
                          <DeleteAndroidButton androidId={android.id} androidName={android.name} />
                        </div>
                      </CardHeader>
                      <CardContent>
                        <Button asChild className="w-full bg-[#00A8FF] text-white hover:bg-[#00A8FF]/90">
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
            </CardContent>
          </Card>
        )}

        {sessions && sessions.length > 0 && (
          <Card className="border border-white/10 bg-white/5">
            <CardHeader>
              <CardTitle className="text-white">Saved Demo Sessions</CardTitle>
              <CardDescription className="text-white/60">View and manage your previous demo conversations</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {sessions.map((session) => {
                  const android = session.androids as any
                  const companyName = android?.business_context?.company_name || android?.business_context?.businessName || "Unknown"
                  const androidName = android?.name || "Unknown Android"
                  
                  return (
                    <div
                      key={session.id}
                      className="flex items-center justify-between p-4 rounded-lg border border-white/10 bg-white/5 hover:bg-white/10 hover:border-[#00A8FF]/50 transition-all"
                    >
                      <div className="flex items-start gap-3 flex-1">
                        <Calendar className="h-5 w-5 text-[#00A8FF] mt-0.5" />
                        <div className="flex-1 min-w-0">
                          <h4 className="font-medium truncate text-white">
                            {session.title || "Untitled Session"}
                          </h4>
                          <p className="text-sm text-white/60">
                            {androidName} — {companyName}
                          </p>
                          <p className="text-xs text-white/50 mt-1">
                            {new Date(session.created_at).toLocaleString()}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button asChild size="sm" variant="outline" className="border-white/10 text-white hover:bg-white/10">
                          <Link href={`/demo/${session.android_id}`}>
                            View
                          </Link>
                        </Button>
                        <DeleteDemoButton sessionId={session.id} />
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
