'use client'

import { createClient } from '@/lib/supabase'
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function Home() {
  const supabase = createClient()
  const router = useRouter()

  useEffect(() => {
    async function checkUser() {
      const {
        data: { user }
      } = await supabase.auth.getUser()
      if (user) {
        router.push('/dashboard')
      }
    }
    checkUser()
  }, [])

  async function signInWithGoogle() {
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`
      }
    })
  }

  return (
    <main className="min-h-screen flex flex-col items-center justify-center bg-gray-950 text-white">
      <div className="flex flex-col items-center gap-6">
        <img
          src="https://crests.football-data.org/wm26.png"
          alt="FIFA World Cup 2026"
          className="w-24 h-24"
        />
        <h1 className="text-4xl font-bold">World Cup 2026</h1>
        <p className="text-gray-400">
          Sign in to pick your team and make predictions
        </p>
        <button
          onClick={signInWithGoogle}
          className="flex items-center gap-3 bg-white text-gray-900 px-6 py-3 rounded-full font-semibold hover:bg-gray-100 transition"
        >
          <img src="https://www.google.com/favicon.ico" className="w-5 h-5" />
          Continue with Google
        </button>
      </div>
    </main>
  )
}
