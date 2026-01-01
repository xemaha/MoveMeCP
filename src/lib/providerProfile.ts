import { supabase } from './supabase'

export interface UserProviderProfile {
  flatrate: Set<number>
  rent: Set<number>
  buy: Set<number>
}

export interface UserProviderProfileDB {
  id: string
  user_id: string
  flatrate_providers: number[]
  rent_providers: number[]
  buy_providers: number[]
  created_at: string
  updated_at: string
}

/**
 * Load user's provider profile from database
 */
export async function loadUserProviderProfile(userId: string): Promise<UserProviderProfile> {
  try {
    const { data, error } = await supabase
      .from('user_provider_profiles')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle()

    if (error) {
      console.error('Error loading provider profile:', error)
      return { flatrate: new Set(), rent: new Set(), buy: new Set() }
    }

    if (!data) {
      // Profile doesn't exist yet, return empty
      return { flatrate: new Set(), rent: new Set(), buy: new Set() }
    }

    return {
      flatrate: new Set(data.flatrate_providers || []),
      rent: new Set(data.rent_providers || []),
      buy: new Set(data.buy_providers || [])
    }
  } catch (err) {
    console.error('Exception loading provider profile:', err)
    return { flatrate: new Set(), rent: new Set(), buy: new Set() }
  }
}

/**
 * Save user's provider profile to database
 */
export async function saveUserProviderProfile(
  userId: string,
  profile: UserProviderProfile
): Promise<boolean> {
  try {
    const profileData = {
      user_id: userId,
      flatrate_providers: Array.from(profile.flatrate),
      rent_providers: Array.from(profile.rent),
      buy_providers: Array.from(profile.buy),
      updated_at: new Date().toISOString()
    }

    // Try to insert or update
    const { error: upsertError } = await supabase
      .from('user_provider_profiles')
      .upsert(profileData, { onConflict: 'user_id' })

    if (upsertError) {
      console.error('Error saving provider profile:', upsertError)
      return false
    }

    console.log('Provider profile saved successfully for user:', userId)
    return true
  } catch (err) {
    console.error('Exception saving provider profile:', err)
    return false
  }
}
