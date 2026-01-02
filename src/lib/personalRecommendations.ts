import { supabase } from './supabase'

export interface PersonalRecommendation {
  movie_id: string
  from_user_id: string
  from_user_name?: string
  created_at: string
}

/**
 * Load all personal recommendations received by a user
 */
export async function loadPersonalRecommendations(userId: string): Promise<PersonalRecommendation[]> {
  try {
    const { data, error } = await supabase
      .from('personal_recommendations')
      .select(`
        movie_id,
        from_user_id,
        created_at
      `)
      .eq('to_user_id', userId)
      .order('created_at', { ascending: false })

    if (error) throw error

    const recs = data || []

    // Resolve aliases for recommenders
    const fromUserIds = Array.from(new Set(recs.map((rec: any) => rec.from_user_id).filter(Boolean)))
    let aliasMap = new Map<string, string>()

    if (fromUserIds.length > 0) {
      const { data: profiles, error: profileError } = await supabase
        .from('user_profiles')
        .select('user_id, alias')
        .in('user_id', fromUserIds)

      if (!profileError && profiles) {
        aliasMap = new Map(profiles.map((p: any) => [p.user_id, p.alias]))
      }
    }

    // Return data with from_user_name if available, otherwise use from_user_id as fallback
    return recs.map((rec: any) => ({
      ...rec,
      from_user_name: aliasMap.get(rec.from_user_id) || rec.from_user_id
    }))
  } catch (error) {
    console.error('Error loading personal recommendations:', error)
    return []
  }
}

/**
 * Get a map of movie IDs to their recommenders
 */
export function getRecommendersMap(recommendations: PersonalRecommendation[]): Map<string, string[]> {
  const map = new Map<string, string[]>()
  
  recommendations.forEach(rec => {
    if (!map.has(rec.movie_id)) {
      map.set(rec.movie_id, [])
    }
    if (rec.from_user_name) {
      map.get(rec.movie_id)!.push(rec.from_user_name)
    }
  })

  return map
}

/**
 * Merge AI recommendations with personal recommendations
 * Returns combined list with source information
 */
export function mergeRecommendations(
  aiRecommendations: any[],
  personalRecommendations: PersonalRecommendation[],
  allMovies: any[]
): any[] {
  const aiMovieIds = new Set(aiRecommendations.map(r => r.movie.id))
  const personalMovieIds = new Set(personalRecommendations.map(r => r.movie_id))
  
  const recommenderMap = getRecommendersMap(personalRecommendations)

  // Add source info to AI recommendations
  const enhancedAiRecs = aiRecommendations.map(rec => ({
    ...rec,
    source: 'ai',
    isPersonal: personalMovieIds.has(rec.movie.id),
    recommenders: recommenderMap.get(rec.movie.id) || []
  }))

  // Add personal-only recommendations (not in AI recommendations)
  const personalOnlyMovieIds = [...personalMovieIds].filter(id => !aiMovieIds.has(id))
  const personalOnlyRecs = personalOnlyMovieIds
    .map(movieId => {
      const movie = allMovies.find(m => m.id === movieId)
      if (!movie) return null

      return {
        movie,
        predictedRating: 0, // No AI prediction
        source: 'personal',
        isPersonal: true,
        recommenders: recommenderMap.get(movieId) || []
      }
    })
    .filter(rec => rec !== null)

  // Combine and sort: personal-only first, then AI by prediction
  const combined = [...enhancedAiRecs, ...personalOnlyRecs]
  
  return combined.sort((a, b) => {
    // Personal-only recommendations first
    if (a.source === 'personal' && b.source !== 'personal') return -1
    if (a.source !== 'personal' && b.source === 'personal') return 1
    
    // Then by predicted rating
    return (b.predictedRating || 0) - (a.predictedRating || 0)
  })
}
