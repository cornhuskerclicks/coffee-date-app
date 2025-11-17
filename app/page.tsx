import { Button } from "@/components/ui/button"
import Link from "next/link"

export default function HomePage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="text-center space-y-6 max-w-2xl">
        <h1 className="text-5xl font-bold">Aether AI Lab</h1>
        <p className="text-xl text-muted-foreground">
          AI-Powered SaaS Platform for Agency Workflows
        </p>
        <div className="flex gap-4 justify-center">
          <Button asChild size="lg">
            <Link href="/login">Get Started</Link>
          </Button>
          <Button asChild size="lg" variant="outline">
            <Link href="/dashboard">View Dashboard</Link>
          </Button>
        </div>
      </div>
    </div>
  )
}
