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
  minCommonMovies: number = 3
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
 * Generate movie recommendations for a user based on similar users
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

    // Calculate weighted average rating from similar users
    let weightedSum = 0
    let weightSum = 0
    const contributingUsers: string[] = []

    for (const similarUser of similarUsers) {
      const rating = movie.ratings.find(r => r.user_name === similarUser.userName)
      if (rating) {
        weightedSum += rating.rating * similarUser.similarity
        weightSum += similarUser.similarity
        contributingUsers.push(similarUser.userName)
      }
    }

    // Need at least one similar user to have rated it
    if (weightSum > 0 && contributingUsers.length > 0) {
      const predictedRating = weightedSum / weightSum

      // Only recommend movies with predicted rating >= 3.5
      if (predictedRating >= 3.5) {
        predictions.push({
          movie,
          predictedRating,
          basedOnUsers: contributingUsers.slice(0, 3) // Top 3 contributors
        })
      }
    }
  }

  // Sort by predicted rating (highest first)
  predictions.sort((a, b) => b.predictedRating - a.predictedRating)

  return predictions.slice(0, maxRecommendations)
}
