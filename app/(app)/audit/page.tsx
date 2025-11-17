"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { FileText, Download, Copy, RotateCw } from 'lucide-react'
import { useState } from "react"
import { useToast } from "@/hooks/use-toast"
import { Progress } from "@/components/ui/progress"

export default function AIAuditPage() {
  const [businessName, setBusinessName] = useState("")
  const [website, setWebsite] = useState("")
  const [goals, setGoals] = useState("")
  const [generated, setGenerated] = useState(false)
  const { toast } = useToast()

  const handleGenerate = () => {
    if (!businessName || !website) {
      toast({
        title: "Missing Information",
        description: "Please fill in required fields",
        variant: "destructive",
      })
      return
    }

    setGenerated(true)
    toast({
      title: "Audit Generated",
      description: "Your AI audit is ready",
    })
  }

  const handleExport = () => {
    toast({
      title: "Exporting PDF",
      description: "Your audit is being prepared for download",
    })
  }

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">AI Audit Generator</h1>
        <p className="text-muted-foreground">Generate comprehensive AI readiness audits for clients</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Business Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="business">Business Name *</Label>
              <Input
                id="business"
                placeholder="Enter business name"
                value={businessName}
                onChange={(e) => setBusinessName(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="website">Website *</Label>
              <Input
                id="website"
                type="url"
                placeholder="https://example.com"
                value={website}
                onChange={(e) => setWebsite(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="goals">Primary Goals</Label>
              <Textarea
                id="goals"
                placeholder="What are the main business goals?"
                value={goals}
                onChange={(e) => setGoals(e.target.value)}
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="crm">Current CRM</Label>
              <Input id="crm" placeholder="e.g., Salesforce, HubSpot" />
            </div>

            <div className="space-y-2">
              <Label htmlFor="traffic">Traffic Sources</Label>
              <Input id="traffic" placeholder="e.g., Google Ads, SEO, Social" />
            </div>

            <div className="space-y-2">
              <Label htmlFor="sales">Sales Process</Label>
              <Textarea id="sales" placeholder="Describe your sales process" rows={3} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="challenges">Biggest Challenges</Label>
              <Textarea id="challenges" placeholder="What are the main pain points?" rows={3} />
            </div>

            <Button onClick={handleGenerate} className="w-full">
              Generate AI Audit
            </Button>
          </CardContent>
        </Card>

        <div className="lg:col-span-2 space-y-4">
          {generated ? (
            <>
              <div className="flex gap-2">
                <Button onClick={handleExport} variant="outline" className="flex-1">
                  <Download className="h-4 w-4 mr-2" />
                  Export PDF
                </Button>
                <Button variant="outline" className="flex-1">
                  <Copy className="h-4 w-4 mr-2" />
                  Copy Summary
                </Button>
                <Button variant="outline" className="flex-1">
                  <RotateCw className="h-4 w-4 mr-2" />
                  Regenerate
                </Button>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle>AI Readiness Scorecard</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="text-center">
                    <div className="text-5xl font-bold text-primary mb-2">72/100</div>
                    <p className="text-muted-foreground">Overall AI Readiness Score</p>
                  </div>

                  <div className="space-y-4">
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Data Infrastructure</span>
                        <span className="font-medium">85/100</span>
                      </div>
                      <Progress value={85} />
                    </div>

                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Automation Potential</span>
                        <span className="font-medium">70/100</span>
                      </div>
                      <Progress value={70} />
                    </div>

                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>AI Integration Readiness</span>
                        <span className="font-medium">60/100</span>
                      </div>
                      <Progress value={60} />
                    </div>

                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Team Capability</span>
                        <span className="font-medium">75/100</span>
                      </div>
                      <Progress value={75} />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Transformation Map</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex gap-4 items-start">
                      <div className="h-10 w-10 rounded-full bg-primary flex items-center justify-center text-white font-bold">
                        1
                      </div>
                      <div className="flex-1">
                        <h4 className="font-semibold">Quick Wins (0-30 days)</h4>
                        <p className="text-sm text-muted-foreground">
                          Implement chatbot for lead qualification, automate email follow-ups
                        </p>
                      </div>
                    </div>

                    <div className="flex gap-4 items-start">
                      <div className="h-10 w-10 rounded-full bg-primary flex items-center justify-center text-white font-bold">
                        2
                      </div>
                      <div className="flex-1">
                        <h4 className="font-semibold">Medium Term (30-90 days)</h4>
                        <p className="text-sm text-muted-foreground">
                          Deploy AI-powered CRM integrations, predictive lead scoring
                        </p>
                      </div>
                    </div>

                    <div className="flex gap-4 items-start">
                      <div className="h-10 w-10 rounded-full bg-primary flex items-center justify-center text-white font-bold">
                        3
                      </div>
                      <div className="flex-1">
                        <h4 className="font-semibold">Long Term (90+ days)</h4>
                        <p className="text-sm text-muted-foreground">
                          Full AI sales automation, custom AI models for your business
                        </p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Revival Opportunity</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-3 gap-4 text-center">
                    <div>
                      <div className="text-2xl font-bold text-primary">347</div>
                      <div className="text-sm text-muted-foreground">Dead Leads</div>
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-secondary">$87K</div>
                      <div className="text-sm text-muted-foreground">Potential Revenue</div>
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-primary">15%</div>
                      <div className="text-sm text-muted-foreground">Est. Conversion</div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Key Recommendations</CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-3">
                    <li className="flex gap-3">
                      <FileText className="h-5 w-5 text-primary flex-shrink-0" />
                      <span className="text-sm">
                        Implement AI-powered lead qualification to reduce manual screening by 80%
                      </span>
                    </li>
                    <li className="flex gap-3">
                      <FileText className="h-5 w-5 text-primary flex-shrink-0" />
                      <span className="text-sm">
                        Deploy automated follow-up sequences to engage cold leads within 24 hours
                      </span>
                    </li>
                    <li className="flex gap-3">
                      <FileText className="h-5 w-5 text-primary flex-shrink-0" />
                      <span className="text-sm">
                        Integrate predictive analytics to identify high-value opportunities early
                      </span>
                    </li>
                    <li className="flex gap-3">
                      <FileText className="h-5 w-5 text-primary flex-shrink-0" />
                      <span className="text-sm">
                        Create personalized AI personas for different customer segments
                      </span>
                    </li>
                  </ul>
                </CardContent>
              </Card>
            </>
          ) : (
            <Card className="h-full flex items-center justify-center min-h-[600px]">
              <CardContent className="text-center space-y-4">
                <FileText className="h-16 w-16 mx-auto text-muted-foreground" />
                <h3 className="text-xl font-semibold">No Audit Generated Yet</h3>
                <p className="text-muted-foreground max-w-md">
                  Fill in the business information form and click "Generate AI Audit" to create a comprehensive report
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
