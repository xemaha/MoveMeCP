"use client";

import { Range } from 'react-range'
import React, { useState, useEffect, useRef } from 'react'
import { supabase } from '@/lib/supabase'
import { useUser } from '@/lib/UserContext'
import type { Movie, Tag } from '@/lib/types'
import { loadPersonalRecommendations, mergeRecommendations } from '@/lib/personalRecommendations'
import { generateRecommendations, calculatePredictedRatings } from '@/lib/recommendations'
import TagDisplay from './TagDisplay'
import { StarRating } from './StarRating'
import { MovieDetailModal } from './MovieDetailModal'
import type { DiscoveryFeature } from './DiscoveryFeatureFilter'

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
  recommendationSourceFilter?: 'all' | 'ai' | 'personal' | 'discover'
  discoveryFeatureFilter?: Record<DiscoveryFeature, boolean>
}

export function MovieList(props?: MovieListProps) {

  // --- Modus-Flags direkt am Anfang deklarieren ---
  const { defaultShowRecommendations = false, showOnlyRecommendations = false, hideRecommendations = false, contentTypeFilter, watchlistOnly = false, showPredictions = false, providerProfile, providerTypeFilter, recommendationSourceFilter = 'all', discoveryFeatureFilter } = props || {}
  const isDiscoverMode = recommendationSourceFilter === 'discover'
  const isAIRecoMode = recommendationSourceFilter === 'ai'
  const { user } = useUser()

  // --- UI: Button zum Anzeigen der erkannten Top-Keywords ---
  // --- UI: Button zum Anzeigen der erkannten Präferenzen ---
  const [showPrefsModal, setShowPrefsModal] = useState(false)
  const [showKeywordModal, setShowKeywordModal] = useState(false)

  // Core state
  const [movies, setMovies] = useState<EnhancedMovie[]>([])
  const [allTags, setAllTags] = useState<Tag[]>([])
  const [availableUsers, setAvailableUsers] = useState<string[]>([])
  const [watchlistMovies, setWatchlistMovies] = useState<Set<string>>(new Set())
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  // Kombinierte AI/Discovery Empfehlungen (immer am Top-Level!)
  // Die States werden immer initialisiert, unabhängig vom Modus
  const [aiCombinedResults, setAICombinedResults] = useState<any[]>([])
  const [isAIRecoLoading, setIsAIRecoLoading] = useState(false)

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
  const hasAutoDiscover = useRef(false)

  // Recommend modal state
  const [recommendModalMovie, setRecommendModalMovie] = useState<EnhancedMovie | null>(null)
  const [showWhatsAppModal, setShowWhatsAppModal] = useState(false)
  const [whatsAppRecipients, setWhatsAppRecipients] = useState<string[]>([])
  const [whatsAppMovie, setWhatsAppMovie] = useState<EnhancedMovie | null>(null)

  // Personal recommendations state
  const [personalRecommendations, setPersonalRecommendations] = useState<any[]>([])
  const [dismissedRecommendationIds, setDismissedRecommendationIds] = useState<Set<string>>(new Set())
  const [mergedRecommendations, setMergedRecommendations] = useState<any[]>([])
  const [discoverResults, setDiscoverResults] = useState<any[]>([])
  const [dismissedDiscoveryIds, setDismissedDiscoveryIds] = useState<Set<string>>(new Set())
    // Discovery: Lade dauerhaft verworfene Empfehlungen beim User-Wechsel
    useEffect(() => {
      const fetchDismissed = async () => {
        if (!user) { setDismissedDiscoveryIds(new Set()); return; }
        const { data, error } = await supabase
          .from('dismissed_recommendations')
          .select('movie_id')
          .eq('user_id', user.id)
        if (!error && data) {
          setDismissedDiscoveryIds(new Set(data.map((row: any) => row.movie_id)))
        }
      }
      fetchDismissed()
    }, [user])
  const [isDiscoverLoading, setIsDiscoverLoading] = useState(false)
  const [discoverError, setDiscoverError] = useState<string | null>(null)

  // Map: movie_id -> array of recommender names
  const [movieRecommenders, setMovieRecommenders] = useState<Map<string, string[]>>(new Map())

  // --- All useEffect hooks at the top level ---
  useEffect(() => {
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
    loadDismissedRecommendations()
  }, [user])

  useEffect(() => {
    loadInitialData()
  }, [])

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

  useEffect(() => {
    if (
      defaultShowRecommendations &&
      !hasAutoCalcRecs.current &&
      user &&
      movies.length > 0 &&
      recommendationSourceFilter !== 'discover'
    ) {
      handleCalculateRecommendations()
      hasAutoCalcRecs.current = true
    }
  }, [defaultShowRecommendations, user, movies.length, recommendationSourceFilter])

  useEffect(() => {
    if (
      recommendationSourceFilter === 'discover' &&
      user &&
      !isDiscoverLoading &&
      discoverResults.length === 0 &&
      !hasAutoDiscover.current
    ) {
      hasAutoDiscover.current = true
      handleDiscoverRecommendations()
    }
    if (recommendationSourceFilter !== 'discover') {
      hasAutoDiscover.current = false
    }
  }, [recommendationSourceFilter, user, isDiscoverLoading, discoverResults.length])

  useEffect(() => {
    if (showPredictions && user && movies.length > 0) {
      const predictions = calculatePredictedRatings(user.id, movies)
      setPredictedRatings(predictions)
    }
  }, [showPredictions, user, movies.length])

  // Remove/dismissed recommendations effect
  useEffect(() => {
    setRecommendations(prev => filterOutDismissed(prev))
    setMergedRecommendations(prev => filterOutDismissed(prev))
  }, [dismissedRecommendationIds])

  // Trigger combined AI reco wenn ausgewählt
  useEffect(() => {
    // Hooks immer am Top-Level, keine Bedingungen um useState/useEffect!
    if (isAIRecoMode && user && aiCombinedResults.length === 0 && !isAIRecoLoading) {
      handleCombinedAIRecommendations()
    }
    if (!isAIRecoMode && aiCombinedResults.length > 0) {
      setAICombinedResults([])
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAIRecoMode, user, movies])

  // --- End of useEffect hooks ---

  // Extrahiere die Top-Keywords, wie sie an die Discovery-API geschickt werden würden
  // Hilfsfunktion: Zähle und sortiere Favoriten für eine Kategorie
  function getPreferenceStats(field: 'genre' | 'director' | 'actor' | 'keywords') {
    const stats: Record<string, { count5: number, count4: number, count3: number, total: number }> = {}
    movies.forEach((movie) => {
      const ratingObj = movie.ratings.find(r => r.user_id === user?.id)
      if (!ratingObj) return
      const rating = ratingObj.rating
      if (rating < 3) return
      let values: string[] = []
      if (field === 'keywords') {
        const keywordsData = (movie as any).keywords || (movie as any).tmdb_keywords
        if (Array.isArray(keywordsData)) {
          values = keywordsData.map((kw: any) => typeof kw === 'string' ? kw : kw.name).filter(Boolean)
        }
      } else if (field === 'genre') {
        if (typeof movie.genre === 'string') {
          values = movie.genre.split(',').map(g => g.trim()).filter(Boolean)
        }
      } else if (field === 'director') {
        if (movie.director) values = movie.director.split(',').map((d: string) => d.trim()).filter(Boolean)
      } else if (field === 'actor') {
        if (movie.actor) values = movie.actor.split(',').map((a: string) => a.trim()).filter(Boolean)
      }
      values.forEach(val => {
        if (!stats[val]) stats[val] = { count5: 0, count4: 0, count3: 0, total: 0 }
        if (rating === 5) stats[val].count5++
        if (rating === 4) stats[val].count4++
        if (rating === 3) stats[val].count3++
        stats[val].total++
      })
    })
    // Sortierung: erst nach 5er, dann 4er, dann 3er, dann total
    return Object.entries(stats)
      .sort((a, b) => b[1].count5 - a[1].count5 || b[1].count4 - a[1].count4 || b[1].count3 - a[1].count3 || b[1].total - a[1].total)
  }

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
    try {
      if (!supabase || typeof supabase.from !== 'function') {
        console.error('Supabase client not initialized')
        setError('Datenbank nicht konfiguriert. Bitte Umgebungsvariablen prüfen.')
        return
      }

      const { data: moviesData, error: moviesError } = await supabase
        .from('movies')
        .select('*')
        .order('created_at', { ascending: false })

      if (moviesError) {
        console.error('Error loading movies:', moviesError)
        setError('Fehler beim Laden der Filme')
        return
      }

      if (!moviesData) return

      // Dynamically import getTMDbDetails only if needed

      const enhancedMovies = await Promise.all(
        moviesData
          .filter(movie => movie.id)
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
            const validRatings = ratings
              .filter(r => r.rating !== null && r.rating !== undefined)
              .map(r => Number(r.rating))
              .filter(rating => !isNaN(rating) && rating >= 1 && rating <= 5)
            const averageRating = validRatings.length > 0
              ? validRatings.reduce((sum, rating) => sum + rating, 0) / validRatings.length
              : 0

            // TMDb-Update-Logik entfernt

            return {
              ...movie,
              id: movieId,
              tags,
              averageRating,
              ratingCount: validRatings.length,
              ratings: ratings
                .filter(r => r.rating !== null && r.rating !== undefined && r.user_name && r.user_id)
                .map(r => ({
                  rating: Number(r.rating),
                  user_name: r.user_name as string,
                  user_id: r.user_id as string
                })),
              keywords: (movie as any).tmdb_keywords,
              director: (movie as any).director,
              actor: (movie as any).actor,
              trailer_url: (movie as any).trailer_url,
              media_type: (movie as any).media_type || (movie.content_type === 'serie' ? 'tv' : 'movie')
            } as EnhancedMovie
          })
      )

      setMovies(enhancedMovies)
      
      // TMDb-Update-Logik entfernt
    } catch (err) {
      console.error('Exception in loadMovies:', err)
      setError('Fehler beim Laden der Filme')
    }
  }

  // Schritt 1: Nachschlagen fehlender TMDb-IDs basierend auf Filmtitel
  const lookupMissingTMDbIds = async (movies: EnhancedMovie[]) => {
    if (!user) return
    
    console.log('🔍 Starting to lookup missing TMDb IDs...')
    
    try {
      const { searchTMDb } = await import('@/lib/tmdbApi')
      
      // Finde Filme ohne TMDb-ID
      const moviesWithoutTmdbId = movies.filter(m => !((m as any).tmdb_id))
      console.log(`Found ${moviesWithoutTmdbId.length} movies without TMDb IDs`)
      
      if (moviesWithoutTmdbId.length === 0) {
        console.log('✓ All movies have TMDb IDs!')
        return
      }
      
      let updatedCount = 0
      for (const movie of moviesWithoutTmdbId) {
        try {
          console.log(`Searching for TMDb ID: ${movie.title}...`)
          const results = await searchTMDb(movie.title)
          
          if (results && results.length > 0) {
            const bestMatch = results[0] // Nehme das erste Ergebnis
            const tmdb_id = bestMatch.id
            const media_type = bestMatch.media_type || 'movie'
            
            console.log(`✓ Found: ${movie.title} → tmdb_id=${tmdb_id}, media_type=${media_type}`)
            
            // Speichere die TMDb-ID in der Datenbank
            const { error } = await supabase
              .from('movies')
              .update({ tmdb_id, media_type })
              .eq('id', movie.id)
            
            if (!error) {
              updatedCount++
              console.log(`✓ Saved TMDb ID for: ${movie.title}`)
            } else {
              console.warn(`Failed to save TMDb ID for ${movie.title}:`, error)
            }
          } else {
            console.warn(`No TMDb results found for: ${movie.title}`)
          }
          
          // Verzögerung: 300ms zwischen requests für API-Rate-Limits
          await new Promise(resolve => setTimeout(resolve, 300))
        } catch (err) {
          console.warn(`Error searching for ${movie.title}:`, err)
        }
      }
      
      console.log(`✓ TMDb ID lookup completed! Updated ${updatedCount}/${moviesWithoutTmdbId.length} movies`)
      
      // Reload movies nach ID-Update
      if (updatedCount > 0) {
        console.log('Reloading movies with new TMDb IDs...')
        await new Promise(resolve => setTimeout(resolve, 500))
        loadMovies()
      }
    } catch (err) {
      console.error('Error in lookupMissingTMDbIds:', err)
    }
  }

  // persistMissingMetadataForRatedMovies entfernt

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
    try {
      if (!supabase || typeof supabase.from !== 'function') return
      const { data, error } = await supabase
        .from('movie_tags')
        .select('tag_id, tags(name)')
      
      if (error) {
        console.error('Error loading tag usage stats:', error)
        return
      }

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
    } catch (err) {
      console.error('Exception in loadTagUsageStats:', err)
    }
  }

  const loadPersonalRecommendationsForAllMovies = async () => {
    if (!user) {
      setMovieRecommenders(new Map())
      return
    }

    try {
      // Load all personal recommendations for this user with from_user_name directly
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

      console.log('Loaded personal recommendations data:', data)

      // Resolve aliases for recommenders
      const fromUserIds = Array.from(new Set(data.map((rec: any) => rec.from_user_id).filter(Boolean)))
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

      // Build recommender map using resolved aliases
      const recommenderMap = new Map<string, string[]>()
      data.forEach((rec: any) => {
        const movieId = rec.movie_id
        const fromUserName = aliasMap.get(rec.from_user_id) || rec.from_user_id
        
        if (!recommenderMap.has(movieId)) {
          recommenderMap.set(movieId, [])
        }
        recommenderMap.get(movieId)!.push(fromUserName)
      })
      
      setMovieRecommenders(recommenderMap)
      console.log('Loaded personal recommendations for', recommenderMap.size, 'movies:', recommenderMap)
    } catch (error) {
      console.error('Error loading personal recommendations:', error)
    }
  }

  // Event handlers
  const handleRating = async (movie: EnhancedMovie | any, rating: number) => {
    if (!user || !movie) {
      alert('Du musst eingeloggt sein, um zu bewerten!')
      return
    }

    try {
      // Ensure movie exists in Supabase (discover items may be tmdb-*)
      const persistedId = await ensureMovieExists(movie)
      if (!persistedId) {
        alert('Konnte Film nicht speichern.')
        return
      }

      const existingRating = await supabase
        .from('ratings')
        .select('*')
        .eq('movie_id', persistedId)
        .eq('user_id', user.id)
        .single()

      if (existingRating.data) {
        const { error } = await supabase
          .from('ratings')
          .update({ rating })
          .eq('id', existingRating.data.id as string)
          
        if (error) {
          console.error('Error updating rating:', error)
          throw error
        }
      } else {
        const { error } = await supabase
          .from('ratings')
          .insert([{
            movie_id: persistedId,
            rating: rating,
            user_id: user.id,
            user_name: user.name,
          }])
          
        if (error) {
          console.error('Error inserting rating:', error)
          throw error
        }
      }

      // Update local state
      setMovies(prevMovies => prevMovies.map(m => {
        if (m.id === persistedId) {
          const existingIndex = m.ratings.findIndex(r => r.user_id === user.id)
          let updatedRatings = [...m.ratings]
          
          if (existingIndex >= 0) {
            updatedRatings[existingIndex] = { ...updatedRatings[existingIndex], rating }
          } else {
            updatedRatings.push({ rating, user_name: user.name, user_id: user.id })
          }

          const averageRating = updatedRatings.length > 0
            ? updatedRatings.reduce((sum, r) => sum + r.rating, 0) / updatedRatings.length
            : 0

          return {
            ...m,
            ratings: updatedRatings,
            averageRating,
            ratingCount: updatedRatings.length
          }
        }
        return m
      }))
      
      // Remove from discover results if rated
      setDiscoverResults(prev => prev.filter(rec => rec.movie.id !== persistedId && rec.movie.tmdb_id !== (movie as any).tmdb_id))
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

  const ensureMovieExists = async (movie: any): Promise<string | null> => {
    if (!movie) {
      console.error('ensureMovieExists: movie is null/undefined')
      return null
    }

    // Already a persisted movie (not a tmdb placeholder)
    if (movie.id && typeof movie.id === 'string' && !movie.id.startsWith('tmdb-')) {
      console.log('ensureMovieExists: Using existing movie ID:', movie.id)
      return movie.id
    }

    console.log('ensureMovieExists: Need to create/find movie:', movie.title, movie.tmdb_id)

    // Versuche, tmdb_id zu holen und als String/Number zu akzeptieren
    let tmdbId = movie.tmdb_id
    if (typeof tmdbId === 'string' && tmdbId.match(/^\d+$/)) tmdbId = Number(tmdbId)
    if (!tmdbId || tmdbId === 'undefined' || tmdbId === 'null') tmdbId = undefined

    // Versuche, bestehenden Film per tmdb_id zu finden
    try {
      let existing: any = null
      if (tmdbId) {
        const res = await supabase
          .from('movies')
          .select('id')
          .eq('tmdb_id', tmdbId)
          .maybeSingle()
        existing = res.data
        if (!res.error && existing?.id) {
          console.log('ensureMovieExists: Found existing by tmdb_id:', existing.id)
          return existing.id as string
        }
      }

      // Fallback: Suche per normalisiertem Titel, falls keine tmdb_id
      let fallbackId: string | null = null
      if (!tmdbId && movie.title) {
        const { data: titleMatch, error: titleError } = await supabase
          .from('movies')
          .select('id')
          .ilike('title', movie.title.trim())
          .maybeSingle()
        if (!titleError && titleMatch?.id) fallbackId = titleMatch.id as string
      }
      if (fallbackId) {
        console.log('ensureMovieExists: Found existing by title:', fallbackId)
        return fallbackId
      }

      // Hole alle Felder wie beim AddMovieForm, lasse optionale Felder weg
      const insertPayload: any = {
        title: movie.title?.trim() || 'Unbekannt',
        description: movie.description?.trim() || null,
        content_type: movie.content_type || (movie.media_type === 'tv' ? 'serie' : 'film'),
        created_by: user?.name || user?.id || 'System',
        poster_url: movie.poster_url || null,
        director: movie.director || null,
        actor: movie.actor || null,
        year: movie.year ? Number(movie.year) : null,
        genre: movie.genre || null,
        trailer_url: movie.trailer_url || null,
        tmdb_id: tmdbId || null,
        media_type: movie.media_type || 'movie',
      }
      // Entferne Felder, die undefined sind
      Object.keys(insertPayload).forEach(k => {
        if (insertPayload[k] === undefined) delete insertPayload[k]
      })

      console.log('ensureMovieExists: Inserting new movie:', insertPayload)

      const { data: upserted, error: upsertError } = await supabase
        .from('movies')
        .upsert(insertPayload, { onConflict: 'tmdb_id' })
        .select('id')
        .single()

      if (upsertError) {
        console.error('Error upserting discover movie', upsertError, insertPayload)
        alert('Fehler beim Speichern des Films: ' + (upsertError.message || 'Unbekannter Fehler'))
        return null
      }

      console.log('ensureMovieExists: Created new movie:', upserted?.id)
      return upserted?.id as string
    } catch (err) {
      console.error('ensureMovieExists error', err, movie)
      const errorMsg = err instanceof Error ? err.message : 'Unbekannter Fehler'
      alert('Fehler beim Speichern des Films: ' + errorMsg)
      return null
    }
  }

  const handleWatchlistToggle = async (movie: EnhancedMovie | any) => {
    if (!user || !movie) {
      alert('Du musst eingeloggt sein!')
      return
    }

    const tmdbId = (movie as any).tmdb_id

    const movieId = await ensureMovieExists(movie)
    if (!movieId) {
      alert('Konnte Film nicht speichern.')
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
        // Prevent duplicates: check existing watchlist entry
        const { data: existing, error: checkError } = await supabase
          .from('watchlist')
          .select('id')
          .eq('movie_id', movieId)
          .eq('user_id', user.id)
          .maybeSingle()

        if (checkError) throw checkError

        if (!existing) {
          const { error } = await supabase
            .from('watchlist')
            .insert([{
              movie_id: movieId,
              user_id: user.id,
            }])
          
          if (error) throw error
        }

        setWatchlistMovies(prev => new Set(prev).add(movieId))
        
        // Remove from discover results when added to watchlist
        setDiscoverResults(prev => prev.filter(rec => rec.movie.id !== movieId && rec.movie.tmdb_id !== tmdbId))
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
      setDiscoverResults(prev => prev.filter(item => item.movie.id !== movieId))

      setMergedRecommendations(prev => prev.filter(item => item.movie.id !== movieId))
      setRecommendations(prev => prev.filter(item => item.movie.id !== movieId))
    } catch (err) {
      console.error('Error deleting recommendation:', err)
      alert('Konnte Empfehlung nicht löschen')
    }
  }

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
    return items.filter(item => {
      const isDismissed = dismissedRecommendationIds.has(item.movie.id)
      if (!isDismissed) return true

      // Allow personal recommendations to resurface even if the movie was dismissed before
      return item.isPersonal === true
    })
  }

  const buildDiscoverPayload = () => {
    if (!user) return null

    const directorStats = new Map<string, { sum: number; count: number }>()
    const actorStats = new Map<string, { sum: number; count: number }>()
    const tagCounts = new Map<string, number>()
    const keywordCounts = new Map<string, number>()

    // Use movies the user rated highly as preference signals
    const strongRatings = movies.filter((m) => {
      const rating = m.ratings.find(r => r.user_id === user.id)
      return rating && rating.rating >= 4
    })

    strongRatings.forEach((movie) => {
      const rating = movie.ratings.find(r => r.user_id === user.id)?.rating || 0

      if (movie.director) {
        const key = movie.director.trim()
        if (!directorStats.has(key)) directorStats.set(key, { sum: 0, count: 0 })
        const entry = directorStats.get(key)!
        entry.sum += rating
        entry.count += 1
      }

      if (movie.actor) {
        movie.actor
          .split(',')
          .map(a => a.trim())
          .filter(Boolean)
          .forEach(actor => {
            if (!actorStats.has(actor)) actorStats.set(actor, { sum: 0, count: 0 })
            const entry = actorStats.get(actor)!
            entry.sum += rating
            entry.count += 1
          })
      }

      if (movie.tags?.length) {
        movie.tags.forEach(tag => {
          const name = tag.name.toLowerCase()
          tagCounts.set(name, (tagCounts.get(name) || 0) + 1)
        })
      }

      // Collect keywords from TMDb metadata if available
      // Prüfe BEIDE Quellen: keywords (im State) und tmdb_keywords (von der Datenbank)
      const keywordsData = (movie as any).keywords || (movie as any).tmdb_keywords
      if (keywordsData) {
        const keywords = keywordsData
        if (Array.isArray(keywords)) {
          keywords.forEach(kw => {
            const name = (typeof kw === 'string' ? kw : kw.name || '').toLowerCase()
            if (name) keywordCounts.set(name, (keywordCounts.get(name) || 0) + 1)
          })
        }
      }
    })

    // Regisseure: Schon ab 1x >4 Sterne als "leicht interessant"
    const preferredDirectors = Array.from(directorStats.entries())
      .filter(([_, stats]) => stats.count >= 1 && (stats.sum / stats.count) > 4)
      .sort((a, b) => (b[1].sum / b[1].count) - (a[1].sum / a[1].count))
      .slice(0, 10)
      .map(([name, stats]) => ({ name, count: stats.count }))

    // Schauspieler: Ab 2x >4 Sterne als "gemocht"
    const preferredActors = Array.from(actorStats.entries())
      .filter(([_, stats]) => stats.count >= 2 && (stats.sum / stats.count) > 4)
      .sort((a, b) => b[1].count - a[1].count)
      .slice(0, 15)
      .map(([name]) => name)

    const preferredGenres = Array.from(tagCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 6)
      .map(([name]) => name)

    const preferredKeywords = Array.from(keywordCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([name, count]) => ({ name, count }))

    // Exclude: bereits bewertet, Watchlist, dismissed
    const ratedTmdbIds = movies
      .filter(m => m.ratings.some(r => r.user_id === user.id))
      .map(m => (m as any).tmdb_id)
      .filter((id): id is number => typeof id === 'number')

    const watchlistTmdbIds = movies
      .filter(m => watchlistMovies.has(m.id))
      .map(m => (m as any).tmdb_id)
      .filter((id): id is number => typeof id === 'number')

    const dismissedTmdbIds = Array.from(dismissedRecommendationIds)
      .map(movieId => {
        const movie = movies.find(m => m.id === movieId)
        return movie ? (movie as any).tmdb_id : null
      })
      .filter((id): id is number => typeof id === 'number')

    const allExcludedIds = [...new Set([...ratedTmdbIds, ...watchlistTmdbIds, ...dismissedTmdbIds])]

    // Detect which media types user has rated
    const hasMovies = movies.some(m => m.content_type === 'film' || m.content_type === 'movie')
    const hasSeries = movies.some(m => m.content_type === 'serie' || m.content_type === 'tv')
    const mediaTypes: string[] = []
    if (hasMovies) mediaTypes.push('movie')
    if (hasSeries) mediaTypes.push('tv')
    if (mediaTypes.length === 0) mediaTypes.push('movie') // default

    // Feature-Filter anwenden
    return {
      preferredDirectors: discoveryFeatureFilter?.directors !== false ? preferredDirectors : [],
      preferredActors: discoveryFeatureFilter?.actors !== false ? preferredActors : [],
      preferredGenres: discoveryFeatureFilter?.genres !== false ? preferredGenres : [],
      preferredKeywords: discoveryFeatureFilter?.keywords !== false ? preferredKeywords : [],
      excludeTmdbIds: allExcludedIds,
      mediaTypes
    }
  }

  const mapDiscoverResult = (item: any) => {
    const averageRating = item.vote_average ? Math.round((item.vote_average / 2) * 10) / 10 : 0
    const mediaType = item.media_type || 'movie'
    const title = item.title || item.name || 'Unknown'
    const contentType = mediaType === 'tv' ? 'serie' : 'film'
    
    const tags = (item.genres || []).map((g: any, idx: number) => ({
      id: String(g.id ?? idx),
      name: g.name,
      color: '#e5e7eb',
      created_at: ''
    }))

    // Color keywords based on match frequency: green (>=4 matches), yellow (2-3), gray (1 or none)
    const matchedMap = new Map<string, number>()
    if (item.keywordFrequencies) {
      Object.entries(item.keywordFrequencies).forEach(([kw, count]) => {
        matchedMap.set(kw.toLowerCase(), count as number)
      })
    }
    const keywordTags = (item.keywords || []).map((k: string, idx: number) => {
      const freq = matchedMap.get(k.toLowerCase()) || 0
      let color = '#9ca3af' // gray for rare/no matches
      if (freq >= 4) color = '#10b981' // green for frequent
      else if (freq >= 2) color = '#fbbf24' // yellow for some matches
      
      return {
        id: `kw-${idx}`,
        name: k,
        color,
        created_at: ''
      }
    })

    return {
      movie: {
        id: `tmdb-${item.tmdb_id}`,
        title,
        description: item.overview,
        poster_url: item.poster_path ? `https://image.tmdb.org/t/p/w500${item.poster_path}` : undefined,
        content_type: contentType,
        averageRating,
        ratingCount: 0,
        tags: [...tags, ...keywordTags],
        director: item.director,
        actor: Array.isArray(item.actors) ? item.actors.join(', ') : item.actors,
        trailer_url: item.trailer_url,
        tmdb_id: item.tmdb_id,
        media_type: mediaType
      },
      source: 'discover',
      isPersonal: false,
      predictedRating: item.score ? Math.min(5, item.score / 2) : 0,
      score: item.score,
      matchReasons: item.matchReasons || [],
      scoreBreakdown: item.scoreBreakdown || []
    }
  }

  // Normalize titles for approximate matching (case/spacing/punctuation insensitive)
  const normalizeTitle = (title: string) => title.toLowerCase().replace(/[^a-z0-9]/g, '')

  // Only treat exact normalized match as duplicate (avoid over-filtering)
  const isApproxSameTitle = (title: string, normalizedSet: Set<string>) => {
    if (!title) return false
    const norm = normalizeTitle(title)
    return normalizedSet.has(norm)
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

  const handleDiscoverRecommendations = async () => {
    if (!user) return

    const payload = buildDiscoverPayload()
    if (!payload) return

    setIsDiscoverLoading(true)
    setDiscoverError(null)

    try {
      const response = await fetch('/api/discover', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      })

      const raw = await response.text()
      let data: any = {}
      try {
        data = raw ? JSON.parse(raw) : {}
      } catch (parseErr) {
        console.error('Discover parse error', parseErr, raw)
        throw new Error('Discover-Antwort ungültig')
      }

      if (!response.ok) {
        throw new Error(data?.error || 'Discover request failed')
      }

      const mapped = (data.results || []).map(mapDiscoverResult)

      // --- Verbesserte Filterlogik mit Fallbacks ---
      const ratedMovies = movies.filter(m => m.ratings.some(r => r.user_id === user.id))
      const ratedTmdbIds = new Set(
        ratedMovies.map(m => String((m as any).tmdb_id || '').trim()).filter(id => id && id !== 'undefined' && id !== 'null')
      )
      const ratedTitlesNormalized = new Set(
        ratedMovies.map(m => m.title).filter(Boolean).map(normalizeTitle)
      )
      const allTmdbIds = new Set(
        movies.map(m => String((m as any).tmdb_id || '').trim()).filter(id => id && id !== 'undefined' && id !== 'null')
      )

      // 1. Streng: Nur echte Keyword-Matches
      let primary = mapped.filter(rec => {
        const tmdbId = String(rec.movie.tmdb_id || '').trim()
        const movieId = rec.movie.id
        const titleNorm = normalizeTitle(rec.movie.title)
        const isRated = ratedTmdbIds.has(tmdbId) || ratedTitlesNormalized.has(titleNorm)
        const isDuplicate = allTmdbIds.has(tmdbId)
        // Mindestens ein Keyword-Match
        const hasKeywordMatch = (rec.movie.tags || []).some(t => t.id.startsWith('kw-'))
        return !isRated && !isDuplicate && !watchlistMovies.has(movieId) && !dismissedRecommendationIds.has(movieId) && hasKeywordMatch
      })

      // 2. Locker: Genre-Matches zulassen, falls zu wenig Treffer
      if (primary.length < 10) {
        primary = mapped.filter(rec => {
          const tmdbId = String(rec.movie.tmdb_id || '').trim()
          const movieId = rec.movie.id
          const titleNorm = normalizeTitle(rec.movie.title)
          const isRated = ratedTmdbIds.has(tmdbId) || ratedTitlesNormalized.has(titleNorm)
          const isDuplicate = allTmdbIds.has(tmdbId)
          // Mindestens ein Genre- oder Keyword-Match
          const hasGenreOrKeyword = (rec.movie.tags || []).some(t => t.color === '#e5e7eb' || t.id.startsWith('kw-'))
          return !isRated && !isDuplicate && !watchlistMovies.has(movieId) && !dismissedRecommendationIds.has(movieId) && hasGenreOrKeyword
        })
      }

      // 3. Fallback: Alles, was nicht ausgeschlossen ist
      if (primary.length < 5) {
        primary = mapped.filter(rec => {
          const tmdbId = String(rec.movie.tmdb_id || '').trim()
          const movieId = rec.movie.id
          const titleNorm = normalizeTitle(rec.movie.title)
          const isRated = ratedTmdbIds.has(tmdbId) || ratedTitlesNormalized.has(titleNorm)
          const isDuplicate = allTmdbIds.has(tmdbId)
          return !isRated && !isDuplicate && !watchlistMovies.has(movieId) && !dismissedRecommendationIds.has(movieId)
        })
      }

      setDiscoverResults(primary.slice(0, 20))
      setShowRecommendations(true)
    } catch (err: any) {
      console.error('Discover error', err)
      setDiscoverError(err?.message || 'Konnte Discover-Ergebnisse nicht laden')
    } finally {
      setIsDiscoverLoading(false)
    }
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

  // Kombinierte Empfehlungen: Discovery + AI (ähnliche Nutzer)
  const handleCombinedAIRecommendations = async () => {
    if (!user) return
    setIsAIRecoLoading(true)
    setDiscoverError(null)
    try {
      // 1. Discovery Empfehlungen holen
      const payload = buildDiscoverPayload()
      let discovery: any[] = []
      if (payload) {
        const response = await fetch('/api/discover', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        })
        const raw = await response.text()
        let data: any = {}
        try { data = raw ? JSON.parse(raw) : {} } catch {}
        if (response.ok && Array.isArray(data.results)) {
          discovery = (data.results || []).map(mapDiscoverResult)
        }
      }
      // 2. AI Empfehlungen (ähnliche Nutzer)
      const recs = generateRecommendations(user.id, movies, 20)
      // recs: [{ movie, predictedRating, ... }]
      const ai = recs.map(r => ({
        movie: r.movie,
        source: 'ai',
        isPersonal: false,
        predictedRating: r.predictedRating,
        score: r.predictedRating * 2, // Skaliere auf 10er Score für Vergleichbarkeit
        matchReasons: r.basedOnUsers?.length ? [`🤖 Ähnliche Nutzer: ${r.basedOnUsers.join(', ')}`] : [],
        scoreBreakdown: [],
        mostSimilarUserName: r.mostSimilarUserName,
        mostSimilarUserRating: r.mostSimilarUserRating,
        ...r
      }))
      // 3. Kombinieren, deduplizieren (nach tmdb_id oder normalisiertem Titel)
      const seen = new Set<string>()
      const norm = (title: string) => title?.toLowerCase().replace(/[^a-z0-9]/g, '')
      const all = [...discovery, ...ai].filter(rec => {
        const id = String((rec.movie.tmdb_id || '')).trim() || norm(rec.movie.title)
        if (seen.has(id)) return false
        seen.add(id)
        return true
      })
      // 4. Score: Mittelwert, falls in beiden Quellen, sonst Score der jeweiligen Quelle
      const merged = all.map(rec => {
        const disc = discovery.find(d => d.movie.tmdb_id === rec.movie.tmdb_id)
        const aiRec = ai.find(a => a.movie.tmdb_id === rec.movie.tmdb_id)
        if (disc && aiRec) {
          // Kombiniere Score (gewichteter Mittelwert)
          const score = (disc.score * 0.6 + aiRec.score * 0.4)
          return { ...rec, score, matchReasons: [...(disc.matchReasons||[]), ...(aiRec.matchReasons||[])] }
        }
        return rec
      })
      // 5. Sortieren nach Score, Top 20
      merged.sort((a, b) => (b.score || 0) - (a.score || 0))
      setAICombinedResults(merged.slice(0, 20))
      setShowRecommendations(true)
    } catch (err: any) {
      setDiscoverError(err?.message || 'Konnte AI-Empfehlungen nicht laden')
    } finally {
      setIsAIRecoLoading(false)
    }
  }

  // Discovery: Filtere verworfene Empfehlungen raus
  const baseRecommendations = isDiscoverMode
    ? discoverResults.filter(rec => {
        const id = rec.movie.id || rec.movie.tmdb_id
        return !dismissedDiscoveryIds.has(id)
      })
    : isAIRecoMode
      ? aiCombinedResults
      : filterOutDismissed(recommendations)
    // Discovery: X-Button zum dauerhaften Entfernen
    const handleDismissDiscovery = async (rec: any) => {
      if (!user) return
      const movieId = rec.movie.id || rec.movie.tmdb_id
      try {
        // In DB speichern
        const { error } = await supabase
          .from('dismissed_recommendations')
          .insert({ user_id: user.id, movie_id: movieId })
        if (error && !String(error.message).includes('duplicate')) {
          alert('Fehler beim Verwerfen: ' + (error.message || error.details))
          return
        }
        setDismissedDiscoveryIds(prev => new Set(prev).add(movieId))
        setDiscoverResults(prev => prev.filter(item => (item.movie.id || item.movie.tmdb_id) !== movieId))
      } catch (err) {
        alert('Fehler beim Verwerfen')
      }
    }
  const recommendationsLoading = isDiscoverMode
    ? isDiscoverLoading
    : isAIRecoMode
      ? isAIRecoLoading
      : isCalculatingRecommendations

  return (
    <div className="space-y-6">
      {/* Recommendations Section */}
      {user && !hideRecommendations && (
        showOnlyRecommendations ? (
          <div className="space-y-4">
            <div className="flex items-center justify-between gap-3">
              <h3 className="text-lg font-semibold text-gray-800">Empfehlungen</h3>
              {isDiscoverMode && (
                <button
                  onClick={handleDiscoverRecommendations}
                  disabled={isDiscoverLoading}
                  className="px-3 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {isDiscoverLoading ? 'Lädt Discover…' : 'Discover laden'}
                </button>
              )}
            </div>
            {recommendationsLoading && (
              <div className="text-sm text-gray-600">Berechne Empfehlungen...</div>
            )}
            {isDiscoverMode && discoverError && (
              <div className="text-sm text-red-600">{discoverError}</div>
            )}
            {baseRecommendations.length > 0 ? (
              <div>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {baseRecommendations
                    .filter(rec => {
                      if (recommendationSourceFilter !== 'all' && rec.source !== recommendationSourceFilter) return false
                      const typeFilter = contentTypeFilter || filters.contentTypes
                      const contentType = rec.movie.content_type?.toLowerCase()
                      if (contentType === 'film') return typeFilter.film
                      if (contentType === 'serie') return typeFilter.serie
                      if (contentType === 'buch') return typeFilter.buch
                      return true
                    })
                    .map((rec) => (
                      <div
                        key={rec.movie.id || rec.movie.tmdb_id}
                        className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow relative"
                      >
                        {/* X-Button oben rechts */}
                        {isDiscoverMode && (
                          <button
                            className="absolute top-2 right-2 z-10 text-gray-400 hover:text-red-500 text-xl font-bold bg-white/80 rounded-full w-8 h-8 flex items-center justify-center shadow"
                            title="Empfehlung dauerhaft entfernen"
                            onClick={e => { e.stopPropagation(); handleDismissDiscovery(rec); }}
                          >
                            ×
                          </button>
                        )}
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
                              {rec.source && (
                                <span className={`px-2 py-1 rounded text-xs font-semibold ${
                                  rec.source === 'ai' 
                                    ? 'bg-purple-100 text-purple-800'
                                    : rec.source === 'personal'
                                    ? 'bg-blue-100 text-blue-800'
                                    : rec.source === 'discover'
                                    ? 'bg-green-100 text-green-800'
                                    : 'bg-gray-100 text-gray-800'
                                }`}>
                                  {rec.source === 'ai' ? '🤖 AI' : rec.source === 'personal' ? '👤 Personal' : rec.source === 'discover' ? '🔍 Discover' : rec.source}
                                </span>
                              )}
                            </div>

                            {/* Match-Gründe und gematchte Kategorien für Discover */}
                            {rec.source === 'discover' && (
                              <div className="bg-green-50 border border-green-200 rounded-lg p-2 mb-2">
                                <div className="text-xs text-green-700 font-medium mb-1">
                                  💚 {rec.predictedRating > 0 ? Math.round((rec.predictedRating / 5) * 100) : Math.round((rec.score / 10) * 100)}% Match
                                </div>
                                {rec.matchReasons?.length > 0 && (
                                  <div className="text-xs text-green-800 space-y-0.5 mb-1">
                                    {rec.matchReasons.map((reason: string, idx: number) => (
                                      <div key={idx}>{reason}</div>
                                    ))}
                                  </div>
                                )}
                                {/* Regisseur anzeigen, wenn gematcht */}
                                {rec.matchReasons?.some((r: string) => r.includes('Regie')) && rec.movie.director && (
                                  <div className="text-xs text-blue-800 font-semibold mb-0.5">🎬 Regie: {rec.movie.director}</div>
                                )}
                                {/* Schauspieler anzeigen, wenn gematcht */}
                                {rec.matchReasons?.some((r: string) => r.includes('Stars')) && rec.movie.actor && (
                                  <div className="text-xs text-blue-800 font-semibold mb-0.5">🎭 Schauspiel: {rec.movie.actor}</div>
                                )}
                                {/* Genres anzeigen, wenn gematcht */}
                                {rec.matchReasons?.some((r: string) => r.includes('Genres')) && rec.movie.tags?.length > 0 && (
                                  <>
                                    <div className="text-xs text-blue-800 font-semibold mb-0.5">
                                      🎞️ Genres: {rec.movie.tags.filter(t => t.color === '#e5e7eb').map(t => t.name).join(', ')}
                                    </div>
                                    {/* Keywords direkt unter Genre anzeigen, falls vorhanden */}
                                    {rec.matchReasons?.some((r: string) => r.includes('Keyword')) && rec.movie.tags?.filter(t => t.id.startsWith('kw-')).length > 0 && (
                                      <div className="text-xs font-semibold mb-0.5">
                                        <span className="mr-1">🔑 Keywords:</span>
                                        {rec.movie.tags.filter(t => t.id.startsWith('kw-')).map(t => (
                                          <span
                                            key={t.id}
                                            className={`inline-block px-2 py-0.5 rounded-full text-xs font-bold mr-1 ${
                                              t.color === '#10b981'
                                                ? 'bg-green-200 text-green-900'
                                                : t.color === '#fbbf24'
                                                ? 'bg-yellow-200 text-yellow-900'
                                                : 'bg-gray-200 text-gray-700'
                                            }`}
                                          >
                                            {t.name}
                                          </span>
                                        ))}
                                      </div>
                                    )}
                                  </>
                                )}
                              </div>
                            )}

                            {/* Score breakdown for discover - optional details */}
                            {rec.scoreBreakdown?.length > 0 && (
                              <details className="text-xs text-gray-500 mb-2">
                                <summary className="cursor-pointer hover:text-gray-700 font-medium">
                                  📊 Score-Details
                                </summary>
                                <div className="mt-1 ml-3 space-y-0.5 font-mono">
                                  {rec.scoreBreakdown.map((line: string, idx: number) => (
                                    <div key={idx}>{line}</div>
                                  ))}
                                </div>
                              </details>
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
                            {/* KEINE allgemeine Tag/Keyword-Anzeige mehr */}
                          </div>
                        </div>

                        {/* User actions */}
                        {user && (
                          <div className="p-4 bg-blue-50 border-t" onClick={(e) => e.stopPropagation()}>
                            {/* Watchlist button */}
                            <button
                              onClick={() => handleWatchlistToggle(rec.movie)}
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
                <div className="text-sm text-gray-600">
                  {isDiscoverMode
                    ? 'Noch keine Discover-Ergebnisse. Klicke auf „Discover laden“.'
                    : 'Keine Empfehlungen gefunden. Bewerte mehr Filme, um bessere Empfehlungen zu erhalten!'}
                </div>
              )}
          </div>
        ) : (
          <div className="p-4 rounded-lg border-2 border-green-200 bg-green-50">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-lg font-semibold text-gray-800">Empfehlungen für dich</h3>
              <div className="flex gap-2">
                <button
                  onClick={isDiscoverMode ? handleDiscoverRecommendations : handleCalculateRecommendations}
                  disabled={recommendationsLoading}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
                >
                  {recommendationsLoading
                    ? 'Berechne...'
                    : showRecommendations
                      ? (isDiscoverMode ? '🔄 Discover neu laden' : '🔄 Neu berechnen')
                      : (isDiscoverMode ? '✨ Discover anzeigen' : '✨ Empfehlungen anzeigen')}
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
            {isDiscoverMode && discoverError && (
              <div className="text-sm text-red-600 mb-2">{discoverError}</div>
            )}
            
            {showRecommendations && baseRecommendations.length > 0 && (
              <div>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 max-h-96 overflow-y-auto">
                  {baseRecommendations
                    .filter(rec => {
                      if (recommendationSourceFilter !== 'all' && rec.source !== recommendationSourceFilter) return false
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
                            {rec.predictedRating > 0 && (
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
                            
                            <div className="flex items-center gap-2 mb-2 flex-wrap">
                              <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full">
                                {rec.movie.content_type === 'film' ? '🎬' : 
                                 rec.movie.content_type === 'serie' ? '📺' : '📚'} 
                                {rec.movie.content_type}
                              </span>
                              {rec.source === 'personal' ? (
                                <span className="bg-pink-100 text-pink-800 text-xs px-2 py-1 rounded-full whitespace-nowrap">
                                  👥 {rec.recommenders?.join(', ')}
                                </span>
                              ) : rec.source === 'discover' ? (
                                <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full whitespace-nowrap">
                                  🔎 Discover
                                </span>
                              ) : (
                                <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full whitespace-nowrap">
                                  🤖 KI
                                </span>
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
                          </div>
                        </div>

                        {/* User actions */}
                        {user && (
                          <div className="p-4 bg-blue-50 border-t" onClick={(e) => e.stopPropagation()}>
                            {/* Watchlist button */}
                            <button
                              onClick={() => handleWatchlistToggle(rec.movie)}
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

            {showRecommendations && baseRecommendations.length === 0 && (
              <p className="text-sm text-gray-600 italic">
                {isDiscoverMode
                  ? 'Noch keine Discover-Ergebnisse. Klicke auf „Discover laden“.'
                  : 'Keine Empfehlungen gefunden. Bewerte mehr Filme, um bessere Empfehlungen zu erhalten!'}
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
                  {/* Rating */}
                  <div className="mb-3">
                    <h4 className="text-sm font-medium text-gray-700 mb-2">
                      Deine Bewertung:
                    </h4>
                    <div className="flex items-center gap-3">
                      <StarRating 
                        rating={getUserRating(movie.ratings, user.id)} 
                        onRate={(rating) => handleRating(movie, rating)} 
                        disabled={false} 
                      />
                      {getUserRating(movie.ratings, user.id) > 0 && (
                        <button
                          onClick={() => handleDeleteRating(movie.id)}
                          className="ml-2 px-2 py-1 text-xs bg-gray-200 text-gray-700 rounded hover:bg-red-100 hover:text-red-600 transition-colors"
                          title="Bewertung löschen"
                        >
                          ✕
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Watchlist button */}
                  <button
                    onClick={() => handleWatchlistToggle(movie)}
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
            // Discovery: Entferne bewerteten Film sofort aus Vorschlagsliste
            setDiscoverResults(prev => prev.filter(
              rec => rec.movie.id !== selectedMovie.id && rec.movie.tmdb_id !== (selectedMovie as any).tmdb_id
            ))
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

      {/* Präferenzen-Button außerhalb der Empfehlungen */}
      {user && (
        <div className="mt-4 flex justify-center">
          <button
            className="bg-green-100 text-green-800 px-4 py-2 rounded-lg text-sm font-semibold hover:bg-green-200 transition"
            onClick={() => setShowPrefsModal(true)}
          >
            💡 Zeige meine Präferenzen
          </button>
        </div>
      )}

      {/* Präferenzen-Modal */}
      {showPrefsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
          <div className="bg-white rounded-lg shadow-lg p-6 max-w-lg w-full relative max-h-[80vh] overflow-y-auto">
            <button
              className="absolute top-2 right-2 text-gray-400 hover:text-gray-600 text-2xl font-bold"
              onClick={() => setShowPrefsModal(false)}
            >
              ×
            </button>
            <h2 className="text-lg font-bold mb-4">Deine Präferenzen</h2>
            <div className="mb-4">
              <h3 className="font-semibold text-green-700 mb-1">🎞️ Genres</h3>
              <ul className="list-disc pl-5 space-y-1">
                {getPreferenceStats('genre').map(([genre, stat]) => (
                  <li key={genre} className="text-gray-700">
                    <span className="font-semibold">{genre}</span>
                    <span className="ml-2 text-yellow-600">{stat.count5 > 0 && `${stat.count5}x ★★★★★ `}</span>
                    <span className="ml-1 text-yellow-500">{stat.count4 > 0 && `${stat.count4}x ★★★★`}</span>
                    <span className="ml-1 text-yellow-400">{stat.count3 > 0 && `${stat.count3}x ★★★`}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="mb-4">
              <h3 className="font-semibold text-green-700 mb-1">🎬 Regie</h3>
              <ul className="list-disc pl-5 space-y-1">
                {getPreferenceStats('director').map(([dir, stat]) => (
                  <li key={dir} className="text-gray-700">
                    <span className="font-semibold">{dir}</span>
                    <span className="ml-2 text-yellow-600">{stat.count5 > 0 && `${stat.count5}x ★★★★★ `}</span>
                    <span className="ml-1 text-yellow-500">{stat.count4 > 0 && `${stat.count4}x ★★★★`}</span>
                    <span className="ml-1 text-yellow-400">{stat.count3 > 0 && `${stat.count3}x ★★★`}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="mb-4">
              <h3 className="font-semibold text-green-700 mb-1">🎭 Schauspiel</h3>
              <ul className="list-disc pl-5 space-y-1">
                {getPreferenceStats('actor').map(([actor, stat]) => (
                  <li key={actor} className="text-gray-700">
                    <span className="font-semibold">{actor}</span>
                    <span className="ml-2 text-yellow-600">{stat.count5 > 0 && `${stat.count5}x ★★★★★ `}</span>
                    <span className="ml-1 text-yellow-500">{stat.count4 > 0 && `${stat.count4}x ★★★★`}</span>
                    <span className="ml-1 text-yellow-400">{stat.count3 > 0 && `${stat.count3}x ★★★`}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="mb-2">
              <h3 className="font-semibold text-green-700 mb-1">🔑 Keywords</h3>
              <ul className="list-disc pl-5 space-y-1">
                {getPreferenceStats('keywords').map(([kw, stat]) => (
                  <li key={kw} className="text-gray-700">
                    <span className="font-semibold">{kw}</span>
                    <span className="ml-2 text-yellow-600">{stat.count5 > 0 && `${stat.count5}x ★★★★★ `}</span>
                    <span className="ml-1 text-yellow-500">{stat.count4 > 0 && `${stat.count4}x ★★★★`}</span>
                    <span className="ml-1 text-yellow-400">{stat.count3 > 0 && `${stat.count3}x ★★★`}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}