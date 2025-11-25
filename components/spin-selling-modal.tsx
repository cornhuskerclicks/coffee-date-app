"use client"
import { Button } from "@/components/ui/button"
import { Sparkles } from "lucide-react"
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet"

interface SpinSellingModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export default function SpinSellingModal({ open, onOpenChange }: SpinSellingModalProps) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="bg-black border-white/10 w-full sm:max-w-lg">
        <SheetHeader className="pb-6">
          <SheetTitle className="text-white flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-[#00A8FF]" />
            How Your Android Uses SPIN Selling
          </SheetTitle>
          <SheetDescription className="text-white/60">
            A proven methodology for consultative sales conversations
          </SheetDescription>
        </SheetHeader>

        <div className="space-y-6">
          <p className="text-white/80 text-sm leading-relaxed">
            SPIN Selling is a research-backed sales methodology developed by Neil Rackham. Your Coffee Date Android is
            designed to guide conversations using this framework, helping prospects feel understood rather than
            pressured.
          </p>

          <div className="space-y-4">
            <div className="p-4 rounded-lg bg-white/5 border border-white/10">
              <div className="flex items-center gap-2 mb-2">
                <span className="w-6 h-6 rounded-full bg-[#00A8FF]/20 flex items-center justify-center text-xs font-bold text-[#00A8FF]">
                  S
                </span>
                <h3 className="font-semibold text-white">Situation Questions</h3>
              </div>
              <p className="text-sm text-white/60">
                Gather facts about the prospect's current state. "How many leads do you currently get per month?"
              </p>
            </div>

            <div className="p-4 rounded-lg bg-white/5 border border-white/10">
              <div className="flex items-center gap-2 mb-2">
                <span className="w-6 h-6 rounded-full bg-amber-500/20 flex items-center justify-center text-xs font-bold text-amber-400">
                  P
                </span>
                <h3 className="font-semibold text-white">Problem Questions</h3>
              </div>
              <p className="text-sm text-white/60">
                Uncover difficulties and dissatisfaction. "What challenges are you facing with lead follow-up?"
              </p>
            </div>

            <div className="p-4 rounded-lg bg-white/5 border border-white/10">
              <div className="flex items-center gap-2 mb-2">
                <span className="w-6 h-6 rounded-full bg-rose-500/20 flex items-center justify-center text-xs font-bold text-rose-400">
                  I
                </span>
                <h3 className="font-semibold text-white">Implication Questions</h3>
              </div>
              <p className="text-sm text-white/60">
                Explore the consequences of the problem. "How much revenue do you think you're losing from slow
                responses?"
              </p>
            </div>

            <div className="p-4 rounded-lg bg-white/5 border border-white/10">
              <div className="flex items-center gap-2 mb-2">
                <span className="w-6 h-6 rounded-full bg-emerald-500/20 flex items-center justify-center text-xs font-bold text-emerald-400">
                  N
                </span>
                <h3 className="font-semibold text-white">Need-Payoff Questions</h3>
              </div>
              <p className="text-sm text-white/60">
                Focus on the value of solving the problem. "If you could respond to leads instantly 24/7, what would
                that mean for your business?"
              </p>
            </div>
          </div>

          <div className="p-4 rounded-lg bg-[#00A8FF]/10 border border-[#00A8FF]/20">
            <p className="text-sm text-white/80">
              <strong className="text-white">Your Android's prompt</strong> is designed to follow this flow so prospects
              feel understood and guided, not pressured.
            </p>
          </div>

          <Button variant="outline" disabled className="w-full border-white/20 text-white/50 bg-white/5">
            View Prompt Pattern (Coming Soon)
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  )
}
