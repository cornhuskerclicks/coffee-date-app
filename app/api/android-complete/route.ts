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

    const { androidId, nicheId } = await request.json()

    if (!androidId) {
      return NextResponse.json({ error: "Android ID is required" }, { status: 400 })
    }

    // If nicheId is provided and not "Other", update that niche to Win status
    if (nicheId) {
      const { error: updateError } = await supabase
        .from("niche_user_state")
        .update({
          coffee_date_completed: true,
          status: "Win",
        })
        .eq("niche_id", nicheId)
        .eq("user_id", user.id)

      if (updateError) {
        console.error("Error updating niche:", updateError)
        return NextResponse.json({ error: "Failed to update niche status" }, { status: 500 })
      }
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error in android-complete:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
