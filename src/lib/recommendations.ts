// Collaborative Filtering Recommendation Engine

interface Rating {
  rating: number
  user_name: string
  user_id: string
}

interface Movie {
  id: string
  title: string
  ratings: Rating[]
  [key: string]: any
}

interface UserSimilarity {
  userName: string
  similarity: number
  commonMovies: number
}

interface Recommendation {
  movie: Movie
  predictedRating: number
  basedOnUsers: string[]
  tagBoost: number
  mostSimilarUserName?: string
  mostSimilarUserRating?: number
}

/**
 * Calculate user's tag preferences based on their ratings
 * Returns a map of tag -> average rating for that tag
 */
function calculateTagPreferences(
  currentUserId: string,
  allMovies: Movie[]
): Map<string, { avgRating: number; count: number }> {
  const tagStats = new Map<string, { sum: number; count: number }>()

  for (const movie of allMovies) {
    const userRating = movie.ratings.find(r => r.user_id === currentUserId)
    if (userRating && movie.tags) {
      for (const tag of movie.tags) {
        const tagName = tag.name
        if (!tagStats.has(tagName)) {
          tagStats.set(tagName, { sum: 0, count: 0 })
        }
        const stats = tagStats.get(tagName)!
        stats.sum += userRating.rating
        stats.count += 1
      }
    }
  }

  // Convert to average ratings
  const preferences = new Map<string, { avgRating: number; count: number }>()
  for (const [tagName, stats] of tagStats.entries()) {
    if (stats.count >= 2) { // Need at least 2 movies with this tag
      preferences.set(tagName, {
        avgRating: stats.sum / stats.count,
        count: stats.count
      })
    }
  }

  return preferences
}

/**
 * Calculate user's director preferences based on their ratings
 * Returns a map of director -> average rating for that director
 */
function calculateDirectorPreferences(
  currentUserId: string,
  allMovies: Movie[]
): Map<string, { avgRating: number; count: number }> {
  const directorStats = new Map<string, { sum: number; count: number }>()

  for (const movie of allMovies) {
    const userRating = movie.ratings.find(r => r.user_id === currentUserId)
    if (userRating && movie.director && typeof movie.director === 'string' && movie.director.trim() !== '') {
      const director = movie.director.trim()
      if (!directorStats.has(director)) {
        directorStats.set(director, { sum: 0, count: 0 })
      }
      const stats = directorStats.get(director)!
      stats.sum += userRating.rating
      stats.count += 1
    }
  }

  // Convert to average ratings
  const preferences = new Map<string, { avgRating: number; count: number }>()
  for (const [director, stats] of directorStats.entries()) {
    if (stats.count >= 1) { // Need at least 1 movie from this director
      preferences.set(director, {
        avgRating: stats.sum / stats.count,
        count: stats.count
      })
    }
  }

  return preferences
}

/**
 * Calculate director boost for a movie based on user's director preferences
 * Returns a value between 0 and 1
 */
function calculateDirectorBoost(
  movie: Movie,
  directorPreferences: Map<string, { avgRating: number; count: number }>
): number {
  if (!movie.director || typeof movie.director !== 'string' || movie.director.trim() === '') {
    return 0
  }

  const director = movie.director.trim()
  const pref = directorPreferences.get(director)
  
  if (!pref) {
    return 0
  }

  // Normalize to 0-1 scale (rating 3-5 maps to 0-1)
  const normalizedRating = Math.max(0, (pref.avgRating - 3) / 2)
  
  return normalizedRating
}

/**
 * Calculate actor preferences based on user's ratings
 */
