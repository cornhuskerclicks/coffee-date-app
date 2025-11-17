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
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Coffee Date Demo</h1>
          <p className="text-muted-foreground">
            Start an interactive AI demo session with your prospect
          </p>
        </div>
        <div className="flex gap-2">
          <Button asChild variant="outline">
            <Link href="/prompt-generator">
              <Plus className="h-4 w-4 mr-2" />
              Create Android
            </Link>
          </Button>
          <DemoStartButton androids={androids || []} />
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <Coffee className="h-8 w-8 text-primary mb-2" />
            <CardTitle>Interactive Demos</CardTitle>
            <CardDescription>
              Simulate real conversations with prospects using AI-powered androids
            </CardDescription>
          </CardHeader>
        </Card>

        <Card>
          <CardHeader>
            <Sparkles className="h-8 w-8 text-primary mb-2" />
            <CardTitle>SPIN Selling</CardTitle>
            <CardDescription>
              Powered by proven sales methodologies like SPIN Selling and The Challenger Sale
            </CardDescription>
          </CardHeader>
        </Card>

        <Card>
          <CardHeader>
            <Coffee className="h-8 w-8 text-primary mb-2" />
            <CardTitle>Save & Share</CardTitle>
            <CardDescription>
              Save demo sessions and share them with your team or prospects
            </CardDescription>
          </CardHeader>
        </Card>
      </div>

      {androids && androids.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Your Androids</CardTitle>
            <CardDescription>Select an android to start a demo session</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {androids.map((android) => {
                const companyName =
                  android.business_context?.company_name || android.business_context?.businessName || "My Business"
                const niche = android.business_context?.niche || android.business_context?.industry || "General"

                return (
                  <Card key={android.id} className="hover:border-primary transition-colors">
                    <CardHeader>
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <CardTitle className="text-lg">{android.name}</CardTitle>
                          <CardDescription>
                            {companyName} • {niche}
                          </CardDescription>
                        </div>
                        <DeleteAndroidButton androidId={android.id} androidName={android.name} />
                      </div>
                    </CardHeader>
                    <CardContent>
                      <Button asChild className="w-full">
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
        <Card>
          <CardHeader>
            <CardTitle>Saved Demo Sessions</CardTitle>
            <CardDescription>View and manage your previous demo conversations</CardDescription>
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
                    className="flex items-center justify-between p-4 rounded-lg border hover:border-primary/50 transition-colors"
                  >
                    <div className="flex items-start gap-3 flex-1">
                      <Calendar className="h-5 w-5 text-muted-foreground mt-0.5" />
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium truncate">
                          {session.title || "Untitled Session"}
                        </h4>
                        <p className="text-sm text-muted-foreground">
                          {androidName} — {companyName}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {new Date(session.created_at).toLocaleString()}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button asChild size="sm" variant="outline">
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
  )
}
