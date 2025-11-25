import { createClient } from "@supabase/supabase-js"
import { type NextRequest, NextResponse } from "next/server"

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { quizTemplateId, responseId, contactInfo, answers, score, scoreTier } = body

    // Get quiz template to find GHL location ID
    const { data: quiz, error: quizError } = await supabase
      .from("quiz_templates")
      .select("ghl_location_id, user_id, title")
      .eq("id", quizTemplateId)
      .single()

    if (quizError || !quiz) {
      console.log("[v0] Quiz not found or no GHL configured")
      return NextResponse.json({ success: true, ghlSynced: false })
    }

    // Get GHL connection for this user
    const { data: ghlConnection, error: ghlError } = await supabase
      .from("ghl_connections")
      .select("api_key, location_id")
      .eq("user_id", quiz.user_id)
      .single()

    if (ghlError || !ghlConnection) {
      console.log("[v0] No GHL connection found for user")
      return NextResponse.json({ success: true, ghlSynced: false })
    }

    const locationId = quiz.ghl_location_id || ghlConnection.location_id

    // Create or update contact in GHL
    const ghlPayload = {
      firstName: contactInfo.firstName,
      email: contactInfo.email,
      companyName: contactInfo.companyName,
      locationId: locationId,
      customFields: [
        { key: "ai_readiness_score", value: score.toString() },
        { key: "ai_readiness_tier", value: scoreTier },
        { key: "quiz_name", value: quiz.title },
        { key: "quiz_completed_at", value: new Date().toISOString() },
        ...Object.entries(answers || {}).map(([key, value], i) => ({
          key: `quiz_q${i + 1}`,
          value: String(value),
        })),
      ],
      tags: [`quiz-${scoreTier.toLowerCase()}`, "ai-readiness-quiz"],
    }

    const ghlResponse = await fetch("https://services.leadconnectorhq.com/contacts/upsert", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${ghlConnection.api_key}`,
        "Content-Type": "application/json",
        Version: "2021-07-28",
      },
      body: JSON.stringify(ghlPayload),
    })

    if (!ghlResponse.ok) {
      const errorText = await ghlResponse.text()
      console.error("[v0] GHL sync failed:", errorText)
      return NextResponse.json({ success: true, ghlSynced: false, error: errorText })
    }

    const ghlData = await ghlResponse.json()
    const contactId = ghlData.contact?.id

    // Update quiz response with GHL sync status
    if (responseId && contactId) {
      await supabase.from("quiz_responses").update({ ghl_synced: true, ghl_contact_id: contactId }).eq("id", responseId)
    }

    console.log("[v0] GHL sync successful, contact ID:", contactId)
    return NextResponse.json({ success: true, ghlSynced: true, contactId })
  } catch (error) {
    console.error("[v0] GHL sync error:", error)
    return NextResponse.json({ success: false, error: String(error) }, { status: 500 })
  }
}
