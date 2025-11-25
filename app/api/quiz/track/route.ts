import { createClient } from "@supabase/supabase-js"
import { type NextRequest, NextResponse } from "next/server"

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

export async function POST(request: NextRequest) {
  try {
    const { quizId, event } = await request.json()

    if (!quizId || !event) {
      return NextResponse.json({ success: false, error: "Missing quizId or event" }, { status: 400 })
    }

    // Increment the appropriate counter
    if (event === "view") {
      await supabase.rpc("increment_quiz_views", { quiz_id: quizId })
    } else if (event === "start") {
      await supabase.rpc("increment_quiz_starts", { quiz_id: quizId })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[v0] Track error:", error)
    return NextResponse.json({ success: false }, { status: 500 })
  }
}
