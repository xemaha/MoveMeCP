import { createClient, SupabaseClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''

// Use demo version if no Supabase credentials are provided
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let supabase: SupabaseClient<any, 'public', any> | any

if (!supabaseUrl || !supabaseAnonKey || supabaseUrl === 'your-project-url' || supabaseAnonKey === 'your-anon-key') {
  // Use demo version for testing
  if (typeof window !== 'undefined') {
    console.log('🎬 Demo-Modus: Verwende lokale Daten (localStorage)')
  }
  
  // Import demo supabase
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const demoModule = require('./supabase-demo')
  supabase = demoModule.supabase
} else {
  // Use real Supabase
  supabase = createClient<any>(supabaseUrl, supabaseAnonKey)
  if (typeof window !== 'undefined') {
    console.log('🎬 Produktiv-Modus: Verwende Supabase Datenbank')
  }
}

export { supabase }

// Export types for backwards compatibility
export interface Movie {
  id: string
  title: string
  description?: string
  content_type?: string
  year?: number
  poster_url?: string
  created_by?: string
  trailer_url?: string
  created_at: string
}

export interface Rating {
  id: string
  movie_id: string
  rating: number
  user_id?: string
  user_name?: string
  created_at: string
}

export interface Tag {
  id: string
  name: string
  color: string
  created_at: string
}

export interface User {
  id: string
  name: string
  created_at: string
}
