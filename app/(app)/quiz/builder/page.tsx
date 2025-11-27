"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Plus, GripVertical, Trash2, Save, ArrowLeft, Copy, FileCode } from "lucide-react"
import { useState, useEffect, Suspense } from "react"
import { useToast } from "@/hooks/use-toast"
import { DEFAULT_AI_READINESS_QUESTIONS, type QuizQuestion } from "@/lib/default-quiz-questions"
import { createBrowserClient } from "@supabase/ssr"
import { useRouter, useSearchParams } from "next/navigation"

function QuizBuilderContent() {
  const [quizName, setQuizName] = useState("")
  const [quizTitle, setQuizTitle] = useState("")
  const [quizDescription, setQuizDescription] = useState("")
  const [questions, setQuestions] = useState<QuizQuestion[]>(DEFAULT_AI_READINESS_QUESTIONS)
  const [isLoading, setIsLoading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [quizId, setQuizId] = useState<string | null>(null)
  const { toast } = useToast()
  const router = useRouter()
  const searchParams = useSearchParams()

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  )

  useEffect(() => {
    const id = searchParams.get("id")
    if (id) {
      loadQuiz(id)
    }
  }, [searchParams])

  const loadQuiz = async (id: string) => {
    setIsLoading(true)
    try {
      const { data, error } = await supabase.from("quiz_templates").select("*").eq("id", id).single()

      if (error) throw error

      if (data) {
        setQuizId(data.id)
        setQuizName(data.name || data.title)
        setQuizTitle(data.title)
        setQuizDescription(data.description || "")
        if (data.questions && Array.isArray(data.questions) && data.questions.length > 0) {
          setQuestions(data.questions)
        }
        toast({
          title: "Quiz Loaded",
          description: `Loaded "${data.name || data.title}"`,
        })
      }
    } catch (error) {
      console.error("Error loading quiz:", error)
      toast({
        title: "Error",
        description: "Failed to load quiz",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const saveQuiz = async () => {
    if (!quizName.trim()) {
      toast({
        title: "Quiz Name Required",
        description: "Please enter a quiz name for saving",
        variant: "destructive",
      })
      return
    }

    if (!quizTitle.trim()) {
      toast({
        title: "Website Title Required",
        description: "Please enter a title that will appear on your website",
        variant: "destructive",
      })
      return
    }

    setIsSaving(true)
    try {
      const quizData = {
        name: quizName,
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

      if (quizId) {
        const { error } = await supabase
          .from("quiz_templates")
          .update({ ...quizData, updated_at: new Date().toISOString() })
          .eq("id", quizId)

        if (error) throw error
        toast({
          title: "Quiz Updated",
          description: `"${quizName}" has been updated`,
        })
      } else {
        const {
          data: { user },
        } = await supabase.auth.getUser()
        if (!user) {
          toast({
            title: "Authentication Required",
            description: "Please log in to save quizzes",
            variant: "destructive",
          })
          return
        }

        const { data, error } = await supabase
          .from("quiz_templates")
          .insert({ ...quizData, user_id: user.id })
          .select()
          .single()

        if (error) throw error
        setQuizId(data.id)
        toast({
          title: "Quiz Saved",
          description: `"${quizName}" has been saved`,
        })

        router.push(`/quiz/builder?id=${data.id}`)
      }
    } catch (error) {
      console.error("Error saving quiz:", error)
      toast({
        title: "Error",
        description: "Failed to save quiz. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsSaving(false)
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

  const copyQuizQuestions = () => {
    let output = `${quizTitle || "AI Readiness Quiz"}\n\n`

    questions.forEach((q, index) => {
      output += `${index + 1}. ${q.text}\n`
      if (q.type === "multiple-choice" && q.options) {
        q.options.forEach((opt, optIndex) => {
          output += `   ${String.fromCharCode(97 + optIndex)}) ${opt.text}\n`
        })
      }
      output += "\n"
    })

    navigator.clipboard.writeText(output)
    toast({
      title: "Questions Copied",
      description: "Quiz questions copied to clipboard",
    })
  }

  const generateAIPrompt = () => {
    const quizTitleText = quizTitle || "AI Readiness Audit"
    const quizDescText = quizDescription || "Discover your AI readiness score in under 3 minutes"

    let questionsPrompt = ""
    questions.forEach((q, index) => {
      questionsPrompt += `Q${index + 1}. ${q.text}\n`
      if (q.type === "multiple-choice" && q.options) {
        q.options.forEach((opt) => {
          questionsPrompt += `▢ ${opt.text} (${opt.value}) `
        })
        questionsPrompt += "\n\n"
      }
    })

    const prompt = `Build a modern, mobile-responsive AI Readiness Quiz Funnel web page for an AI agency website.

Page Layout

A clean hero section with the headline:
"${quizTitleText}"

Subtext: "${quizDescText}"

Centered Start Quiz button that opens a multi-step form.

White background, soft-gray quiz cards, rounded corners, subtle shadow, blue progress bar (#089fef).

Font: Inter or Lato, modern and readable.

Include small footer text: Powered by AI Readiness Audit System.

Quiz Structure
Create an ${questions.length + 1}-step form with a visible progress bar and "Next/Back" buttons:

Step 1: Collect first name, email, and company name.

Steps 2–${questions.length + 1}: ${questions.length} multiple-choice quiz questions (radio buttons).

Each answer carries a numeric value based on the scoring below.

At completion, calculate a total score (0–100).

Quiz Questions
${questionsPrompt}

Scoring and Results

Add up numeric values (max = 100).

Display results dynamically with matching messages:
80–100 = High AI Readiness: "You're ahead of the curve — your systems and mindset are primed for AI."
40–79 = Medium AI Readiness: "You're experimenting but missing efficiency gains. We'll show you where to focus."
0–39 = Low AI Readiness: "You're missing out on AI's advantages. The audit will show where to start for maximum impact."

Below the result, display:
"Your AI Readiness Score has been sent to your inbox."
Include a Book Your AI Readiness Audit button linking to /book-audit.

GoHighLevel API Connection

Connect this form to your GoHighLevel account API.

When Step 1 (contact details) is submitted, create or update the contact in GoHighLevel.

When the full quiz is completed, send all answers and the total score to that same contact record.

Use a secure API key stored in environment variables for authorization.

Confirm the API connection with a console success message.

Design Notes

White background, light gray cards, rounded corners (12 px).

Blue (#089fef) progress bar and accent color.

Smooth motion transitions between steps.

Include space for your own logo top-center throughout.

Final Goal
A single-page AI Readiness Quiz Funnel that you can brand for your own AI agency website.
The quiz captures leads, calculates scores, and sends contact and quiz data directly into your GoHighLevel CRM for follow-up.`

    navigator.clipboard.writeText(prompt)
    toast({
      title: "Prompt Copied",
      description: "AI web building prompt copied to clipboard - paste into v0 or any AI builder",
    })
  }

  if (isLoading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Loading quiz...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.push("/quiz")}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-white">{quizId ? "Edit Quiz" : "Create New Quiz"}</h1>
            <p className="text-secondary mt-1">
              {quizId ? "Update your quiz settings and questions" : "Start with AI Readiness questions"}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={copyQuizQuestions}
            className="border-border hover:border-primary bg-transparent"
          >
            <Copy className="h-4 w-4 mr-2" />
            Copy Questions
          </Button>
          <Button
            variant="outline"
            onClick={generateAIPrompt}
            className="border-border hover:border-primary bg-transparent"
          >
            <FileCode className="h-4 w-4 mr-2" />
            Generate AI Prompt
          </Button>
          <Button onClick={saveQuiz} disabled={isSaving} className="bg-primary hover:bg-primary/90">
            <Save className="h-4 w-4 mr-2" />
            {isSaving ? "Saving..." : "Save Quiz"}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card className="bg-card border-border shadow-[0_2px_8px_rgba(0,0,0,0.5)]">
            <CardHeader className="pb-6">
              <CardTitle className="text-white text-xl">Quiz Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-3">
                <Label htmlFor="name" className="text-white text-sm font-medium">
                  Quiz Name (Internal)
                </Label>
                <Input
                  id="name"
                  placeholder="e.g., Q1 2025 AI Audit"
                  value={quizName}
                  onChange={(e) => setQuizName(e.target.value)}
                  className="bg-muted border-border focus:border-primary text-white"
                />
                <p className="text-zinc-500 text-xs mt-2">Internal name for organizing your quizzes</p>
              </div>

              <div className="space-y-3">
                <Label htmlFor="title" className="text-white text-sm font-medium">
                  Website Title
                </Label>
                <Input
                  id="title"
                  placeholder="AI Readiness Audit"
                  value={quizTitle}
                  onChange={(e) => setQuizTitle(e.target.value)}
                  className="bg-muted border-border focus:border-primary text-white"
                />
                <p className="text-zinc-500 text-xs mt-2">This heading will appear on your website</p>
              </div>

              <div className="space-y-3">
                <Label htmlFor="description" className="text-white text-sm font-medium">
                  Description
                </Label>
                <Textarea
                  id="description"
                  placeholder="Discover your AI readiness score in under 3 minutes"
                  value={quizDescription}
                  onChange={(e) => setQuizDescription(e.target.value)}
                  rows={3}
                  className="bg-muted border-border focus:border-primary text-white"
                />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card border-border shadow-[0_2px_8px_rgba(0,0,0,0.5)]">
            <CardHeader className="flex flex-row items-center justify-between pb-6">
              <CardTitle className="text-white text-xl">Questions</CardTitle>
              <Button onClick={addQuestion} size="sm" className="bg-primary hover:bg-primary/90">
                <Plus className="h-4 w-4 mr-2" />
                Add Question
              </Button>
            </CardHeader>
            <CardContent className="space-y-6">
              {questions.map((question, qIndex) => (
                <div key={question.id} className="p-6 border border-border rounded-lg bg-muted/30 space-y-4">
                  <div className="flex items-start gap-3">
                    <GripVertical className="h-5 w-5 text-white/40 cursor-move mt-2" />
                    <div className="flex-1 space-y-4">
                      <div className="flex items-start gap-3">
                        <span className="text-sm font-medium text-white mt-2">Q{qIndex + 1}</span>
                        <Input
                          placeholder="Enter question"
                          value={question.text}
                          onChange={(e) => updateQuestion(qIndex, "text", e.target.value)}
                          className="bg-muted border-border focus:border-primary text-white"
                        />
                      </div>

                      {question.type === "multiple-choice" && (
                        <div className="space-y-3 ml-8">
                          <Label className="text-zinc-400 text-xs">Answer Options</Label>
                          {question.options?.map((option, oIndex) => (
                            <div key={oIndex} className="flex items-center gap-2">
                              <Input
                                placeholder={`Option ${oIndex + 1}`}
                                value={option.text}
                                onChange={(e) => updateOption(qIndex, oIndex, "text", e.target.value)}
                                className="flex-1 bg-muted border-border focus:border-primary text-white"
                              />
                              <Input
                                type="number"
                                placeholder="Score"
                                value={option.value}
                                onChange={(e) =>
                                  updateOption(qIndex, oIndex, "value", Number.parseInt(e.target.value) || 0)
                                }
                                className="w-20 bg-muted border-border focus:border-primary text-white"
                              />
                              <Button
                                size="icon"
                                variant="ghost"
                                onClick={() => deleteOption(qIndex, oIndex)}
                                className="hover:bg-destructive/10"
                              >
                                <Trash2 className="h-4 w-4 text-destructive" />
                              </Button>
                            </div>
                          ))}
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => addOption(qIndex)}
                            className="border-border hover:border-primary"
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
                      className="hover:bg-destructive/10"
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="bg-[hsl(0_0%_6%)] border-[hsl(0_0%_13%)] shadow-[0_2px_6px_rgba(0,0,0,0.4)]">
            <CardHeader className="pb-6">
              <CardTitle className="text-white text-xl">Preview</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div>
                  <h3 className="font-semibold text-lg text-white text-balance">{quizTitle || "AI Readiness Audit"}</h3>
                  <p className="text-zinc-400 text-sm text-pretty mt-2">
                    {quizDescription || "Discover your AI readiness score"}
                  </p>
                </div>
                <div className="space-y-4">
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div className="h-full w-1/10 bg-primary" />
                  </div>
                  <div className="text-sm font-medium text-white">Question 1 of {questions.length}</div>
                  <div className="p-5 border border-border rounded-lg bg-muted/50">
                    <p className="text-sm font-medium text-white mb-4">{questions[0]?.text || "Your question"}</p>
                    {questions[0]?.type === "multiple-choice" && questions[0]?.options && (
                      <div className="space-y-2">
                        {questions[0].options.slice(0, 2).map((option, i) => (
                          <div key={i} className="p-3 border border-border rounded bg-muted text-xs text-blue-400">
                            {option.text}
                          </div>
                        ))}
                        {questions[0].options.length > 2 && (
                          <div className="text-xs text-zinc-500">+{questions[0].options.length - 2} more options</div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card border-border shadow-[0_2px_8px_rgba(0,0,0,0.5)]">
            <CardHeader className="pb-6">
              <CardTitle className="text-white text-xl">Scoring</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-sm">
                <div className="flex justify-between items-center mb-3">
                  <span className="font-medium text-white">Max Score:</span>
                  <span className="text-zinc-400">100 points</span>
                </div>
                <div className="space-y-2 text-xs text-zinc-500">
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

export default function QuizBuilderPage() {
  return (
    <Suspense
      fallback={
        <div className="p-6 flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4" />
            <p className="text-muted-foreground">Loading quiz builder...</p>
          </div>
        </div>
      }
    >
      <QuizBuilderContent />
    </Suspense>
  )
}
