"use client"

import { Button } from "@/components/ui/button"
import { Share2, Clock } from "lucide-react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"

interface SaveShareModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export default function SaveShareModal({ open, onOpenChange }: SaveShareModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[450px] bg-black border-white/10">
        <DialogHeader>
          <DialogTitle className="text-white flex items-center gap-2">
            <Share2 className="h-5 w-5 text-[#00A8FF]" />
            Save & Share Demos
          </DialogTitle>
          <DialogDescription className="text-white/60">
            Record and share your best demos with clients and teammates
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="flex items-center gap-2 text-amber-400 bg-amber-400/10 p-3 rounded-lg">
            <Clock className="h-4 w-4 shrink-0" />
            <span className="text-sm font-medium">Coming Soon</span>
          </div>

          <p className="text-white/70 text-sm leading-relaxed">
            Soon you'll be able to save demo sessions and share them with clients or teammates. Saved demos will appear
            here with a shareable link.
          </p>

          <div className="p-6 rounded-lg bg-white/5 border border-dashed border-white/20 text-center">
            <Share2 className="h-8 w-8 text-white/20 mx-auto mb-2" />
            <p className="text-sm text-white/40">Saved demos will appear here</p>
          </div>

          <div className="text-xs text-white/50">
            Features planned:
            <ul className="list-disc list-inside mt-2 space-y-1">
              <li>Record live demo conversations</li>
              <li>Generate shareable links</li>
              <li>Track who viewed your demos</li>
              <li>Add notes and highlights</li>
            </ul>
          </div>
        </div>

        <Button
          onClick={() => onOpenChange(false)}
          variant="outline"
          className="w-full border-white/20 text-white hover:bg-white/10"
        >
          Close
        </Button>
      </DialogContent>
    </Dialog>
  )
}
