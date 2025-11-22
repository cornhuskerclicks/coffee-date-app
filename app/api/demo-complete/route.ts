import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function POST(request: Request) {
  try {
    const supabase = await createClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { sessionId, nicheId, nicheName } = body

    if (!sessionId) {
      return NextResponse.json({ error: "Session ID is required" }, { status: 400 })
    }

    // If nicheId is provided, update the niche_user_state
    if (nicheId) {
      // First, check if the niche_user_state exists for this user and niche
      const { data: existingState } = await supabase
        .from("niche_user_state")
        .select("id, status")
        .eq("niche_id", nicheId)
        .eq("user_id", user.id)
        .single()

      if (existingState) {
        // Update existing niche_user_state
        const { error: updateError } = await supabase
          .from("niche_user_state")
          .update({
            coffee_date_completed: true,
            status: "Win",
            win_completed: true,
            updated_at: new Date().toISOString(),
          })
          .eq("id", existingState.id)

        if (updateError) {
          console.error("Error updating niche state:", updateError)
          return NextResponse.json({ error: "Failed to update niche status" }, { status: 500 })
        }
      } else {
        // Create new niche_user_state
        const { error: insertError } = await supabase.from("niche_user_state").insert({
          niche_id: nicheId,
          user_id: user.id,
          coffee_date_completed: true,
          status: "Win",
          win_completed: true,
        })

        if (insertError) {
          console.error("Error creating niche state:", insertError)
          return NextResponse.json({ error: "Failed to create niche status" }, { status: 500 })
        }
      }
    }

    // Update the session to mark it as completed (you can add a completed field to sessions table if needed)
    // For now, we'll just return success

    return NextResponse.json({
      success: true,
      message: nicheId ? "Niche advanced to Win status" : "Demo marked as complete",
    })
  } catch (error) {
    console.error("Error marking demo as complete:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
