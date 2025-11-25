"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Award, Search } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { useRouter } from "next/navigation"
import { useToast } from "@/hooks/use-toast"
import { ScrollArea } from "@/components/ui/scroll-area"

interface MarkDemoCompleteButtonProps {
  sessionId: string
}

interface Niche {
  id: string
  niche_name: string
  industry: {
    name: string
  }
}

export default function MarkDemoCompleteButton({ sessionId }: MarkDemoCompleteButtonProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [niches, setNiches] = useState<Niche[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [step, setStep] = useState<"type" | "niche">("type")
  const router = useRouter()
  const { toast } = useToast()

  useEffect(() => {
    if (isOpen && step === "niche") {
      fetchNiches()
    }
  }, [isOpen, step])

  useEffect(() => {
    if (!isOpen) {
      setStep("type")
      setSearchQuery("")
    }
  }, [isOpen])

  const fetchNiches = async () => {
    try {
      const response = await fetch("/api/niches")
      if (response.ok) {
        const data = await response.json()
        setNiches(data)
      }
    } catch (error) {
      console.error("Error fetching niches:", error)
    }
  }

  const handleNicheSelect = async (nicheId: string | null, nicheName: string) => {
    setIsLoading(true)
    try {
      const response = await fetch("/api/demo-complete", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          sessionId,
          nicheId,
          nicheName: nicheId ? undefined : nicheName,
          action: "coffee_date",
        }),
      })

      if (response.ok) {
        toast({
          title: "Coffee Date Logged",
          description: nicheId ? `Coffee date logged for ${nicheName}` : "Demo marked as complete for Other niche",
        })
        setIsOpen(false)
        router.refresh()
      } else {
        const error = await response.json()
        toast({
          title: "Error",
          description: error.error || "Failed to mark demo as complete",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error marking demo complete:", error)
      toast({
        title: "Error",
        description: "An error occurred while marking the demo as complete",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const filteredNiches = niches.filter(
    (niche) =>
      niche.niche_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      niche.industry.name.toLowerCase().includes(searchQuery.toLowerCase()),
  )

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button
          size="sm"
          variant="outline"
          className="border-[#00A8FF]/50 text-[#00A8FF] hover:bg-[#00A8FF]/10 bg-transparent"
        >
          <Award className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px] bg-black border-white/10">
        <DialogHeader>
          <DialogTitle className="text-white">
            {step === "type" ? "How would you classify this Coffee Date session?" : "Which niche was this demo for?"}
          </DialogTitle>
          <DialogDescription className="text-white/60">
            {step === "type"
              ? "Select whether this was a test or a real client demo"
              : "Select the niche to update its pipeline status to Coffee Date Demo"}
          </DialogDescription>
        </DialogHeader>

        {step === "type" ? (
          <div className="flex flex-col gap-3 py-4">
            <Button
              onClick={() => {
                setIsOpen(false)
                toast({
                  title: "Test Session",
                  description: "No pipeline changes made",
                })
              }}
              variant="outline"
              className="h-16 border-white/20 text-white hover:bg-white/10 bg-white/5"
            >
              <div className="text-left w-full">
                <div className="font-semibold">Test Only</div>
                <div className="text-sm text-white/60">Practice session, no pipeline update</div>
              </div>
            </Button>
            <Button onClick={() => setStep("niche")} className="h-16 bg-[#00A8FF] hover:bg-[#00A8FF]/90">
              <div className="text-left w-full">
                <div className="font-semibold">Client Demo</div>
                <div className="text-sm text-white/80">Real demo, update niche to Coffee Date stage</div>
              </div>
            </Button>
          </div>
        ) : (
          /* Step 2: Niche Selection */
          <div className="space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-white/40" />
              <Input
                placeholder="Search niches..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 bg-white/5 border-white/10 text-white placeholder:text-white/40"
              />
            </div>

            <ScrollArea className="h-[300px] rounded-lg border border-white/10 bg-white/5">
              <div className="p-2 space-y-1">
                {/* Other option at the top */}
                <button
                  onClick={() => handleNicheSelect(null, "Other")}
                  disabled={isLoading}
                  className="w-full text-left p-3 rounded-lg hover:bg-white/10 transition-colors border border-white/20 bg-white/5"
                >
                  <div className="font-medium text-white">Other</div>
                  <div className="text-sm text-white/60">Not in the list</div>
                </button>

                {filteredNiches.length === 0 ? (
                  <div className="p-4 text-center text-white/60">No niches found</div>
                ) : (
                  filteredNiches.map((niche) => (
                    <button
                      key={niche.id}
                      onClick={() => handleNicheSelect(niche.id, niche.niche_name)}
                      disabled={isLoading}
                      className="w-full text-left p-3 rounded-lg hover:bg-white/10 transition-colors"
                    >
                      <div className="font-medium text-white">{niche.niche_name}</div>
                      <div className="text-sm text-white/60">{niche.industry.name}</div>
                    </button>
                  ))
                )}
              </div>
            </ScrollArea>

            <Button
              variant="outline"
              onClick={() => setStep("type")}
              className="w-full border-white/20 text-white hover:bg-white/10"
            >
              Back
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
