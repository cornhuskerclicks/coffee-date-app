"use server"

import { createClient } from "@/lib/supabase/server"

export async function createSession(androidId: string, userId: string, title: string) {
  const supabase = await createClient()

  const { data: session, error } = await supabase
    .from("sessions")
    .insert({
      android_id: androidId,
      user_id: userId,
      title,
      status: "active",
    })
    .select()
    .single()

  if (error) {
    console.error("Error creating session:", error)
    return { success: false, error: error.message }
  }

  return { success: true, session }
}
