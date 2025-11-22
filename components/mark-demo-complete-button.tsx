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
  const router = useRouter()
  const { toast } = useToast()

  useEffect(() => {
    if (isOpen) {
      fetchNiches()
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
          nicheName: nicheId ? undefined : nicheName, // Only send nicheName if it's "Other"
        }),
      })

      if (response.ok) {
        toast({
          title: "Success",
          description: nicheId
            ? `Demo marked as complete and ${nicheName} advanced to Win!`
            : "Demo marked as complete for Other niche",
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
          <DialogTitle className="text-white">Mark Demo as Complete</DialogTitle>
          <DialogDescription className="text-white/60">
            Select the business niche for this demo. The niche will automatically advance to Win status.
          </DialogDescription>
        </DialogHeader>

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
        </div>
      </DialogContent>
    </Dialog>
  )
}
