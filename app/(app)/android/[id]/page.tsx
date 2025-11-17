import { createClient } from "@/lib/supabase/server"
import { redirect } from 'next/navigation'
import AndroidChat from "@/components/android-chat"

export default async function AndroidPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/login")
  }

  const { data: android, error } = await supabase
    .from("androids")
    .select("*")
    .eq("id", id)
    .eq("user_id", user.id)
    .single()

  if (error || !android) {
    redirect("/dashboard")
  }

  const { data: sessions } = await supabase
    .from("sessions")
    .select("*")
    .eq("android_id", id)
    .order("created_at", { ascending: false })

  return <AndroidChat android={android} sessions={sessions || []} userId={user.id} />
}
