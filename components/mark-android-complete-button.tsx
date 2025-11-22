"use client"

import { useState } from "react"
import { Award, Search } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { useToast } from "@/hooks/use-toast"
import { useRouter } from "next/navigation"

interface MarkAndroidCompleteButtonProps {
  androidId: string
  androidName: string
}

export default function MarkAndroidCompleteButton({ androidId, androidName }: MarkAndroidCompleteButtonProps) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [niches, setNiches] = useState<Array<{ id: string; niche_name: string }>>([])
  const [searchQuery, setSearchQuery] = useState("")
  const { toast } = useToast()
  const router = useRouter()

  const handleOpen = async () => {
    setOpen(true)
    setLoading(true)

    try {
      const response = await fetch("/api/niches")
      if (!response.ok) throw new Error("Failed to fetch niches")
      const data = await response.json()
      setNiches(data)
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to load niches. Please try again.",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleSelectNiche = async (nicheId: string | null, nicheName: string) => {
    setLoading(true)

    try {
      const response = await fetch("/api/android-complete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ androidId, nicheId }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Failed to mark demo as complete")
      }

      toast({
        title: "Success",
        description: `Demo completed for ${nicheName}! Niche advanced to Win status.`,
      })

      setOpen(false)
      router.refresh()
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to complete demo",
      })
    } finally {
      setLoading(false)
    }
  }

  const filteredNiches = niches.filter((niche) => niche.niche_name.toLowerCase().includes(searchQuery.toLowerCase()))

  return (
    <>
      <Button
        variant="ghost"
        size="icon"
        onClick={handleOpen}
        className="h-8 w-8 text-white/60 hover:text-[#00A8FF] hover:bg-white/10"
        title="Mark demo as completed"
      >
        <Award className="h-4 w-4" />
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="bg-[#0A0A0A] border border-white/10 text-white sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Demo Completed for {androidName}</DialogTitle>
            <DialogDescription className="text-white/60">
              Select which business niche this demo was for
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/40" />
              <Input
                placeholder="Search niches..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 bg-white/5 border-white/10 text-white placeholder:text-white/40"
              />
            </div>

            <ScrollArea className="h-[300px] rounded-md border border-white/10 bg-white/5 p-2">
              <div className="space-y-1">
                <Button
                  variant="ghost"
                  className="w-full justify-start text-left hover:bg-white/10 text-white/90 font-medium"
                  onClick={() => handleSelectNiche(null, "Other")}
                  disabled={loading}
                >
                  Other
                </Button>

                {loading ? (
                  <div className="p-4 text-center text-white/60">Loading niches...</div>
                ) : filteredNiches.length === 0 ? (
                  <div className="p-4 text-center text-white/60">No niches found</div>
                ) : (
                  filteredNiches.map((niche) => (
                    <Button
                      key={niche.id}
                      variant="ghost"
                      className="w-full justify-start text-left hover:bg-white/10 text-white"
                      onClick={() => handleSelectNiche(niche.id, niche.niche_name)}
                      disabled={loading}
                    >
                      {niche.niche_name}
                    </Button>
                  ))
                )}
              </div>
            </ScrollArea>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
