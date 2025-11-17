"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Coffee } from 'lucide-react'
import DemoAndroidSelectorModal from "@/components/demo-android-selector-modal"
import type { Android } from "@/lib/types"

interface DemoStartButtonProps {
  androids: Android[]
}

export default function DemoStartButton({ androids }: DemoStartButtonProps) {
  const [showModal, setShowModal] = useState(false)

  return (
    <>
      <Button
        onClick={() => setShowModal(true)}
        className="bg-[#00A8FF] text-white hover:bg-white hover:text-black transition-all duration-200"
      >
        <Coffee className="h-4 w-4 mr-2" />
        Start Coffee Date Demo
      </Button>

      <DemoAndroidSelectorModal open={showModal} onOpenChange={setShowModal} androids={androids} />
    </>
  )
}
