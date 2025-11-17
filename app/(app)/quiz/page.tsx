"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Plus, GripVertical, Trash2, Save, FileText, Sparkles } from 'lucide-react'
import { useState, useEffect } from "react"
import { useToast } from "@/hooks/use-toast"
import { DEFAULT_AI_READINESS_QUESTIONS, type QuizQuestion } from "@/lib/default-quiz-questions"
import { createBrowserClient } from '@supabase/ssr'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

interface SavedQuiz {
  id: string
  title: string
  description: string | null
  questions: QuizQuestion[]
  created_at: string
}

export default function QuizBuilderPage() {
  const [quizTitle, setQuizTitle] = useState("")
  const [quizDescription, setQuizDescription] = useState("")
  const [questions, setQuestions] = useState<QuizQuestion[]>(DEFAULT_AI_READINESS_QUESTIONS)
  const [savedQuizzes, setSavedQuizzes] = useState<SavedQuiz[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [selectedQuizId, setSelectedQuizId] = useState<string | null>(null)
  const { toast } = useToast()

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
        .order('created_at', { ascending: false })

      if (error) throw error
      setSavedQuizzes(data || [])
    } catch (error) {
      console.error('Error loading quizzes:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const loadQuiz = (quiz: SavedQuiz) => {
    setQuizTitle(quiz.title)
    setQuizDescription(quiz.description || "")
    setQuestions(quiz.questions)
    setSelectedQuizId(quiz.id)
    toast({
      title: "Quiz Loaded",
      description: `Loaded "${quiz.title}"`,
    })
  }

  const createNewQuiz = () => {
    setQuizTitle("")
    setQuizDescription("")
    setQuestions(DEFAULT_AI_READINESS_QUESTIONS)
    setSelectedQuizId(null)
    toast({
      title: "New Quiz Created",
      description: "Starting with default AI Readiness questions",
    })
  }

  const saveQuiz = async () => {
    if (!quizTitle.trim()) {
      toast({
        title: "Title Required",
        description: "Please enter a quiz title",
        variant: "destructive",
      })
      return
    }

    setIsSaving(true)
    try {
      const quizData = {
        title: quizTitle,
        description: quizDescription,
        questions: questions,
        scoring_rules: {
          maxScore: 100,
          ranges: {
            high: [80, 100],
            medium: [40, 79],
            low: [0, 39],
          },
        },
      }

      if (selectedQuizId) {
        // Update existing quiz
        const { error } = await supabase
          .from('quiz_templates')
          .update({ ...quizData, updated_at: new Date().toISOString() })
          .eq('id', selectedQuizId)

        if (error) throw error
        toast({
          title: "Quiz Updated",
          description: `"${quizTitle}" has been updated`,
        })
      } else {
        // Create new quiz
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) {
          toast({
            title: "Authentication Required",
            description: "Please log in to save quizzes",
            variant: "destructive",
          })
          return
        }

        const { data, error } = await supabase
          .from('quiz_templates')
          .insert({ ...quizData, user_id: user.id })
          .select()
          .single()

        if (error) throw error
        setSelectedQuizId(data.id)
        toast({
          title: "Quiz Saved",
          description: `"${quizTitle}" has been saved`,
        })
      }

      await loadSavedQuizzes()
    } catch (error) {
      console.error('Error saving quiz:', error)
      toast({
        title: "Error",
        description: "Failed to save quiz. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsSaving(false)
    }
  }

  const deleteQuiz = async (quizId: string) => {
    try {
      const { error } = await supabase
        .from('quiz_templates')
        .delete()
        .eq('id', quizId)

      if (error) throw error

      toast({
        title: "Quiz Deleted",
        description: "Quiz has been removed",
      })

      if (selectedQuizId === quizId) {
        createNewQuiz()
      }

      await loadSavedQuizzes()
    } catch (error) {
      console.error('Error deleting quiz:', error)
      toast({
        title: "Error",
        description: "Failed to delete quiz",
        variant: "destructive",
      })
    }
  }

  const addQuestion = () => {
    const newQuestion: QuizQuestion = {
      id: Date.now().toString(),
      text: "",
      type: "multiple-choice",
      options: [
        { text: "Option 1", value: 10 },
        { text: "Option 2", value: 7 },
        { text: "Option 3", value: 4 },
        { text: "Option 4", value: 1 },
      ],
    }
    setQuestions([...questions, newQuestion])
  }

  const deleteQuestion = (id: string) => {
    setQuestions(questions.filter((q) => q.id !== id))
  }

  const updateQuestion = (index: number, field: string, value: any) => {
    const updated = [...questions]
    updated[index] = { ...updated[index], [field]: value }
    setQuestions(updated)
  }

  const updateOption = (questionIndex: number, optionIndex: number, field: string, value: any) => {
    const updated = [...questions]
    const options = [...(updated[questionIndex].options || [])]
    options[optionIndex] = { ...options[optionIndex], [field]: value }
    updated[questionIndex] = { ...updated[questionIndex], options }
    setQuestions(updated)
  }

  const addOption = (questionIndex: number) => {
    const updated = [...questions]
    const options = [...(updated[questionIndex].options || [])]
    options.push({ text: `Option ${options.length + 1}`, value: 5 })
    updated[questionIndex] = { ...updated[questionIndex], options }
    setQuestions(updated)
  }

  const deleteOption = (questionIndex: number, optionIndex: number) => {
    const updated = [...questions]
    const options = (updated[questionIndex].options || []).filter((_, i) => i !== optionIndex)
    updated[questionIndex] = { ...updated[questionIndex], options }
    setQuestions(updated)
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">AI Readiness Quiz Builder</h1>
          <p className="text-muted-foreground">Create engaging quizzes to qualify leads</p>
        </div>
        <div className="flex gap-2">
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="outline">
                <FileText className="h-4 w-4 mr-2" />
                Saved Quizzes ({savedQuizzes.length})
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Saved Quizzes</DialogTitle>
                <DialogDescription>
                  Load or delete your saved quiz templates
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-2">
                {savedQuizzes.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-8">
                    No saved quizzes yet. Create and save your first quiz!
                  </p>
                ) : (
                  savedQuizzes.map((quiz) => (
                    <div
                      key={quiz.id}
                      className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50"
                    >
                      <div className="flex-1">
                        <h3 className="font-semibold">{quiz.title}</h3>
                        {quiz.description && (
                          <p className="text-sm text-muted-foreground">{quiz.description}</p>
                        )}
                        <p className="text-xs text-muted-foreground mt-1">
                          {quiz.questions.length} questions • Created{' '}
                          {new Date(quiz.created_at).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => loadQuiz(quiz)}
                        >
                          Load
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => deleteQuiz(quiz.id)}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </DialogContent>
          </Dialog>
          <Button variant="outline" onClick={createNewQuiz}>
            <Sparkles className="h-4 w-4 mr-2" />
            New Quiz
          </Button>
          <Button onClick={saveQuiz} disabled={isSaving}>
            <Save className="h-4 w-4 mr-2" />
            {isSaving ? "Saving..." : "Save Quiz"}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Quiz Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">Quiz Title</Label>
                <Input
                  id="title"
                  placeholder="AI Readiness Audit"
                  value={quizTitle}
                  onChange={(e) => setQuizTitle(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  placeholder="Discover your AI readiness score in under 3 minutes"
                  value={quizDescription}
                  onChange={(e) => setQuizDescription(e.target.value)}
                  rows={3}
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Questions</CardTitle>
              <Button onClick={addQuestion} size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Add Question
              </Button>
            </CardHeader>
            <CardContent className="space-y-4">
              {questions.map((question, qIndex) => (
                <div key={question.id} className="p-4 border rounded-lg space-y-3">
                  <div className="flex items-start gap-3">
                    <GripVertical className="h-5 w-5 text-muted-foreground cursor-move mt-2" />
                    <div className="flex-1 space-y-3">
                      <div className="flex items-start gap-2">
                        <span className="text-sm font-medium mt-2">Q{qIndex + 1}</span>
                        <Input
                          placeholder="Enter question"
                          value={question.text}
                          onChange={(e) => updateQuestion(qIndex, 'text', e.target.value)}
                        />
                      </div>

                      {question.type === 'multiple-choice' && (
                        <div className="space-y-2 ml-8">
                          <Label className="text-xs text-muted-foreground">Answer Options</Label>
                          {question.options?.map((option, oIndex) => (
                            <div key={oIndex} className="flex items-center gap-2">
                              <Input
                                placeholder="Option text"
                                value={option.text}
                                onChange={(e) =>
                                  updateOption(qIndex, oIndex, 'text', e.target.value)
                                }
                                className="flex-1"
                              />
                              <Input
                                type="number"
                                placeholder="Value"
                                value={option.value}
                                onChange={(e) =>
                                  updateOption(qIndex, oIndex, 'value', parseInt(e.target.value))
                                }
                                className="w-20"
                              />
                              <Button
                                size="icon"
                                variant="ghost"
                                onClick={() => deleteOption(qIndex, oIndex)}
                              >
                                <Trash2 className="h-4 w-4 text-destructive" />
                              </Button>
                            </div>
                          ))}
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => addOption(qIndex)}
                          >
                            <Plus className="h-3 w-3 mr-1" />
                            Add Option
                          </Button>
                        </div>
                      )}
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => deleteQuestion(question.id)}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Preview</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <h3 className="font-semibold text-lg">
                    {quizTitle || "AI Readiness Audit"}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {quizDescription || "Discover your AI readiness score"}
                  </p>
                </div>
                <div className="space-y-3">
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div className="h-full w-1/10 bg-primary" />
                  </div>
                  <div className="text-sm font-medium">Question 1 of {questions.length}</div>
                  <div className="p-4 border rounded-lg bg-muted/50">
                    <p className="text-sm font-medium mb-3">
                      {questions[0]?.text || "Your question"}
                    </p>
                    {questions[0]?.type === 'multiple-choice' && questions[0]?.options && (
                      <div className="space-y-2">
                        {questions[0].options.slice(0, 2).map((option, i) => (
                          <div
                            key={i}
                            className="p-2 border rounded bg-background text-xs"
                          >
                            {option.text}
                          </div>
                        ))}
                        {questions[0].options.length > 2 && (
                          <div className="text-xs text-muted-foreground">
                            +{questions[0].options.length - 2} more options
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Scoring</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="text-sm">
                <div className="flex justify-between items-center mb-1">
                  <span className="font-medium">Max Score:</span>
                  <span className="text-muted-foreground">100 points</span>
                </div>
                <div className="space-y-1 text-xs text-muted-foreground">
                  <div>80-100: High AI Readiness</div>
                  <div>40-79: Medium AI Readiness</div>
                  <div>0-39: Low AI Readiness</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
