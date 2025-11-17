"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Plus, FileText, Trash2, Download, Calendar, ExternalLink, Sparkles, ChevronDown, ChevronUp } from 'lucide-react'
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
    <div className="p-8 space-y-8 max-w-7xl mx-auto">
      <div className="relative overflow-hidden rounded-2xl">
        <div className="absolute inset-0 bg-gradient-radial from-[#3a8bff]/20 via-transparent to-transparent blur-3xl" />
        
        <Card className="border-[#3a8bff]/30 bg-black/60 backdrop-blur-xl relative">
          <CardHeader className="text-center pb-10 pt-12">
            <div className="mx-auto w-20 h-20 rounded-3xl bg-gradient-to-br from-[#3a8bff] to-[#2d6ed4] flex items-center justify-center mb-6 shadow-lg shadow-[#3a8bff]/30">
              <Sparkles className="h-10 w-10 text-white" />
            </div>
            <CardTitle className="text-5xl font-bold bg-gradient-to-br from-white via-white to-white/70 bg-clip-text text-transparent mb-4">
              AI Readiness Audits
            </CardTitle>
            <CardDescription className="text-lg mt-4 max-w-3xl mx-auto leading-relaxed text-white/70">
              Create comprehensive AI readiness assessments to help clients identify opportunities and build their transformation roadmap
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col items-center gap-6 pb-12">
            <div className="flex gap-4">
              <Link href="/audit/builder">
                <Button size="lg" className="bg-[#3a8bff] hover:bg-[#2d6ed4] text-white px-10 py-6 text-base shadow-lg shadow-[#3a8bff]/30 transition-all hover:shadow-xl hover:shadow-[#3a8bff]/40">
                  <Plus className="h-5 w-5 mr-2" />
                  Create New Audit
                </Button>
              </Link>
              <Button
                variant="outline"
                size="lg"
                onClick={() => window.open('https://docs.google.com/document/d/1QsJ94eM9DnXmxPZlFCj3rLWH1sqtWZewlU73YVT0VW0/edit?usp=sharing', '_blank')}
                className="border-white/20 hover:border-[#3a8bff]/60 hover:bg-[#3a8bff]/10 px-8 py-6 text-base transition-all"
              >
                <ExternalLink className="h-5 w-5 mr-2" />
                View Questions Doc
              </Button>
            </div>
            <p className="text-sm text-white/50">
              Use the questions doc to send to clients for completion
            </p>
          </CardContent>
        </Card>
      </div>

      <Card className="border-white/10 bg-black/40 backdrop-blur-sm hover:border-[#3a8bff]/30 transition-all">
        <CardHeader 
          className="cursor-pointer hover:bg-white/5 transition-colors rounded-t-xl"
          onClick={() => setTipsExpanded(!tipsExpanded)}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-xl bg-gradient-to-br from-[#3a8bff]/20 to-[#3a8bff]/5 border border-[#3a8bff]/30">
                <Sparkles className="h-6 w-6 text-[#3a8bff]" />
              </div>
              <div>
                <CardTitle className="text-2xl">Top Tips for Delivering Successful Audits</CardTitle>
                <CardDescription className="mt-1">13 principles to keep in mind when conducting audits</CardDescription>
              </div>
            </div>
            {tipsExpanded ? (
              <ChevronUp className="h-6 w-6 text-[#3a8bff] transition-transform" />
            ) : (
              <ChevronDown className="h-6 w-6 text-[#3a8bff] transition-transform" />
            )}
          </div>
        </CardHeader>
        
        {tipsExpanded && (
          <CardContent className="space-y-4 pt-0 pb-8">
            <div className="grid md:grid-cols-2 gap-5">
              <div className="space-y-3 p-5 rounded-xl bg-gradient-to-br from-white/5 to-white/[0.02] border border-white/10 hover:border-[#3a8bff]/30 transition-all">
                <h4 className="font-semibold text-[#3a8bff] text-base">1. Start with business goals, not AI opportunities</h4>
                <p className="text-white/60 text-sm leading-relaxed">Always begin by asking what the business is trying to achieve this quarter and this year. Only then map AI improvements to those goals.</p>
              </div>
              
              <div className="space-y-3 p-5 rounded-xl bg-gradient-to-br from-white/5 to-white/[0.02] border border-white/10 hover:border-[#3a8bff]/30 transition-all">
                <h4 className="font-semibold text-[#3a8bff] text-base">2. Identify bottlenecks before proposing solutions</h4>
                <p className="text-white/60 text-sm leading-relaxed">Look for friction points in their workflow. A great audit focuses on problems before tools.</p>
              </div>

              <div className="space-y-3 p-5 rounded-xl bg-gradient-to-br from-white/5 to-white/[0.02] border border-white/10 hover:border-[#3a8bff]/30 transition-all">
                <h4 className="font-semibold text-[#3a8bff] text-base">3. Keep every question practical</h4>
                <p className="text-white/60 text-sm leading-relaxed">Avoid abstract or technical prompts. Ask questions that reveal how the business actually operates day to day.</p>
              </div>

              <div className="space-y-3 p-5 rounded-xl bg-gradient-to-br from-white/5 to-white/[0.02] border border-white/10 hover:border-[#3a8bff]/30 transition-all">
                <h4 className="font-semibold text-[#3a8bff] text-base">4. Use numbers wherever possible</h4>
                <p className="text-white/60 text-sm leading-relaxed">Ask for approximate time per week, conversion rates, or rough numbers to show clear ROI later.</p>
              </div>

              <div className="space-y-3 p-5 rounded-xl bg-gradient-to-br from-white/5 to-white/[0.02] border border-white/10 hover:border-[#3a8bff]/30 transition-all">
                <h4 className="font-semibold text-[#3a8bff] text-base">5. Capture everything in their words</h4>
                <p className="text-white/60 text-sm leading-relaxed">When they describe a pain point, write it down verbatim. Their language should shape your final report.</p>
              </div>

              <div className="space-y-3 p-5 rounded-xl bg-gradient-to-br from-white/5 to-white/[0.02] border border-white/10 hover:border-[#3a8bff]/30 transition-all">
                <h4 className="font-semibold text-[#3a8bff] text-base">6. Don't jump to conclusions during the audit</h4>
                <p className="text-white/60 text-sm leading-relaxed">Stay neutral. Your job is to listen, map processes, and ask smart questions. Recommendations come later.</p>
              </div>

              <div className="space-y-3 p-5 rounded-xl bg-gradient-to-br from-white/5 to-white/[0.02] border border-white/10 hover:border-[#3a8bff]/30 transition-all">
                <h4 className="font-semibold text-[#3a8bff] text-base">7. Look for high-impact, low-complexity wins</h4>
                <p className="text-white/60 text-sm leading-relaxed">Simple automations or AI-driven workflows that save time within days create trust and momentum.</p>
              </div>

              <div className="space-y-3 p-5 rounded-xl bg-gradient-to-br from-white/5 to-white/[0.02] border border-white/10 hover:border-[#3a8bff]/30 transition-all">
                <h4 className="font-semibold text-[#3a8bff] text-base">8. Validate every AI opportunity</h4>
                <p className="text-white/60 text-sm leading-relaxed">Good use-cases must be Useful (solves real problems), Usable (team can adopt it), and Profitable (reduces cost or generates revenue).</p>
              </div>

              <div className="space-y-3 p-5 rounded-xl bg-gradient-to-br from-white/5 to-white/[0.02] border border-white/10 hover:border-[#3a8bff]/30 transition-all">
                <h4 className="font-semibold text-[#3a8bff] text-base">9. Prioritise a small number of clear recommendations</h4>
                <p className="text-white/60 text-sm leading-relaxed">Most businesses can only action 3-4 improvements in 90 days. Make them specific and actionable.</p>
              </div>

              <div className="space-y-3 p-5 rounded-xl bg-gradient-to-br from-white/5 to-white/[0.02] border border-white/10 hover:border-[#3a8bff]/30 transition-all">
                <h4 className="font-semibold text-[#3a8bff] text-base">10. Show quick proof, not long explanations</h4>
                <p className="text-white/60 text-sm leading-relaxed">Use short examples, quick prototypes, or simple text flows to demonstrate how AI might improve a process.</p>
              </div>

              <div className="space-y-3 p-5 rounded-xl bg-gradient-to-br from-white/5 to-white/[0.02] border border-white/10 hover:border-[#3a8bff]/30 transition-all">
                <h4 className="font-semibold text-[#3a8bff] text-base">11. Connect every recommendation to financial value</h4>
                <p className="text-white/60 text-sm leading-relaxed">Even if the numbers are rough, outline the potential savings or revenue uplift.</p>
              </div>

              <div className="space-y-3 p-5 rounded-xl bg-gradient-to-br from-white/5 to-white/[0.02] border border-white/10 hover:border-[#3a8bff]/30 transition-all">
                <h4 className="font-semibold text-[#3a8bff] text-base">12. Keep the tone collaborative, not prescriptive</h4>
                <p className="text-white/60 text-sm leading-relaxed">You are running a professional diagnostic. Make them feel understood, not corrected.</p>
              </div>

              <div className="space-y-3 p-5 rounded-xl bg-gradient-to-br from-white/5 to-white/[0.02] border border-white/10 hover:border-[#3a8bff]/30 transition-all md:col-span-2">
                <h4 className="font-semibold text-[#3a8bff] text-base">13. End with a clear next step</h4>
                <p className="text-white/60 text-sm leading-relaxed">Every great audit ends with one question: "What do you want to move forward with first?"</p>
              </div>
            </div>
          </CardContent>
        )}
      </Card>

      <div>
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-3xl font-bold">Your Audits</h2>
            <p className="text-base text-white/60 mt-1">Manage and review completed assessments</p>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-16">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#3a8bff] mx-auto mb-4" />
            <p className="text-white/60">Loading audits...</p>
          </div>
        ) : audits.length === 0 ? (
          <Card className="border-white/10 bg-black/40 backdrop-blur-sm">
            <CardContent className="flex flex-col items-center justify-center py-16">
              <div className="p-6 rounded-2xl bg-white/5 mb-6 border border-white/10">
                <FileText className="h-14 w-14 text-[#3a8bff]" />
              </div>
              <h3 className="text-2xl font-bold mb-3">No audits yet</h3>
              <p className="text-white/60 mb-8 text-center max-w-md leading-relaxed">
                Create your first AI readiness audit to help clients understand their AI transformation opportunities
              </p>
              <Link href="/audit/builder">
                <Button size="lg" className="bg-[#3a8bff] hover:bg-[#2d6ed4] shadow-lg shadow-[#3a8bff]/30">
                  <Plus className="h-5 w-5 mr-2" />
                  Create First Audit
                </Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {audits.map((audit) => (
              <Card key={audit.id} className="border-white/10 bg-black/40 backdrop-blur-sm hover:border-[#3a8bff]/40 hover:bg-black/60 hover:shadow-lg hover:shadow-[#3a8bff]/10 transition-all group">
                <CardHeader>
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <CardTitle className="text-lg line-clamp-1 group-hover:text-[#3a8bff] transition-colors">{audit.name}</CardTitle>
                      <CardDescription className="flex items-center gap-2 mt-3">
                        <Calendar className="h-4 w-4 flex-shrink-0" />
                        {new Date(audit.created_at).toLocaleDateString()}
                      </CardDescription>
                    </div>
                    <div className="p-2 rounded-lg bg-[#3a8bff]/10 border border-[#3a8bff]/30">
                      <FileText className="h-5 w-5 text-[#3a8bff]" />
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="text-sm text-white/60 px-3 py-2 bg-white/5 rounded-lg border border-white/10">
                      <span className="font-semibold text-white">{Object.keys(audit.responses).length}</span> questions answered
                    </div>
                    <div className="flex gap-2">
                      <Link href={`/audit/builder?id=${audit.id}`} className="flex-1">
                        <Button variant="outline" className="w-full border-white/20 hover:border-[#3a8bff]/60 hover:bg-[#3a8bff]/10">
                          View/Edit
                        </Button>
                      </Link>
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => handleDownload(audit)}
                        title="Download"
                        className="border-white/20 hover:border-[#3a8bff]/60 hover:bg-[#3a8bff]/10"
                      >
                        <Download className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => setDeleteId(audit.id)}
                        title="Delete"
                        className="border-white/20 hover:border-red-500/60 hover:bg-red-500/10"
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
