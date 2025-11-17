import { NextRequest } from "next/server"
import { generateText } from "ai"
import { createClient } from "@/lib/supabase/server"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export async function POST(request: NextRequest) {
  try {
    const { messages, androidId } = await request.json()

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

    // Generate AI response using the android's prompt as system message
    const { text } = await generateText({
      model: "openai/gpt-4o-mini",
      system: android.prompt,
      messages: messages.map((m: any) => ({
        role: m.role,
        content: m.content,
      })),
    })

    return Response.json({ 
      role: "assistant", 
      content: text 
    })
  } catch (error) {
    console.error("Chat API error:", error)
    return Response.json({ error: "Failed to generate response" }, { status: 500 })
  }
}
