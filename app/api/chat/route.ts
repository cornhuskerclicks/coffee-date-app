import { streamText } from "ai"
import { createClient } from "@/lib/supabase/server"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export async function POST(request: Request) {
  try {
    const { messages } = await request.json()

    // Get androidId from URL search params
    const url = new URL(request.url)
    const androidId = url.searchParams.get("androidId")

    if (!androidId) {
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
      console.error("Android not found:", androidError)
      return Response.json({ error: "Android not found" }, { status: 404 })
    }

    const result = streamText({
      model: "openai/gpt-4o-mini",
      system: android.prompt,
      messages: messages.map((m: any) => ({
        role: m.role,
        content: m.content,
      })),
    })

    // Return the streaming response
    return result.toUIMessageStreamResponse()
  } catch (error) {
    console.error("Chat API error:", error)
    return Response.json({ error: "Failed to generate response" }, { status: 500 })
  }
}
