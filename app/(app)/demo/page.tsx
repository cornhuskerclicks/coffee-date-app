"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useState } from "react"
import { useToast } from "@/hooks/use-toast"
import { Copy, ExternalLink } from 'lucide-react'

export default function CoffeeDateDemoPage() {
  const [businessName, setBusinessName] = useState("")
  const [audience, setAudience] = useState("")
  const [offer, setOffer] = useState("")
  const [tone, setTone] = useState("confident")
  const [generated, setGenerated] = useState(false)
  const { toast } = useToast()

  const handleGenerate = () => {
    if (!businessName || !audience || !offer) {
      toast({
        title: "Missing Information",
        description: "Please fill in all fields",
        variant: "destructive",
      })
      return
    }

    setGenerated(true)
    toast({
      title: "Demo Generated",
      description: "Your Coffee Date Demo has been created",
    })
  }

  const handleCopy = () => {
    toast({
      title: "Copied",
      description: "Demo content copied to clipboard",
    })
  }

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Coffee Date Demo 2.0</h1>
        <p className="text-muted-foreground">Generate personalized demo content for your business</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Input Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="business">Business Name</Label>
              <Input
                id="business"
                placeholder="Enter business name"
                value={businessName}
                onChange={(e) => setBusinessName(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="audience">Target Audience</Label>
              <Input
                id="audience"
                placeholder="Who do you help?"
                value={audience}
                onChange={(e) => setAudience(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="offer">Main Offer</Label>
              <Textarea
                id="offer"
                placeholder="What's your main offer?"
                value={offer}
                onChange={(e) => setOffer(e.target.value)}
                rows={4}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="tone">Tone</Label>
              <Select value={tone} onValueChange={setTone}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="simple">Simple</SelectItem>
                  <SelectItem value="confident">Confident</SelectItem>
                  <SelectItem value="warm">Warm</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Button onClick={handleGenerate} className="w-full">
              Generate Demo
            </Button>
          </CardContent>
        </Card>

        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Before AI</CardTitle>
            </CardHeader>
            <CardContent>
              {generated ? (
                <div className="space-y-4">
                  <p className="text-sm text-muted-foreground">
                    Manual outreach, generic messages, low response rates. Hours spent on follow-ups with minimal results.
                  </p>
                  <div className="bg-muted p-4 rounded-lg">
                    <p className="text-sm">
                      "Hi [Name], I wanted to reach out about our services. We help businesses like yours. Let me know if you're interested."
                    </p>
                  </div>
                </div>
              ) : (
                <p className="text-muted-foreground text-center py-8">
                  Generate a demo to see the comparison
                </p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>After AI</CardTitle>
            </CardHeader>
            <CardContent>
              {generated ? (
                <div className="space-y-4">
                  <p className="text-sm text-muted-foreground">
                    Personalized AI-powered conversations that engage leads, qualify interest, and book calls automatically.
                  </p>
                  <div className="bg-primary/10 p-4 rounded-lg border-2 border-primary">
                    <p className="text-sm">
                      "Hey [Name], I noticed {businessName} works with {audience}. We've helped similar businesses {offer}. Would you be open to a quick 15-minute call to explore how we could help you achieve similar results?"
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button onClick={handleCopy} variant="outline" className="flex-1">
                      <Copy className="h-4 w-4 mr-2" />
                      Copy Demo
                    </Button>
                    <Button className="flex-1">
                      <ExternalLink className="h-4 w-4 mr-2" />
                      Generate Link
                    </Button>
                  </div>
                </div>
              ) : (
                <p className="text-muted-foreground text-center py-8">
                  Fill in the details and generate
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
