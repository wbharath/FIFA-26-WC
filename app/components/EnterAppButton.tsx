'use client'

import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'

interface Props {
  label?: string
  className?: string
}

export default function EnterAppButton({
  label = 'Enter App →',
  className = 'bg-wc-red text-white px-5 py-2 rounded text-sm font-semibold tracking-wide hover:brightness-110 transition-all duration-150',
}: Props) {
  const router = useRouter()

  async function handleClick() {
    const supabase = createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (user) {
      router.push('/dashboard')
    } else {
      await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: { redirectTo: `${window.location.origin}/auth/callback` },
      })
    }
  }

  return (
    <button onClick={handleClick} className={className}>
      {label}
    </button>
  )
}
