"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Coffee, Search } from "lucide-react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { useRouter } from "next/navigation"
import { useToast } from "@/hooks/use-toast"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

interface LogDemoButtonProps {
  androidId: string
  androidName: string
}

interface Niche {
  id: string
  niche_name: string
  industry: {
    name: string
  }
}

export default function LogDemoButton({ androidId, androidName }: LogDemoButtonProps) {
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

  const handleTestDemo = async () => {
    setIsLoading(true)
    try {
      const response = await fetch("/api/demo-logs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          androidId,
          type: "test",
        }),
      })

      if (response.ok) {
        toast({
          title: "Test Session Logged",
          description: `Practice session logged for ${androidName}`,
        })
        setIsOpen(false)
        router.refresh()
      } else {
        toast({
          title: "Error",
          description: "Failed to log test session",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error logging test demo:", error)
      toast({
        title: "Error",
        description: "An error occurred",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleClientDemo = async (nicheId: string | null, nicheName: string) => {
    setIsLoading(true)
    try {
      const response = await fetch("/api/demo-logs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          androidId,
          type: "client",
          nicheId,
          nicheName: nicheId ? undefined : nicheName,
        }),
      })

      if (response.ok) {
        toast({
          title: "Client Demo Logged",
          description: nicheId
            ? `Demo logged for ${nicheName} - niche advanced to Coffee Date Demo`
            : "Demo logged for Other niche",
        })
        setIsOpen(false)
        router.refresh()
      } else {
        toast({
          title: "Error",
          description: "Failed to log client demo",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error logging client demo:", error)
      toast({
        title: "Error",
        description: "An error occurred",
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
    <>
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              onClick={() => setIsOpen(true)}
              size="icon"
              variant="ghost"
              className="h-8 w-8 text-white/40 hover:text-[#00A8FF] hover:bg-[#00A8FF]/10"
            >
              <Coffee className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Log Demo</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="sm:max-w-[500px] bg-black border-white/10">
          <DialogHeader>
            <DialogTitle className="text-white">
              {step === "type" ? `Log Demo for ${androidName}` : "Which niche was this demo for?"}
            </DialogTitle>
            <DialogDescription className="text-white/60">
              {step === "type"
                ? "How would you classify this Coffee Date session?"
                : "Select the niche to update its pipeline to Coffee Date Demo"}
            </DialogDescription>
          </DialogHeader>

          {step === "type" ? (
            <div className="flex flex-col gap-3 py-4">
              <Button
                onClick={handleTestDemo}
                disabled={isLoading}
                variant="outline"
                className="h-16 border-white/20 text-white hover:bg-white/10 bg-white/5"
              >
                <div className="text-left w-full">
                  <div className="font-semibold">Test Only</div>
                  <div className="text-sm text-white/60">Practice session, no pipeline update</div>
                </div>
              </Button>
              <Button
                onClick={() => setStep("niche")}
                disabled={isLoading}
                className="h-16 bg-[#00A8FF] hover:bg-[#00A8FF]/90"
              >
                <div className="text-left w-full">
                  <div className="font-semibold">Client Demo</div>
                  <div className="text-sm text-white/80">Real demo, update niche to Coffee Date stage</div>
                </div>
              </Button>
            </div>
          ) : (
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
                  <button
                    onClick={() => handleClientDemo(null, "Other")}
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
                        onClick={() => handleClientDemo(niche.id, niche.niche_name)}
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
    </>
  )
}
