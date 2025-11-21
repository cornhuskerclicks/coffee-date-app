import type { NextRequest } from "next/server"
import { generateText } from "ai"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export async function POST(request: NextRequest) {
  try {
    const { messages, nicheName } = await request.json()

    const systemPrompt = `You are a business strategy consultant helping define an Ideal Customer Profile (ICP) for "${nicheName}" businesses.

Your task:
1. Ask ONE specific question at a time about the target market
2. Consider these areas: Demographics, Company characteristics, Pain points and challenges, Goals and aspirations, Decision-making process, Budget and buying capacity, Current solutions they're using
3. After gathering enough information (typically 6-8 questions), create a detailed ICP
4. Suggest specific places to find these clients on LinkedIn

IMPORTANT: 
- Ask questions naturally and conversationally
- Build on previous answers
- When you have enough information, create the ICP and respond with a JSON object containing:
  {
    "icp_complete": true,
    "decision_maker": "...",
    "pain_points": "...",
    "goals": "...",
    "budget": "...",
    "current_solutions": "...",
    "objections": "...",
    "gathering_places": "LinkedIn groups: ..., Facebook: ..., Forums: ..."
  }
- Until the ICP is complete, respond with regular conversational text asking the next question`

    const conversationHistory = messages.map((msg: any) => ({
      role: msg.role,
      content: msg.content,
    }))

    const { text } = await generateText({
      model: "openai/gpt-4o-mini",
      system: systemPrompt,
      messages: conversationHistory,
    })

    // Check if the response contains the completed ICP JSON
    const jsonMatch = text.match(/\{[\s\S]*"icp_complete"\s*:\s*true[\s\S]*\}/)

    if (jsonMatch) {
      try {
        const icpData = JSON.parse(jsonMatch[0])
        return Response.json({
          success: true,
          message:
            "Perfect! I've compiled your complete Ideal Customer Profile:\n\n✅ Decision Maker: " +
            icpData.decision_maker +
            "\n✅ Pain Points: " +
            icpData.pain_points +
            "\n✅ Where to Find Them: " +
            icpData.gathering_places +
            "\n\nYour ICP has been saved! You can close this interview now or continue refining it.",
          icpComplete: true,
          customerProfile: icpData,
        })
      } catch (e) {
        // If parsing fails, continue with normal flow
      }
    }

    return Response.json({
      success: true,
      message: text,
      icpComplete: false,
    })
  } catch (error) {
    console.error("Chat API error:", error)
    return Response.json({ error: "Failed to process chat" }, { status: 500 })
  }
}
