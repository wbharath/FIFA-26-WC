import { create } from 'zustand'

interface MatchState {
  fixtures: any[]
  standingsByGroup: Record<string, any[]>
  loaded: boolean
  load: () => Promise<void>
  reset: () => void
}

export const useMatchStore = create<MatchState>((set, get) => ({
  fixtures: [],
  standingsByGroup: {},
  loaded: false,
  load: async () => {
    if (get().loaded) return
    const res = await fetch('/api/matches')
    const data = await res.json()
    set({
      fixtures: data.fixtures || [],
      standingsByGroup: data.standingsByGroup || {},
      loaded: true,
    })
  },
  reset: () => set({ fixtures: [], standingsByGroup: {}, loaded: false }),
}))
