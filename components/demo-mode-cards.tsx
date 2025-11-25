"use client"

import { useState } from "react"
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Coffee, Sparkles, Share2 } from "lucide-react"
import SpinSellingModal from "@/components/spin-selling-modal"
import SaveShareModal from "@/components/save-share-modal"

export default function DemoModeCards() {
  const [spinOpen, setSpinOpen] = useState(false)
  const [saveShareOpen, setSaveShareOpen] = useState(false)

  const demoModes = [
    {
      id: "interactive",
      icon: Coffee,
      title: "Interactive Demos",
      description: "Live AI-powered conversations with prospects",
      isDefault: true,
      onClick: () => {},
    },
    {
      id: "spin",
      icon: Sparkles,
      title: "SPIN Selling",
      description: "Guided by proven sales methodologies",
      isDefault: false,
      onClick: () => setSpinOpen(true),
    },
    {
      id: "save",
      icon: Share2,
      title: "Save & Share",
      description: "Record and share demos with your team",
      isDefault: false,
      onClick: () => setSaveShareOpen(true),
    },
  ]

  return (
    <>
      <div>
        <h2 className="text-lg font-semibold text-white mb-4">Demo Modes</h2>
        <div className="grid grid-cols-3 gap-4">
          {demoModes.map((mode) => (
            <Card
              key={mode.id}
              onClick={mode.onClick}
              className={`border bg-white/5 hover:bg-white/10 hover:border-[#00A8FF]/50 transition-all cursor-pointer ${
                mode.isDefault ? "border-[#00A8FF]/50 bg-[#00A8FF]/5" : "border-white/10"
              }`}
            >
              <CardHeader className="pb-2">
                <div className="flex items-center gap-2">
                  <mode.icon className={`h-5 w-5 ${mode.isDefault ? "text-[#00A8FF]" : "text-white/60"}`} />
                  {mode.isDefault && (
                    <span className="text-[10px] font-medium text-[#00A8FF] bg-[#00A8FF]/10 px-2 py-0.5 rounded-full">
                      DEFAULT
                    </span>
                  )}
                </div>
                <CardTitle className="text-sm text-white">{mode.title}</CardTitle>
                <CardDescription className="text-xs text-white/50">{mode.description}</CardDescription>
              </CardHeader>
            </Card>
          ))}
        </div>
      </div>

      <SpinSellingModal open={spinOpen} onOpenChange={setSpinOpen} />
      <SaveShareModal open={saveShareOpen} onOpenChange={setSaveShareOpen} />
    </>
  )
}
