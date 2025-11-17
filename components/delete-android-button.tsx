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

interface DeleteAndroidButtonProps {
  androidId: string
  androidName: string
}

export default function DeleteAndroidButton({ androidId, androidName }: DeleteAndroidButtonProps) {
  const [isDeleting, setIsDeleting] = useState(false)
  const router = useRouter()
  const { toast } = useToast()

  const handleDelete = async () => {
    setIsDeleting(true)
    try {
      const response = await fetch(`/api/androids/${androidId}`, {
        method: "DELETE",
      })

      if (response.ok) {
        toast({
          title: "Success",
          description: `${androidName} has been deleted successfully`,
        })
        router.refresh()
      } else {
        toast({
          title: "Error",
          description: "Failed to delete android",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error deleting android:", error)
      toast({
        title: "Error",
        description: "An error occurred while deleting the android",
        variant: "destructive",
      })
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button 
          size="icon" 
          variant="ghost" 
          className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete Android</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to delete <strong>{androidName}</strong>? This action cannot be undone and will permanently delete the android and all associated demo sessions and messages.
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
