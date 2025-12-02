import { streamText } from "ai"
import { createClient } from "@/lib/supabase/server"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export async function POST(request: Request) {
  try {
    console.log("[v0] Chat API called")
    const { messages } = await request.json()
    console.log("[v0] Received messages:", messages?.length || 0)

    // Get androidId from URL search params
    const url = new URL(request.url)
    const androidId = url.searchParams.get("androidId")
    console.log("[v0] Android ID:", androidId)

    if (!androidId) {
      console.error("[v0] Missing Android ID")
      return Response.json({ error: "Android ID is required" }, { status: 400 })
    }

    const supabase = await createClient()

    // Get the android's prompt
    const { data: android, error: androidError } = await supabase
      .from("androids")
      .select("*")
      .eq("id", androidId)
      .single()

    if (androidError || !android) {
      console.error("[v0] Android not found:", androidError)
      return Response.json({ error: "Android not found" }, { status: 404 })
    }

    console.log("[v0] Found android:", android.name)
    console.log("[v0] System prompt length:", android.prompt?.length || 0)

    const result = streamText({
      model: "openai/gpt-4o-mini",
      system: android.prompt,
      messages: messages.map((m: any) => ({
        role: m.role,
        content: m.content,
      })),
    })

    console.log("[v0] Streaming response started")

    return result.toDataStreamResponse()
  } catch (error) {
    console.error("[v0] Chat API error:", error)
    return Response.json({ error: "Failed to generate response" }, { status: 500 })
  }
}
