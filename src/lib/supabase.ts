import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

// Use demo version if no Supabase credentials are provided
let supabase: any

if (!supabaseUrl || !supabaseAnonKey || supabaseUrl === 'your-project-url' || supabaseAnonKey === 'your-anon-key') {
  // Use demo version for testing
  if (typeof window !== 'undefined') {
    console.log('🎬 Demo-Modus: Verwende lokale Daten (localStorage)')
  }
  
  // Import demo supabase
  const demoModule = require('./supabase-demo')
  supabase = demoModule.supabase
} else {
  supabase = createClient(supabaseUrl, supabaseAnonKey)
}

export { supabase }

// Types for our database
export interface Movie {
  id: string
  title: string
  description?: string
  year?: number
  poster_url?: string
  created_at: string
}

export interface Rating {
  id: string
  movie_id: string
  rating: number
  user_id?: string
  created_at: string
}

export interface Tag {
  id: string
  name: string
  color: string
  created_at: string
}

export interface MovieTag {
  movie_id: string
  tag_id: string
}
