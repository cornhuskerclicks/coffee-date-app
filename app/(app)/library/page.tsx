"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Plus, Copy, Trash2, Edit } from 'lucide-react'
import { useState } from "react"
import { useToast } from "@/hooks/use-toast"

interface Prompt {
  id: string
  name: string
  content: string
  category: string
}

const initialPrompts: Prompt[] = [
  {
    id: "1",
    name: "Lead Qualification",
    content:
      "You are an AI assistant helping qualify leads. Ask about their budget, timeline, and specific needs. Be friendly and professional.",
    category: "Sales",
  },
  {
    id: "2",
    name: "Follow-up Message",
    content:
      "Create a friendly follow-up message for a lead who hasn't responded in 3 days. Reference our previous conversation and offer value.",
    category: "Revival",
  },
  {
    id: "3",
    name: "Demo Booking",
    content:
      "You're booking demos for an AI automation service. Highlight time savings and ROI. Suggest specific times this week.",
    category: "Demo",
  },
]

export default function PromptLibraryPage() {
  const [prompts, setPrompts] = useState<Prompt[]>(initialPrompts)
  const [selectedPrompt, setSelectedPrompt] = useState<Prompt | null>(null)
  const [isEditing, setIsEditing] = useState(false)
  const [editName, setEditName] = useState("")
  const [editContent, setEditContent] = useState("")
  const { toast } = useToast()

  const handleSelectPrompt = (prompt: Prompt) => {
    setSelectedPrompt(prompt)
    setEditName(prompt.name)
    setEditContent(prompt.content)
    setIsEditing(false)
  }

  const handleSave = () => {
    if (selectedPrompt) {
      const updated = prompts.map((p) =>
        p.id === selectedPrompt.id ? { ...p, name: editName, content: editContent } : p
      )
      setPrompts(updated)
      setSelectedPrompt({ ...selectedPrompt, name: editName, content: editContent })
      setIsEditing(false)
      toast({
        title: "Saved",
        description: "Prompt updated successfully",
      })
    }
  }

  const handleCopy = () => {
    navigator.clipboard.writeText(editContent)
    toast({
      title: "Copied",
      description: "Prompt copied to clipboard",
    })
  }

  const handleDelete = () => {
    if (selectedPrompt) {
      setPrompts(prompts.filter((p) => p.id !== selectedPrompt.id))
      setSelectedPrompt(null)
      toast({
        title: "Deleted",
        description: "Prompt removed from library",
      })
    }
  }

  const handleNewPrompt = () => {
    const newPrompt: Prompt = {
      id: Date.now().toString(),
      name: "New Prompt",
      content: "",
      category: "General",
    }
    setPrompts([...prompts, newPrompt])
    handleSelectPrompt(newPrompt)
    setIsEditing(true)
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
                    <Button onClick={handleSave} className="flex-1">
                      Save Changes
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => {
                        setIsEditing(false)
                        setEditName(selectedPrompt.name)
                        setEditContent(selectedPrompt.content)
                      }}
                      className="flex-1"
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
                <Library className="h-16 w-16 mx-auto text-muted-foreground" />
                <h3 className="text-xl font-semibold">No Prompt Selected</h3>
                <p className="text-muted-foreground max-w-md">
                  Select a prompt from the library or create a new one to get started
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Global Tone Profile</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Default Communication Style</Label>
            <Textarea
              placeholder="Define your default tone and style for all AI communications..."
              rows={4}
            />
          </div>
          <Button>Save Tone Profile</Button>
        </CardContent>
      </Card>
    </div>
  )
}