function calculateActorPreferences(
  currentUserId: string,
  allMovies: Movie[]
): Map<string, { avgRating: number; count: number }> {
  const actorStats = new Map<string, { sum: number; count: number }>()

  for (const movie of allMovies) {
    const userRating = movie.ratings.find(r => r.user_id === currentUserId)
    if (userRating && movie.actor && typeof movie.actor === 'string') {
      movie.actor
        .split(',')
        .map(a => a.trim())
        .filter(Boolean)
        .forEach(actor => {
          if (!actorStats.has(actor)) {
            actorStats.set(actor, { sum: 0, count: 0 })
          }
          const stats = actorStats.get(actor)!
          stats.sum += userRating.rating
          stats.count += 1
        })
    }
  }

  const preferences = new Map<string, { avgRating: number; count: number }>()
  for (const [actor, stats] of actorStats.entries()) {
    if (stats.count >= 1) {
      preferences.set(actor, {
        avgRating: stats.sum / stats.count,
        count: stats.count
      })
    }
  }

  return preferences
}

/**
 * Calculate actor boost for a movie based on user's preferred actors
 */
function calculateActorBoost(
  movie: Movie,
  actorPreferences: Map<string, { avgRating: number; count: number }>
): number {
  if (!movie.actor || typeof movie.actor !== 'string') {
    return 0
  }

  const actors = movie.actor
    .split(',')
    .map(a => a.trim())
    .filter(Boolean)

  if (actors.length === 0) {
    return 0
  }

  let totalBoost = 0
  let matches = 0

  for (const actor of actors) {
    const pref = actorPreferences.get(actor)
    if (pref) {
      const normalizedRating = Math.max(0, (pref.avgRating - 3) / 2)
      totalBoost += normalizedRating
      matches++
    }
  }

  if (matches === 0) {
    return 0
  }

  return totalBoost / matches
}

/**
 * Calculate tag boost for a movie based on user's tag preferences
 * Returns a value between 0 and 1
 */
function calculateTagBoost(
  movie: Movie,
  tagPreferences: Map<string, { avgRating: number; count: number }>
): number {
  if (!movie.tags || movie.tags.length === 0) {
    return 0
  }

  let totalBoost = 0
  let matchingTags = 0

  for (const tag of movie.tags) {
    const pref = tagPreferences.get(tag.name)
    if (pref) {
      // Normalize to 0-1 scale (rating 3-5 maps to 0-1)
      const normalizedRating = Math.max(0, (pref.avgRating - 3) / 2)
      totalBoost += normalizedRating
      matchingTags++
    }
  }

  if (matchingTags === 0) {
    return 0
  }

  // Average boost across matching tags
  return totalBoost / matchingTags
}

/**
 * Calculate Pearson correlation coefficient between two users
 * Returns a value between -1 (opposite) and 1 (identical)
 */
function calculatePearsonCorrelation(
  user1Ratings: Map<string, number>,
  user2Ratings: Map<string, number>
): number {
  // Find movies both users have rated
  const commonMovies: string[] = []
  for (const movieId of user1Ratings.keys()) {
    if (user2Ratings.has(movieId)) {
      commonMovies.push(movieId)
    }
  }

  // Need at least 2 common movies for meaningful correlation
  if (commonMovies.length < 2) {
    return 0
  }

  // Calculate means
  let sum1 = 0
  let sum2 = 0
  for (const movieId of commonMovies) {
    sum1 += user1Ratings.get(movieId)!
    sum2 += user2Ratings.get(movieId)!
  }
  const mean1 = sum1 / commonMovies.length
  const mean2 = sum2 / commonMovies.length

  // Calculate correlation
  let numerator = 0
  let sum1Sq = 0
  let sum2Sq = 0

  for (const movieId of commonMovies) {
    const diff1 = user1Ratings.get(movieId)! - mean1
    const diff2 = user2Ratings.get(movieId)! - mean2
    numerator += diff1 * diff2
    sum1Sq += diff1 * diff1
    sum2Sq += diff2 * diff2
  }

  const denominator = Math.sqrt(sum1Sq * sum2Sq)
  
  if (denominator === 0) {
    return 0
  }

  return numerator / denominator
}

/**
 * Find users with similar taste to the current user
 */
