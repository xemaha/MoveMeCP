'use client'

import React, { useState, useEffect, useRef } from 'react'
import { Range } from 'react-range'
import { supabase, Movie, Tag } from '@/lib/supabase'
import { MovieDetailModal } from '@/components/MovieDetailModal'
import { WatchProvidersDisplay } from '@/components/WatchProvidersDisplay'
import { RecommendModal } from '@/components/RecommendModal'
import { WhatsAppSuccessModal } from '@/components/WhatsAppSuccessModal'
import { useUser } from '@/lib/UserContext'
import { generateRecommendations, findSimilarUsers, calculatePredictedRatings } from '@/lib/recommendations'
import { loadPersonalRecommendations, mergeRecommendations } from '@/lib/personalRecommendations'

// Types
interface Rating {
  rating: number
  user_name: string
  user_id: string
}

interface EnhancedMovie extends Movie {
  tags: Tag[]
  averageRating: number
  ratingCount: number
  ratings: Rating[]
  actor?: string
  director?: string
  predictedRating?: number
}

interface FilterSettings {
  searchQuery: string
  userType: 'all' | 'rated' | 'watchlist' | 'unrated'
  userName: string
  minRating: number
  maxRating: number
  selectedTags: string[]
  contentTypes: {
    film: boolean
    serie: boolean
    buch: boolean
  }
}

// Range component props types
type RangeTrackProps = { props: any; children: React.ReactNode }
type RangeThumbProps = { props: any; index: number }

interface MovieListProps {
  defaultShowRecommendations?: boolean
  showOnlyRecommendations?: boolean
  hideRecommendations?: boolean
  contentTypeFilter?: {
    film: boolean
    serie: boolean
    buch: boolean
  }
  watchlistOnly?: boolean
  showPredictions?: boolean
  providerProfile?: {
    flatrate: Set<number>
    rent: Set<number>
    buy: Set<number>
  }
  providerTypeFilter?: {
    flatrate: boolean
    rent: boolean
    buy: boolean
    unavailable: boolean
  }
  recommendationSourceFilter?: 'all' | 'ai' | 'personal'
}

// Tag display component
const TagDisplay: React.FC<{ tags: Tag[] }> = ({ tags }) => {
  const [expanded, setExpanded] = useState(false)
  
  if (!tags?.length) return null
  
  const sortedTags = [...tags].sort((a, b) => a.name.localeCompare(b.name))
  const visibleTags = expanded ? sortedTags : sortedTags.slice(0, 8)
  const hasMore = sortedTags.length > visibleTags.length

  return (
    <div className="flex flex-wrap gap-2 mt-2">
      {visibleTags.map((tag) => (
        <span
          key={tag.id}
          className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium"
          style={{
            backgroundColor: tag.color + '20',
            color: tag.color
          }}
        >
          {tag.name}
        </span>
      ))}
      {hasMore && (
        <button
          className="ml-2 text-xs text-blue-600 underline hover:text-blue-800"
          onClick={() => setExpanded(!expanded)}
        >
          {expanded ? 'Weniger anzeigen' : 'Alle anzeigen'}
        </button>
      )}
    </div>
  )
}

