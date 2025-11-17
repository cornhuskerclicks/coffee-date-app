import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  // Delete the session (cascade will delete messages)
  const { error } = await supabase.from("sessions").delete().eq("id", id).eq("user_id", user.id)

  if (error) {
    console.error("Error deleting session:", error)
    return NextResponse.json({ error: "Failed to delete session" }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
