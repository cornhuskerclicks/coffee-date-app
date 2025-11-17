"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"
import { Upload, Loader2 } from 'lucide-react'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import Image from 'next/image'

export default function SettingsPage() {
  const { toast } = useToast()
  const supabase = createClient()
  const [loading, setLoading] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [profile, setProfile] = useState<any>(null)
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')

  useEffect(() => {
    loadProfile()
  }, [])

  const loadProfile = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()

      if (error) throw error

      setProfile(data)
      setFullName(data?.full_name || '')
      setEmail(data?.email || user.email || '')
    } catch (error) {
      console.error('Error loading profile:', error)
    }
  }

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    try {
      setUploading(true)
      
      if (!event.target.files || event.target.files.length === 0) {
        return
      }

      const file = event.target.files[0]
      const fileExt = file.name.split('.').pop()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('No user found')

      const fileName = `${user.id}/profile.${fileExt}`

      // Upload image to Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from('profiles')
        .upload(fileName, file, { upsert: true })

      if (uploadError) throw uploadError

      // Get public URL
      const { data } = supabase.storage
        .from('profiles')
        .getPublicUrl(fileName)

      // Update profile with image URL
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ profile_image_url: data.publicUrl })
        .eq('id', user.id)

      if (updateError) throw updateError

      toast({
        title: "Image uploaded",
        description: "Your profile image has been updated successfully",
      })

      loadProfile()
      window.dispatchEvent(new CustomEvent('profile-image-updated', { 
        detail: { imageUrl: data.publicUrl } 
      }))
    } catch (error: any) {
      toast({
        title: "Upload failed",
        description: error.message,
        variant: "destructive",
      })
    } finally {
      setUploading(false)
    }
  }

  const handleSaveProfile = async () => {
    try {
      setLoading(true)
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('No user found')

      const { error } = await supabase
        .from('profiles')
        .update({ full_name: fullName, email })
        .eq('id', user.id)

      if (error) throw error

      toast({
        title: "Profile updated",
        description: "Your profile has been saved successfully",
      })

      loadProfile()
    } catch (error: any) {
      toast({
        title: "Update failed",
        description: error.message,
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="p-6 space-y-6 max-w-4xl">
      <div>
        <h1 className="text-3xl font-bold text-white">Settings</h1>
        <p className="text-white/60">Manage your account and profile settings</p>
      </div>

      <Card className="bg-white/5 border-white/10">
        <CardHeader>
          <CardTitle className="text-white">Profile</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label className="text-white">Profile Picture / Company Logo</Label>
            <div className="flex items-center gap-4">
              <div className="relative w-20 h-20 rounded-full bg-white/5 border-2 border-white/10 overflow-hidden flex items-center justify-center">
                {profile?.profile_image_url ? (
                  <Image
                    src={profile.profile_image_url || "/placeholder.svg"}
                    alt="Profile"
                    width={80}
                    height={80}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <Upload className="h-8 w-8 text-white/40" />
                )}
              </div>
              <div>
                <input
                  type="file"
                  id="profile-image"
                  accept="image/*"
                  className="hidden"
                  onChange={handleImageUpload}
                  disabled={uploading}
                />
                <Button
                  onClick={() => document.getElementById('profile-image')?.click()}
                  disabled={uploading}
                  className="bg-[#00A8FF] hover:bg-[#0090DD] text-white"
                >
                  {uploading ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Uploading...
                    </>
                  ) : (
                    <>
                      <Upload className="h-4 w-4 mr-2" />
                      Upload Image
                    </>
                  )}
                </Button>
                <p className="text-xs text-white/40 mt-1">PNG, JPG up to 2MB</p>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="name" className="text-white">Name</Label>
            <Input
              id="name"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="bg-white/5 border-white/10 text-white"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="email" className="text-white">Email</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="bg-white/5 border-white/10 text-white"
            />
          </div>

          <Button
            onClick={handleSaveProfile}
            disabled={loading}
            className="bg-[#00A8FF] hover:bg-[#0090DD] text-white"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              'Save Profile'
            )}
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
