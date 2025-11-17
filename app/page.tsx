'use client'

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Sparkles, Zap, Target, MessageSquare } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useToast } from '@/hooks/use-toast'
import Image from 'next/image'

export default function HomePage() {
  const [isSignUp, setIsSignUp] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const { toast } = useToast()
  const supabase = createClient()

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      if (isSignUp) {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: process.env.NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL || `${window.location.origin}/dashboard`,
          },
        })
        
        if (error) throw error
        
        toast({
          title: "Check your email",
          description: "We sent you a confirmation link to complete your registration.",
        })
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        })
        
        if (error) throw error
        
        toast({
          title: "Welcome back!",
          description: "You've successfully signed in.",
        })
        router.push('/dashboard')
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleGoogleAuth = async () => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: process.env.NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL || `${window.location.origin}/auth/callback`,
        },
      })
      
      if (error) throw error
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      })
    }
  }

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-[#0EE7FF]/5 via-transparent to-transparent" />
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-24">
          {/* Logo/Brand */}
          <div className="text-center mb-12">
            <div className="inline-flex items-center justify-center mb-6">
              <Image 
                src="/images/aether-logo.png" 
                alt="Aether" 
                width={80} 
                height={80}
                className="drop-shadow-[0_0_20px_rgba(14,231,255,0.3)]"
              />
            </div>
            <h1 className="text-5xl md:text-6xl font-bold tracking-tight mb-4">
              Aether AI Lab
            </h1>
            <p className="text-xl text-gray-400 max-w-2xl mx-auto">
              AI-Powered Platform for Agency Workflows
            </p>
          </div>

          <div className="max-w-md mx-auto mb-20">
            <div className="bg-white rounded-xl p-8 border border-gray-200 shadow-xl">
              <h2 className="text-2xl font-bold text-black mb-6 text-center">
                {isSignUp ? 'Create Account' : 'Sign In'}
              </h2>
              
              <form onSubmit={handleEmailAuth} className="space-y-4">
                <div>
                  <Label htmlFor="email" className="text-black font-medium">
                    Email
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    required
                    className="mt-1.5 h-12 border-gray-300 text-black"
                  />
                </div>
                
                <div>
                  <Label htmlFor="password" className="text-black font-medium">
                    Password
                  </Label>
                  <Input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    className="mt-1.5 h-12 border-gray-300 text-black"
                  />
                </div>

                <Button
                  type="submit"
                  disabled={loading}
                  className="w-full h-12 bg-[#0EE7FF] text-black hover:bg-[#0EE7FF]/90 font-semibold"
                >
                  {loading ? 'Loading...' : (isSignUp ? 'Sign Up' : 'Sign In')}
                </Button>
              </form>

              <div className="relative my-6">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-300"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-white text-gray-500">Or continue with</span>
                </div>
              </div>

              <Button
                onClick={handleGoogleAuth}
                variant="outline"
                className="w-full h-12 border-gray-300 text-black hover:bg-gray-50 font-semibold"
              >
                <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                  <path
                    fill="currentColor"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="currentColor"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="currentColor"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  />
                  <path
                    fill="currentColor"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  />
                </svg>
                Sign in with Google
              </Button>

              <div className="mt-4 text-center">
                <button
                  type="button"
                  onClick={() => setIsSignUp(!isSignUp)}
                  className="text-[#0EE7FF] hover:underline font-medium"
                >
                  {isSignUp ? 'Already have an account? Sign in' : "Don't have an account? Sign up"}
                </button>
              </div>
            </div>
          </div>

          {/* Features Grid */}
          <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            <div className="bg-white rounded-xl p-6 border border-gray-200">
              <div className="w-12 h-12 rounded-lg bg-[#0EE7FF]/10 flex items-center justify-center mb-4">
                <MessageSquare className="h-6 w-6 text-[#0EE7FF]" />
              </div>
              <h3 className="text-lg font-semibold text-black mb-2">
                Coffee Date Demo
              </h3>
              <p className="text-gray-600">
                Create AI-powered conversational demos for your clients with custom personas
              </p>
            </div>

            <div className="bg-white rounded-xl p-6 border border-gray-200">
              <div className="w-12 h-12 rounded-lg bg-[#0EE7FF]/10 flex items-center justify-center mb-4">
                <Target className="h-6 w-6 text-[#0EE7FF]" />
              </div>
              <h3 className="text-lg font-semibold text-black mb-2">
                AI Readiness Audit
              </h3>
              <p className="text-gray-600">
                Build and deploy comprehensive AI readiness assessments for prospects
              </p>
            </div>

            <div className="bg-white rounded-xl p-6 border border-gray-200">
              <div className="w-12 h-12 rounded-lg bg-[#0EE7FF]/10 flex items-center justify-center mb-4">
                <Zap className="h-6 w-6 text-[#0EE7FF]" />
              </div>
              <h3 className="text-lg font-semibold text-black mb-2">
                Dead Lead Revival
              </h3>
              <p className="text-gray-600">
                Connect to GHL and analyze campaign metrics with AI conversation insights
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
