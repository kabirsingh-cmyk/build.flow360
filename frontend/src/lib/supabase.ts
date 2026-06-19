import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || ''
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || ''

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  }
})

export type AuthUser = {
  id: string
  email: string
  name: string | null
  avatarUrl: string | null
  role: string
}

export async function getCurrentUser(): Promise<AuthUser | null> {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  return {
    id: user.id,
    email: user.email || '',
    name: user.user_metadata?.name || user.email?.split('@')[0] || '',
    avatarUrl: user.user_metadata?.avatar_url || null,
    role: user.user_metadata?.role || 'OWNER'
  }
}

export async function signInWithEmail(email: string, password: string) {
  return supabase.auth.signInWithPassword({ email, password })
}

export async function signUpWithEmail(email: string, password: string, name: string) {
  return supabase.auth.signUp({
    email,
    password,
    options: { data: { name, role: 'OWNER' } }
  })
}

export async function signInWithOAuth(provider: 'google' | 'github') {
  return supabase.auth.signInWithOAuth({ provider })
}

export async function signOut() {
  return supabase.auth.signOut()
}

export async function getSessionToken(): Promise<string | null> {
  const { data: { session } } = await supabase.auth.getSession()
  return session?.access_token || null
}
