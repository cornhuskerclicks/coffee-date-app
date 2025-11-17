"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Trash2 } from 'lucide-react'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { useRouter } from 'next/navigation'
import { useToast } from "@/hooks/use-toast"

interface DeleteDemoButtonProps {
  sessionId: string
}

export default function DeleteDemoButton({ sessionId }: DeleteDemoButtonProps) {
  const [isDeleting, setIsDeleting] = useState(false)
  const router = useRouter()
  const { toast } = useToast()

  const handleDelete = async () => {
    setIsDeleting(true)
    try {
      const response = await fetch(`/api/sessions/${sessionId}`, {
        method: "DELETE",
      })

      if (response.ok) {
        toast({
          title: "Success",
          description: "Demo session deleted successfully",
        })
        router.refresh()
      } else {
        toast({
          title: "Error",
          description: "Failed to delete demo session",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error deleting session:", error)
      toast({
        title: "Error",
        description: "An error occurred while deleting the session",
        variant: "destructive",
      })
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button size="sm" variant="outline" className="text-destructive hover:bg-destructive/10">
          <Trash2 className="h-4 w-4" />
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete Demo Session</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to delete this demo session? This action cannot be undone and will permanently delete all messages in this conversation.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDelete}
            disabled={isDeleting}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {isDeleting ? "Deleting..." : "Delete"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
