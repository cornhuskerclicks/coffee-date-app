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
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-center h-96">
          <p className="text-muted-foreground">Loading prompts...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Prompt Library</h1>
          <p className="text-muted-foreground">Manage and organize your AI prompts</p>
        </div>
        <Button onClick={handleNewPrompt}>
          <Plus className="h-4 w-4 mr-2" />
          New Prompt
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Saved Prompts</CardTitle>
          </CardHeader>
          <CardContent>
            {prompts.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">
                No prompts yet. Click "New Prompt" to create one.
              </p>
            ) : (
              <div className="space-y-2">
                {prompts.map((prompt) => (
                  <div
                    key={prompt.id}
                    onClick={() => handleSelectPrompt(prompt)}
                    className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                      selectedPrompt?.id === prompt.id
                        ? "bg-primary text-primary-foreground border-primary"
                        : "hover:bg-muted"
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
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>{isEditing ? "Edit Prompt" : selectedPrompt.name}</CardTitle>
                <div className="flex gap-2">
                  {!isEditing && (
                    <>
                      <Button size="sm" variant="outline" onClick={() => setIsEditing(true)}>
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button size="sm" variant="outline" onClick={handleCopy}>
                        <Copy className="h-4 w-4" />
                      </Button>
                      <Button size="sm" variant="outline" onClick={handleDelete}>
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </>
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Prompt Name</Label>
                  <Input
                    id="name"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    disabled={!isEditing}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="category">Category</Label>
                  <Input
                    id="category"
                    value={editCategory}
                    onChange={(e) => setEditCategory(e.target.value)}
                    disabled={!isEditing}
                    placeholder="e.g. Sales, Demo, Revival"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="content">Prompt Content</Label>
                  <Textarea
                    id="content"
                    value={editContent}
                    onChange={(e) => setEditContent(e.target.value)}
                    rows={12}
                    disabled={!isEditing}
                  />
                </div>

                {isEditing && (
                  <div className="flex gap-2">
                    <Button onClick={handleSave} className="flex-1" disabled={isSaving}>
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
                      className="flex-1"
                      disabled={isSaving}
                    >
                      Cancel
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          ) : (
            <Card className="h-full flex items-center justify-center min-h-[500px]">
              <CardContent className="text-center space-y-4">
                <BookOpen className="h-16 w-16 mx-auto text-muted-foreground" />
                <h3 className="text-xl font-semibold">No Prompt Selected</h3>
                <p className="text-muted-foreground max-w-md">
                  Select a prompt from the library or create a new one to get started
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
