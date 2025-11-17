"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Plus, FileText, Trash2, Download, Calendar, Search, ExternalLink } from 'lucide-react'
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
  const [searchQuery, setSearchQuery] = useState("")
  const [deleteId, setDeleteId] = useState<string | null>(null)
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

  const filteredAudits = audits.filter(audit =>
    audit.name.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">AI Readiness Audits</h1>
          <p className="text-muted-foreground">Create and manage comprehensive AI readiness assessments</p>
        </div>
        <div className="flex gap-3">
          <Button
            variant="outline"
            onClick={() => window.open('https://docs.google.com/document/d/1QsJ94eM9DnXmxPZlFCj3rLWH1sqtWZewlU73YVT0VW0/edit?usp=sharing', '_blank')}
            className="border-[#00A8FF]/20 hover:border-[#00A8FF]/40 hover:bg-[#00A8FF]/5"
          >
            <ExternalLink className="h-4 w-4 mr-2" />
            View Audit Questions
          </Button>
          <Link href="/audit/builder">
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              New Audit
            </Button>
          </Link>
        </div>
      </div>

      <Card>
        <CardContent className="pt-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search audits by business name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {loading ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground">Loading audits...</p>
        </div>
      ) : filteredAudits.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <FileText className="h-16 w-16 text-muted-foreground mb-4" />
            <h3 className="text-xl font-semibold mb-2">
              {searchQuery ? "No audits found" : "No audits yet"}
            </h3>
            <p className="text-muted-foreground mb-6 text-center max-w-md">
              {searchQuery 
                ? "Try adjusting your search query"
                : "Create your first AI readiness audit to help clients understand their AI transformation opportunities"
              }
            </p>
            {!searchQuery && (
              <Link href="/audit/builder">
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Create First Audit
                </Button>
              </Link>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredAudits.map((audit) => (
            <Card key={audit.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-lg line-clamp-1">{audit.name}</CardTitle>
                    <CardDescription className="flex items-center gap-2 mt-2">
                      <Calendar className="h-3 w-3" />
                      {new Date(audit.created_at).toLocaleDateString()}
                    </CardDescription>
                  </div>
                  <FileText className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="text-sm text-muted-foreground">
                    {Object.keys(audit.responses).length} questions answered
                  </div>
                  <div className="flex gap-2">
                    <Link href={`/audit/builder?id=${audit.id}`} className="flex-1">
                      <Button variant="outline" className="w-full">
                        View/Edit
                      </Button>
                    </Link>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => handleDownload(audit)}
                      title="Download"
                    >
                      <Download className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => setDeleteId(audit.id)}
                      title="Delete"
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
