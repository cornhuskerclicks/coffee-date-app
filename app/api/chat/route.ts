import { streamText } from "ai"
import { createClient } from "@/lib/supabase/server"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export async function POST(request: Request) {
  try {
    console.log("[v0] ===== Chat API POST Request =====")
    console.log("[v0] Request URL:", request.url)
    console.log("[v0] Request headers:", Object.fromEntries(request.headers.entries()))

    const body = await request.json()
    console.log("[v0] Request body:", JSON.stringify(body, null, 2))

    const { messages } = body
    console.log("[v0] Messages count:", messages?.length || 0)
    console.log("[v0] Messages:", JSON.stringify(messages, null, 2))

    // Get androidId from URL search params
    const url = new URL(request.url)
    const androidId = url.searchParams.get("androidId")
    console.log("[v0] Android ID from params:", androidId)

    if (!androidId) {
      console.error("[v0] ERROR: Missing Android ID")
      return Response.json({ error: "Android ID is required" }, { status: 400 })
    }

    const supabase = await createClient()
    console.log("[v0] Supabase client created")

    // Get the android's prompt
    const { data: android, error: androidError } = await supabase
      .from("androids")
      .select("*")
      .eq("id", androidId)
      .single()

    if (androidError || !android) {
      console.error("[v0] ERROR: Android not found:", androidError)
      return Response.json({ error: "Android not found" }, { status: 404 })
    }

    console.log("[v0] Found android:", android.name)
    console.log("[v0] Android ID:", android.id)
    console.log("[v0] Prompt exists:", !!android.prompt)
    console.log("[v0] Prompt length:", android.prompt?.length || 0)
    console.log("[v0] First 200 chars of prompt:", android.prompt?.substring(0, 200))

    console.log("[v0] Creating streamText with model: openai/gpt-4o-mini")

    const result = streamText({
      model: "openai/gpt-4o-mini",
      system: android.prompt,
      messages: messages.map((m: any) => ({
        role: m.role,
        content: m.content,
      })),
    })

    console.log("[v0] Streaming response created, returning to client")

    return result.toUIMessageStreamResponse()
  } catch (error) {
    console.error("[v0] FATAL ERROR in Chat API:", error)
    console.error("[v0] Error stack:", error instanceof Error ? error.stack : "No stack trace")
    return Response.json(
      {
        error: "Failed to generate response",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    )
  }
}
