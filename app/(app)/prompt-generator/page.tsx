import { createClient } from "@/lib/supabase/server"
import { redirect } from 'next/navigation'
import PromptGeneratorForm from "@/components/prompt-generator-form"

export default async function PromptGeneratorPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/login")
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">Prompt Generator</h1>
          <p className="text-muted-foreground text-lg">
            Create custom Coffee Date prompts for your androids
          </p>
        </div>
        <PromptGeneratorForm userId={user.id} />
      </div>
    </div>
  )
}