export function MovieList(props?: MovieListProps) {
  const { defaultShowRecommendations = false, showOnlyRecommendations = false, hideRecommendations = false, contentTypeFilter, watchlistOnly = false, showPredictions = false, providerProfile, providerTypeFilter, recommendationSourceFilter = 'all' } = props || {}
  const { user } = useUser()
  
  // Core state
  const [movies, setMovies] = useState<EnhancedMovie[]>([])
  const [allTags, setAllTags] = useState<Tag[]>([])
  const [availableUsers, setAvailableUsers] = useState<string[]>([])
  const [watchlistMovies, setWatchlistMovies] = useState<Set<string>>(new Set())
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  // Filter state
  const [filters, setFilters] = useState<FilterSettings>({
    searchQuery: '',
    userType: 'all',
    userName: '',
    minRating: 0,
    maxRating: 5,
    selectedTags: [],
    contentTypes: {
      film: true,
      serie: true,
      buch: false
    }
  })
  
  // Separate rating range for personal ratings
  const [myRatingMin, setMyRatingMin] = useState(0)
  const [myRatingMax, setMyRatingMax] = useState(5)
  
  // UI state
  const [viewMode, setViewMode] = useState<'movie-based' | 'tag-based'>('movie-based')
  const [selectedMovie, setSelectedMovie] = useState<EnhancedMovie | null>(null)
  const [showAllTagsInFilter, setShowAllTagsInFilter] = useState(false)
  const [tagUsageCount, setTagUsageCount] = useState<Record<string, number>>({})
  const [userSearchInput, setUserSearchInput] = useState('')
  const [showUserDropdown, setShowUserDropdown] = useState(false)
  const [showRecommendations, setShowRecommendations] = useState(defaultShowRecommendations)
  const [recommendations, setRecommendations] = useState<any[]>([])
  const [isCalculatingRecommendations, setIsCalculatingRecommendations] = useState(false)
  const [predictedRatings, setPredictedRatings] = useState<Map<string, number>>(new Map())
  const hasAutoCalcRecs = useRef(false)
  const [movieProviders, setMovieProviders] = useState<Map<string, any>>(new Map()) // movieId -> provider data
  
  // Recommend modal state
  const [recommendModalMovie, setRecommendModalMovie] = useState<EnhancedMovie | null>(null)
  const [showWhatsAppModal, setShowWhatsAppModal] = useState(false)
  const [whatsAppRecipients, setWhatsAppRecipients] = useState<string[]>([])
  const [whatsAppMovie, setWhatsAppMovie] = useState<EnhancedMovie | null>(null)
  
  // Personal recommendations state
  const [personalRecommendations, setPersonalRecommendations] = useState<any[]>([])
  const [dismissedRecommendationIds, setDismissedRecommendationIds] = useState<Set<string>>(new Set())
  const [mergedRecommendations, setMergedRecommendations] = useState<any[]>([])
  
  // Map: movie_id -> array of recommender names
  const [movieRecommenders, setMovieRecommenders] = useState<Map<string, string[]>>(new Map())

  // Load dismissed recommendations per user from Supabase
  const loadDismissedRecommendations = async () => {
    if (!user) {
      setDismissedRecommendationIds(new Set())
      return
    }

    try {
      const { data, error } = await supabase
        .from('dismissed_recommendations')
        .select('movie_id')
        .eq('user_id', user.id)
      
      if (error) {
        console.error('Error loading dismissed recommendations:', error)
        return
      }
      
      if (data) {
        const movieIds = data.map(item => item.movie_id)
        setDismissedRecommendationIds(new Set(movieIds))
        console.log('Loaded', movieIds.length, 'dismissed recommendations')
      }
    } catch (err) {
      console.error('Error loading dismissed recommendations', err)
    }
  }

  useEffect(() => {
    loadDismissedRecommendations()
  }, [user])

  // Initialize data
  useEffect(() => {
    loadInitialData()
  }, [])

  // Load watch providers for watchlist movies when providerProfile is active
  useEffect(() => {
    const loadProvidersForMovies = async () => {
      if (!watchlistOnly || !providerProfile || movieProviders.size > 0) return
      if (movies.length === 0) return
      
      const watchlistMovieList = movies.filter(m => watchlistMovies.has(m.id))
      if (watchlistMovieList.length === 0) return
      
      const { getWatchProviders, searchTMDb } = await import('@/lib/tmdbApi')
      const providersMap = new Map<string, any>()
      
      await Promise.all(
        watchlistMovieList.slice(0, 30).map(async (movie) => {
          try {
            let tmdbId = (movie as any).tmdb_id
            let mediaType = (movie as any).media_type || 'movie'
            
            if (!tmdbId) {
              const results = await searchTMDb(movie.title)
              if (results && results.length > 0) {
                tmdbId = results[0].id
                mediaType = results[0].media_type || 'movie'
              }
            }
            
            if (tmdbId) {
              const providers = await getWatchProviders(tmdbId, mediaType as 'movie' | 'tv')
              if (providers && Object.keys(providers).length > 0) {
                providersMap.set(movie.id, providers)
              }
            }
          } catch (err) {
            // Ignore errors for individual movies
          }
        })
      )
      
      setMovieProviders(providersMap)
    }
    
    if (watchlistOnly && providerProfile && movies.length > 0) {
      loadProvidersForMovies()
    }
  }, [watchlistOnly, providerProfile, movies, watchlistMovies])

  useEffect(() => {
    loadWatchlist()
    loadPersonalRecommendationsForAllMovies()
  }, [user])

  useEffect(() => {
    loadTagUsageStats()
  }, [movies])

  // Auto-calculate recommendations when on recommendations page
  useEffect(() => {
    if (defaultShowRecommendations && !hasAutoCalcRecs.current && user && movies.length > 0) {
      handleCalculateRecommendations()
      hasAutoCalcRecs.current = true
    }
  }, [defaultShowRecommendations, user, movies.length])

  // Auto-calculate predictions for watchlist
  useEffect(() => {
    if (showPredictions && user && movies.length > 0) {
      const predictions = calculatePredictedRatings(user.id, movies)
      setPredictedRatings(predictions)
    }
  }, [showPredictions, user, movies.length])

  const loadInitialData = async () => {
    try {
      setIsLoading(true)
      await Promise.all([
        loadMovies(),
        loadTags(),
        loadUsers()
      ])
    } catch (err) {
      console.error('Error loading initial data:', err)
      setError('Fehler beim Laden der Daten')
    } finally {
      setIsLoading(false)
    }
  }

  const loadMovies = async () => {
    const { data: moviesData, error: moviesError } = await supabase
      .from('movies')
      .select('*')
      .order('created_at', { ascending: false })

    if (moviesError) throw moviesError
    if (!moviesData) return

    const enhancedMovies = await Promise.all(
      moviesData
        .filter(movie => movie.id) // Filter out movies without ID first
        .map(async (movie) => {
          const movieId = movie.id as string

          const [ratingsResult, tagsResult] = await Promise.all([
            supabase
              .from('ratings')
              .select('rating, user_name, user_id')
              .eq('movie_id', movieId),
            supabase
              .from('movie_tags')
              .select('tags(id, name, color, created_at)')
              .eq('movie_id', movieId)
          ])

          const ratings = ratingsResult.data || []
          const tags = tagsResult.data?.map((mt: any) => mt.tags).filter(Boolean) || []
          
          // Ensure ratings are properly typed and filtered
          const validRatings = ratings
            .filter(r => r.rating !== null && r.rating !== undefined)
            .map(r => Number(r.rating))
            .filter(rating => !isNaN(rating) && rating >= 1 && rating <= 5)
          
          const averageRating = validRatings.length > 0
            ? validRatings.reduce((sum, rating) => sum + rating, 0) / validRatings.length
            : 0

          return {
            ...movie,
            id: movieId, // Explicitly ensure id is set
            tags,
            averageRating,
            ratingCount: validRatings.length,
            ratings: ratings
              .filter(r => r.rating !== null && r.rating !== undefined && r.user_name && r.user_id)
              .map(r => ({
                rating: Number(r.rating),
                user_name: r.user_name as string,
                user_id: r.user_id as string
              }))
          } as EnhancedMovie
        })
    )

    setMovies(enhancedMovies)
  }

  const loadTags = async () => {
    try {
      const { data, error } = await supabase
        .from('tags')
        .select('*')
        .order('name')

      if (error) {
        console.error('Error loading tags:', error)
        return
      }

      if (data) {
        setAllTags(data.map(tag => ({
          id: tag.id as string,
          name: tag.name as string,
          color: tag.color as string,
          created_at: tag.created_at as string
        })))
      }
    } catch (error) {
      console.error('Exception in loadTags:', error)
    }
  }

  const loadUsers = async () => {
    try {
      const [ratingsResult, moviesResult] = await Promise.all([
        supabase.from('ratings').select('user_name').not('user_name', 'is', null),
        supabase.from('movies').select('created_by').not('created_by', 'is', null)
      ])

      const userSet = new Set<string>()
      
      if (ratingsResult.data) {
        ratingsResult.data.forEach((r: any) => {
          if (r.user_name && 
              typeof r.user_name === 'string' && 
              r.user_name.trim() !== '' &&
              !r.user_name.match(/^[0-9a-f-]{36}$/i)) {
            userSet.add(r.user_name)
          }
        })
      }
      
      if (moviesResult.data) {
        moviesResult.data.forEach((m: any) => {
          if (m.created_by && 
              typeof m.created_by === 'string' && 
              m.created_by.trim() !== '' &&
              !m.created_by.match(/^[0-9a-f-]{36}$/i)) {
            userSet.add(m.created_by)
          }
        })
      }

      let userList = Array.from(userSet)
        .filter(u => u && u !== 'System')

      // Sort: current user first, then alphabetically
      const currentUserName = user?.name
      if (currentUserName && userList.includes(currentUserName)) {
        userList = [
          currentUserName,
          ...userList.filter(u => u !== currentUserName).sort()
        ]
      } else {
        userList.sort()
      }

      setAvailableUsers(userList)
    } catch (error) {
      console.error('Exception in loadUsers:', error)
    }
  }

  const loadWatchlist = async () => {
    if (!user) {
      setWatchlistMovies(new Set())
      return
    }

    try {
      const { data, error } = await supabase
        .from('watchlist')
        .select('movie_id')
        .eq('user_id', user.id)

      if (error) {
        console.error('Error loading watchlist:', error)
        return
      }

      if (data) {
        const watchlistIds = new Set(data.map(item => item.movie_id as string).filter(Boolean))
        setWatchlistMovies(watchlistIds)
      }
    } catch (error) {
      console.error('Exception in loadWatchlist:', error)
    }
  }

  const loadTagUsageStats = async () => {
    const { data } = await supabase
      .from('movie_tags')
      .select('tag_id, tags(name)')
      
    if (data) {
      const countMap: Record<string, number> = {}
      data.forEach((row: any) => {
        const tagName = row.tags?.name
        if (tagName) {
          countMap[tagName] = (countMap[tagName] || 0) + 1
        }
      })
      setTagUsageCount(countMap)
    }
  }

  const loadPersonalRecommendationsForAllMovies = async () => {
    if (!user) {
      setMovieRecommenders(new Map())
      return
    }

    try {
      // Load all personal recommendations for this user
      const { data, error } = await supabase
        .from('personal_recommendations')
        .select('movie_id, from_user_id')
        .eq('to_user_id', user.id)

      if (error) {
        console.error('Error loading personal recommendations:', error)
        return
      }

      if (!data || data.length === 0) {
        setMovieRecommenders(new Map())
        return
      }

      // Get unique user IDs
      const userIds = [...new Set(data.map((rec: any) => rec.from_user_id))]
      
      // Load user profiles for these IDs
      const { data: profiles, error: profilesError } = await supabase
        .from('user_profiles')
        .select('id, name')
        .in('id', userIds)

      const userIdToName = new Map<string, string>()
      if (profiles && !profilesError) {
        profiles.forEach((profile: any) => {
          userIdToName.set(profile.id, profile.name || profile.id)
        })
      }

      // Build recommender map
      const recommenderMap = new Map<string, string[]>()
      data.forEach((rec: any) => {
        const movieId = rec.movie_id
        const fromUserName = userIdToName.get(rec.from_user_id) || rec.from_user_id
        
        if (!recommenderMap.has(movieId)) {
          recommenderMap.set(movieId, [])
        }
        recommenderMap.get(movieId)!.push(fromUserName)
      })
      
      setMovieRecommenders(recommenderMap)
      console.log('Loaded personal recommendations for', recommenderMap.size, 'movies')
    } catch (error) {
      console.error('Error loading personal recommendations:', error)
    }
  }

  // Event handlers
  const handleRating = async (movieId: string, rating: number) => {
    if (!user || !movieId) {
      alert('Du musst eingeloggt sein, um zu bewerten!')
      return
    }

    try {
      const existingRating = await supabase
        .from('ratings')
        .select('*')
        .eq('movie_id', movieId)
        .eq('user_id', user.id)
        .single()

      if (existingRating.data) {
        const { error } = await supabase
          .from('ratings')
          .update({ rating })
          .eq('id', existingRating.data.id as string)
          
        if (error) throw error
      } else {
        const { error } = await supabase
          .from('ratings')
          .insert([{
            movie_id: movieId,
            rating: rating,
            user_id: user.id,
            user_name: user.name,
          }])
          
        if (error) throw error
      }

      // Update local state
      setMovies(prevMovies => prevMovies.map(movie => {
        if (movie.id === movieId) {
          const existingIndex = movie.ratings.findIndex(r => r.user_id === user.id)
          let updatedRatings = [...movie.ratings]
          
          if (existingIndex >= 0) {
            updatedRatings[existingIndex] = { ...updatedRatings[existingIndex], rating }
          } else {
            updatedRatings.push({ rating, user_name: user.name, user_id: user.id })
          }

          const averageRating = updatedRatings.length > 0
            ? updatedRatings.reduce((sum, r) => sum + r.rating, 0) / updatedRatings.length
            : 0

          return {
            ...movie,
            ratings: updatedRatings,
            averageRating,
            ratingCount: updatedRatings.length
          }
        }
        return movie
      }))
    } catch (error) {
      console.error('Error handling rating:', error)
      alert('Fehler beim Verarbeiten der Bewertung')
    }
  }

  const handleDeleteRating = async (movieId: string) => {
    if (!user || !movieId) return
    
    try {
      const { data, error } = await supabase
        .from('ratings')
        .select('id')
        .eq('movie_id', movieId)
        .eq('user_id', user.id)
        .single()
        
      if (error) {
        console.error('Error finding rating:', error)
        return
      }
        
      if (data) {
        const { error: deleteError } = await supabase
          .from('ratings')
          .delete()
          .eq('id', data.id as string)
          
        if (deleteError) throw deleteError

        setMovies(prevMovies => prevMovies.map(movie => {
          if (movie.id === movieId) {
            const updatedRatings = movie.ratings.filter(r => r.user_id !== user.id)
            const averageRating = updatedRatings.length > 0
              ? updatedRatings.reduce((sum, r) => sum + r.rating, 0) / updatedRatings.length
              : 0
            return {
              ...movie,
              ratings: updatedRatings,
              averageRating,
              ratingCount: updatedRatings.length
            }
          }
          return movie
        }))
      }
    } catch (error) {
      console.error('Error deleting rating:', error)
    }
  }

  const handleWatchlistToggle = async (movieId: string) => {
    if (!user || !movieId) {
      alert('Du musst eingeloggt sein!')
      return
    }

    try {
      const isInWatchlist = watchlistMovies.has(movieId)

      if (isInWatchlist) {
        const { error } = await supabase
          .from('watchlist')
          .delete()
          .eq('movie_id', movieId)
          .eq('user_id', user.id)
          
        if (error) throw error

        setWatchlistMovies(prev => {
          const newSet = new Set(prev)
          newSet.delete(movieId)
          return newSet
        })
      } else {
        const { error } = await supabase
          .from('watchlist')
          .insert([{
            movie_id: movieId,
            user_id: user.id,
          }])
          
        if (error) throw error

        setWatchlistMovies(prev => new Set(prev).add(movieId))
      }

    } catch (error: any) {
      console.error('Error handling watchlist:', error)
      alert(`Fehler: ${error.message}`)
    }
  }

  // Remove/dismiss a recommendation card (personal: delete in DB, AI: just hide)
  const handleRemoveRecommendation = async (rec: any) => {
    if (!user) return

    const movieId = rec.movie.id

    try {
      if (rec.source === 'personal') {
        const { error } = await supabase
          .from('personal_recommendations')
          .delete()
          .eq('movie_id', movieId)
          .eq('to_user_id', user.id)

        if (error) {
          console.error('Error deleting personal recommendation:', error)
          alert('Konnte Empfehlung nicht löschen')
          return
        }

        setPersonalRecommendations(prev => prev.filter((item: any) => item.movie_id !== movieId))
        
        // Update movieRecommenders map to remove this movie
        setMovieRecommenders(prev => {
          const next = new Map(prev)
          next.delete(movieId)
          return next
        })
      }

      // Add to dismissed list in Supabase
      const { error: dismissError } = await supabase
        .from('dismissed_recommendations')
        .insert({ user_id: user.id, movie_id: movieId })
        .select()
      
      if (dismissError && !dismissError.message.includes('duplicate')) {
        console.error('Error saving dismissed recommendation:', dismissError)
        alert('Konnte Empfehlung nicht als verworfen speichern')
        return
      }

      const newDismissedIds = new Set(dismissedRecommendationIds)
      newDismissedIds.add(movieId)
      setDismissedRecommendationIds(newDismissedIds)
      console.log('Dismissed recommendation saved to Supabase')

      setMergedRecommendations(prev => prev.filter(item => item.movie.id !== movieId))
      setRecommendations(prev => prev.filter(item => item.movie.id !== movieId))
    } catch (err) {
      console.error('Error deleting recommendation:', err)
      alert('Konnte Empfehlung nicht löschen')
    }
  }

  useEffect(() => {
    setRecommendations(prev => filterOutDismissed(prev))
    setMergedRecommendations(prev => filterOutDismissed(prev))
  }, [dismissedRecommendationIds])

  const handleRecommendClick = (movie: EnhancedMovie) => {
    if (!user) {
      alert('Du musst eingeloggt sein!')
      return
    }
    setRecommendModalMovie(movie)
  }

  const handleRecommendSuccess = (recipients: string[]) => {
    setRecommendModalMovie(null)
    setWhatsAppRecipients(recipients)
    setWhatsAppMovie(recommendModalMovie)
    setShowWhatsAppModal(true)
  }

  const handleWhatsAppModalClose = () => {
    setShowWhatsAppModal(false)
    setWhatsAppRecipients([])
    setWhatsAppMovie(null)
  }

  // Filter logic
  const filteredMovies = movies.filter(movie => {
    // Ensure movie has valid id
    if (!movie.id) return false

    // If watchlistOnly, only show movies in watchlist
    if (watchlistOnly && !watchlistMovies.has(movie.id)) {
      return false
    }
    
    // Search filter
    const searchLower = filters.searchQuery.toLowerCase()
    const matchesSearch = !filters.searchQuery ||
      movie.title?.toLowerCase().includes(searchLower) ||
      movie.tags?.some(tag => tag.name?.toLowerCase().includes(searchLower)) ||
      (movie.actor && movie.actor.toLowerCase().includes(searchLower)) ||
      (movie.director && movie.director.toLowerCase().includes(searchLower))

    // User-specific type filter (watchlist/rated for current user)
    let matchesUserTypeFilter = true
    if (user && filters.userType !== 'all') {
      if (filters.userType === 'rated') {
        const userRating = movie.ratings?.find(r => r.user_id === user.id)
        matchesUserTypeFilter = !!userRating
      } else if (filters.userType === 'watchlist') {
        matchesUserTypeFilter = watchlistMovies.has(movie.id)
      } else if (filters.userType === 'unrated') {
        const userRating = movie.ratings?.find(r => r.user_id === user.id)
        matchesUserTypeFilter = !userRating
      }
    }

    // Rating range filter - handle combinations of filters
    let matchesRatingRange = true
    
    // Check personal rating filter ("Von mir bewertet")
    let matchesMyRating = true
    if (filters.userType === 'rated' && user) {
      const userRating = movie.ratings?.find(r => r.user_id === user.id)
      if (userRating) {
        matchesMyRating = userRating.rating >= myRatingMin && 
                         userRating.rating <= myRatingMax
      } else {
        matchesMyRating = false
      }
    }
    
    // Check friend filter (Freunde Inspiration)
    let matchesFriendRating = true
    if (filters.userName) {
      const selectedUserRating = movie.ratings?.find(r => r.user_name === filters.userName)
      if (selectedUserRating) {
        matchesFriendRating = selectedUserRating.rating >= filters.minRating && 
                             selectedUserRating.rating <= filters.maxRating
      } else {
        // Friend hasn't rated this movie - exclude it
        matchesFriendRating = false
      }
    } else {
      // No specific friend selected - filter by average rating
      if (movie.averageRating > 0) {
        matchesFriendRating = movie.averageRating >= filters.minRating && 
                             movie.averageRating <= filters.maxRating
      } else {
        matchesFriendRating = filters.minRating === 0
      }
    }
    
    // Combine filters: both must match if both are active
    if (filters.userType === 'rated' && user) {
      // Personal rating filter is active
      matchesRatingRange = matchesMyRating && matchesFriendRating
    } else if (filters.userName || filters.minRating > 0 || filters.maxRating < 5) {
      // Friend filter is active (when friend selected OR rating range adjusted)
      matchesRatingRange = matchesFriendRating
    }
    // Otherwise, no rating filter is active

    // Tag filter
    let matchesTagFilter = true
    if (filters.selectedTags.length > 0) {
      matchesTagFilter = filters.selectedTags.every(selectedTag =>
        movie.tags?.some(movieTag => movieTag.name === selectedTag)
      )
    }

    // Content type filter - use contentTypeFilter from props if provided, otherwise use filters state
    const typeFilter = contentTypeFilter || filters.contentTypes
    const matchesContentType = typeFilter[movie.content_type as keyof typeof typeFilter]

    // Provider profile filter with type filtering
    let matchesProviderFilter = true
    if (providerProfile) {
      const hasAnyProviderConfigured = 
        providerProfile.flatrate.size > 0 || 
        providerProfile.rent.size > 0 || 
        providerProfile.buy.size > 0
      
      if (hasAnyProviderConfigured) {
        const movieProviderData = movieProviders.get(movie.id)
        
        if (!movieProviderData) {
          // No provider data - can't watch it
          if (!providerTypeFilter?.unavailable) {
            matchesProviderFilter = false
          }
        } else {
          const countryData = movieProviderData.DE || Object.values(movieProviderData)[0] as any
          
          if (!countryData) {
            if (!providerTypeFilter?.unavailable) {
              matchesProviderFilter = false
            }
          } else {
            // Check which categories this movie is available in for user's services
            let availableCategories = {
              flatrate: false,
              rent: false,
              buy: false
            }
            
            // Check flatrate (streaming subscriptions)
            if (providerProfile.flatrate.size > 0 && countryData.flatrate) {
              availableCategories.flatrate = countryData.flatrate.some((p: any) => 
                providerProfile.flatrate.has(p.provider_id)
              )
            }
            
            // Check rent
            if (providerProfile.rent.size > 0 && countryData.rent) {
              availableCategories.rent = countryData.rent.some((p: any) => 
                providerProfile.rent.has(p.provider_id)
              )
            }
            
            // Check buy
            if (providerProfile.buy.size > 0 && countryData.buy) {
              availableCategories.buy = countryData.buy.some((p: any) => 
                providerProfile.buy.has(p.provider_id)
              )
            }
            
            // Check if movie passes the type filter
            const isAvailable = availableCategories.flatrate || availableCategories.rent || availableCategories.buy
            
            // Apply provider type filter if it exists
            if (providerTypeFilter) {
              // If movie is unavailable on user's services
              if (!isAvailable) {
                matchesProviderFilter = providerTypeFilter.unavailable
              } else {
                // Movie is available - check if any selected type matches
                const selectedTypes = {
                  flatrate: providerTypeFilter.flatrate && availableCategories.flatrate,
                  rent: providerTypeFilter.rent && availableCategories.rent,
                  buy: providerTypeFilter.buy && availableCategories.buy
                }
                matchesProviderFilter = selectedTypes.flatrate || selectedTypes.rent || selectedTypes.buy
              }
            } else {
              // No type filter applied, just check if available
              matchesProviderFilter = isAvailable
            }
          }
        }
      }
    }

    return matchesSearch && matchesUserTypeFilter && matchesRatingRange && matchesTagFilter && matchesContentType && matchesProviderFilter
  })

  // Helper functions
  const getUserRating = (movieRatings: Rating[], userId: string): number => {
    const userRating = movieRatings.find(r => r.user_id === userId)
    return userRating ? userRating.rating : 0
  }

  const updateFilters = (updates: Partial<FilterSettings>) => {
    setFilters(prev => ({ ...prev, ...updates }))
  }

  const filterOutDismissed = (items: any[]) => {
    if (!dismissedRecommendationIds.size) return items
    return items.filter(item => !dismissedRecommendationIds.has(item.movie.id))
  }

  const getAvailableTagsWithCounts = () => {
    return allTags.map(tag => {
      const count = filteredMovies.filter(movie => 
        movie.tags.some(movieTag => movieTag.name === tag.name)
      ).length
      return { ...tag, count }
    }).filter(tag => tag.count > 0)
  }

  const getTagBasedGroups = () => {
    const groups: { [tagName: string]: { tag: Tag; movies: EnhancedMovie[] } } = {}
    
    filteredMovies.forEach(movie => {
      movie.tags.forEach(tag => {
        if (!groups[tag.name]) {
          groups[tag.name] = { tag, movies: [] }
        }
        groups[tag.name].movies.push(movie)
      })
    })

    return Object.entries(groups)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([tagName, data]) => ({
        tagName,
        tag: data.tag,
        movies: data.movies.sort((a, b) => a.title.localeCompare(b.title))
      }))
  }

  const handleCalculateRecommendations = async () => {
    if (!user) return
    
    setIsCalculatingRecommendations(true)
    
    try {
      // Calculate AI recommendations
      const recs = generateRecommendations(user.id, movies, 20)
      
      // Load personal recommendations
      const personalRecs = await loadPersonalRecommendations(user.id)
      setPersonalRecommendations(personalRecs)
      
      // Merge recommendations with source info
      const merged = mergeRecommendations(recs, personalRecs, movies)
      const filteredMerged = filterOutDismissed(merged)
      setMergedRecommendations(filteredMerged)
      setRecommendations(filteredMerged)
      
      // Calculate predicted ratings for all movies
      const predictions = calculatePredictedRatings(user.id, movies)
      setPredictedRatings(predictions)
      
      setShowRecommendations(true)
    } catch (error) {
      console.error('Error calculating recommendations:', error)
    } finally {
      setIsCalculatingRecommendations(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex justify-center items-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-center p-8 text-red-600">
        {error}
      </div>
    )
  }

  const availableTagsWithCounts = getAvailableTagsWithCounts()

  return (
    <div className="space-y-6">
      {/* Recommendations Section */}
      {user && !hideRecommendations && (
        showOnlyRecommendations ? (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-800">🎯 Empfehlungen</h3>
            {isCalculatingRecommendations && (
              <div className="text-sm text-gray-600">Berechne Empfehlungen...</div>
            )}
            {recommendations.length > 0 ? (
              <div>
                <p className="text-sm text-gray-600 mb-2">Basierend auf Nutzern mit ähnlichem Geschmack</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {recommendations
                    .filter(rec => !dismissedRecommendationIds.has(rec.movie.id))
                    .filter(rec => {
                      // Filter by source
                      if (recommendationSourceFilter === 'ai' && rec.source !== 'ai') return false
                      if (recommendationSourceFilter === 'personal' && rec.source !== 'personal') return false
                      
                      const typeFilter = contentTypeFilter || filters.contentTypes
                      const contentType = rec.movie.content_type?.toLowerCase()
                      if (contentType === 'film') return typeFilter.film
                      if (contentType === 'serie') return typeFilter.serie
                      if (contentType === 'buch') return typeFilter.buch
                      return true
                    })
                    .map((rec) => (
                      <div
                        key={rec.movie.id}
                        className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow"
                      >
                        <div onClick={() => setSelectedMovie(rec.movie)} className="cursor-pointer">
                          {/* Poster */}
                          {rec.movie.poster_url ? (
                            <div className="w-full h-60 overflow-hidden">
                              <img
                                src={rec.movie.poster_url}
                                alt={rec.movie.title}
                                className="w-full h-full object-cover hover:scale-105 transition-transform"
                              />
                            </div>
                          ) : (
                            <div className="w-full h-60 bg-gray-200 flex items-center justify-center text-gray-400 text-5xl">
                              🎬
                            </div>
                          )}
                          
                            <div className="p-4">
                            {/* Title and Source Badge */}
                            <div className="flex items-center gap-2 mb-2">
                              <h3 className="text-lg font-semibold text-gray-900 truncate flex-1">
                                {rec.movie.title}
                              </h3>
                              <div className="flex items-center gap-2">
                                {rec.source === 'personal' ? (
                                  <span className="bg-pink-100 text-pink-800 text-xs px-2 py-1 rounded-full whitespace-nowrap">
                                    👥 {rec.recommenders?.join(', ')}
                                  </span>
                                ) : (
                                  <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full whitespace-nowrap">
                                    🤖 KI
                                  </span>
                                )}

                                {user && (
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      handleRemoveRecommendation(rec)
                                    }}
                                    className="w-7 h-7 inline-flex items-center justify-center rounded-full bg-red-100 text-red-600 hover:bg-red-200 text-xs font-bold"
                                    title="Empfehlung entfernen"
                                  >
                                    ✕
                                  </button>
                                )}
                              </div>
                            </div>
                            
                            {/* Predicted Match - only show for AI recommendations */}
                            {rec.source === 'ai' && rec.predictedRating > 0 && (
                              <div className="bg-green-50 border border-green-200 rounded-lg p-2 mb-2">
                                <span className="text-xs text-green-700 font-medium">
                                  Wird dir mit {Math.round((rec.predictedRating / 5) * 100)}% Wahrscheinlichkeit gefallen
                                </span>
                              </div>
                            )}
                            
                            {/* Most similar user info */}
                            {rec.mostSimilarUserName && rec.mostSimilarUserRating && (
                              <div className="text-xs text-gray-500 mb-2">
                                {rec.mostSimilarUserName} hat bewertet:
                                <div className="flex items-center gap-1 mt-0.5">
                                  {[1, 2, 3, 4, 5].map((star) => (
                                    <span
                                      key={star}
                                      className={`text-sm ${
                                        star <= rec.mostSimilarUserRating! ? 'text-yellow-400' : 'text-gray-300'
                                      }`}
                                    >
                                      ★
                                    </span>
                                  ))}
                                  <span className="text-gray-600 ml-1">{rec.mostSimilarUserRating}</span>
                                </div>
                              </div>
                            )}

                            {/* Description */}
                            {rec.movie.description && (
                              <p className="text-gray-600 text-sm mb-3 line-clamp-2">
                                {rec.movie.description}
                              </p>
                            )}

                            {/* YouTube Trailer Button */}
                            {rec.movie.trailer_url && (
                              <div className="mb-3">
                                <a
                                  href={rec.movie.trailer_url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center px-3 py-1 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors text-xs font-medium gap-2"
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  🎬 Trailer ansehen
                                </a>
                              </div>
                            )}

                            {/* Tags */}
                            {rec.movie.tags.length > 0 && (
                              <TagDisplay tags={rec.movie.tags} />
                            )}

                            {/* Average Rating */}
                            {rec.movie.averageRating > 0 && (
                              <div className="flex items-center mb-3">
                                <div className="flex">
                                  {[1, 2, 3, 4, 5].map((star) => (
                                    <span
                                      key={star}
                                      className={`text-lg ${
                                        star <= rec.movie.averageRating ? 'text-yellow-400' : 'text-gray-300'
                                      }`}
                                    >
                                      ★
                                    </span>
                                  ))}
                                </div>
                                <span className="text-sm text-gray-600 ml-2">
                                  {rec.movie.averageRating.toFixed(1)} ({rec.movie.ratingCount} Bewertungen)
                                </span>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* User actions */}
                        {user && (
                          <div className="p-4 bg-blue-50 border-t" onClick={(e) => e.stopPropagation()}>
                            {/* Watchlist button */}
                            <button
                              onClick={() => handleWatchlistToggle(rec.movie.id)}
                              className={`w-full flex items-center justify-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                                watchlistMovies.has(rec.movie.id)
                                  ? 'bg-green-100 text-green-700 hover:bg-green-200'
                                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                              }`}
                            >
                              <span>{watchlistMovies.has(rec.movie.id) ? '👁️' : '👁️‍🗨️'}</span>
                              <span>
                                {watchlistMovies.has(rec.movie.id) ? 'Auf Watchlist' : 'Zur Watchlist'}
                              </span>
                            </button>
                          </div>
                        )}
                      </div>
                    ))}
                </div>
              </div>
            ) : (
              <div className="text-sm text-gray-600">Keine Empfehlungen gefunden. Bewerte mehr Filme, um bessere Empfehlungen zu erhalten!</div>
            )}
          </div>
        ) : (
          <div className="p-4 rounded-lg border-2 border-green-200 bg-green-50">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-lg font-semibold text-gray-800">🎯 Empfehlungen für dich</h3>
              <div className="flex gap-2">
                <button
                  onClick={handleCalculateRecommendations}
                  disabled={isCalculatingRecommendations}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
                >
                  {isCalculatingRecommendations ? 'Berechne...' : showRecommendations ? '🔄 Neu berechnen' : '✨ Empfehlungen anzeigen'}
                </button>
                {showRecommendations && (
                  <button
                    onClick={() => setShowRecommendations(false)}
                    className="px-3 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors text-sm font-medium"
                    title="Empfehlungen ausblenden"
                  >
                    ✕
                  </button>
                )}
              </div>
            </div>
            
            {showRecommendations && recommendations.length > 0 && (
              <div>
                <p className="text-sm text-gray-600 mb-4">
                  Basierend auf Nutzern mit ähnlichem Geschmack wie du
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 max-h-96 overflow-y-auto">
                  {recommendations
                    .filter(rec => {
                      const typeFilter = contentTypeFilter || filters.contentTypes
                      const contentType = rec.movie.content_type?.toLowerCase()
                      if (contentType === 'film') return typeFilter.film
                      if (contentType === 'serie') return typeFilter.serie
                      if (contentType === 'buch') return typeFilter.buch
                      return true
                    })
                    .map((rec) => (
                      <div
                        key={rec.movie.id}
                        className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow"
                      >
                        <div onClick={() => setSelectedMovie(rec.movie)} className="cursor-pointer">
                          {/* Poster */}
                          {rec.movie.poster_url ? (
                            <div className="w-full h-60 overflow-hidden">
                              <img
                                src={rec.movie.poster_url}
                                alt={rec.movie.title}
                                className="w-full h-full object-cover hover:scale-105 transition-transform"
                              />
                            </div>
                          ) : (
                            <div className="w-full h-60 bg-gray-200 flex items-center justify-center text-gray-400 text-5xl">
                              🎬
                            </div>
                          )}
                          
                          <div className="p-4">
                            {/* Title and type */}
                            <div className="flex items-center gap-2 mb-2">
                              <h3 className="text-lg font-semibold text-gray-900 truncate flex-1">
                                {rec.movie.title}
                              </h3>
                            </div>
                            
                            {/* Predicted Match */}
                            <div className="bg-green-50 border border-green-200 rounded-lg p-2 mb-2">
                              <span className="text-xs text-green-700 font-medium">
                                Wird dir mit {Math.round((rec.predictedRating / 5) * 100)}% Wahrscheinlichkeit gefallen
                              </span>
                            </div>
                            
                            {/* Most similar user info */}
                            {rec.mostSimilarUserName && rec.mostSimilarUserRating && (
                              <div className="text-xs text-gray-500 mb-2">
                                {rec.mostSimilarUserName} hat bewertet:
                                <div className="flex items-center gap-1 mt-0.5">
                                  {[1, 2, 3, 4, 5].map((star) => (
                                    <span
                                      key={star}
                                      className={`text-sm ${
                                        star <= rec.mostSimilarUserRating! ? 'text-yellow-400' : 'text-gray-300'
                                      }`}
                                    >
                                      ★
                                    </span>
                                  ))}
                                  <span className="text-gray-600 ml-1">{rec.mostSimilarUserRating}</span>
                                </div>
                              </div>
                            )}
                            
                            <div className="flex items-center gap-2 mb-2">
                              <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full">
                                {rec.movie.content_type === 'film' ? '🎬' : 
                                 rec.movie.content_type === 'serie' ? '📺' : '📚'} 
                                {rec.movie.content_type}
                              </span>
                              {rec.movie.created_by && (
                                <span className="text-xs text-gray-500">von {rec.movie.created_by}</span>
                              )}
                            </div>

                            {/* Description */}
                            {rec.movie.description && (
                              <p className="text-gray-600 text-sm mb-3 line-clamp-2">
                                {rec.movie.description}
                              </p>
                            )}

                            {/* Tags */}
                            {rec.movie.tags.length > 0 && (
                              <TagDisplay tags={rec.movie.tags} />
                            )}

                            {/* Average Rating */}
                            {rec.movie.averageRating > 0 && (
                              <div className="flex items-center mb-3">
                                <div className="flex">
                                  {[1, 2, 3, 4, 5].map((star) => (
                                    <span
                                      key={star}
                                      className={`text-lg ${
                                        star <= rec.movie.averageRating ? 'text-yellow-400' : 'text-gray-300'
                                      }`}
                                    >
                                      ★
                                    </span>
                                  ))}
                                </div>
                                <span className="text-sm text-gray-600 ml-2">
                                  {rec.movie.averageRating.toFixed(1)} ({rec.movie.ratingCount} Bewertungen)
                                </span>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* User actions */}
                        {user && (
                          <div className="p-4 bg-blue-50 border-t" onClick={(e) => e.stopPropagation()}>
                            {/* Watchlist button */}
                            <button
                              onClick={() => handleWatchlistToggle(rec.movie.id)}
                              className={`w-full flex items-center justify-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                                watchlistMovies.has(rec.movie.id)
                                  ? 'bg-green-100 text-green-700 hover:bg-green-200'
                                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                              }`}
                            >
                              <span>{watchlistMovies.has(rec.movie.id) ? '👁️' : '👁️‍🗨️'}</span>
                              <span>
                                {watchlistMovies.has(rec.movie.id) ? 'Auf Watchlist' : 'Zur Watchlist'}
                              </span>
                            </button>
                          </div>
                        )}
                      </div>
                    ))}
                </div>
              </div>
            )}

            {showRecommendations && recommendations.length === 0 && (
              <p className="text-sm text-gray-600 italic">
                Keine Empfehlungen gefunden. Bewerte mehr Filme, um bessere Empfehlungen zu erhalten!
              </p>
            )}
          </div>
        )
      )}

      {!showOnlyRecommendations && (
        <>
          {/* Only show filters if not watchlistOnly */}
          {!watchlistOnly && (
            <>
              {/* Filters */}
              <div className="space-y-4">
            {/* Search */}
            <input
              type="text"
              placeholder="Suche nach Titel, Tags, Schauspielern..."
          value={filters.searchQuery}
          onChange={(e) => updateFilters({ searchQuery: e.target.value })}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        />

        {/* Content Type Filter - Hidden when contentTypeFilter is provided from parent */}
        {!contentTypeFilter && (
          <div className="p-4 rounded-lg">
            <h3 className="text-sm font-medium text-gray-700 mb-3">Content-Type</h3>
            <div className="flex gap-2 flex-wrap">
              {Object.entries(filters.contentTypes).map(([type, checked]) => {
                const icons: Record<string, string> = {
                  film: '🎬 Filme',
                  serie: '📺 Serien',
                  buch: '📚 Bücher'
                }
                return (
                  <button
                    key={type}
                    onClick={() => updateFilters({
                      contentTypes: {
                        ...filters.contentTypes,
                        [type]: !checked
                      }
                    })}
                    className={`px-4 py-2 rounded-lg font-medium transition-all ${
                      checked
                        ? 'bg-blue-600 text-white shadow-md hover:bg-blue-700'
                        : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
                    }`}
                  >
                    {icons[type]}
                  </button>
                )
              })}
            </div>
          </div>
        )}

        {/* Personal Filter - For Current User */}
        {user && (
          <div className="p-4 rounded-lg border-2 border-blue-200 bg-blue-50">
            <h3 className="text-sm font-semibold text-gray-800 mb-3">📌 Meine Filter</h3>
            <div className="flex flex-col gap-2">
              {[
                { value: 'all', label: '🎬 Alle Filme & Serien' },
                { value: 'watchlist', label: '👁️ Meine Watchlist' },
                { value: 'rated', label: '⭐ Von mir bewertet' },
                { value: 'unrated', label: '☆ Von mir noch nicht bewertet' }
              ].map(option => (
                <button
                  key={option.value}
                  onClick={() => updateFilters({
                    userType: option.value as FilterSettings['userType'],
                    userName: ''
                  })}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all text-left ${
                    filters.userType === option.value
                      ? 'bg-blue-600 text-white shadow-md'
                      : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-200'
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
            
            {/* Show rating range only when "Von mir bewertet" is selected */}
            {filters.userType === 'rated' && (
              <div className="mt-4 pt-4 border-t border-blue-300">
                <label className="text-xs font-medium text-gray-700 block mb-2">
                  Meine Bewertungen: {myRatingMin} - {myRatingMax} ⭐
                </label>
                <Range
                  step={1}
                  min={0}
                  max={5}
                  values={[myRatingMin, myRatingMax]}
                  onChange={(values) => {
                    setMyRatingMin(values[0])
                    setMyRatingMax(values[1])
                  }}
                  renderTrack={({ props, children }: RangeTrackProps) => {
                    const { key, ...restProps } = props
                    return (
                      <div
                        key={key}
                        {...restProps}
                        className="h-2 w-full rounded bg-gray-200"
                      >
                        <div 
                          className="h-2 rounded bg-blue-400"
                          style={{
                            position: 'absolute',
                            left: `${(myRatingMin / 5) * 100}%`,
                            width: `${((myRatingMax - myRatingMin) / 5) * 100}%`,
                            top: 0,
                            bottom: 0
                          }}
                        />
                        {children}
                      </div>
                    )
                  }}
                  renderThumb={({ props, index }: RangeThumbProps) => {
                    const { key, ...restProps } = props
                    return (
                      <div
                        key={key}
                        {...restProps}
                        className="w-5 h-5 bg-blue-400 border-2 border-blue-600 rounded-full flex items-center justify-center shadow"
                      >
                        <span className="text-xs font-bold text-white">
                          {[myRatingMin, myRatingMax][index]}
                        </span>
                      </div>
                    )
                  }}
                />
              </div>
            )}
          </div>
        )}

        {/* Friends Filter - For Inspiration */}
        <div className="p-4 rounded-lg border-2 border-purple-200 bg-purple-50">
          <h3 className="text-sm font-semibold text-gray-800 mb-3">👯 Freunde Inspiration</h3>
          <p className="text-xs text-gray-600 mb-3">Wähle eine Freundin aus, um ihre Bewertungen zu sehen</p>
          
          <div className="relative">
            <input
              type="text"
              placeholder="Freundin suchen..."
              value={filters.userName}
              onChange={(e) => {
                updateFilters({ userName: e.target.value })
                setShowUserDropdown(true)
              }}
              onFocus={() => setShowUserDropdown(true)}
              onBlur={() => setTimeout(() => setShowUserDropdown(false), 150)}
              className="w-full px-3 py-2 border border-purple-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 bg-white"
            />
            
            {/* Autocomplete dropdown */}
            {showUserDropdown && (
              <div className="absolute z-50 mt-1 w-full bg-white border border-purple-300 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                <button
                  type="button"
                  onClick={() => {
                    updateFilters({ userName: '' })
                    setShowUserDropdown(false)
                  }}
                  className="w-full text-left px-3 py-2 hover:bg-purple-100 text-sm border-b border-purple-200"
                >
                  — Alle Benutzer —
                </button>
                {availableUsers
                  .filter(username =>
                    filters.userName === '' || username.toLowerCase().includes(filters.userName.toLowerCase())
                  )
                  .map(username => (
                    <button
                      key={username}
                      type="button"
                      onClick={() => {
                        updateFilters({ userName: username })
                        setShowUserDropdown(false)
                      }}
                      className="w-full text-left px-3 py-2 hover:bg-purple-100 text-sm border-b border-purple-100 last:border-b-0"
                    >
                      {username}
                    </button>
                  ))}
              </div>
            )}
          </div>
          
          {/* Rating range always visible */}
          <div className="mt-4">
            <label className="text-xs font-medium text-gray-700 block mb-2">
              {filters.userName ? `Bewertungen von ${filters.userName}` : 'Durchschnittliche Bewertungen'}: {filters.minRating} - {filters.maxRating} ⭐
            </label>
            <Range
              step={1}
              min={0}
              max={5}
              values={[filters.minRating, filters.maxRating]}
              onChange={(values) => updateFilters({ 
                minRating: values[0], 
                maxRating: values[1] 
              })}
              renderTrack={({ props, children }: RangeTrackProps) => {
                const { key, ...restProps } = props
                return (
                  <div
                    key={key}
                    {...restProps}
                    className="h-2 w-full rounded bg-gray-200"
                  >
                    <div 
                      className="h-2 rounded bg-purple-400"
                      style={{
                        position: 'absolute',
                        left: `${(filters.minRating / 5) * 100}%`,
                        width: `${((filters.maxRating - filters.minRating) / 5) * 100}%`,
                        top: 0,
                        bottom: 0
                      }}
                    />
                    {children}
                  </div>
                )
              }}
              renderThumb={({ props, index }: RangeThumbProps) => {
                const { key, ...restProps } = props
                return (
                  <div
                    key={key}
                    {...restProps}
                    className="w-5 h-5 bg-purple-400 border-2 border-purple-600 rounded-full flex items-center justify-center shadow"
                  >
                    <span className="text-xs font-bold text-white">
                      {[filters.minRating, filters.maxRating][index]}
                    </span>
                  </div>
                )
              }}
            />
          </div>
        </div>

        {/* Tag Filter */}
        <div className="bg-blue-50 p-4 rounded-lg">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-medium text-gray-700">Tags</h3>
            {filters.selectedTags.length > 0 && (
              <button
                onClick={() => updateFilters({ selectedTags: [] })}
                className="text-xs text-blue-600 underline"
              >
                Zurücksetzen
              </button>
            )}
          </div>
          
          <div className="flex flex-wrap gap-2">
            {(showAllTagsInFilter ? 
              availableTagsWithCounts.sort((a, b) => a.name.localeCompare(b.name)) : 
              availableTagsWithCounts.sort((a, b) => (tagUsageCount[b.name] || 0) - (tagUsageCount[a.name] || 0)).slice(0, 20)
            ).map(tag => (
              <button
                key={tag.id}
                onClick={() => {
                  const isSelected = filters.selectedTags.includes(tag.name)
                  updateFilters({
                    selectedTags: isSelected
                      ? filters.selectedTags.filter(t => t !== tag.name)
                      : [...filters.selectedTags, tag.name]
                  })
                }}
                className={`px-3 py-1 rounded-full text-sm font-medium text-white transition-opacity ${
                  filters.selectedTags.includes(tag.name) 
                    ? 'opacity-100' 
                    : 'opacity-60 hover:opacity-100'
                }`}
                style={{ backgroundColor: tag.color }}
              >
                {tag.name} ({tag.count})
              </button>
            ))}
          </div>
          
          {availableTagsWithCounts.length > 20 && (
            <button
              onClick={() => setShowAllTagsInFilter(!showAllTagsInFilter)}
              className="mt-2 text-xs text-blue-600 underline"
            >
              {showAllTagsInFilter ? 'Weniger anzeigen' : 'Alle anzeigen'}
            </button>
          )}
          </div>
        </div>
            </>
          )}

          {/* Results count */}
          <div className="text-sm text-gray-600">
            {filteredMovies.length} {filteredMovies.length === 1 ? 'Eintrag' : 'Einträge'} gefunden
          </div>

          {/* Content */}
          {viewMode === 'movie-based' ? (
            /* Movie Grid */
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
          {filteredMovies.map((movie) => (
            <div key={movie.id} className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow">
              <div className="cursor-pointer" onClick={() => setSelectedMovie(movie)}>
                {/* Poster */}
                {movie.poster_url ? (
                  <div className="w-full h-60 overflow-hidden">
                    <img
                      src={movie.poster_url}
                      alt={movie.title}
                      className="w-full h-full object-cover hover:scale-105 transition-transform"
                    />
                  </div>
                ) : (
                  <div className="w-full h-60 bg-gray-200 flex items-center justify-center text-gray-400 text-5xl">
                    🎬
                  </div>
                )}
                
                <div className="p-4">
                  {/* Title and type */}
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="text-lg font-semibold text-gray-900 truncate flex-1">
                      {movie.title}
                    </h3>
                    {user && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          handleRecommendClick(movie)
                        }}
                        className="text-blue-600 hover:text-blue-800 transition-colors"
                        title="Film empfehlen"
                      >
                        ↗️
                      </button>
                    )}
                  </div>
                  
                  <div className="flex items-center gap-2 mb-2 flex-wrap">
                    <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full">
                      {movie.content_type === 'film' ? '🎬' : 
                       movie.content_type === 'serie' ? '📺' : '📚'} 
                      {movie.content_type}
                    </span>
                    {movie.created_by && (
                      <span className="text-xs text-gray-500">von {movie.created_by}</span>
                    )}
                    {/* Personal recommendation badge */}
                    {movieRecommenders.has(movie.id) && (
                      <span className="bg-pink-100 text-pink-800 text-xs px-2 py-1 rounded-full whitespace-nowrap">
                        👥 {movieRecommenders.get(movie.id)!.join(', ')}
                      </span>
                    )}
                  </div>

                  {/* Description */}
                  {movie.description && (
                    <p className="text-gray-600 text-sm mb-3 line-clamp-2">
                      {movie.description}
                    </p>
                  )}

                  {/* YouTube Trailer Button */}
                  {movie.trailer_url && (
                    <div className="mb-3">
                      <a
                        href={movie.trailer_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center px-3 py-1 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors text-xs font-medium gap-2"
                        onClick={(e) => e.stopPropagation()}
                      >
                        🎬 Trailer ansehen
                      </a>
                    </div>
                  )}

                  {/* Tags */}
                  {movie.tags.length > 0 && (
                    <TagDisplay tags={movie.tags} />
                  )}

                  {/* Average Rating */}
                  {movie.averageRating > 0 && (
                    <div className="flex items-center mb-3">
                      <div className="flex">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <span
                            key={star}
                            className={`text-lg ${
                              star <= movie.averageRating ? 'text-yellow-400' : 'text-gray-300'
                            }`}
                          >
                            ★
                          </span>
                        ))}
                      </div>
                      <span className="text-sm text-gray-600 ml-2">
                        {movie.averageRating.toFixed(1)} ({movie.ratingCount} Bewertungen)
                      </span>
                    </div>
                  )}

                  {/* Predicted Match - show if available and user hasn't rated yet */}
                  {showPredictions && predictedRatings.has(movie.id) && !movie.ratings.some(r => r.user_id === user?.id) && (
                    <div className="bg-green-50 border border-green-200 rounded-lg p-3 mb-3">
                      <span className="text-xs text-green-700 font-medium">
                        Wird dir mit {Math.round((predictedRatings.get(movie.id)! / 5) * 100)}% Wahrscheinlichkeit gefallen
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* User actions */}
              {user && (
                <div className="p-4 bg-blue-50 border-t" onClick={(e) => e.stopPropagation()}>
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="text-sm font-medium text-gray-700">
                      Deine Bewertung:
                    </h4>
                  </div>
                  
                  {/* Star rating */}
                  <div className="flex items-center mb-3">
                    {[1, 2, 3, 4, 5].map((star) => {
                      const userRating = getUserRating(movie.ratings, user.id)
                      return (
                        <button
                          key={star}
                          onClick={() => handleRating(movie.id, star)}
                          className={`text-xl transition-colors hover:scale-110 ${
                            star <= userRating ? 'text-yellow-400' : 'text-gray-300 hover:text-yellow-300'
                          }`}
                        >
                          ★
                        </button>
                      )
                    })}
                    
                    {getUserRating(movie.ratings, user.id) > 0 && (
                      <button
                        onClick={() => handleDeleteRating(movie.id)}
                        className="ml-2 px-2 py-1 text-xs bg-gray-200 text-gray-700 rounded hover:bg-red-100 hover:text-red-600"
                        title="Bewertung löschen"
                      >
                        ✕
                      </button>
                    )}
                  </div>

                  {/* Watchlist button */}
                  <button
                    onClick={() => handleWatchlistToggle(movie.id)}
                    className={`w-full flex items-center justify-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                      watchlistMovies.has(movie.id)
                        ? 'bg-green-100 text-green-700 hover:bg-green-200'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    <span>{watchlistMovies.has(movie.id) ? '👁️' : '👁️‍🗨️'}</span>
                    <span>
                      {watchlistMovies.has(movie.id) ? 'Auf Watchlist' : 'Zur Watchlist'}
                    </span>
                  </button>
                </div>
              )}
            </div>
          ))}
            </div>
          ) : (
            /* Tag-based view */
            <div className="space-y-6">
          {getTagBasedGroups().map(({ tagName, tag, movies }) => (
            <div key={tagName} className="bg-white rounded-lg shadow-md overflow-hidden">
              <div 
                className="p-4 border-b"
                style={{ backgroundColor: tag.color + '20' }}
              >
                <div className="flex items-center gap-2">
                  <span
                    className="w-4 h-4 rounded-full"
                    style={{ backgroundColor: tag.color }}
                  />
                  <h3 className="text-lg font-semibold">{tagName}</h3>
                  <span className="text-sm text-gray-500">({movies.length})</span>
                </div>
              </div>
              
              <div className="p-4 space-y-3">
                {movies.map((movie) => (
                  <div 
                    key={movie.id}
                    className="flex items-start gap-4 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 cursor-pointer"
                    onClick={() => setSelectedMovie(movie)}
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-medium">{movie.title}</h4>
                        <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full">
                          {movie.content_type}
                        </span>
                      </div>
                      
                      {movie.description && (
                        <p className="text-sm text-gray-600 line-clamp-2 mb-2">
                          {movie.description}
                        </p>
                      )}
                      
                      <TagDisplay tags={movie.tags} />
                    </div>
                    
                    {movie.averageRating > 0 && (
                      <div className="text-right">
                        <div className="flex items-center">
                          <span className="text-yellow-400 mr-1">★</span>
                          <span className="text-sm">{movie.averageRating.toFixed(1)}</span>
                        </div>
                        <div className="text-xs text-gray-500">
                          {movie.ratingCount} Bewertung{movie.ratingCount !== 1 ? 'en' : ''}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
            </div>
          )}

          {/* No results */}
          {filteredMovies.length === 0 && (
            <div className="text-center py-12">
              <p className="text-gray-500 text-lg">Keine Filme gefunden.</p>
              <p className="text-gray-400 text-sm mt-2">
                Versuche andere Filter oder füge neue Filme hinzu.
              </p>
            </div>
          )}
        </>
      )}

      {/* Movie Detail Modal */}
      {selectedMovie && (
        <MovieDetailModal
          movie={selectedMovie}
          isOpen={true}
          onClose={() => setSelectedMovie(null)}
          onMovieUpdated={async () => {
            await loadMovies()
            await loadWatchlist()
            setSelectedMovie(null)
          }}
          hideWatchlistFeature={true}
        />
      )}

      {/* Recommend Modal */}
      {recommendModalMovie && user && (
        <RecommendModal
          movie={recommendModalMovie}
          currentUserId={user.id}
          onClose={() => setRecommendModalMovie(null)}
          onSuccess={handleRecommendSuccess}
        />
      )}

      {/* WhatsApp Success Modal */}
      {showWhatsAppModal && whatsAppMovie && (
        <WhatsAppSuccessModal
          movie={whatsAppMovie}
          recipients={whatsAppRecipients}
          onClose={handleWhatsAppModalClose}
        />
      )}
    </div>
  )
}