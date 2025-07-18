import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''

// Use demo version if no Supabase credentials are provided
let supabase: ReturnType<typeof createClient>

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
  supabase = createClient(supabaseUrl, supabaseAnonKey)
  if (typeof window !== 'undefined') {
    console.log('🎬 Produktiv-Modus: Verwende Supabase Datenbank')
  }
}

export { supabase }
