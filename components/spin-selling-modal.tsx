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
      <SheetContent className="bg-black border-white/10 w-full sm:max-w-2xl overflow-y-auto">
        <SheetHeader className="pb-6">
          <SheetTitle className="text-white flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-[#00A8FF]" />
            How Your Android Uses SPIN Selling
          </SheetTitle>
          <SheetDescription className="text-white/60">
            A proven communication model designed to revive cold leads through genuine understanding
          </SheetDescription>
        </SheetHeader>

        <div className="space-y-6 text-white/80">
          <div className="space-y-3">
            <p className="text-sm leading-relaxed">
              SPIN Selling, created by researcher Neil Rackham, is one of the most reliable frameworks for re-engaging
              people who stopped responding. Your Coffee Date Android uses SPIN not to sell aggressively, but to re-open
              conversations with empathy, clarity, and relevance.
            </p>

            <div className="p-4 rounded-lg bg-white/5 border border-white/10">
              <p className="text-sm font-semibold text-white mb-2">Dead leads usually go quiet because:</p>
              <ul className="text-sm text-white/70 space-y-1 list-disc list-inside">
                <li>they felt misunderstood</li>
                <li>they weren't ready</li>
                <li>they were overwhelmed</li>
                <li>the timing was wrong</li>
                <li>previous follow-up felt salesy or generic</li>
              </ul>
              <p className="text-sm text-white/80 mt-3">
                SPIN breaks through that wall by shifting the conversation back to the customer's world, not the
                company's agenda.
              </p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="p-4 rounded-lg bg-white/5 border border-white/10">
              <div className="flex items-center gap-2 mb-3">
                <span className="w-6 h-6 rounded-full bg-[#00A8FF]/20 flex items-center justify-center text-xs font-bold text-[#00A8FF]">
                  S
                </span>
                <h3 className="font-semibold text-white">Situation Questions</h3>
              </div>
              <p className="text-sm font-medium text-white/90 mb-2">Help the customer express where they are today</p>
              <p className="text-sm text-white/70 mb-3">
                Cold leads rarely remember their last contact. Situation questions rebuild context in a low-pressure
                way.
              </p>
              <div className="bg-black/30 p-3 rounded border border-white/5 mb-3">
                <p className="text-sm text-white/60 italic">"Where are things at with your project today?"</p>
                <p className="text-sm text-white/60 italic">"How have things been since you first reached out?"</p>
              </div>
              <p className="text-xs text-emerald-400">
                <strong>Why it works:</strong> It warms the conversation without assumptions or pressure, giving the
                customer a safe way to re-engage.
              </p>
            </div>

            <div className="p-4 rounded-lg bg-white/5 border border-white/10">
              <div className="flex items-center gap-2 mb-3">
                <span className="w-6 h-6 rounded-full bg-amber-500/20 flex items-center justify-center text-xs font-bold text-amber-400">
                  P
                </span>
                <h3 className="font-semibold text-white">Problem Questions</h3>
              </div>
              <p className="text-sm font-medium text-white/90 mb-2">
                Explore what challenge brought them in originally
              </p>
              <p className="text-sm text-white/70 mb-3">
                Dead leads often went silent because the original problem faded… or got worse.
              </p>
              <div className="bg-black/30 p-3 rounded border border-white/5 mb-3">
                <p className="text-sm text-white/60 italic">
                  "What's been the most difficult part of dealing with this?"
                </p>
                <p className="text-sm text-white/60 italic">"What made you look for help again?"</p>
              </div>
              <p className="text-xs text-emerald-400">
                <strong>Why it works:</strong> People respond when you acknowledge their struggle, not your offer.
              </p>
            </div>

            <div className="p-4 rounded-lg bg-white/5 border border-white/10">
              <div className="flex items-center gap-2 mb-3">
                <span className="w-6 h-6 rounded-full bg-rose-500/20 flex items-center justify-center text-xs font-bold text-rose-400">
                  I
                </span>
                <h3 className="font-semibold text-white">Implication Questions</h3>
              </div>
              <p className="text-sm font-medium text-white/90 mb-2">
                Highlight the cost of doing nothing — gently, respectfully
              </p>
              <p className="text-sm text-white/70 mb-3">
                Cold leads re-engage when they understand how their issue is affecting them.
              </p>
              <div className="bg-black/30 p-3 rounded border border-white/5 mb-3">
                <p className="text-sm text-white/60 italic">"How has this been impacting your day-to-day?"</p>
                <p className="text-sm text-white/60 italic">"What does this mean for you if it keeps going?"</p>
              </div>
              <p className="text-xs text-emerald-400">
                <strong>Why it works:</strong> It helps the customer reconnect with the reason they reached out in the
                first place.
              </p>
            </div>

            <div className="p-4 rounded-lg bg-white/5 border border-white/10">
              <div className="flex items-center gap-2 mb-3">
                <span className="w-6 h-6 rounded-full bg-emerald-500/20 flex items-center justify-center text-xs font-bold text-emerald-400">
                  N
                </span>
                <h3 className="font-semibold text-white">Need-Payoff Questions</h3>
              </div>
              <p className="text-sm font-medium text-white/90 mb-2">
                Let the customer describe the value of a better outcome
              </p>
              <p className="text-sm text-white/70 mb-3">
                These questions get the customer thinking about the benefit, not the offer.
              </p>
              <div className="bg-black/30 p-3 rounded border border-white/5 mb-3">
                <p className="text-sm text-white/60 italic">
                  "How helpful would it be if this could be handled quickly?"
                </p>
                <p className="text-sm text-white/60 italic">"What would it mean to finally get this resolved?"</p>
              </div>
              <p className="text-xs text-emerald-400">
                <strong>Why it works:</strong> When customers articulate the payoff themselves, they naturally lean back
                into the buying process.
              </p>
            </div>
          </div>

          <div className="p-4 rounded-lg bg-[#00A8FF]/10 border border-[#00A8FF]/20 space-y-3">
            <h4 className="text-white font-semibold flex items-center gap-2">
              <span className="text-xl">⭐</span> Why SPIN is so powerful for dead-lead revival
            </h4>
            <p className="text-sm text-white/80">
              Most companies follow up by pushing information: "Do you want a quote?" "Do you want to book a call?" "Are
              you still interested?"
            </p>
            <p className="text-sm text-white/80">
              Your Android does the opposite. It pulls the customer back in using:
            </p>
            <div className="space-y-2 mt-3">
              <div className="flex gap-2">
                <span className="text-emerald-400 font-bold">✅</span>
                <div>
                  <p className="text-sm font-semibold text-white">Curiosity</p>
                  <p className="text-xs text-white/70">
                    Instead of pressuring the customer, SPIN invites them to talk.
                  </p>
                </div>
              </div>
              <div className="flex gap-2">
                <span className="text-emerald-400 font-bold">✅</span>
                <div>
                  <p className="text-sm font-semibold text-white">Relevance</p>
                  <p className="text-xs text-white/70">
                    Questions stay focused on their needs, not the company's pitch.
                  </p>
                </div>
              </div>
              <div className="flex gap-2">
                <span className="text-emerald-400 font-bold">✅</span>
                <div>
                  <p className="text-sm font-semibold text-white">Emotional clarity</p>
                  <p className="text-xs text-white/70">
                    Customers often ghost because they felt overwhelmed — SPIN gently helps them find clarity again.
                  </p>
                </div>
              </div>
              <div className="flex gap-2">
                <span className="text-emerald-400 font-bold">✅</span>
                <div>
                  <p className="text-sm font-semibold text-white">Self-driven motivation</p>
                  <p className="text-xs text-white/70">
                    People re-engage when they rediscover why the problem matters.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="p-4 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
            <h4 className="text-white font-semibold mb-2 flex items-center gap-2">
              <span className="text-xl">🎯</span> The result
            </h4>
            <p className="text-sm text-white/80">
              SPIN turns dead-lead revival into a human conversation, not a transactional chase. Your Android becomes
              calm, patient, genuinely helpful — and that's exactly why customers respond.
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
