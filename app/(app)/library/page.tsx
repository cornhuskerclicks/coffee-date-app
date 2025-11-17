"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Plus, Copy, Trash2, Edit, BookOpen } from 'lucide-react'
import { useState, useEffect } from "react"
import { useToast } from "@/hooks/use-toast"
import { createBrowserClient } from "@supabase/ssr"

interface Prompt {
  id: string
  name: string
  content: string
  category: string
  user_id?: string
  created_at?: string
  updated_at?: string
}

export default function PromptLibraryPage() {
  const [prompts, setPrompts] = useState<Prompt[]>([])
  const [selectedPrompt, setSelectedPrompt] = useState<Prompt | null>(null)
  const [isEditing, setIsEditing] = useState(false)
  const [editName, setEditName] = useState("")
  const [editContent, setEditContent] = useState("")
  const [editCategory, setEditCategory] = useState("")
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const { toast } = useToast()

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  useEffect(() => {
    loadPrompts()
  }, [])

  const loadPrompts = async () => {
    try {
      const { data, error } = await supabase
        .from('prompts')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error
      
      setPrompts(data || [])
    } catch (error) {
      console.error('Error loading prompts:', error)
      toast({
        title: "Error",
        description: "Failed to load prompts",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleSelectPrompt = (prompt: Prompt) => {
    setSelectedPrompt(prompt)
    setEditName(prompt.name)
    setEditContent(prompt.content)
    setEditCategory(prompt.category)
    setIsEditing(false)
  }

  const handleSave = async () => {
    if (!selectedPrompt) return
    
    setIsSaving(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      const updateData = {
        name: editName,
        content: editContent,
        category: editCategory,
        updated_at: new Date().toISOString()
      }

      const { error } = await supabase
        .from('prompts')
        .update(updateData)
        .eq('id', selectedPrompt.id)

      if (error) throw error

      // Update local state
      const updated = prompts.map((p) =>
        p.id === selectedPrompt.id ? { ...p, ...updateData } : p
      )
      setPrompts(updated)
      setSelectedPrompt({ ...selectedPrompt, ...updateData })
      setIsEditing(false)
      
      toast({
        title: "Saved",
        description: "Prompt updated successfully",
      })
    } catch (error) {
      console.error('Error saving prompt:', error)
      toast({
        title: "Error",
        description: "Failed to save prompt",
        variant: "destructive",
      })
    } finally {
      setIsSaving(false)
    }
  }

  const handleCopy = () => {
    navigator.clipboard.writeText(editContent)
    toast({
      title: "Copied",
      description: "Prompt copied to clipboard",
    })
  }

  const handleDelete = async () => {
    if (!selectedPrompt) return

    try {
      const { error } = await supabase
        .from('prompts')
        .delete()
        .eq('id', selectedPrompt.id)

      if (error) throw error

      setPrompts(prompts.filter((p) => p.id !== selectedPrompt.id))
      setSelectedPrompt(null)
      
      toast({
        title: "Deleted",
        description: "Prompt removed from library",
      })
    } catch (error) {
      console.error('Error deleting prompt:', error)
      toast({
        title: "Error",
        description: "Failed to delete prompt",
        variant: "destructive",
      })
    }
  }

  const handleNewPrompt = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      const newPrompt = {
        user_id: user.id,
        name: "New Prompt",
        content: "",
        category: "General",
      }

      const { data, error } = await supabase
        .from('prompts')
        .insert([newPrompt])
        .select()
        .single()

      if (error) throw error

      setPrompts([data, ...prompts])
      handleSelectPrompt(data)
      setIsEditing(true)
      
      toast({
        title: "Created",
        description: "New prompt created",
      })
    } catch (error) {
      console.error('Error creating prompt:', error)
      toast({
        title: "Error",
        description: "Failed to create prompt",
        variant: "destructive",
      })
    }
  }

  if (isLoading) {
    return (
      <div className="p-8 bg-black min-h-screen">
        <div className="flex items-center justify-center h-96">
          <p className="text-white/60">Loading prompts...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-black min-h-screen">
      <div className="p-8 space-y-6 max-w-7xl mx-auto">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-[32px] font-bold text-white">Prompt Library</h1>
            <p className="text-white/60 text-[16px]">Manage and organize your AI prompts</p>
          </div>
          <Button onClick={handleNewPrompt} className="bg-[#00A8FF] text-white hover:bg-[#00A8FF]/90">
            <Plus className="h-4 w-4 mr-2" />
            New Prompt
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="border border-white/10 bg-white/5">
            <CardHeader>
              <CardTitle className="text-white">Saved Prompts</CardTitle>
            </CardHeader>
            <CardContent>
              {prompts.length === 0 ? (
                <p className="text-sm text-white/60 text-center py-8">
                  No prompts yet. Click "New Prompt" to create one.
                </p>
              ) : (
                <div className="space-y-2">
                  {prompts.map((prompt) => (
                    <div
                      key={prompt.id}
                      onClick={() => handleSelectPrompt(prompt)}
                      className={`p-3 rounded-lg border cursor-pointer transition-all ${
                        selectedPrompt?.id === prompt.id
                          ? "bg-[#00A8FF] text-white border-[#00A8FF]"
                          : "bg-white/5 border-white/10 text-white hover:bg-white/10 hover:border-[#00A8FF]/50"
                      }`}
                    >
                      <div className="font-medium">{prompt.name}</div>
                      <div className="text-xs opacity-80">{prompt.category}</div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <div className="lg:col-span-2">
            {selectedPrompt ? (
              <Card className="border border-white/10 bg-white/5">
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle className="text-white">{isEditing ? "Edit Prompt" : selectedPrompt.name}</CardTitle>
                  <div className="flex gap-2">
                    {!isEditing && (
                      <>
                        <Button size="sm" variant="outline" onClick={() => setIsEditing(true)} className="border-white/10 text-white hover:bg-white/10">
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button size="sm" variant="outline" onClick={handleCopy} className="border-white/10 text-white hover:bg-white/10">
                          <Copy className="h-4 w-4" />
                        </Button>
                        <Button size="sm" variant="outline" onClick={handleDelete} className="border-white/10 text-red-400 hover:bg-red-500/10">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="name" className="text-white">Prompt Name</Label>
                    <Input
                      id="name"
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      disabled={!isEditing}
                      className="bg-white/5 border-white/10 text-white disabled:opacity-50"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="category" className="text-white">Category</Label>
                    <Input
                      id="category"
                      value={editCategory}
                      onChange={(e) => setEditCategory(e.target.value)}
                      disabled={!isEditing}
                      placeholder="e.g. Sales, Demo, Revival"
                      className="bg-white/5 border-white/10 text-white placeholder:text-white/40 disabled:opacity-50"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="content" className="text-white">Prompt Content</Label>
                    <Textarea
                      id="content"
                      value={editContent}
                      onChange={(e) => setEditContent(e.target.value)}
                      rows={12}
                      disabled={!isEditing}
                      className="bg-white/5 border-white/10 text-white disabled:opacity-50"
                    />
                  </div>

                  {isEditing && (
                    <div className="flex gap-2">
                      <Button onClick={handleSave} className="flex-1 bg-[#00A8FF] text-white hover:bg-[#00A8FF]/90" disabled={isSaving}>
                        {isSaving ? "Saving..." : "Save Changes"}
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => {
                          setIsEditing(false)
                          setEditName(selectedPrompt.name)
                          setEditContent(selectedPrompt.content)
                          setEditCategory(selectedPrompt.category)
                        }}
                        className="flex-1 border-white/10 text-white hover:bg-white/10"
                        disabled={isSaving}
                      >
                        Cancel
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            ) : (
              <Card className="h-full flex items-center justify-center min-h-[500px] border border-white/10 bg-white/5">
                <CardContent className="text-center space-y-4">
                  <BookOpen className="h-16 w-16 mx-auto text-[#00A8FF]" />
                  <h3 className="text-xl font-semibold text-white">No Prompt Selected</h3>
                  <p className="text-white/60 max-w-md">
                    Select a prompt from the library or create a new one to get started
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
