import { NextResponse } from "next/server"

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { nicheId, nicheName, status, outreachChannels } = body

    // Simulate a small delay to mimic API call
    await new Promise((resolve) => setTimeout(resolve, 500))

    // Mock suggestions based on status
    const suggestions = {
      topPriorityAction: getSuggestedAction(status, outreachChannels),
      messageIdea: getMessageIdea(nicheName, status),
      risk: getRisk(status, outreachChannels),
      opportunity: getOpportunity(status, outreachChannels),
      suggestion: getGeneralSuggestion(status),
    }

    return NextResponse.json(suggestions)
  } catch (error) {
    return NextResponse.json({ error: "Failed to generate suggestions" }, { status: 500 })
  }
}

function getSuggestedAction(status: string, outreach: any): string {
  const totalActivity =
    (outreach?.linkedin_messages || 0) +
    (outreach?.facebook_dms || 0) +
    (outreach?.cold_calls || 0) +
    (outreach?.emails || 0)

  switch (status) {
    case "Research":
      return "Complete the AOV calculator and customer profile to unlock outreach insights."
    case "Shortlisted":
      return "Prepare your messaging scripts before starting outreach."
    case "Outreach in Progress":
      if (totalActivity < 5) {
        return "Increase outreach volume - aim for at least 10 touchpoints this week."
      }
      return "Follow up with warm leads who haven't responded in 3+ days."
    case "Coffee Date Demo":
      return "Schedule a demo call within the next 48 hours to maintain momentum."
    case "Win":
      return "Set up the GHL sub-account and onboard the client."
    default:
      return "Start by researching this niche and identifying key pain points."
  }
}

function getMessageIdea(nicheName: string, status: string): string {
  if (status === "Outreach in Progress" || status === "Shortlisted") {
    return `"Hey! I noticed many ${nicheName.toLowerCase()} businesses struggle with [pain point]. Would you be open to a quick chat about how we've helped similar companies?"`
  }
  return `"Hi! I specialize in helping ${nicheName.toLowerCase()} businesses. Would love to learn more about your current challenges."`
}

function getRisk(status: string, outreach: any): string {
  const daysSinceLastActivity = 7 // Mock value

  if (status === "Outreach in Progress" && daysSinceLastActivity > 5) {
    return "Lead going cold - no activity in over 5 days. Re-engage immediately."
  }
  if (status === "Coffee Date Demo") {
    return "Demo scheduled but not completed - ensure follow-up is in place."
  }
  if (status === "Research" && !outreach) {
    return "Stuck in research phase - move to shortlisting to maintain pipeline velocity."
  }
  return "No immediate risks detected. Keep momentum going."
}

function getOpportunity(status: string, outreach: any): string {
  const totalActivity = (outreach?.linkedin_messages || 0) + (outreach?.facebook_dms || 0) + (outreach?.emails || 0)

  if (totalActivity > 10) {
    return "High engagement detected - prioritize follow-ups for faster conversion."
  }
  if (status === "Shortlisted") {
    return "Ready for outreach - this niche has strong potential based on research."
  }
  return "Consistent outreach can move this to the next stage within 2 weeks."
}

function getGeneralSuggestion(status: string): string {
  switch (status) {
    case "Research":
      return "Focus on understanding the market size and key decision makers."
    case "Shortlisted":
      return "Craft personalized messages that address specific pain points."
    case "Outreach in Progress":
      return "Use multi-channel approach - combine LinkedIn, email, and calls."
    case "Coffee Date Demo":
      return "Prepare case studies and ROI projections for the demo."
    case "Win":
      return "Document the win for future reference and referrals."
    default:
      return "Take the first step - every journey begins with research."
  }
}
