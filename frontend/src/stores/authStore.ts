import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { getCurrentUser, signInWithEmail, signUpWithEmail, signOut as sbSignOut, getSessionToken, type AuthUser } from '../lib/supabase'

interface AuthState {
  user: AuthUser | null
  isLoading: boolean
  isAuthenticated: boolean
  setUser: (user: AuthUser | null) => void
  setLoading: (loading: boolean) => void
  login: (email: string, password: string) => Promise<void>
  register: (email: string, password: string, name: string) => Promise<void>
  logout: () => Promise<void>
  refreshUser: () => Promise<void>
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      isLoading: true,
      isAuthenticated: false,
      setUser: (user) => set({ user, isAuthenticated: !!user }),
      setLoading: (loading) => set({ isLoading: loading }),
      login: async (email, password) => {
        const { error } = await signInWithEmail(email, password)
        if (error) throw new Error(error.message)
        const user = await getCurrentUser()
        set({ user, isAuthenticated: true, isLoading: false })
      },
      register: async (email, password, name) => {
        const { error } = await signUpWithEmail(email, password, name)
        if (error) throw new Error(error.message)
      },
      logout: async () => {
        await sbSignOut()
        set({ user: null, isAuthenticated: false, isLoading: false })
      },
      refreshUser: async () => {
        const user = await getCurrentUser()
        set({ user, isAuthenticated: !!user, isLoading: false })
      }
    }),
    {
      name: 'siteforge-auth',
      partialize: (state) => ({ user: state.user, isAuthenticated: state.isAuthenticated })
    }
  )
)
