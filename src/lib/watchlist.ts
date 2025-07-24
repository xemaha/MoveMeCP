import { supabase } from '@/lib/supabase'

export async function addToWatchlistClient(movieId: string) {
  // Get the current user
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  
  if (authError || !user) {
    console.error('Auth error:', authError)
    throw new Error('Not authenticated')
  }

  console.log('🔍 Adding to watchlist - User ID:', user.id, 'Movie ID:', movieId)

  try {
    // Check if already in watchlist
    const { data: existing, error: checkError } = await supabase
      .from('watchlist')
      .select('id')
      .eq('user_id', user.id)
      .eq('movie_id', movieId)
      .maybeSingle()

    if (checkError && checkError.code !== 'PGRST116') {
      console.error('Error checking existing watchlist:', checkError)
      throw new Error(`Error checking watchlist: ${checkError.message}`)
    }

    if (existing) {
      console.log('ℹ️ Movie already in watchlist')
      return { success: true, message: 'Already in watchlist' }
    }

    // Insert into watchlist
    const { data, error } = await supabase
      .from('watchlist')
      .insert({
        user_id: user.id,
        movie_id: movieId
      })
      .select()

    if (error) {
      console.error('❌ Database error adding to watchlist:', error)
      throw new Error(`Failed to add to watchlist: ${error.message}`)
    }

    console.log('✅ Successfully added to watchlist:', data)
    
    return { success: true, data }
  } catch (error) {
    console.error('❌ Exception in addToWatchlistClient:', error)
    throw error
  }
}

export async function removeFromWatchlistClient(movieId: string) {
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  
  if (authError || !user) {
    console.error('Auth error:', authError)
    throw new Error('Not authenticated')
  }

  console.log('🔍 Removing from watchlist - User ID:', user.id, 'Movie ID:', movieId)

  try {
    const { error } = await supabase
      .from('watchlist')
      .delete()
      .eq('user_id', user.id)
      .eq('movie_id', movieId)

    if (error) {
      console.error('❌ Database error removing from watchlist:', error)
      throw new Error(`Failed to remove from watchlist: ${error.message}`)
    }

    console.log('✅ Successfully removed from watchlist')
    
    return { success: true }
  } catch (error) {
    console.error('❌ Exception in removeFromWatchlistClient:', error)
    throw error
  }
}
