import { createClient } from "@supabase/supabase-js"
import { type NextRequest, NextResponse } from "next/server"

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { quizTemplateId, contactInfo, answers, score } = body

    // Determine score tier
    let scoreTier = "Low"
    if (score >= 80) scoreTier = "High"
    else if (score >= 40) scoreTier = "Medium"

    // Save response to database
    const { data: response, error } = await supabase
      .from("quiz_responses")
      .insert({
        quiz_template_id: quizTemplateId,
        respondent_name: contactInfo.firstName,
        respondent_email: contactInfo.email,
        company_name: contactInfo.companyName,
        answers: answers,
        score: score,
      })
      .select()
      .single()

    if (error) throw error

    const origin = request.headers.get("origin") || request.nextUrl.origin
    fetch(`${origin}/api/quiz/ghl-sync`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        quizTemplateId,
        responseId: response.id,
        contactInfo,
        answers,
        score,
        scoreTier,
      }),
    }).catch((err) => console.error("[v0] GHL sync fire-and-forget error:", err))

    return NextResponse.json({
      success: true,
      responseId: response.id,
      score,
      scoreTier,
    })
  } catch (error) {
    console.error("[v0] Quiz submit error:", error)
    return NextResponse.json({ success: false, error: String(error) }, { status: 500 })
  }
}
