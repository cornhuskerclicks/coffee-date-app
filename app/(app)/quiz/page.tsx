"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Plus, FileText, Calendar, Edit, Trash2, Copy, Sparkles } from 'lucide-react'
import { useState, useEffect } from "react"
import { useToast } from "@/hooks/use-toast"
import { createBrowserClient } from '@supabase/ssr'
import { useRouter } from 'next/navigation'
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

interface SavedQuiz {
  id: string
  name: string
  title: string
  description: string | null
  questions: any[]
  created_at: string
  updated_at: string
}

export default function QuizHomePage() {
  const [savedQuizzes, setSavedQuizzes] = useState<SavedQuiz[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [quizToDelete, setQuizToDelete] = useState<string | null>(null)
  const { toast } = useToast()
  const router = useRouter()

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  useEffect(() => {
    loadSavedQuizzes()
  }, [])

  const loadSavedQuizzes = async () => {
    setIsLoading(true)
    try {
      const { data, error } = await supabase
        .from('quiz_templates')
        .select('*')
        .order('updated_at', { ascending: false })

      if (error) throw error
      setSavedQuizzes(data || [])
    } catch (error) {
      console.error('Error loading quizzes:', error)
      toast({
        title: "Error",
        description: "Failed to load quizzes",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!quizToDelete) return

    try {
      const { error } = await supabase
        .from('quiz_templates')
        .delete()
        .eq('id', quizToDelete)

      if (error) throw error

      toast({
        title: "Quiz Deleted",
        description: "Quiz has been successfully removed",
      })

      await loadSavedQuizzes()
    } catch (error) {
      console.error('Error deleting quiz:', error)
      toast({
        title: "Error",
        description: "Failed to delete quiz",
        variant: "destructive",
      })
    } finally {
      setDeleteDialogOpen(false)
      setQuizToDelete(null)
    }
  }

  const duplicateQuiz = async (quiz: SavedQuiz) => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        toast({
          title: "Authentication Required",
          description: "Please log in to duplicate quizzes",
          variant: "destructive",
        })
        return
      }

      const { error } = await supabase
        .from('quiz_templates')
        .insert({
          user_id: user.id,
          name: `${quiz.name} (Copy)`,
          title: quiz.title,
          description: quiz.description,
          questions: quiz.questions,
          scoring_rules: { maxScore: 100 }
        })

      if (error) throw error

      toast({
        title: "Quiz Duplicated",
        description: `Created a copy of "${quiz.name}"`,
      })

      await loadSavedQuizzes()
    } catch (error) {
      console.error('Error duplicating quiz:', error)
      toast({
        title: "Error",
        description: "Failed to duplicate quiz",
        variant: "destructive",
      })
    }
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">AI Readiness Quiz</h1>
          <p className="text-white/60 mt-1">Create and manage your lead qualification quizzes</p>
        </div>
        <Button 
          onClick={() => router.push('/quiz/builder')}
          className="bg-primary hover:bg-primary/90 text-white"
        >
          <Plus className="h-4 w-4 mr-2" />
          Create New Quiz
        </Button>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="animate-pulse bg-[#111] border-white/10">
              <CardHeader>
                <div className="h-6 bg-white/5 rounded w-3/4" />
                <div className="h-4 bg-white/5 rounded w-full mt-2" />
              </CardHeader>
              <CardContent>
                <div className="h-4 bg-white/5 rounded w-1/2" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : savedQuizzes.length === 0 ? (
        <Card className="border-dashed border-white/20 bg-[#111]">
          <CardContent className="flex flex-col items-center justify-center py-16">
            <div className="rounded-full bg-primary/10 p-4 mb-4">
              <Sparkles className="h-12 w-12 text-primary" />
            </div>
            <h3 className="text-xl font-semibold mb-2 text-white">No Quizzes Yet</h3>
            <p className="text-sm text-white/60 text-center mb-6 max-w-md">
              Create your first AI Readiness quiz to start qualifying leads. Each new quiz starts with proven questions.
            </p>
            <Button 
              onClick={() => router.push('/quiz/builder')}
              className="bg-primary hover:bg-primary/90 text-white"
            >
              <Plus className="h-4 w-4 mr-2" />
              Create Your First Quiz
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {savedQuizzes.map((quiz) => (
            <Card key={quiz.id} className="hover:shadow-xl hover:border-primary/50 transition-all bg-[#111] border-white/10">
              <CardHeader>
                <CardTitle className="text-balance text-white">{quiz.title}</CardTitle>
                <CardDescription className="line-clamp-2 text-white/60">
                  {quiz.description || "No description"}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-4 text-sm text-white/50">
                  <div className="flex items-center gap-1">
                    <FileText className="h-4 w-4" />
                    <span>{quiz.questions?.length || 0} questions</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Calendar className="h-4 w-4" />
                    <span>{new Date(quiz.updated_at).toLocaleDateString()}</span>
                  </div>
                </div>

                <div className="pt-2 border-t border-white/10">
                  <div className="text-xs text-white/50">
                    Quiz Name: <span className="font-mono text-white/70">{quiz.name}</span>
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1 bg-transparent border-white/20 text-white hover:bg-primary hover:text-white hover:border-primary"
                    onClick={() => router.push(`/quiz/builder?id=${quiz.id}`)}
                  >
                    <Edit className="h-3 w-3 mr-1" />
                    Edit
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="bg-transparent border-white/20 text-white hover:bg-white/10 hover:border-white/30"
                    onClick={() => duplicateQuiz(quiz)}
                  >
                    <Copy className="h-3 w-3" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="bg-transparent border-white/20 text-red-400 hover:bg-red-500/10 hover:border-red-500/50"
                    onClick={() => {
                      setQuizToDelete(quiz.id)
                      setDeleteDialogOpen(true)
                    }}
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent className="bg-[#111] border-white/20">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-white">Delete Quiz?</AlertDialogTitle>
            <AlertDialogDescription className="text-white/60">
              This action cannot be undone. This will permanently delete the quiz and all associated responses.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel 
              onClick={() => setQuizToDelete(null)}
              className="bg-transparent border-white/20 text-white hover:bg-white/10"
            >
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDelete} 
              className="bg-red-500 text-white hover:bg-red-600"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
