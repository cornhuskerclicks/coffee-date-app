"use client"

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
  const [loading, setLoading] = useState(false)
  const [auditId, setAuditId] = useState<string | null>(null)
  const { toast } = useToast()
  const router = useRouter()
  const searchParams = useSearchParams()
  const supabase = createClient()

  const categories = getQuestionsByCategory()

  useEffect(() => {
    const id = searchParams.get('id')
    if (id) {
      loadAudit(id)
    }
  }, [searchParams])

  async function loadAudit(id: string) {
    try {
      const { data, error } = await supabase
        .from('audits')
        .select('*')
        .eq('id', id)
        .single()

      if (error) throw error

      setAuditId(id)
      setAuditName(data.name)
      setResponses(data.responses)
    } catch (error) {
      console.error('[v0] Error loading audit:', error)
      toast({
        title: "Error",
        description: "Failed to load audit",
        variant: "destructive",
      })
    }
  }

  async function handleSave() {
    if (!auditName.trim()) {
      toast({
        title: "Missing Information",
        description: "Please enter a business name",
        variant: "destructive",
      })
      return
    }

    setLoading(true)

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

        toast({
          title: "Saved",
          description: "Audit updated successfully",
        })
      } else {
        // Create new audit
        const { data, error } = await supabase
          .from('audits')
          .insert({
            name: auditName,
            responses,
          })
          .select()
          .single()

        if (error) throw error

        setAuditId(data.id)
        toast({
          title: "Saved",
          description: "Audit created successfully",
        })
      }
    } catch (error) {
      console.error('[v0] Error saving audit:', error)
      toast({
        title: "Error",
        description: "Failed to save audit",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  function handleDownload() {
    if (!auditName.trim()) {
      toast({
        title: "Missing Information",
        description: "Please save the audit first",
        variant: "destructive",
      })
      return
    }

    const content = `AI READINESS AUDIT\n\nBusiness: ${auditName}\nDate: ${new Date().toLocaleDateString()}\n\n` +
      categories.map(([category, questions]) =>
        `${category.toUpperCase()}\n\n` +
        questions.map(q => `${q.question}\n${responses[q.id] || '[Not answered]'}\n`).join('\n')
      ).join('\n\n')

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

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/audit">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold">
              {auditId ? 'Edit Audit' : 'New Audit'}
            </h1>
            <p className="text-muted-foreground">Complete the AI readiness assessment</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleDownload}>
            <Download className="h-4 w-4 mr-2" />
            Download
          </Button>
          <Button onClick={handleSave} disabled={loading}>
            <Save className="h-4 w-4 mr-2" />
            {loading ? 'Saving...' : 'Save Audit'}
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Business Information</CardTitle>
          <CardDescription>Enter the business name for this audit</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <Label htmlFor="auditName">Business Name *</Label>
            <Input
              id="auditName"
              placeholder="Enter business name..."
              value={auditName}
              onChange={(e) => setAuditName(e.target.value)}
            />
          </div>
        </CardContent>
      </Card>

      {categories.map(([category, questions]) => (
        <Card key={category}>
          <CardHeader>
            <CardTitle>{category}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {questions.map((question) => (
              <div key={question.id} className="space-y-2">
                <Label htmlFor={question.id}>{question.question}</Label>
                {question.type === 'text' ? (
                  <Input
                    id={question.id}
                    value={responses[question.id] || ''}
                    onChange={(e) =>
                      setResponses({ ...responses, [question.id]: e.target.value })
                    }
                    placeholder="Your answer..."
                  />
                ) : (
                  <Textarea
                    id={question.id}
                    value={responses[question.id] || ''}
                    onChange={(e) =>
                      setResponses({ ...responses, [question.id]: e.target.value })
                    }
                    placeholder="Your answer..."
                    rows={3}
                  />
                )}
              </div>
            ))}
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

export default function AuditBuilderPage() {
  return (
    <Suspense fallback={
      <div className="p-6">
        <p className="text-muted-foreground">Loading audit builder...</p>
      </div>
    }>
      <AuditBuilderContent />
    </Suspense>
  )
}
