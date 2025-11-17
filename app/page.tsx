'use client'

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { MessageSquare, BarChart3, Sparkles } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useToast } from '@/hooks/use-toast'
import Image from 'next/image'

export default function HomePage() {
  const [showAuthForm, setShowAuthForm] = useState(false)
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

  const showAuth = (signUpMode: boolean) => {
    setIsSignUp(signUpMode)
    setShowAuthForm(true)
  }

  return (
    <div className="min-h-screen bg-black text-white">
      <header className="border-b border-white/10">
        <div className="max-w-7xl mx-auto px-6 py-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="rounded-lg p-1">
              <Image 
                src="/images/aether-logo.png" 
                alt="Aether" 
                width={32} 
                height={32}
              />
            </div>
            <div>
              <div className="text-lg font-bold leading-none">AETHER AI LAB</div>
              <div className="text-xs text-gray-400 leading-none mt-0.5">by Aether</div>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <Button 
              variant="ghost" 
              className="text-white hover:text-white hover:bg-white/10"
              onClick={() => showAuth(false)}
            >
              Sign In
            </Button>
            <Button 
              className="bg-[#00A8FF] text-white hover:bg-[#00A8FF]/90 font-semibold"
              onClick={() => showAuth(true)}
            >
              Sign Up
            </Button>
          </div>
        </div>
      </header>

      <div className="relative overflow-hidden bg-glow-blue">
        <div className="absolute inset-0 bg-gradient-to-br from-[#00A8FF]/5 via-transparent to-transparent" />
        
        <div className="relative max-w-6xl mx-auto px-6 pt-24 pb-32 text-center">
          <div className="inline-block px-4 py-1.5 rounded-full border border-[#00A8FF]/30 bg-[#00A8FF]/5 text-[#00A8FF] text-sm font-medium mb-8">
            AI-POWERED AGENCY WORKSPACE
          </div>

          <h1 className="text-6xl md:text-7xl font-bold tracking-tight mb-6 leading-tight">
            <span className="bg-gradient-to-r from-[#00A8FF] to-[#0080FF] bg-clip-text text-transparent">
              Your AI Agency Workspace
            </span>
          </h1>

          <p className="text-xl text-gray-400 max-w-3xl mx-auto mb-10 leading-relaxed">
            Run demos, revive old leads, build quizzes, store prompts, and organise client delivery — all inside the <span className="text-[#00A8FF]">Aether AI Lab</span>.
          </p>

          <div className="flex items-center justify-center gap-4 mb-20">
            <Button 
              size="lg"
              className="bg-[#00A8FF] text-white hover:bg-[#00A8FF]/90 font-semibold h-12 px-8"
              onClick={() => showAuth(true)}
            >
              SIGN UP
            </Button>
            <Button 
              size="lg"
              variant="outline" 
              className="border-white/20 text-white hover:bg-white/5 h-12 px-8 font-semibold"
              onClick={() => showAuth(false)}
            >
              SIGN IN
            </Button>
          </div>

          {showAuthForm && (
            <div className="max-w-md mx-auto mb-16">
              <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-8 border border-white/10">
                <h2 className="text-2xl font-bold mb-6 text-center">
                  {isSignUp ? 'Create Account' : 'Sign In'}
                </h2>
                
                <form onSubmit={handleEmailAuth} className="space-y-4">
                  <div>
                    <Label htmlFor="email" className="text-white font-medium">
                      Email
                    </Label>
                    <Input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@example.com"
                      required
                      className="mt-1.5 h-12 bg-white/5 border-white/20 text-white placeholder:text-gray-500"
                      autoComplete="email"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="password" className="text-white font-medium">
                      Password
                    </Label>
                    <Input
                      id="password"
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      required
                      className="mt-1.5 h-12 bg-white/5 border-white/20 text-white placeholder:text-gray-500"
                      autoComplete="current-password"
                    />
                  </div>

                  <Button
                    type="submit"
                    disabled={loading}
                    className="w-full h-12 bg-[#00A8FF] text-white hover:bg-[#00A8FF]/90 font-semibold"
                  >
                    {loading ? 'Loading...' : (isSignUp ? 'Sign Up' : 'Sign In')}
                  </Button>
                </form>

                <div className="relative my-6">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-white/20"></div>
                  </div>
                  <div className="relative flex justify-center text-sm">
                    <span className="px-2 bg-black text-gray-400">Or continue with</span>
                  </div>
                </div>

                <Button
                  onClick={handleGoogleAuth}
                  variant="outline"
                  className="w-full h-12 border-white/20 text-white hover:bg-white/5 font-semibold"
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
                    className="text-[#00A8FF] hover:underline font-medium"
                  >
                    {isSignUp ? 'Already have an account? Sign in' : "Don't have an account? Sign up"}
                  </button>
                </div>
              </div>
            </div>
          )}

          <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-8 border border-white/10 text-left transition-all hover:bg-white/10 bg-glow-blue-sm">
              <div className="w-12 h-12 rounded-lg bg-[#00A8FF]/10 flex items-center justify-center mb-6">
                <MessageSquare className="h-6 w-6 text-[#00A8FF]" />
              </div>
              <h3 className="text-xl font-bold mb-3">
                DEMO SANDBOX
              </h3>
              <p className="text-gray-400 leading-relaxed">
                Test your Coffee Date prompts and simulate AI conversations before launching real campaigns.
              </p>
            </div>

            <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-8 border border-white/10 text-left transition-all hover:bg-white/10 bg-glow-blue-sm">
              <div className="w-12 h-12 rounded-lg bg-[#00A8FF]/10 flex items-center justify-center mb-6">
                <BarChart3 className="h-6 w-6 text-[#00A8FF]" />
              </div>
              <h3 className="text-xl font-bold mb-3">
                LEAD REVIVAL
              </h3>
              <p className="text-gray-400 leading-relaxed">
                Connect GoHighLevel and revive old leads with automated SMS sequences powered by AI.
              </p>
            </div>

            <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-8 border border-white/10 text-left transition-all hover:bg-white/10 bg-glow-blue-sm">
              <div className="w-12 h-12 rounded-lg bg-[#00A8FF]/10 flex items-center justify-center mb-6">
                <Sparkles className="h-6 w-6 text-[#00A8FF]" />
              </div>
              <h3 className="text-xl font-bold mb-3">
                PROMPT LIBRARY
              </h3>
              <p className="text-gray-400 leading-relaxed">
                Store and organize your AI prompts, build quizzes, and manage client delivery workflows.
              </p>
            </div>
          </div>
        </div>
      </div>

      <footer className="border-t border-white/10 py-8">
        <div className="max-w-7xl mx-auto px-6 text-center text-sm text-gray-400">
          POWERED BY AETHER INTELLIGENCE • AI AGENCY WORKSPACE
        </div>
      </footer>
    </div>
  )
}
