"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Loader2, Sparkles, Copy, Check, Search, ChevronDown } from "lucide-react"
import { generatePrompt } from "@/app/actions/generate-prompt"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { ScrollArea } from "@/components/ui/scroll-area"
import { createClient } from "@/lib/supabase/client"

interface PromptGeneratorFormProps {
  userId: string
}

interface Niche {
  id: string
  niche_name: string
  industry: {
    name: string
  }
}

interface Industry {
  id: string
  name: string
}

export default function PromptGeneratorForm({ userId }: PromptGeneratorFormProps) {
  const router = useRouter()
  const [isGenerating, setIsGenerating] = useState(false)
  const [generatedPrompt, setGeneratedPrompt] = useState<string | null>(null)
  const [generatedAndroidId, setGeneratedAndroidId] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  const [niches, setNiches] = useState<Niche[]>([])
  const [nicheSearchQuery, setNicheSearchQuery] = useState("")
  const [nichePopoverOpen, setNichePopoverOpen] = useState(false)
  const [industries, setIndustries] = useState<Industry[]>([])

  const [formData, setFormData] = useState({
    businessName: "",
    androidName: "",
    nicheId: "" as string | null,
    nicheName: "",
    customNiche: "",
    serviceType: "",
    shortService: "",
    nicheQuestion: "",
    valueProp: "",
    calendarLink: "",
    regionTone: "",
    industryTraining: "",
    website: "",
    openingHours: "",
    promiseLine: "",
  })

  const supabase = createClient()

  useEffect(() => {
    fetchNiches()
    loadIndustries()
  }, [])

  const loadIndustries = async () => {
    const { data, error } = await supabase.from("industries").select("id, name").order("name")
    if (!error && data) {
      setIndustries(data)
    }
  }

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

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const handleNicheSelect = (nicheId: string | null, nicheName: string) => {
    setFormData((prev) => ({
      ...prev,
      nicheId,
      nicheName,
      customNiche: nicheId === null && nicheName === "Other" ? "" : prev.customNiche,
      serviceType: nicheId ? nicheName : prev.customNiche || prev.serviceType,
    }))
    setNichePopoverOpen(false)
  }

  const handleGenerate = async () => {
    setIsGenerating(true)
    try {
      const dataToSend = {
        ...formData,
        niche: formData.nicheId ? formData.nicheName : formData.customNiche || formData.nicheName,
        serviceType: formData.nicheId ? formData.nicheName : formData.customNiche || formData.serviceType,
      }
      const result = await generatePrompt(dataToSend, userId)
      if (result.success && result.androidId && result.prompt) {
        setGeneratedPrompt(result.prompt)
        setGeneratedAndroidId(result.androidId)
      }
    } catch (error) {
      console.error("Error generating prompt:", error)
    } finally {
      setIsGenerating(false)
    }
  }

  const handleCopy = () => {
    if (generatedPrompt) {
      navigator.clipboard.writeText(generatedPrompt)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const handleUseInBuilder = () => {
    if (generatedAndroidId) {
      router.push(`/android/${generatedAndroidId}`)
    }
  }

  const isNicheValid = formData.nicheId !== "" || (formData.nicheName === "Other" && formData.customNiche.trim() !== "")
  const isFormValid = formData.businessName && formData.androidName && isNicheValid

  const filteredNiches = niches.filter(
    (niche) =>
      niche.niche_name.toLowerCase().includes(nicheSearchQuery.toLowerCase()) ||
      niche.industry.name.toLowerCase().includes(nicheSearchQuery.toLowerCase()),
  )

  if (generatedPrompt) {
    return (
      <Card className="glass glass-border">
        <CardHeader>
          <CardTitle className="text-white">Generated Coffee Date Prompt</CardTitle>
          <CardDescription className="text-white-secondary">Your Android is ready to use</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="bg-black/40 p-4 rounded-lg max-h-96 overflow-y-auto border border-white/10">
            <pre className="text-sm whitespace-pre-wrap font-mono text-white">{generatedPrompt}</pre>
          </div>

          <div className="flex gap-4">
            <Button
              onClick={handleCopy}
              variant="outline"
              className="flex-1 border-aether text-aether hover:bg-aether hover:text-white bg-transparent"
            >
              {copied ? <Check className="h-4 w-4 mr-2" /> : <Copy className="h-4 w-4 mr-2" />}
              {copied ? "Copied!" : "Copy Prompt"}
            </Button>
            <Button onClick={handleUseInBuilder} className="flex-1 bg-aether text-white hover:aether-glow">
              Use in Android Builder
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="glass glass-border">
      <CardHeader>
        <CardTitle className="text-white">Generate Coffee Date Prompt</CardTitle>
        <CardDescription className="text-white-secondary">Fill in the details to create your Android</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Business Name */}
        <div className="space-y-2">
          <Label className="text-white">Business Name</Label>
          <Input
            placeholder="e.g., BrightSky Roofing"
            value={formData.businessName}
            onChange={(e) => handleInputChange("businessName", e.target.value)}
            className="bg-black/40 border-white/10 text-white placeholder:text-white/30"
          />
          <p className="text-xs text-zinc-500">The name of the business this Android will represent</p>
        </div>

        {/* Android Name */}
        <div className="space-y-2">
          <Label className="text-white">Android Name</Label>
          <Input
            placeholder="e.g., Grace, Jasper, or Nova"
            value={formData.androidName}
            onChange={(e) => handleInputChange("androidName", e.target.value)}
            className="bg-black/40 border-white/10 text-white placeholder:text-white/30"
          />
          <p className="text-xs text-zinc-500">A friendly name for the AI assistant</p>
        </div>

        <div className="space-y-2">
          <Label className="text-white">Industry / Niche</Label>
          <Popover open={nichePopoverOpen} onOpenChange={setNichePopoverOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                role="combobox"
                className="w-full justify-between bg-black/40 border-white/10 text-white hover:bg-white/5"
              >
                {formData.nicheName || "Select a niche..."}
                <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-full p-0 bg-zinc-900 border-zinc-700" align="start">
              <div className="p-2 border-b border-zinc-700">
                <div className="flex items-center gap-2 px-2">
                  <Search className="h-4 w-4 text-zinc-400" />
                  <Input
                    placeholder="Search niches..."
                    value={nicheSearchQuery}
                    onChange={(e) => setNicheSearchQuery(e.target.value)}
                    className="border-0 bg-transparent text-white placeholder:text-zinc-500 focus-visible:ring-0"
                  />
                </div>
              </div>
              <ScrollArea className="h-[200px]">
                {industries.map((industry) => {
                  const industryNiches = filteredNiches.filter((n) => n.industry?.name === industry.name)
                  if (
                    industryNiches.length === 0 &&
                    !industry.name.toLowerCase().includes(nicheSearchQuery.toLowerCase())
                  )
                    return null
                  return (
                    <div key={industry.id}>
                      <div className="px-3 py-1.5 text-xs font-semibold text-zinc-400 bg-zinc-800/50">
                        {industry.name}
                      </div>
                      {industryNiches.map((niche) => (
                        <button
                          key={niche.id}
                          onClick={() => handleNicheSelect(niche.id, niche.niche_name)}
                          className="w-full px-3 py-2 text-left text-sm text-white hover:bg-zinc-800 transition-colors"
                        >
                          {niche.niche_name}
                        </button>
                      ))}
                    </div>
                  )
                })}
                <button
                  onClick={() => handleNicheSelect(null, "Other")}
                  className="w-full px-3 py-2 text-left text-sm text-white hover:bg-zinc-800 transition-colors border-t border-zinc-700"
                >
                  Other (Custom)
                </button>
              </ScrollArea>
            </PopoverContent>
          </Popover>
          <p className="text-xs text-zinc-500">Select the industry or niche this Android will specialize in</p>
        </div>

        {formData.nicheName === "Other" && (
          <div className="space-y-2">
            <Label className="text-white">Custom Niche</Label>
            <Input
              placeholder="e.g., Pet Grooming Services"
              value={formData.customNiche}
              onChange={(e) => handleInputChange("customNiche", e.target.value)}
              className="bg-black/40 border-white/10 text-white placeholder:text-white/30"
            />
            <p className="text-xs text-zinc-500">Describe your specific niche or industry</p>
          </div>
        )}

        {/* Service Type */}
        <div className="space-y-2">
          <Label className="text-white">Service Type</Label>
          <Input
            placeholder="e.g., Commercial roofing installation and repair"
            value={formData.serviceType}
            onChange={(e) => handleInputChange("serviceType", e.target.value)}
            className="bg-black/40 border-white/10 text-white placeholder:text-white/30"
          />
          <p className="text-xs text-zinc-500">The main service or product offered</p>
        </div>

        {/* Short Service */}
        <div className="space-y-2">
          <Label className="text-white">Short Service Description</Label>
          <Input
            placeholder="e.g., roofing"
            value={formData.shortService}
            onChange={(e) => handleInputChange("shortService", e.target.value)}
            className="bg-black/40 border-white/10 text-white placeholder:text-white/30"
          />
          <p className="text-xs text-zinc-500">A one or two word description of the service</p>
        </div>

        {/* Niche Question */}
        <div className="space-y-2">
          <Label className="text-white">Niche-Specific Question</Label>
          <Input
            placeholder="e.g., What type of roofing material are you considering?"
            value={formData.nicheQuestion}
            onChange={(e) => handleInputChange("nicheQuestion", e.target.value)}
            className="bg-black/40 border-white/10 text-white placeholder:text-white/30"
          />
          <p className="text-xs text-zinc-500">A qualifying question specific to this industry</p>
        </div>

        {/* Value Prop */}
        <div className="space-y-2">
          <Label className="text-white">Value Proposition</Label>
          <Input
            placeholder="e.g., 25-year warranty and free annual inspections"
            value={formData.valueProp}
            onChange={(e) => handleInputChange("valueProp", e.target.value)}
            className="bg-black/40 border-white/10 text-white placeholder:text-white/30"
          />
          <p className="text-xs text-zinc-500">The main benefit or unique selling point</p>
        </div>

        {/* Calendar Link */}
        <div className="space-y-2">
          <Label className="text-white">Calendar Booking Link</Label>
          <Input
            placeholder="e.g., https://calendly.com/your-business"
            value={formData.calendarLink}
            onChange={(e) => handleInputChange("calendarLink", e.target.value)}
            className="bg-black/40 border-white/10 text-white placeholder:text-white/30"
          />
          <p className="text-xs text-zinc-500">Link where leads can book appointments</p>
        </div>

        {/* Region Tone */}
        <div className="space-y-2">
          <Label className="text-white">Region / Tone</Label>
          <Input
            placeholder="e.g., Midwest, friendly and professional"
            value={formData.regionTone}
            onChange={(e) => handleInputChange("regionTone", e.target.value)}
            className="bg-black/40 border-white/10 text-white placeholder:text-white/30"
          />
          <p className="text-xs text-zinc-500">Geographic region and communication style</p>
        </div>

        {/* Industry Training */}
        <div className="space-y-2">
          <Label className="text-white">Industry-Specific Training</Label>
          <Input
            placeholder="e.g., Common roofing issues, material types, pricing factors"
            value={formData.industryTraining}
            onChange={(e) => handleInputChange("industryTraining", e.target.value)}
            className="bg-black/40 border-white/10 text-white placeholder:text-white/30"
          />
          <p className="text-xs text-zinc-500">Specific knowledge the Android should have</p>
        </div>

        {/* Website */}
        <div className="space-y-2">
          <Label className="text-white">Website URL</Label>
          <Input
            placeholder="e.g., https://brightskyroofing.com"
            value={formData.website}
            onChange={(e) => handleInputChange("website", e.target.value)}
            className="bg-black/40 border-white/10 text-white placeholder:text-white/30"
          />
          <p className="text-xs text-zinc-500">The business website for reference</p>
        </div>

        {/* Opening Hours */}
        <div className="space-y-2">
          <Label className="text-white">Opening Hours</Label>
          <Input
            placeholder="e.g., Mon-Fri 8am-6pm, Sat 9am-2pm"
            value={formData.openingHours}
            onChange={(e) => handleInputChange("openingHours", e.target.value)}
            className="bg-black/40 border-white/10 text-white placeholder:text-white/30"
          />
          <p className="text-xs text-zinc-500">Business hours of operation</p>
        </div>

        {/* Promise Line */}
        <div className="space-y-2">
          <Label className="text-white">Promise Line</Label>
          <Input
            placeholder="e.g., We'll have a quote to you within 24 hours"
            value={formData.promiseLine}
            onChange={(e) => handleInputChange("promiseLine", e.target.value)}
            className="bg-black/40 border-white/10 text-white placeholder:text-white/30"
          />
          <p className="text-xs text-zinc-500">A commitment or promise to potential customers</p>
        </div>

        {/* Generate Button */}
        <Button
          onClick={handleGenerate}
          className="w-full bg-aether text-white hover:aether-glow"
          disabled={isGenerating || !isFormValid}
        >
          {isGenerating ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Generating Prompt...
            </>
          ) : (
            <>
              <Sparkles className="h-4 w-4 mr-2" />
              Generate Prompt
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  )
}
