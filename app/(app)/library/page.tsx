"use client"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Plus, Copy, Trash2, Edit, FolderOpen, Search, FileText, X } from "lucide-react"
import { useState, useEffect, useMemo } from "react"
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

const DEFAULT_CATEGORIES = ["Marketing", "Sales", "Business Leadership", "Operations", "Documents & SOPs", "General"]

export default function PromptLibraryPage() {
  const [prompts, setPrompts] = useState<Prompt[]>([])
  const [categories, setCategories] = useState<string[]>(DEFAULT_CATEGORIES)
  const [selectedCategory, setSelectedCategory] = useState<string>("All")
  const [selectedPrompt, setSelectedPrompt] = useState<Prompt | null>(null)
  const [isCreating, setIsCreating] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")

  // Form state
  const [editName, setEditName] = useState("")
  const [editContent, setEditContent] = useState("")
  const [editCategory, setEditCategory] = useState("")

  // Modal state
  const [showNewCategoryModal, setShowNewCategoryModal] = useState(false)
  const [newCategoryName, setNewCategoryName] = useState("")
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const { toast } = useToast()

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  )

  useEffect(() => {
    loadPrompts()
  }, [])

  // Extract unique categories from prompts and merge with defaults
  useEffect(() => {
    const promptCategories = [...new Set(prompts.map((p) => p.category).filter(Boolean))]
    const allCategories = [...new Set([...DEFAULT_CATEGORIES, ...promptCategories])]
    setCategories(allCategories.sort())
  }, [prompts])

  const loadPrompts = async () => {
    try {
      const { data, error } = await supabase.from("prompts").select("*").order("name", { ascending: true })

      if (error) throw error
      setPrompts(data || [])
    } catch (error) {
      console.error("Error loading prompts:", error)
      toast({
        title: "Error",
        description: "Failed to load prompts",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  // Filter prompts by category and search
  const filteredPrompts = useMemo(() => {
    let filtered = prompts

    if (selectedCategory !== "All") {
      filtered = filtered.filter((p) => p.category === selectedCategory)
    }

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(
        (p) => p.name.toLowerCase().includes(query) || p.content?.toLowerCase().includes(query),
      )
    }

    return filtered
  }, [prompts, selectedCategory, searchQuery])

  const handleSelectPrompt = (prompt: Prompt) => {
    setSelectedPrompt(prompt)
    setEditName(prompt.name)
    setEditContent(prompt.content)
    setEditCategory(prompt.category)
    setIsCreating(false)
  }

  const handleNewPrompt = () => {
    setSelectedPrompt(null)
    setEditName("")
    setEditContent("")
    setEditCategory(selectedCategory === "All" ? "General" : selectedCategory)
    setIsCreating(true)
  }

  const handleSave = async () => {
    if (!editName.trim()) {
      toast({
        title: "Error",
        description: "Prompt name is required",
        variant: "destructive",
      })
      return
    }

    setIsSaving(true)
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) throw new Error("Not authenticated")

      if (isCreating) {
        // Create new prompt
        const newPrompt = {
          user_id: user.id,
          name: editName.trim(),
          content: editContent,
          category: editCategory || "General",
        }

        const { data, error } = await supabase.from("prompts").insert([newPrompt]).select().single()

        if (error) throw error

        setPrompts([...prompts, data])
        setSelectedPrompt(data)
        setIsCreating(false)

        toast({
          title: "Created",
          description: "Prompt saved to library",
        })
      } else if (selectedPrompt) {
        // Update existing prompt
        const updateData = {
          name: editName.trim(),
          content: editContent,
          category: editCategory,
          updated_at: new Date().toISOString(),
        }

        const { error } = await supabase.from("prompts").update(updateData).eq("id", selectedPrompt.id)

        if (error) throw error

        const updated = prompts.map((p) => (p.id === selectedPrompt.id ? { ...p, ...updateData } : p))
        setPrompts(updated)
        setSelectedPrompt({ ...selectedPrompt, ...updateData })

        toast({
          title: "Saved",
          description: "Prompt updated",
        })
      }
    } catch (error) {
      console.error("Error saving prompt:", error)
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
      const { error } = await supabase.from("prompts").delete().eq("id", selectedPrompt.id)

      if (error) throw error

      setPrompts(prompts.filter((p) => p.id !== selectedPrompt.id))
      setSelectedPrompt(null)
      setIsCreating(false)
      setShowDeleteConfirm(false)

      toast({
        title: "Deleted",
        description: "Prompt removed from library",
      })
    } catch (error) {
      console.error("Error deleting prompt:", error)
      toast({
        title: "Error",
        description: "Failed to delete prompt",
        variant: "destructive",
      })
    }
  }

  const handleAddCategory = () => {
    if (!newCategoryName.trim()) return

    const trimmed = newCategoryName.trim()
    if (!categories.includes(trimmed)) {
      setCategories([...categories, trimmed].sort())
    }
    setNewCategoryName("")
    setShowNewCategoryModal(false)
    setSelectedCategory(trimmed)

    toast({
      title: "Category added",
      description: `"${trimmed}" is now available`,
    })
  }

  const handleCancel = () => {
    if (isCreating) {
      setIsCreating(false)
      setSelectedPrompt(null)
    } else if (selectedPrompt) {
      setEditName(selectedPrompt.name)
      setEditContent(selectedPrompt.content)
      setEditCategory(selectedPrompt.category)
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-black">
        <p className="text-white/60">Loading prompts...</p>
      </div>
    )
  }

  return (
    <div className="flex h-screen bg-black overflow-hidden">
      {/* Left Sidebar - Categories */}
      <div className="w-56 border-r border-white/10 flex flex-col">
        <div className="p-4 border-b border-white/10">
          <h2 className="text-sm font-semibold text-white/60 uppercase tracking-wide">Categories</h2>
        </div>
        <div className="flex-1 overflow-y-auto p-2">
          {/* All category */}
          <button
            onClick={() => setSelectedCategory("All")}
            className={`w-full text-left px-3 py-2 rounded-md text-sm transition-colors ${
              selectedCategory === "All" ? "bg-[#00A8FF] text-white" : "text-white/80 hover:bg-white/10"
            }`}
          >
            All Prompts
          </button>

          {/* Category list */}
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`w-full text-left px-3 py-2 rounded-md text-sm transition-colors ${
                selectedCategory === cat ? "bg-[#00A8FF] text-white" : "text-white/80 hover:bg-white/10"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* New Category button */}
        <div className="p-3 border-t border-white/10">
          <button
            onClick={() => setShowNewCategoryModal(true)}
            className="w-full flex items-center gap-2 px-3 py-2 text-sm text-white/60 hover:text-white hover:bg-white/5 rounded-md transition-colors"
          >
            <Plus className="h-4 w-4" />
            New Category
          </button>
        </div>
      </div>

      {/* Center Panel - Prompt List */}
      <div className="w-80 border-r border-white/10 flex flex-col">
        {/* Top bar with search and new prompt */}
        <div className="p-4 border-b border-white/10 space-y-3">
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/40" />
              <Input
                placeholder="Search prompts..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 bg-white/5 border-white/10 text-white placeholder:text-white/40 h-9"
              />
            </div>
            <Button onClick={handleNewPrompt} size="sm" className="bg-[#00A8FF] text-white hover:bg-[#00A8FF]/90 h-9">
              <Plus className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Prompt list */}
        <div className="flex-1 overflow-y-auto p-2">
          {filteredPrompts.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center p-6">
              <FolderOpen className="h-12 w-12 text-white/20 mb-3" />
              <p className="text-white/60 text-sm">
                {searchQuery ? "No prompts found" : "No prompts in this category"}
              </p>
              <Button
                onClick={handleNewPrompt}
                variant="outline"
                size="sm"
                className="mt-4 border-white/20 text-white hover:bg-white/10 bg-transparent"
              >
                <Plus className="h-4 w-4 mr-2" />
                New Prompt
              </Button>
            </div>
          ) : (
            <div className="space-y-1">
              {filteredPrompts.map((prompt) => (
                <div
                  key={prompt.id}
                  onClick={() => handleSelectPrompt(prompt)}
                  className={`group p-3 rounded-lg cursor-pointer transition-all ${
                    selectedPrompt?.id === prompt.id
                      ? "bg-[#00A8FF]/20 border border-[#00A8FF]/50"
                      : "hover:bg-white/5 border border-transparent"
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-white text-sm truncate">{prompt.name}</div>
                      <div className="text-xs text-white/50 mt-0.5">{prompt.category}</div>
                    </div>
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          handleSelectPrompt(prompt)
                        }}
                        className="p-1 text-white/40 hover:text-white"
                      >
                        <Edit className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          setSelectedPrompt(prompt)
                          setShowDeleteConfirm(true)
                        }}
                        className="p-1 text-white/40 hover:text-red-400"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Right Panel - Prompt Details */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {selectedPrompt || isCreating ? (
          <>
            {/* Header */}
            <div className="p-4 border-b border-white/10 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-white">{isCreating ? "New Prompt" : "Edit Prompt"}</h2>
              <button onClick={handleCancel} className="p-1 text-white/40 hover:text-white">
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Form */}
            <div className="flex-1 overflow-y-auto p-6 space-y-5">
              <div className="space-y-2">
                <Label htmlFor="name" className="text-white/80 text-sm">
                  Prompt Name
                </Label>
                <Input
                  id="name"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  placeholder="Enter prompt name..."
                  className="bg-white/5 border-white/10 text-white placeholder:text-white/40"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="category" className="text-white/80 text-sm">
                  Category
                </Label>
                <Select value={editCategory} onValueChange={setEditCategory}>
                  <SelectTrigger className="bg-white/5 border-white/10 text-white">
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent className="bg-zinc-900 border-white/10">
                    {categories.map((cat) => (
                      <SelectItem key={cat} value={cat} className="text-white hover:bg-white/10 focus:bg-white/10">
                        {cat}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2 flex-1">
                <Label htmlFor="content" className="text-white/80 text-sm">
                  Prompt Content
                </Label>
                <Textarea
                  id="content"
                  value={editContent}
                  onChange={(e) => setEditContent(e.target.value)}
                  placeholder="Enter your prompt content..."
                  rows={16}
                  className="bg-white/5 border-white/10 text-white placeholder:text-white/40 resize-none"
                />
              </div>
            </div>

            {/* Actions */}
            <div className="p-4 border-t border-white/10 flex items-center gap-3">
              <Button
                onClick={handleSave}
                className="bg-[#00A8FF] text-white hover:bg-[#00A8FF]/90"
                disabled={isSaving}
              >
                {isSaving ? "Saving..." : "Save"}
              </Button>
              <Button
                onClick={handleCopy}
                variant="outline"
                className="border-white/20 text-white hover:bg-white/10 bg-transparent"
                disabled={!editContent}
              >
                <Copy className="h-4 w-4 mr-2" />
                Copy Prompt
              </Button>
              {!isCreating && (
                <Button
                  onClick={() => setShowDeleteConfirm(true)}
                  variant="outline"
                  className="border-red-500/30 text-red-400 hover:bg-red-500/10 ml-auto"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete
                </Button>
              )}
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
            <FileText className="h-16 w-16 text-white/20 mb-4" />
            <h3 className="text-xl font-semibold text-white mb-2">Select a prompt to view or edit</h3>
            <p className="text-white/50 max-w-sm mb-6">
              Choose a prompt from the list or create a new one to get started
            </p>
            <Button onClick={handleNewPrompt} className="bg-[#00A8FF] text-white hover:bg-[#00A8FF]/90">
              <Plus className="h-4 w-4 mr-2" />
              New Prompt
            </Button>
          </div>
        )}
      </div>

      {/* New Category Modal */}
      <Dialog open={showNewCategoryModal} onOpenChange={setShowNewCategoryModal}>
        <DialogContent className="bg-zinc-900 border-white/10 text-white">
          <DialogHeader>
            <DialogTitle>New Category</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <Label htmlFor="categoryName" className="text-white/80">
              Category Name
            </Label>
            <Input
              id="categoryName"
              value={newCategoryName}
              onChange={(e) => setNewCategoryName(e.target.value)}
              placeholder="Enter category name..."
              className="mt-2 bg-white/5 border-white/10 text-white placeholder:text-white/40"
              onKeyDown={(e) => e.key === "Enter" && handleAddCategory()}
            />
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowNewCategoryModal(false)}
              className="border-white/20 text-white hover:bg-white/10"
            >
              Cancel
            </Button>
            <Button
              onClick={handleAddCategory}
              className="bg-[#00A8FF] text-white hover:bg-[#00A8FF]/90"
              disabled={!newCategoryName.trim()}
            >
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Modal */}
      <Dialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <DialogContent className="bg-zinc-900 border-white/10 text-white">
          <DialogHeader>
            <DialogTitle>Delete Prompt</DialogTitle>
          </DialogHeader>
          <p className="text-white/70 py-4">
            Are you sure you want to delete "{selectedPrompt?.name}"? This action cannot be undone.
          </p>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowDeleteConfirm(false)}
              className="border-white/20 text-white hover:bg-white/10"
            >
              Cancel
            </Button>
            <Button onClick={handleDelete} className="bg-red-600 text-white hover:bg-red-700">
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
