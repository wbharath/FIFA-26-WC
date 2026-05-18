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
    <main className="min-h-screen flex flex-col items-center justify-center bg-[#06090f] text-white relative overflow-hidden">
      {/* Background radial glow */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(22,163,74,0.12),transparent_65%)]" />
      <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(ellipse_at_bottom_right,rgba(217,119,6,0.07),transparent_60%)]" />

      <div className="relative flex flex-col items-center gap-8 text-center px-4">
        {/* Trophy */}
        <div className="relative">
          <div className="absolute inset-0 blur-3xl bg-yellow-500/20 rounded-full scale-150" />
          <img
            src="https://crests.football-data.org/wm26.png"
            alt="FIFA World Cup 2026"
            className="relative w-32 h-32 object-contain drop-shadow-2xl"
          />
        </div>

        <div className="flex flex-col items-center gap-3">
          <p className="text-green-400/70 text-xs font-semibold uppercase tracking-[0.3em]">
            FIFA World Cup
          </p>
          <h1 className="text-6xl font-black tracking-tight">
            <span className="text-white">World Cup </span>
            <span className="text-yellow-500">2026</span>
          </h1>
          <p className="text-gray-400 text-lg max-w-sm">
            Sign in to pick your team and make predictions
          </p>
        </div>

        <button
          onClick={signInWithGoogle}
          className="flex items-center gap-3 bg-white text-gray-900 px-8 py-3.5 rounded-full font-semibold hover:bg-gray-100 transition-all duration-200 shadow-xl shadow-black/30 hover:shadow-2xl hover:scale-[1.02]"
        >
          <img src="https://www.google.com/favicon.ico" className="w-5 h-5" />
          Continue with Google
        </button>

        <p className="text-gray-600 text-xs">USA · Canada · Mexico — June 2026</p>
      </div>
    </main>
  )
}
