"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Plus, FileText, Trash2, Download, Calendar, ExternalLink, Lightbulb, ChevronDown, ChevronUp } from 'lucide-react'
import { useState, useEffect } from "react"
import { useToast } from "@/hooks/use-toast"
import { createClient } from "@/lib/supabase/client"
import Link from "next/link"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

interface Audit {
  id: string
  name: string
  created_at: string
  updated_at: string
  responses: Record<string, string>
}

export default function AuditHomePage() {
  const [audits, setAudits] = useState<Audit[]>([])
  const [loading, setLoading] = useState(true)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [tipsExpanded, setTipsExpanded] = useState(false)
  const { toast } = useToast()
  const supabase = createClient()

  useEffect(() => {
    loadAudits()
  }, [])

  async function loadAudits() {
    try {
      const { data, error } = await supabase
        .from('audits')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error
      setAudits(data || [])
    } catch (error) {
      console.error('[v0] Error loading audits:', error)
      toast({
        title: "Error",
        description: "Failed to load audits",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  async function handleDelete(id: string) {
    try {
      const { error } = await supabase
        .from('audits')
        .delete()
        .eq('id', id)

      if (error) throw error

      setAudits(audits.filter(a => a.id !== id))
      toast({
        title: "Deleted",
        description: "Audit deleted successfully",
      })
    } catch (error) {
      console.error('[v0] Error deleting audit:', error)
      toast({
        title: "Error",
        description: "Failed to delete audit",
        variant: "destructive",
      })
    }
    setDeleteId(null)
  }

  function handleDownload(audit: Audit) {
    const content = `AI READINESS AUDIT\n\nBusiness: ${audit.name}\nDate: ${new Date(audit.created_at).toLocaleDateString()}\n\n${Object.entries(audit.responses).map(([key, value]) => `${key}:\n${value}\n`).join('\n')}`
    
    const blob = new Blob([content], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${audit.name.replace(/\s+/g, '-')}-audit.txt`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)

    toast({
      title: "Downloaded",
      description: "Audit downloaded successfully",
    })
  }


  return (
    <div className="p-6 space-y-8">
      <div className="relative">
        <div className="absolute inset-0 bg-gradient-radial from-[#00A8FF]/10 via-transparent to-transparent blur-3xl -z-10" />
        
        <Card className="border-[#00A8FF]/30 bg-black/40 backdrop-blur-sm">
          <CardHeader className="text-center pb-8">
            <div className="mx-auto w-16 h-16 rounded-2xl bg-gradient-to-br from-[#00A8FF] to-[#0080CC] flex items-center justify-center mb-4">
              <FileText className="h-8 w-8 text-white" />
            </div>
            <CardTitle className="text-4xl font-bold bg-gradient-to-r from-white to-white/80 bg-clip-text text-transparent">
              AI Readiness Audits
            </CardTitle>
            <CardDescription className="text-base mt-3 max-w-2xl mx-auto">
              Create comprehensive AI readiness assessments to help clients identify opportunities and build their transformation roadmap
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col items-center gap-4 pb-8">
            <div className="flex gap-3">
              <Link href="/audit/builder">
                <Button size="lg" className="bg-[#00A8FF] hover:bg-[#0090E0] text-white px-8">
                  <Plus className="h-5 w-5 mr-2" />
                  Create New Audit
                </Button>
              </Link>
              <Button
                variant="outline"
                size="lg"
                onClick={() => window.open('https://docs.google.com/document/d/1QsJ94eM9DnXmxPZlFCj3rLWH1sqtWZewlU73YVT0VW0/edit?usp=sharing', '_blank')}
                className="border-white/20 hover:border-[#00A8FF]/40 hover:bg-[#00A8FF]/5"
              >
                <ExternalLink className="h-4 w-4 mr-2" />
                View Questions Doc
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              Use the questions doc to send to clients for completion
            </p>
          </CardContent>
        </Card>
      </div>

      <Card className="border-white/10 bg-black/40">
        <CardHeader 
          className="cursor-pointer hover:bg-white/5 transition-colors"
          onClick={() => setTipsExpanded(!tipsExpanded)}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-[#00A8FF]/10">
                <Lightbulb className="h-5 w-5 text-[#00A8FF]" />
              </div>
              <div>
                <CardTitle className="text-xl">Top Tips for Delivering Successful Audits</CardTitle>
                <CardDescription>13 principles to keep in mind when conducting audits</CardDescription>
              </div>
            </div>
            {tipsExpanded ? (
              <ChevronUp className="h-5 w-5 text-[#00A8FF]" />
            ) : (
              <ChevronDown className="h-5 w-5 text-[#00A8FF]" />
            )}
          </div>
        </CardHeader>
        
        {tipsExpanded && (
          <CardContent className="space-y-4 pt-0">
            <div className="grid md:grid-cols-2 gap-4 text-sm">
              <div className="space-y-2 p-4 rounded-lg bg-white/5 border border-white/10">
                <h4 className="font-semibold text-[#00A8FF]">1. Start with business goals, not AI opportunities</h4>
                <p className="text-muted-foreground">Always begin by asking what the business is trying to achieve this quarter and this year. Only then map AI improvements to those goals.</p>
              </div>
              
              <div className="space-y-2 p-4 rounded-lg bg-white/5 border border-white/10">
                <h4 className="font-semibold text-[#00A8FF]">2. Identify bottlenecks before proposing solutions</h4>
                <p className="text-muted-foreground">Look for friction points in their workflow. A great audit focuses on problems before tools.</p>
              </div>

              <div className="space-y-2 p-4 rounded-lg bg-white/5 border border-white/10">
                <h4 className="font-semibold text-[#00A8FF]">3. Keep every question practical</h4>
                <p className="text-muted-foreground">Avoid abstract or technical prompts. Ask questions that reveal how the business actually operates day to day.</p>
              </div>

              <div className="space-y-2 p-4 rounded-lg bg-white/5 border border-white/10">
                <h4 className="font-semibold text-[#00A8FF]">4. Use numbers wherever possible</h4>
                <p className="text-muted-foreground">Ask for approximate time per week, conversion rates, or rough numbers to show clear ROI later.</p>
              </div>

              <div className="space-y-2 p-4 rounded-lg bg-white/5 border border-white/10">
                <h4 className="font-semibold text-[#00A8FF]">5. Capture everything in their words</h4>
                <p className="text-muted-foreground">When they describe a pain point, write it down verbatim. Their language should shape your final report.</p>
              </div>

              <div className="space-y-2 p-4 rounded-lg bg-white/5 border border-white/10">
                <h4 className="font-semibold text-[#00A8FF]">6. Don't jump to conclusions during the audit</h4>
                <p className="text-muted-foreground">Stay neutral. Your job is to listen, map processes, and ask smart questions. Recommendations come later.</p>
              </div>

              <div className="space-y-2 p-4 rounded-lg bg-white/5 border border-white/10">
                <h4 className="font-semibold text-[#00A8FF]">7. Look for high-impact, low-complexity wins</h4>
                <p className="text-muted-foreground">Simple automations or AI-driven workflows that save time within days create trust and momentum.</p>
              </div>

              <div className="space-y-2 p-4 rounded-lg bg-white/5 border border-white/10">
                <h4 className="font-semibold text-[#00A8FF]">8. Validate every AI opportunity</h4>
                <p className="text-muted-foreground">Good use-cases must be Useful (solves real problems), Usable (team can adopt it), and Profitable (reduces cost or generates revenue).</p>
              </div>

              <div className="space-y-2 p-4 rounded-lg bg-white/5 border border-white/10">
                <h4 className="font-semibold text-[#00A8FF]">9. Prioritise a small number of clear recommendations</h4>
                <p className="text-muted-foreground">Most businesses can only action 3-4 improvements in 90 days. Make them specific and actionable.</p>
              </div>

              <div className="space-y-2 p-4 rounded-lg bg-white/5 border border-white/10">
                <h4 className="font-semibold text-[#00A8FF]">10. Show quick proof, not long explanations</h4>
                <p className="text-muted-foreground">Use short examples, quick prototypes, or simple text flows to demonstrate how AI might improve a process.</p>
              </div>

              <div className="space-y-2 p-4 rounded-lg bg-white/5 border border-white/10">
                <h4 className="font-semibold text-[#00A8FF]">11. Connect every recommendation to financial value</h4>
                <p className="text-muted-foreground">Even if the numbers are rough, outline the potential savings or revenue uplift.</p>
              </div>

              <div className="space-y-2 p-4 rounded-lg bg-white/5 border border-white/10">
                <h4 className="font-semibold text-[#00A8FF]">12. Keep the tone collaborative, not prescriptive</h4>
                <p className="text-muted-foreground">You are running a professional diagnostic. Make them feel understood, not corrected.</p>
              </div>

              <div className="space-y-2 p-4 rounded-lg bg-white/5 border border-white/10 md:col-span-2">
                <h4 className="font-semibold text-[#00A8FF]">13. End with a clear next step</h4>
                <p className="text-muted-foreground">Every great audit ends with one question: "What do you want to move forward with first?"</p>
              </div>
            </div>
          </CardContent>
        )}
      </Card>

      <div>
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold">Your Audits</h2>
            <p className="text-sm text-muted-foreground">Manage and review completed assessments</p>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">Loading audits...</p>
          </div>
        ) : audits.length === 0 ? (
          <Card className="border-white/10 bg-black/40">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <div className="p-4 rounded-full bg-white/5 mb-4">
                <FileText className="h-12 w-12 text-muted-foreground" />
              </div>
              <h3 className="text-xl font-semibold mb-2">No audits yet</h3>
              <p className="text-muted-foreground mb-6 text-center max-w-md">
                Create your first AI readiness audit to help clients understand their AI transformation opportunities
              </p>
              <Link href="/audit/builder">
                <Button className="bg-[#00A8FF] hover:bg-[#0090E0]">
                  <Plus className="h-4 w-4 mr-2" />
                  Create First Audit
                </Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {audits.map((audit) => (
              <Card key={audit.id} className="border-white/10 bg-black/40 hover:border-[#00A8FF]/30 hover:bg-black/60 transition-all">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-lg line-clamp-1">{audit.name}</CardTitle>
                      <CardDescription className="flex items-center gap-2 mt-2">
                        <Calendar className="h-3 w-3" />
                        {new Date(audit.created_at).toLocaleDateString()}
                      </CardDescription>
                    </div>
                    <FileText className="h-5 w-5 text-[#00A8FF] flex-shrink-0" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="text-sm text-muted-foreground">
                      {Object.keys(audit.responses).length} questions answered
                    </div>
                    <div className="flex gap-2">
                      <Link href={`/audit/builder?id=${audit.id}`} className="flex-1">
                        <Button variant="outline" className="w-full border-white/10 hover:border-[#00A8FF]/40 hover:bg-[#00A8FF]/5">
                          View/Edit
                        </Button>
                      </Link>
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => handleDownload(audit)}
                        title="Download"
                        className="border-white/10 hover:border-[#00A8FF]/40 hover:bg-[#00A8FF]/5"
                      >
                        <Download className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => setDeleteId(audit.id)}
                        title="Delete"
                        className="border-white/10 hover:border-red-500/40 hover:bg-red-500/5"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Audit</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this audit? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => deleteId && handleDelete(deleteId)}>
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