export function findSimilarUsers(
  currentUserId: string,
  allMovies: Movie[],
  minCommonMovies: number = 2
): UserSimilarity[] {
  // Build rating maps for all users
  const userRatings = new Map<string, Map<string, number>>()

  for (const movie of allMovies) {
    for (const rating of movie.ratings) {
      if (!userRatings.has(rating.user_id)) {
        userRatings.set(rating.user_id, new Map())
      }
      userRatings.get(rating.user_id)!.set(movie.id, rating.rating)
    }
  }

  const currentUserRatings = userRatings.get(currentUserId)
  if (!currentUserRatings || currentUserRatings.size === 0) {
    return []
  }

  // Calculate similarity with all other users
  const similarities: UserSimilarity[] = []

  for (const [userId, otherUserRatings] of userRatings.entries()) {
    if (userId === currentUserId) continue

    // Count common movies
    let commonMovies = 0
    for (const movieId of currentUserRatings.keys()) {
      if (otherUserRatings.has(movieId)) {
        commonMovies++
      }
    }

    if (commonMovies < minCommonMovies) continue

    const similarity = calculatePearsonCorrelation(currentUserRatings, otherUserRatings)

    if (similarity > 0.1) { // Only consider positive correlations
      // Get user name
      const userName = allMovies
        .flatMap(m => m.ratings)
        .find(r => r.user_id === userId)?.user_name || 'Unknown'

      similarities.push({
        userName,
        similarity,
        commonMovies
      })
    }
  }

  // Sort by similarity (highest first)
  return similarities.sort((a, b) => b.similarity - a.similarity)
}

/**
 * Generate movie recommendations for a user based on similar users AND tag preferences
 */
export function generateRecommendations(
  currentUserId: string,
  allMovies: Movie[],
  maxRecommendations: number = 20
): Recommendation[] {
  // Find similar users
  const similarUsers = findSimilarUsers(currentUserId, allMovies)

  if (similarUsers.length === 0) {
    return []
  }

  // Calculate user's tag preferences
  const tagPreferences = calculateTagPreferences(currentUserId, allMovies)

  // Calculate user's director preferences
  const directorPreferences = calculateDirectorPreferences(currentUserId, allMovies)

  // Calculate user's actor preferences
  const actorPreferences = calculateActorPreferences(currentUserId, allMovies)

  // Get movies current user has already rated
  const ratedMovieIds = new Set<string>()
  for (const movie of allMovies) {
    if (movie.ratings.some(r => r.user_id === currentUserId)) {
      ratedMovieIds.add(movie.id)
    }
  }

  // Calculate predicted ratings for unrated movies
  const predictions: Recommendation[] = []

  for (const movie of allMovies) {
    // Skip if already rated
    if (ratedMovieIds.has(movie.id)) continue

    // Calculate weighted average rating from similar users (Collaborative Filtering)
    let weightedSum = 0
    let weightSum = 0
    const contributingUsers: string[] = []
    let mostSimilarUser: UserSimilarity | undefined
    let mostSimilarUserRating: number | undefined

    for (const similarUser of similarUsers) {
      const rating = movie.ratings.find(r => r.user_name === similarUser.userName)
      if (rating) {
        weightedSum += rating.rating * similarUser.similarity
        weightSum += similarUser.similarity
        contributingUsers.push(similarUser.userName)
        
        // Track the most similar user who rated this movie
        if (!mostSimilarUser || similarUser.similarity > mostSimilarUser.similarity) {
          mostSimilarUser = similarUser
          mostSimilarUserRating = rating.rating
        }
      }
    }

    // Need at least one similar user to have rated it
    if (weightSum > 0 && contributingUsers.length > 0) {
      const collaborativeRating = weightedSum / weightSum

      // Calculate tag boost (Content-based Filtering)
      const tagBoost = calculateTagBoost(movie, tagPreferences)

      // Calculate director boost (Content-based Filtering)
      const directorBoost = calculateDirectorBoost(movie, directorPreferences)

      // Calculate actor boost (Content-based Filtering)
      const actorBoost = calculateActorBoost(movie, actorPreferences)

      // Combine collaborative and content-based scores
      // Base weights favor collaborative + strong keyword/director signal, actors slightly lower.
      // If a boost is unavailable (0), its weight shifts to collaborative so we never block recommendations.
      const baseCollabWeight = 0.55
      const tagWeight = 0.2
      const directorWeight = 0.15
      const actorWeight = 0.1
      let collabWeight = baseCollabWeight

      if (tagBoost === 0) collabWeight += tagWeight
      if (directorBoost === 0) collabWeight += directorWeight
      if (actorBoost === 0) collabWeight += actorWeight

      const finalRating =
        collaborativeRating * collabWeight +
        collaborativeRating * tagBoost * tagWeight +
        collaborativeRating * directorBoost * directorWeight +
        collaborativeRating * actorBoost * actorWeight

      // Only recommend movies with final rating >= 3.5
      if (finalRating >= 3.5) {
        predictions.push({
          movie,
          predictedRating: finalRating,
          basedOnUsers: contributingUsers.slice(0, 3), // Top 3 contributors
          tagBoost,
          mostSimilarUserName: mostSimilarUser?.userName,
          mostSimilarUserRating
        })
      }
    }
  }

  // Sort by predicted rating (highest first)
  predictions.sort((a, b) => b.predictedRating - a.predictedRating)

  return predictions.slice(0, maxRecommendations)
}

