"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Trash2 } from "lucide-react"
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
import { useRouter } from "next/navigation"
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
        <Button size="icon" variant="ghost" className="h-8 w-8 hover:bg-red-500/10">
          <Trash2 className="h-5 w-5 text-[#FF3B30] hover:text-[#FF5B50]" />
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent className="bg-black border-white/10">
        <AlertDialogHeader>
          <AlertDialogTitle className="text-white">Delete Android</AlertDialogTitle>
          <AlertDialogDescription className="text-white/60">
            Are you sure you want to delete <strong className="text-white">{androidName}</strong>? This action cannot be
            undone and will permanently delete the android and all associated demo sessions and messages.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel
            disabled={isDeleting}
            className="bg-white/5 border-white/10 text-white hover:bg-white/10 hover:text-white"
          >
            Cancel
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDelete}
            disabled={isDeleting}
            className="bg-[#FF3B30] text-white hover:bg-[#FF5B50]"
          >
            {isDeleting ? "Deleting..." : "Delete"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
