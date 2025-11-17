"use client"

import { Bell, Search, User, LogOut, Settings2 } from 'lucide-react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu"
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { useToast } from '@/hooks/use-toast'
import { useEffect, useState } from 'react'
import Image from 'next/image'

export function AppHeader() {
  const router = useRouter()
  const { toast } = useToast()
  const supabase = createClient()
  const [profileImage, setProfileImage] = useState<string | null>(null)

  useEffect(() => {
    loadProfile()
    
    const handleProfileUpdate = (event: any) => {
      if (event.detail?.imageUrl) {
        setProfileImage(event.detail.imageUrl)
      }
    }
    
    window.addEventListener('profile-image-updated', handleProfileUpdate)
    
    return () => {
      window.removeEventListener('profile-image-updated', handleProfileUpdate)
    }
  }, [])

  const loadProfile = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data, error } = await supabase
        .from('profiles')
        .select('profile_image_url')
        .eq('id', user.id)
        .single()

      if (error) throw error
      setProfileImage(data?.profile_image_url || null)
    } catch (error) {
      console.error('Error loading profile:', error)
    }
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    toast({
      title: "Signed out",
      description: "You've been successfully signed out.",
    })
    router.push('/')
  }

  return (
    <header className="sticky top-0 z-10 border-b border-white/10 bg-black">
      <div className="flex items-center justify-between px-6 py-4">
        <div className="flex items-center gap-4 flex-1 max-w-xl">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/40" />
            <Input
              placeholder="Search..."
              className="pl-10 border-white/10 bg-white/5 text-white placeholder:text-white/40"
            />
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" className="text-white hover:bg-white/10">
            <Bell className="h-5 w-5" />
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="text-white hover:bg-white/10 rounded-full w-10 h-10 p-0 overflow-hidden">
                {profileImage ? (
                  <Image
                    src={profileImage || "/placeholder.svg"}
                    alt="Profile"
                    width={40}
                    height={40}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <User className="h-5 w-5" />
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48 bg-black border-white/10">
              <DropdownMenuItem
                onClick={() => router.push('/settings')}
                className="cursor-pointer text-white hover:bg-white/10"
              >
                <User className="h-4 w-4 mr-2" />
                Profile
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => router.push('/settings')}
                className="cursor-pointer text-white hover:bg-white/10"
              >
                <Settings2 className="h-4 w-4 mr-2" />
                Settings
              </DropdownMenuItem>
              <DropdownMenuSeparator className="bg-white/10" />
              <DropdownMenuItem onClick={handleLogout} className="cursor-pointer text-red-400 hover:bg-white/10">
                <LogOut className="h-4 w-4 mr-2" />
                Logout
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  )
}
