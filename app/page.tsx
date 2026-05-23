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
        data: { user },
      } = await supabase.auth.getUser()
      if (user) router.push('/dashboard')
    }
    checkUser()
  }, [])

  async function signInWithGoogle() {
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    })
  }

  return (
    <main className="min-h-screen flex flex-col items-center justify-center bg-wc-black text-white relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(232,0,45,0.07),transparent_65%)]" />

      <div className="relative flex flex-col items-center gap-8 text-center px-4">
        {/* Trophy */}
        <div className="relative">
          <div className="absolute inset-0 blur-3xl bg-wc-red/10 rounded-full scale-150" />
          <img
            src="https://crests.football-data.org/wm26.png"
            alt="FIFA World Cup 2026"
            className="relative w-28 h-28 object-contain drop-shadow-2xl"
          />
        </div>

        <div className="flex flex-col items-center gap-3">
          <p className="text-wc-muted text-xs font-semibold uppercase tracking-[0.3em]">
            FIFA World Cup
          </p>
          <h1 className="font-bebas text-7xl uppercase tracking-wide">
            World Cup <span className="text-wc-red">2026</span>
          </h1>
          <p className="text-wc-muted text-base max-w-sm">
            Sign in to pick your team and make predictions
          </p>
        </div>

        <button
          onClick={signInWithGoogle}
          className="flex items-center gap-3 bg-wc-red text-white px-8 py-3 rounded font-semibold uppercase tracking-wide text-base hover:brightness-110 transition-all duration-150"
        >
          <img
            src="https://www.google.com/favicon.ico"
            className="w-5 h-5"
            alt="Google"
          />
          Continue with Google
        </button>

        <p className="text-wc-muted/50 text-xs">USA · Canada · Mexico — June 2026</p>
      </div>
    </main>
  )
}