/**
 * Calculate predicted ratings for ALL movies (including already rated)
 * This is used to show predicted match percentage on all movie cards
 */
export function calculatePredictedRatings(
  currentUserId: string,
  allMovies: Movie[]
): Map<string, number> {
  const predictedRatings = new Map<string, number>()

  // Find similar users
  const similarUsers = findSimilarUsers(currentUserId, allMovies)

  if (similarUsers.length === 0) {
    return predictedRatings
  }

  // Calculate user's tag preferences
  const tagPreferences = calculateTagPreferences(currentUserId, allMovies)

  // Calculate user's director preferences
  const directorPreferences = calculateDirectorPreferences(currentUserId, allMovies)

  // Calculate predicted ratings for all movies
  for (const movie of allMovies) {
    // Calculate weighted average rating from similar users (Collaborative Filtering)
    let weightedSum = 0
    let weightSum = 0

    for (const similarUser of similarUsers) {
      const rating = movie.ratings.find(r => r.user_name === similarUser.userName)
      if (rating) {
        weightedSum += rating.rating * similarUser.similarity
        weightSum += similarUser.similarity
      }
    }

    // Need at least one similar user to have rated it
    if (weightSum > 0) {
      const collaborativeRating = weightedSum / weightSum

      // Calculate tag boost (Content-based Filtering)
      const tagBoost = calculateTagBoost(movie, tagPreferences)

      // Calculate director boost (Content-based Filtering)
      const directorBoost = calculateDirectorBoost(movie, directorPreferences)

      // Calculate actor boost (Content-based Filtering)
      const actorBoost = calculateActorBoost(movie, actorPreferences)

      // Combine collaborative and content-based scores (same dynamic weighting as generateRecommendations)
      const baseCollabWeight = 0.55
      const tagWeight = 0.2
      const directorWeight = 0.15
      const actorWeight = 0.1
      let collabWeight = baseCollabWeight

      if (tagBoost === 0) collabWeight += tagWeight
      if (directorBoost === 0) collabWeight += directorWeight
      if (actorBoost === 0) collabWeight += actorWeight

      const finalRating =
        collaborativeRating * collabWeight +
        collaborativeRating * tagBoost * tagWeight +
        collaborativeRating * directorBoost * directorWeight +
        collaborativeRating * actorBoost * actorWeight

      predictedRatings.set(movie.id, finalRating)
    }
  }

  return predictedRatings
}
