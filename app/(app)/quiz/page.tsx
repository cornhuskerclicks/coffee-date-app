"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Plus, GripVertical, Trash2, Eye, Code } from 'lucide-react'
import { useState } from "react"
import { useToast } from "@/hooks/use-toast"

interface Question {
  id: string
  text: string
  type: string
}

export default function QuizBuilderPage() {
  const [quizTitle, setQuizTitle] = useState("")
  const [quizDescription, setQuizDescription] = useState("")
  const [questions, setQuestions] = useState<Question[]>([
    { id: "1", text: "How familiar are you with AI tools?", type: "multiple-choice" },
    { id: "2", text: "What's your biggest business challenge?", type: "text" },
  ])
  const { toast } = useToast()

  const addQuestion = () => {
    const newQuestion: Question = {
      id: Date.now().toString(),
      text: "",
      type: "multiple-choice",
    }
    setQuestions([...questions, newQuestion])
  }

  const deleteQuestion = (id: string) => {
    setQuestions(questions.filter((q) => q.id !== id))
  }

  const handleGenerateLink = () => {
    toast({
      title: "Share Link Generated",
      description: "Quiz link copied to clipboard",
    })
  }

  const handleGetEmbed = () => {
    toast({
      title: "Embed Code Generated",
      description: "Embed code copied to clipboard",
    })
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">AI Readiness Quiz Builder</h1>
          <p className="text-muted-foreground">Create engaging quizzes to qualify leads</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleGetEmbed}>
            <Code className="h-4 w-4 mr-2" />
            Embed Code
          </Button>
          <Button onClick={handleGenerateLink}>
            Generate Share Link
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
                  placeholder="Enter quiz title"
                  value={quizTitle}
                  onChange={(e) => setQuizTitle(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  placeholder="Brief description of the quiz"
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
              {questions.map((question, index) => (
                <div key={question.id} className="flex items-start gap-3 p-4 border rounded-lg">
                  <GripVertical className="h-5 w-5 text-muted-foreground cursor-move mt-2" />
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">Q{index + 1}</span>
                      <Input
                        placeholder="Enter question"
                        value={question.text}
                        onChange={(e) => {
                          const updated = [...questions]
                          updated[index].text = e.target.value
                          setQuestions(updated)
                        }}
                      />
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm">Multiple Choice</Button>
                      <Button variant="ghost" size="sm">Text</Button>
                      <Button variant="ghost" size="sm">Scale</Button>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => deleteQuestion(question.id)}
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
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
                  <h3 className="font-semibold text-lg">{quizTitle || "Quiz Title"}</h3>
                  <p className="text-sm text-muted-foreground">
                    {quizDescription || "Quiz description will appear here"}
                  </p>
                </div>
                <div className="space-y-3">
                  <div className="text-sm font-medium">Question 1 of {questions.length}</div>
                  <div className="p-4 border rounded-lg bg-muted/50">
                    <p className="text-sm">{questions[0]?.text || "Your question"}</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Result Logic</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>CTA Link</Label>
                <Input placeholder="https://example.com/book" />
              </div>
              <div className="space-y-2">
                <Label>Success Message</Label>
                <Textarea
                  placeholder="Message after quiz completion"
                  rows={3}
                />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
