import { create } from 'zustand'
import { createClient } from '@/lib/supabase'

interface UserState {
  user: any | null
  profile: any | null
  loaded: boolean
  load: () => Promise<void>
  clear: () => void
}

export const useUserStore = create<UserState>((set, get) => ({
  user: null,
  profile: null,
  loaded: false,
  load: async () => {
    if (get().loaded) return
    const supabase = createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) {
      set({ loaded: true })
      return
    }
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', user.id)
      .single()
    set({ user, profile: profile ?? null, loaded: true })
  },
  clear: () => set({ user: null, profile: null, loaded: false }),
}))
