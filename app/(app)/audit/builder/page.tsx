"use client"

// Version: 2.0.0 - Updated for Aether branding
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Save, ArrowLeft, Download } from 'lucide-react'
import { useState, useEffect, Suspense } from "react"
import { useToast } from "@/hooks/use-toast"
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from "@/lib/supabase/client"
import Link from "next/link"
import { AI_AUDIT_QUESTIONS, getQuestionsByCategory } from "@/lib/audit-questions"

function AuditBuilderContent() {
  const [auditName, setAuditName] = useState("")
  const [responses, setResponses] = useState<Record<string, string>>({})
  const [saving, setSaving] = useState(false)
  const [loading, setLoading] = useState(true)
  const { toast } = useToast()
  const router = useRouter()
  const searchParams = useSearchParams()
  const auditId = searchParams?.get('id')
  const supabase = createClient()

  useEffect(() => {
    if (auditId) {
      loadAudit(auditId)
    } else {
      setLoading(false)
    }
  }, [auditId])

  async function loadAudit(id: string) {
    try {
      const { data, error } = await supabase
        .from('audits')
        .select('*')
        .eq('id', id)
        .single()

      if (error) throw error

      if (data) {
        setAuditName(data.name)
        setResponses(data.responses || {})
      }
    } catch (error) {
      console.error('[v0] Error loading audit:', error)
      toast({
        title: "Error",
        description: "Failed to load audit",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  async function handleSave() {
    if (!auditName.trim()) {
      toast({
        title: "Validation Error",
        description: "Please enter a business name",
        variant: "destructive",
      })
      return
    }

    setSaving(true)

    try {
      if (auditId) {
        // Update existing audit
        const { error } = await supabase
          .from('audits')
          .update({
            name: auditName,
            responses,
            updated_at: new Date().toISOString(),
          })
          .eq('id', auditId)

        if (error) throw error
      } else {
        // Create new audit
        const { error } = await supabase
          .from('audits')
          .insert({
            name: auditName,
            responses,
          })

        if (error) throw error
      }

      toast({
        title: "Saved",
        description: "Audit saved successfully",
      })

      router.push('/audit')
    } catch (error) {
      console.error('[v0] Error saving audit:', error)
      toast({
        title: "Error",
        description: "Failed to save audit",
        variant: "destructive",
      })
    } finally {
      setSaving(false)
    }
  }

  function handleDownload() {
    const content = `AI READINESS AUDIT\n\nBusiness: ${auditName}\nDate: ${new Date().toLocaleDateString()}\n\n${Object.entries(responses).map(([key, value]) => {
      const question = AI_AUDIT_QUESTIONS.find(q => q.id === key)
      return `${question?.question || key}:\n${value}\n`
    }).join('\n')}`
    
    const blob = new Blob([content], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${auditName.replace(/\s+/g, '-')}-audit.txt`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)

    toast({
      title: "Downloaded",
      description: "Audit downloaded successfully",
    })
  }

  const categorizedQuestions = getQuestionsByCategory()

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-[400px]">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto" />
          <p className="text-muted-foreground">Loading audit...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-8 max-w-5xl mx-auto">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/audit">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-white">
              {auditId ? 'Edit Audit' : 'New Audit'}
            </h1>
            <p className="text-secondary mt-1">
              Complete the AI readiness assessment
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleDownload} disabled={!auditName} className="border-border hover:border-primary">
            <Download className="h-4 w-4 mr-2" />
            Download
          </Button>
          <Button onClick={handleSave} disabled={saving} className="bg-primary hover:bg-primary/90">
            <Save className="h-4 w-4 mr-2" />
            {saving ? 'Saving...' : 'Save Audit'}
          </Button>
        </div>
      </div>

      <Card className="bg-card border-border shadow-[0_2px_8px_rgba(0,0,0,0.5)]">
        <CardHeader className="pb-6">
          <CardTitle className="text-white text-xl">Business Information</CardTitle>
          <CardDescription className="text-secondary mt-2">Enter the business name for this audit</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <Label htmlFor="business-name" className="text-white text-sm font-medium">Business Name *</Label>
            <Input
              id="business-name"
              placeholder="Enter business name"
              value={auditName}
              onChange={(e) => setAuditName(e.target.value)}
              className="bg-muted border-border focus:border-primary"
            />
          </div>
        </CardContent>
      </Card>

      {categorizedQuestions.map(([category, questions]) => (
        <Card key={category} className="bg-card border-border shadow-[0_2px_8px_rgba(0,0,0,0.5)]">
          <CardHeader className="pb-6">
            <CardTitle className="text-white text-xl">{category}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-8">
            {questions.map((question) => (
              <div key={question.id} className="space-y-3">
                <Label htmlFor={question.id} className="text-white text-sm font-medium">{question.question}</Label>
                {question.type === 'text' ? (
                  <Input
                    id={question.id}
                    placeholder="Your answer..."
                    value={responses[question.id] || ''}
                    onChange={(e) =>
                      setResponses({ ...responses, [question.id]: e.target.value })
                    }
                    className="bg-muted border-border focus:border-primary"
                  />
                ) : (
                  <Textarea
                    id={question.id}
                    placeholder="Your answer..."
                    rows={4}
                    value={responses[question.id] || ''}
                    onChange={(e) =>
                      setResponses({ ...responses, [question.id]: e.target.value })
                    }
                    className="bg-muted border-border focus:border-primary"
                  />
                )}
              </div>
            ))}
          </CardContent>
        </Card>
      ))}

      <div className="flex justify-end gap-2 pt-4">
        <Link href="/audit">
          <Button variant="outline" className="border-border hover:border-primary">Cancel</Button>
        </Link>
        <Button onClick={handleSave} disabled={saving} className="bg-primary hover:bg-primary/90">
          <Save className="h-4 w-4 mr-2" />
          {saving ? 'Saving...' : 'Save Audit'}
        </Button>
      </div>
    </div>
  )
}

export default function AuditBuilderPage() {
  return (
    <Suspense fallback={
      <div className="p-6 flex items-center justify-center min-h-[400px]">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto" />
          <p className="text-muted-foreground">Loading audit builder...</p>
        </div>
      </div>
    }>
      <AuditBuilderContent />
    </Suspense>
  )
}
