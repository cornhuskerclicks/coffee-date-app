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

export default function PromptGeneratorForm({ userId }: PromptGeneratorFormProps) {
  const router = useRouter()
  const [isGenerating, setIsGenerating] = useState(false)
  const [generatedPrompt, setGeneratedPrompt] = useState<string | null>(null)
  const [generatedAndroidId, setGeneratedAndroidId] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  const [niches, setNiches] = useState<Niche[]>([])
  const [nicheSearchQuery, setNicheSearchQuery] = useState("")
  const [nichePopoverOpen, setNichePopoverOpen] = useState(false)

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

  useEffect(() => {
    fetchNiches()
  }, [])

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
      // Also set serviceType for compatibility
      serviceType: nicheId ? nicheName : prev.serviceType,
    }))
    setNichePopoverOpen(false)
  }

  const handleGenerate = async () => {
    setIsGenerating(true)
    try {
      const dataToSend = {
        ...formData,
        // Use custom niche if "Other" selected
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
        <CardTitle className="text-white">Coffee Date Prompt Generator</CardTitle>
        <CardDescription className="text-white-secondary">
          Fill in your business details to generate a custom Android prompt
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <Label htmlFor="businessName" className="text-white">
              Business Name <span className="text-red-400">*</span>
            </Label>
            <Input
              id="businessName"
              placeholder="e.g. Omaha Capital Investments"
              value={formData.businessName}
              onChange={(e) => handleInputChange("businessName", e.target.value)}
              className="bg-white/5 border-white/10 text-white placeholder:text-white/50"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="androidName" className="text-white">
              Android Name (Admin Persona) <span className="text-red-400">*</span>
            </Label>
            <Input
              id="androidName"
              placeholder="e.g. Grace"
              value={formData.androidName}
              onChange={(e) => handleInputChange("androidName", e.target.value)}
              className="bg-white/5 border-white/10 text-white placeholder:text-white/50"
            />
          </div>

          <div className="space-y-2 md:col-span-2">
            <Label className="text-white">
              Business Niche <span className="text-red-400">*</span>
            </Label>
            <Popover open={nichePopoverOpen} onOpenChange={setNichePopoverOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  role="combobox"
                  aria-expanded={nichePopoverOpen}
                  className="w-full justify-between bg-white/5 border-white/10 text-white hover:bg-white/10 hover:text-white"
                >
                  {formData.nicheName || "Select a niche..."}
                  <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[400px] p-0 bg-black border-white/10" align="start">
                <div className="p-2 border-b border-white/10">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-white/40" />
                    <Input
                      placeholder="Search niches..."
                      value={nicheSearchQuery}
                      onChange={(e) => setNicheSearchQuery(e.target.value)}
                      className="pl-9 bg-white/5 border-white/10 text-white placeholder:text-white/40"
                    />
                  </div>
                </div>
                <ScrollArea className="h-[250px]">
                  <div className="p-2 space-y-1">
                    {/* Other option at top */}
                    <button
                      onClick={() => handleNicheSelect(null, "Other")}
                      className={`w-full text-left p-3 rounded-lg transition-colors ${
                        formData.nicheName === "Other"
                          ? "bg-[#00A8FF]/20 border border-[#00A8FF]/50"
                          : "hover:bg-white/10 border border-transparent"
                      }`}
                    >
                      <div className="font-medium text-white">Other</div>
                      <div className="text-sm text-white/60">Enter a custom niche</div>
                    </button>

                    {filteredNiches.map((niche) => (
                      <button
                        key={niche.id}
                        onClick={() => handleNicheSelect(niche.id, niche.niche_name)}
                        className={`w-full text-left p-3 rounded-lg transition-colors ${
                          formData.nicheId === niche.id
                            ? "bg-[#00A8FF]/20 border border-[#00A8FF]/50"
                            : "hover:bg-white/10 border border-transparent"
                        }`}
                      >
                        <div className="font-medium text-white">{niche.niche_name}</div>
                        <div className="text-sm text-white/60">{niche.industry.name}</div>
                      </button>
                    ))}
                  </div>
                </ScrollArea>
              </PopoverContent>
            </Popover>
          </div>

          {formData.nicheName === "Other" && (
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="customNiche" className="text-white">
                Custom Niche <span className="text-red-400">*</span>
              </Label>
              <Input
                id="customNiche"
                placeholder="Describe the niche..."
                value={formData.customNiche}
                onChange={(e) => handleInputChange("customNiche", e.target.value)}
                className="bg-white/5 border-white/10 text-white placeholder:text-white/50"
              />
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="shortService" className="text-white">
              Short Service Description
            </Label>
            <Input
              id="shortService"
              placeholder="help selling or investing in property"
              value={formData.shortService}
              onChange={(e) => handleInputChange("shortService", e.target.value)}
              className="bg-white/5 border-white/10 text-white placeholder:text-white/50"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="valueProp" className="text-white">
              Value Proposition
            </Label>
            <Input
              id="valueProp"
              placeholder="beat any fair market price and close fast"
              value={formData.valueProp}
              onChange={(e) => handleInputChange("valueProp", e.target.value)}
              className="bg-white/5 border-white/10 text-white placeholder:text-white/50"
            />
          </div>

          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="nicheQuestion" className="text-white">
              Niche Question 1
            </Label>
            <Input
              id="nicheQuestion"
              placeholder="Are you looking to sell a property or find investment opportunities?"
              value={formData.nicheQuestion}
              onChange={(e) => handleInputChange("nicheQuestion", e.target.value)}
              className="bg-white/5 border-white/10 text-white placeholder:text-white/50"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="calendarLink" className="text-white">
              Calendar Link
            </Label>
            <Input
              id="calendarLink"
              placeholder="https://yourcalendarlink.com"
              value={formData.calendarLink}
              onChange={(e) => handleInputChange("calendarLink", e.target.value)}
              className="bg-white/5 border-white/10 text-white placeholder:text-white/50"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="regionTone" className="text-white">
              Region / Tone
            </Label>
            <Input
              id="regionTone"
              placeholder="Omaha dialect"
              value={formData.regionTone}
              onChange={(e) => handleInputChange("regionTone", e.target.value)}
              className="bg-white/5 border-white/10 text-white placeholder:text-white/50"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="industryTraining" className="text-white">
              Industry Training
            </Label>
            <Input
              id="industryTraining"
              placeholder="Real Estate"
              value={formData.industryTraining}
              onChange={(e) => handleInputChange("industryTraining", e.target.value)}
              className="bg-white/5 border-white/10 text-white placeholder:text-white/50"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="website" className="text-white">
              Website URL
            </Label>
            <Input
              id="website"
              placeholder="https://example.com"
              value={formData.website}
              onChange={(e) => handleInputChange("website", e.target.value)}
              className="bg-white/5 border-white/10 text-white placeholder:text-white/50"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="openingHours" className="text-white">
              Opening Hours
            </Label>
            <Input
              id="openingHours"
              placeholder="Mon–Fri 9–6 CST"
              value={formData.openingHours}
              onChange={(e) => handleInputChange("openingHours", e.target.value)}
              className="bg-white/5 border-white/10 text-white placeholder:text-white/50"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="promiseLine" className="text-white">
              Promise Line
            </Label>
            <Input
              id="promiseLine"
              placeholder="Fast, fair and transparent deals."
              value={formData.promiseLine}
              onChange={(e) => handleInputChange("promiseLine", e.target.value)}
              className="bg-white/5 border-white/10 text-white placeholder:text-white/50"
            />
          </div>
        </div>

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
