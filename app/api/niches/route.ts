import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function GET() {
  try {
    const supabase = await createClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { data: niches, error } = await supabase
      .from("niches")
      .select(`
        id,
        niche_name,
        industry:industries (
          name
        )
      `)
      .order("niche_name", { ascending: true })

    if (error) {
      console.error("Error fetching niches:", error)
      return NextResponse.json({ error: "Failed to fetch niches" }, { status: 500 })
    }

    return NextResponse.json(niches)
  } catch (error) {
    console.error("Error in niches API:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
