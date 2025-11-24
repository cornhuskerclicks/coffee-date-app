"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

export default function TestDropdown() {
  const [industries, setIndustries] = useState<Array<{ id: string; name: string }>>([])
  const [selected, setSelected] = useState("all")

  useEffect(() => {
    async function loadIndustries() {
      const supabase = createClient()
      const { data } = await supabase.from("industries").select("id, name").order("name")
      if (data) setIndustries(data)
    }
    loadIndustries()
  }, [])

  return (
    <div className="min-h-screen bg-black text-white p-8">
      <h1 className="text-2xl mb-4">Industry Dropdown Test</h1>

      <div className="max-w-md">
        <Select
          value={selected}
          onValueChange={(value) => {
            console.log("===== DROPDOWN TEST =====")
            console.log("Value received:", value)
            console.log("Type:", typeof value)
            console.log("Is UUID:", /^[0-9a-f-]{36}$/i.test(value))
            setSelected(value)
          }}
        >
          <SelectTrigger className="bg-white/10 border-white/20">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Industries</SelectItem>
            {industries.map((industry) => (
              <SelectItem key={industry.id} value={industry.id}>
                {industry.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <div className="mt-4 p-4 bg-white/5 rounded">
          <p className="text-sm text-gray-400">Selected value:</p>
          <p className="font-mono text-green-400">{selected}</p>
        </div>

        <div className="mt-4 p-4 bg-white/5 rounded">
          <p className="text-sm text-gray-400">Loaded industries:</p>
          {industries.slice(0, 3).map((ind) => (
            <div key={ind.id} className="text-xs font-mono mt-2">
              <span className="text-blue-400">{ind.name}</span>: {ind.id}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
