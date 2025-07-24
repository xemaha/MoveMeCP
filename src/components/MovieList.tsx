'use client'
// Type helpers for react-range props (no @types/react-range available)
type RangeTrackProps = { props: any; children: React.ReactNode }
type RangeThumbProps = { props: any; index: number }
import { Range } from 'react-range'
import React, { useState, useEffect } from 'react'
import { supabase, Movie, Tag } from '@/lib/supabase'
import { MovieDetailModal } from '@/components/MovieDetailModal'
import { useUser } from '@/lib/UserContext'

// TagListDisplay: Zeigt Top 20 Tags, mit Button zum Umschalten auf alle alphabetisch sortiert
interface TagListDisplayProps {
  tags: Tag[]
}

const TagListDisplay: React.FC<TagListDisplayProps> = ({ tags }) => {
  const [showAll, setShowAll] = useState(false)
  if (!tags || tags.length === 0) return null
  const tagsSorted = [...tags].sort((a, b) => a.name.localeCompare(b.name))
  const tagsToShow = showAll ? tagsSorted : tags.slice(0, 20)
  return (
    <div className="flex flex-wrap gap-1 mb-2 sm:mb-3">
      {tagsToShow.map((tag) => (
        <span
          key={tag.id}
          className="inline-block px-2 py-1 rounded-full text-xs font-medium text-white"
          style={{ backgroundColor: tag.color }}
        >
          {tag.name}
        </span>
      ))}
      {tags.length > 20 && (
        <button
          type="button"
          className="ml-2 text-xs text-blue-600 underline hover:text-blue-800"
          onClick={() => setShowAll(v => !v)}
        >
          {showAll ? 'Weniger anzeigen' : 'Alle anzeigen'}
        </button>
      )}
    </div>
  )
}

interface Rating {
  rating: number
  user_name: string
  user_id: string
}

interface MovieWithDetails extends Movie {
  tags: Tag[]
  averageRating: number
  ratingCount: number
  ratings: Rating[]
  actor?: string
  director?: string
}

interface UserRatingFilter {
  type: 'all' | 'rated' | 'watchlist'
  userName: string
  minRating: number | null
  maxRating: number | null
}

interface ContentTypeFilter {
  film: boolean
  buch: boolean
  serie: boolean
}

export function MovieList() {
  // Move watchlistMovies state to the beginning
  const [watchlistMovies, setWatchlistMovies] = useState<Set<string>>(new Set())
  
  async function handleDeleteRating(movieId: string) {
    if (!user) return;
    try {
      // Find the rating id
      const { data, error } = await supabase
        .from('ratings')
        .select('id')
        .eq('movie_id', movieId)
        .eq('user_id', user.id)
        .single();
      if (error || !data) return;
      await supabase
        .from('ratings')
        .delete()
        .eq('id', data.id as string);
      // Update local state
      setMovies(prevMovies => prevMovies.map(movie => {
        if (movie.id === movieId) {
          const updatedRatings = movie.ratings.filter(r => r.user_id !== user.id);
          const averageRating = updatedRatings.length > 0
            ? updatedRatings.reduce((sum, r) => sum + r.rating, 0) / updatedRatings.length
            : 0;
          return {
            ...movie,
            ratings: updatedRatings,
            averageRating,
            ratingCount: updatedRatings.length
          };
        }
        return movie;
      }));
    } catch (err) {
      console.error('Fehler beim Löschen der Bewertung', err);
    }
  }
  // Tag-Filter: AND/OR Umschalter
  const [requireAllTags, setRequireAllTags] = useState(true)
  const [movies, setMovies] = useState<MovieWithDetails[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [userFilter, setUserFilter] = useState<UserRatingFilter>({
    type: 'all',
    userName: '',
    minRating: 0,
    maxRating: 5
  })
  const [showUnrated, setShowUnrated] = useState(false)
  const [availableUsers, setAvailableUsers] = useState<string[]>([])
  const [allTags, setAllTags] = useState<Tag[]>([])
  const [selectedTags, setSelectedTags] = useState<string[]>([])
  const [contentTypeFilter, setContentTypeFilter] = useState<ContentTypeFilter>({
    film: true,
    serie: true,
    buch: false
  })
  const [viewMode, setViewMode] = useState<'movie-based' | 'tag-based'>('movie-based')
  const [selectedMovieForEdit, setSelectedMovieForEdit] = useState<MovieWithDetails | null>(null)
  const { user } = useUser()

  // State for tag display toggle
  const [showAllTags, setShowAllTags] = useState(false)
  const [tagUsageCount, setTagUsageCount] = useState<Record<string, number>>({})

  // Add state for searchable user dropdown
  const [userSearchQuery, setUserSearchQuery] = useState('')
  const [showUserDropdown, setShowUserDropdown] = useState(false)

  useEffect(() => {
    fetchMoviesWithDetails()
    fetchAvailableUsers()
    fetchAllTags()
  }, [])

  // Fetch tag usage counts from movie_tags table (like in MovieDetailModal)
  useEffect(() => {
    const fetchTagUsage = async () => {
      const { data, error } = await supabase
        .from('movie_tags')
        .select('tag_id, tags(name)')
      if (!error && data) {
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
    fetchTagUsage()
  }, [])

  // Filter movies based on search and user rating filter
  const filteredMovies = movies.filter(movie => {
    // Text search (now also includes actors and director)
    const lowerQuery = searchQuery.toLowerCase();
    const matchesSearch =
      movie.title.toLowerCase().includes(lowerQuery) ||
      movie.tags.some(tag => tag.name.toLowerCase().includes(lowerQuery)) ||
      (movie.actor && movie.actor.toLowerCase().includes(lowerQuery)) ||
      (movie.director && movie.director.toLowerCase().includes(lowerQuery));

    // Rating filter: if user is selected, filter by their rating; otherwise, filter by averageRating
    let matchesRatingFilter = true
    if (userFilter.userName) {
      const userRating = movie.ratings.find(r => r.user_name === userFilter.userName)
      if (userFilter.minRating === 0) {
        // Show movies with no rating by this user, or in range
        matchesRatingFilter = !userRating || (userRating.rating >= 1 && userRating.rating >= (userFilter.minRating ?? 0) && userRating.rating <= (userFilter.maxRating ?? 5))
      } else {
        matchesRatingFilter = !!userRating && userRating.rating >= (userFilter.minRating ?? 0) && userRating.rating <= (userFilter.maxRating ?? 5)
      }
    } else {
      if (userFilter.minRating === 0) {
        // Show unrated movies (no ratings) or movies in range
        matchesRatingFilter = movie.ratings.length === 0 || (movie.averageRating >= 1 && movie.averageRating >= (userFilter.minRating ?? 0) && movie.averageRating <= (userFilter.maxRating ?? 5))
      } else {
        matchesRatingFilter = movie.averageRating >= (userFilter.minRating ?? 0) && movie.averageRating <= (userFilter.maxRating ?? 5)
      }
    }

    // User-specific filter logic
    let matchesUserFilter = true
    if (user && userFilter.type !== 'all') {
      if (userFilter.type === 'rated') {
        // Show only movies rated by current user
        const userRating = movie.ratings.find(r => r.user_id === user.id)
        matchesUserFilter = !!userRating && 
          userRating.rating >= (userFilter.minRating ?? 0) && 
          userRating.rating <= (userFilter.maxRating ?? 5)
      } else if (userFilter.type === 'watchlist') {
        // Show only movies in current user's watchlist
        matchesUserFilter = watchlistMovies.has(movie.id)
      }
    } else if (userFilter.userName) {
      const userRating = movie.ratings.find(r => r.user_name === userFilter.userName)
      if (!userRating) {
        matchesUserFilter = false
      } else {
        matchesUserFilter = userRating.rating >= (userFilter.minRating ?? 0) && userRating.rating <= (userFilter.maxRating ?? 5)
      }
    } else {
      // Rating filter for all users
      if (userFilter.minRating === 0) {
        matchesUserFilter = movie.ratings.length === 0 || (movie.averageRating >= 1 && movie.averageRating >= (userFilter.minRating ?? 0) && movie.averageRating <= (userFilter.maxRating ?? 5))
      } else {
        matchesUserFilter = movie.averageRating >= (userFilter.minRating ?? 0) && movie.averageRating <= (userFilter.maxRating ?? 5)
      }
    }

    // Tag filter
    let matchesTagFilter = true
    if (selectedTags.length > 0) {
      if (requireAllTags) {
        // AND: Movie must have all selected tags
        matchesTagFilter = selectedTags.every(selectedTag =>
          movie.tags.some(movieTag => movieTag.name === selectedTag)
        )
      } else {
        // OR: Movie must have at least one selected tag
        matchesTagFilter = selectedTags.some(selectedTag =>
          movie.tags.some(movieTag => movieTag.name === selectedTag)
        )
      }
    }

    // Content type filter
    const matchesContentTypeFilter = contentTypeFilter[movie.content_type as keyof ContentTypeFilter] || false

    return matchesSearch && matchesUserFilter && matchesTagFilter && matchesContentTypeFilter
  })

  // Get available tags based on current filters (content type, user ratings, search) - but NOT tag filter itself
  const availableTagsForCurrentFilters = allTags.filter(tag => {
    // Get movies that match current filters (excluding tag filter)
    const moviesWithoutTagFilter = movies.filter(movie => {
      // Text search filter
      const lowerQuery = searchQuery.toLowerCase();
      const matchesSearch = searchQuery === '' || 
        movie.title.toLowerCase().includes(lowerQuery) ||
        (movie.actor && movie.actor.toLowerCase().includes(lowerQuery)) ||
        (movie.director && movie.director.toLowerCase().includes(lowerQuery)) ||
        movie.tags.some(tag => tag.name.toLowerCase().includes(lowerQuery));

      // Content type filter
      const matchesContentType = contentTypeFilter[movie.content_type as keyof ContentTypeFilter] || false

      // User-specific filter logic
      let matchesUserFilter = true
      if (user && userFilter.type !== 'all') {
        if (userFilter.type === 'rated') {
          const userRating = movie.ratings.find(r => r.user_id === user.id)
          matchesUserFilter = !!userRating && 
            userRating.rating >= (userFilter.minRating ?? 0) && 
            userRating.rating <= (userFilter.maxRating ?? 5)
        } else if (userFilter.type === 'watchlist') {
          matchesUserFilter = watchlistMovies.has(movie.id)
        }
      } else if (userFilter.userName) {
        const userRating = movie.ratings.find(r => r.user_name === userFilter.userName)
        if (!userRating) {
          matchesUserFilter = false
        } else {
          matchesUserFilter = userRating.rating >= (userFilter.minRating ?? 0) && userRating.rating <= (userFilter.maxRating ?? 5)
        }
      } else {
        // Rating filter for all users
        if (userFilter.minRating === 0) {
          matchesUserFilter = movie.ratings.length === 0 || (movie.averageRating >= 1 && movie.averageRating >= (userFilter.minRating ?? 0) && movie.averageRating <= (userFilter.maxRating ?? 5))
        } else {
          matchesUserFilter = movie.averageRating >= (userFilter.minRating ?? 0) && movie.averageRating <= (userFilter.maxRating ?? 5)
        }
      }

      return matchesSearch && matchesContentType && matchesUserFilter
    })

    // Check if this tag is used by any of the movies without tag filter
    return moviesWithoutTagFilter.some(movie => {
      return movie.tags.some(movieTag => movieTag.name === tag.name)
    })
  }).map(tag => {
    // Add count of how many movies have this tag (with current filters INCLUDING tag filters applied)
    const count = filteredMovies.filter(movie => 
      movie.tags.some(movieTag => movieTag.name === tag.name)
    ).length

    return { ...tag, count }
  }).filter(tag => tag.count > 0) // Only show tags that have movies

  // Clear selected tags that are no longer available when filters change
  useEffect(() => {
    if (selectedTags.length > 0) {
      const availableTagNames = availableTagsForCurrentFilters.map(tag => tag.name)
      const validSelectedTags = selectedTags.filter(tagName => availableTagNames.includes(tagName))
      if (validSelectedTags.length !== selectedTags.length) {
        setSelectedTags(validSelectedTags)
      }
    }
  }, [contentTypeFilter, userFilter, searchQuery, availableTagsForCurrentFilters, selectedTags])

  const fetchAllTags = async () => {
    try {
      const { data: tags } = await supabase
        .from('tags')
        .select('*')
        .order('name')

      if (tags) {
        setAllTags(tags as unknown as Tag[])
      }
    } catch (error) {
      console.error('Error fetching tags:', error)
    }
  }

  const fetchAvailableUsers = async () => {
    try {
      // Get all users who have rated movies
      const { data: ratings } = await supabase
        .from('ratings')
        .select('user_name')
        .not('user_name', 'is', null)

      // Get all users who have created movies
      const { data: movies } = await supabase
        .from('movies')
        .select('created_by')
        .not('created_by', 'is', null)

      const allUsers = new Set<string>()
      
      // Add users from ratings - nur user_name verwenden
      if (ratings) {
        ratings.forEach(r => {
          if (r.user_name && typeof r.user_name === 'string') {
            allUsers.add(r.user_name)
          }
        })
      }
      
      // Add users from movie creators - nur created_by verwenden
      if (movies) {
        movies.forEach(m => {
          if (m.created_by && typeof m.created_by === 'string') {
            allUsers.add(m.created_by)
          }
        })
      }

      // Filter out system users and duplicates, sort alphabetically
      const userList = Array.from(allUsers)
        .filter(u => u && u !== 'System' && u !== 'system')
        .sort((a, b) => a.localeCompare(b))

      setAvailableUsers(userList)
    } catch (error) {
      console.error('Error fetching users:', error)
    }
  }

  // Enhanced movie fetching that also checks for new watchlist entries
  const fetchMoviesWithDetails = async (checkForNewWatchlistMovies = false) => {
    try {
      setIsLoading(true)
      const previousMovieIds = new Set(movies.map(m => m.id))
      
      // Fetch movies
      const { data: moviesData, error: moviesError } = await supabase
        .from('movies')
        .select('*')
        .order('created_at', { ascending: false })

      if (moviesError) {
        setError('Supabase: ' + (moviesError.message || moviesError.details || JSON.stringify(moviesError)))
        throw moviesError
      }

      if (!moviesData) {
        setMovies([])
        return
      }

      // Fetch ratings and tags for each movie
      const moviesWithDetails = await Promise.all(
        moviesData.map(async (movie) => {
          // Get ratings with user info
          const { data: ratings } = await supabase
            .from('ratings')
            .select('rating, user_name, user_id')
            .eq('movie_id', movie.id as string)

          // Get tags
          const { data: movieTags } = await supabase
            .from('movie_tags')
            .select(`
              tags (
                id,
                name,
                color,
                created_at
              )
            `)
            .eq('movie_id', movie.id as string)

          const tags = movieTags?.map((mt: any) => mt.tags).filter(Boolean) || []
          
          const movieRatings = ratings || []
          const averageRating = movieRatings.length > 0
            ? movieRatings.reduce((sum: number, r: any) => sum + (r.rating as number), 0) / movieRatings.length
            : 0

          return {
            ...movie,
            tags,
            averageRating,
            ratingCount: movieRatings.length,
            ratings: movieRatings.map(r => ({
              rating: r.rating as number,
              user_name: r.user_name as string,
              user_id: r.user_id as string
            }))
          } as MovieWithDetails
        })
      )

      setMovies(moviesWithDetails)
      
      // Check for new movies if requested
      if (checkForNewWatchlistMovies && user) {
        const newMovies = moviesWithDetails.filter(movie => !previousMovieIds.has(movie.id))
        console.log('🎬 Checking new movies for watchlist:', newMovies.map(m => ({ id: m.id, title: m.title })))
        
        for (const newMovie of newMovies) {
          // Check if this new movie is in the watchlist
          const { data: watchlistEntry } = await supabase
            .from('watchlist')
            .select('movie_id')
            .eq('user_id', user.id)
            .eq('movie_id', newMovie.id)
            .maybeSingle()
          
          if (watchlistEntry) {
            console.log('🎬 Found new movie in watchlist:', newMovie.title, newMovie.id)
            addToWatchlistState(newMovie.id)
          }
        }
      }
      
      // Force watchlist refresh after movies are loaded
      if (user) {
        setTimeout(() => {
          refreshWatchlist()
        }, 100)
      }
    } catch (error: any) {
      console.error('Error fetching movies:', error)
      setError('Fehler beim Laden der Filme: ' + (error.message || error.details || JSON.stringify(error)))
    } finally {
      setIsLoading(false)
    }
  }

  // Helper: count how many selected tags a movie has
  function countMatchingTags(movieTags: Tag[], selectedTags: string[]): number {
    return movieTags.filter(tag => selectedTags.includes(tag.name)).length
  }

  // Helper: Anzahl Filme für einen Tag nach aktuellem Filter
  function getMovieCountForTag(tagName: string) {
    // Zeige, wie viele Filme nach aktuellem Filter diesen Tag noch haben
    return filteredMovies.filter(movie => movie.tags.some(tag => tag.name === tagName)).length
  }

  const handleTagClick = (tagName: string) => {
    setSelectedTags(prev => {
      if (prev.includes(tagName)) {
        // Remove tag if already selected
        return prev.filter(tag => tag !== tagName)
      } else {
        // Add tag if not selected
        return [...prev, tagName]
      }
    })
  }

  const clearTagFilter = () => {
    setSelectedTags([])
  }

  // Prepare data for tag-based view
  const getTagBasedData = () => {
    const tagGroups: { [tagName: string]: { tag: Tag; movies: MovieWithDetails[] } } = {}
    
    filteredMovies.forEach(movie => {
      movie.tags.forEach(tag => {
        if (!tagGroups[tag.name]) {
          tagGroups[tag.name] = {
            tag: tag,
            movies: []
          }
        }
        tagGroups[tag.name].movies.push(movie)
      })
    })

    // Sort tags alphabetically
    return Object.entries(tagGroups)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([tagName, data]) => ({
        tagName,
        tag: data.tag,
        movies: data.movies.sort((a, b) => a.title.localeCompare(b.title))
      }))
  }

  const handleContentTypeToggle = (contentType: keyof ContentTypeFilter) => {
    setContentTypeFilter(prev => ({
      ...prev,
      [contentType]: !prev[contentType]
    }))
  }

  const resetContentTypeFilter = () => {
    setContentTypeFilter({
      film: true,
      buch: true,
      serie: true
    })
  }

  const handleStarClick = async (movieId: string, rating: number) => {
    if (!user) {
      alert('Du musst eingeloggt sein, um zu bewerten!')
      return
    }

    try {
      // Check if user already rated this movie
      const existingRatingQuery = await supabase
        .from('ratings')
        .select('*')
        .eq('movie_id', movieId)
        .eq('user_id', user.id)
        .single()

      if (existingRatingQuery.data) {
        // Update existing rating
        const updateResult = await supabase
          .from('ratings')
          .update({ rating })
          .eq('id', existingRatingQuery.data.id as string)

        if (updateResult.error) {
          console.error('Error updating rating:', updateResult.error)
          alert('Fehler beim Aktualisieren der Bewertung')
          return
        }
      } else {
        // Create new rating
        const insertResult = await supabase
          .from('ratings')
          .insert([
            {
              movie_id: movieId,
              rating: rating,
              user_id: user.id,
              user_name: user.name,
            },
          ])

        if (insertResult.error) {
          console.error('Error creating rating:', insertResult.error)
          alert('Fehler beim Erstellen der Bewertung')
          return
        }
      }

      // Update the local state optimistically (without full reload)
      setMovies(prevMovies => prevMovies.map(movie => {
        if (movie.id === movieId) {
          // Update or add the rating
          const existingRatingIndex = movie.ratings.findIndex(r => r.user_id === user.id)
          let updatedRatings = [...movie.ratings]
          
          if (existingRatingIndex >= 0) {
            // Update existing rating
            updatedRatings[existingRatingIndex] = { ...updatedRatings[existingRatingIndex], rating }
          } else {
            // Add new rating
            updatedRatings.push({ rating, user_name: user.name, user_id: user.id })
          }

          // Recalculate average rating
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

      // Show success feedback
      console.log('Bewertung erfolgreich gespeichert!')
      
    } catch (error) {
      console.error('Error handling rating:', error)
      alert('Fehler beim Verarbeiten der Bewertung')
    }
  }

  const getUserRating = (movieRatings: Rating[], userId: string): number => {
    const userRating = movieRatings.find(r => r.user_id === userId)
    return userRating ? userRating.rating : 0
  }

  const handleRemoveMovie = (movieId: string) => {
    setMovies(movies.filter(movie => movie.id !== movieId))
  }

  // Function to manually add movie to watchlist state
  const addToWatchlistState = (movieId: string) => {
    console.log('Debug: Manually adding to watchlist state:', movieId)
    setWatchlistMovies(prev => {
      const newSet = new Set(prev)
      newSet.add(movieId)
      console.log('Debug: New watchlist state:', Array.from(newSet))
      return newSet
    })
  }

  // Function to manually remove movie from watchlist state  
  const removeFromWatchlistState = (movieId: string) => {
    console.log('Debug: Manually removing from watchlist state:', movieId)
    setWatchlistMovies(prev => {
      const newSet = new Set(prev)
      newSet.delete(movieId)
      console.log('Debug: New watchlist state:', Array.from(newSet))
      return newSet
    })
  }

  // Enhanced refresh function that forces a complete refresh
  const forceRefreshWatchlist = async () => {
    if (!user) {
      setWatchlistMovies(new Set())
      return
    }
    
    try {
      console.log('Debug: Force refreshing watchlist for user:', user.id)
      
      // Clear current state first
      setWatchlistMovies(new Set())
      
      // Wait a bit for any pending operations
      await new Promise(resolve => setTimeout(resolve, 200))
      
      const { data, error } = await supabase
        .from('watchlist')
        .select('movie_id')
        .eq('user_id', user.id)

      if (error) {
        console.error('Debug: Error fetching watchlist:', error)
        return
      }

      console.log('Debug: Fresh watchlist data:', data)
      if (data) {
        const watchlistIds = new Set(data.map(item => item.movie_id as string))
        console.log('Debug: Setting fresh watchlist IDs:', Array.from(watchlistIds))
        setWatchlistMovies(watchlistIds)
      }
    } catch (error) {
      console.error('Debug: Exception in forceRefreshWatchlist:', error)
    }
  }

  // Separate function for refreshing watchlist
  const refreshWatchlist = async () => {
    if (!user) {
      console.log('Debug: No user, clearing watchlist')
      setWatchlistMovies(new Set())
      return
    }
    
    try {
      console.log('Debug: Refreshing watchlist for user:', user.id)
      const { data, error } = await supabase
        .from('watchlist')
        .select('movie_id')
        .eq('user_id', user.id)

      if (error) {
        console.error('Debug: Error fetching watchlist:', error)
        return
      }

      console.log('Debug: Watchlist data:', data)
      if (data) {
        const watchlistIds = new Set(data.map(item => item.movie_id as string))
        console.log('Debug: Setting watchlist IDs:', Array.from(watchlistIds))
        setWatchlistMovies(watchlistIds)
      }
    } catch (error) {
      console.error('Debug: Exception in refreshWatchlist:', error)
    }
  }

  // Neuer useEffect für Watchlist laden
  useEffect(() => {
    refreshWatchlist()
  }, [user, movies]) // Add movies dependency to refresh when movies change

  // Neue Funktion für Watchlist Toggle mit UUID-Konvertierung
  const handleWatchlistToggle = async (movieId: string) => {
    if (!user) {
      alert('Du musst eingeloggt sein, um Filme zur Watchlist hinzuzufügen!')
      return
    }

    try {
      const isCurrentlyInWatchlist = watchlistMovies.has(movieId)

      if (isCurrentlyInWatchlist) {
        // Remove from watchlist
        const { error } = await supabase
          .from('watchlist')
          .delete()
          .eq('movie_id', movieId)
          .eq('user_id', user.id)

        if (error) {
          console.error('Error removing from watchlist:', error)
          alert(`Fehler beim Entfernen aus der Watchlist: ${error.message}`)
          return
        }

        // Update local state
        setWatchlistMovies(prev => {
          const newSet = new Set(prev)
          newSet.delete(movieId)
          return newSet
        })
      } else {
        // Add to watchlist - konvertiere movieId zu UUID wenn nötig
        const { error } = await supabase
          .from('watchlist')
          .insert([
            {
              movie_id: movieId, // Wird automatisch zu UUID konvertiert
              user_id: user.id,   // user.id ist bereits vom auth system
            },
          ])

        if (error) {
          console.error('Error adding to watchlist:', error)
          // Mehr Details für Debugging
          console.error('Movie ID:', movieId, 'Type:', typeof movieId)
          console.error('User ID:', user.id, 'Type:', typeof user.id)
          alert(`Fehler beim Hinzufügen zur Watchlist: ${error.message}`)
          return
        }

        // Update local state
        setWatchlistMovies(prev => new Set(prev).add(movieId))
      }

      console.log('Watchlist erfolgreich aktualisiert!')
      
    } catch (error: any) {
      console.error('Error handling watchlist:', error)
      alert(`Fehler beim Verarbeiten der Watchlist: ${error?.message || 'Unbekannter Fehler'}`)
    }
  }

  const isInWatchlist = (movieId: string): boolean => {
    return watchlistMovies.has(movieId)
  }

  // Add debug function to check watchlist state
  const debugWatchlist = async () => {
    if (!user) return
    
    console.log('Debug: Current user:', user.id, user.name)
    
    try {
      const { data, error } = await supabase
        .from('watchlist')
        .select('*')
        .eq('user_id', user.id)

      console.log('Debug: Watchlist data from DB:', data)
      console.log('Debug: Watchlist error:', error)
      console.log('Debug: Current watchlistMovies state:', Array.from(watchlistMovies))
    } catch (error) {
      console.error('Debug: Error fetching watchlist:', error)
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

  // Top 20 tags by usage
  const topTags = [...allTags]
    .sort((a, b) => (tagUsageCount[b.name] || 0) - (tagUsageCount[a.name] || 0))
    .slice(0, 20)
  // All tags sorted alphabetically
  const allTagsSorted = [...allTags].sort((a, b) => a.name.localeCompare(b.name))

  return (
    <div className="space-y-6">
      {/* View Mode Toggle and Refresh Button */}
      <div className="flex justify-center items-center gap-4">
        <div className="bg-gray-100 rounded-lg p-1 flex">
          <button
            onClick={() => setViewMode('movie-based')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              viewMode === 'movie-based'
                ? 'bg-white text-blue-600 shadow-sm'
                : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            📽️ Nach Items
          </button>
          <button
            onClick={() => setViewMode('tag-based')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              viewMode === 'tag-based'
                ? 'bg-white text-blue-600 shadow-sm'
                : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            🏷️ Nach Tags
          </button>
        </div>
        {/* Refresh-Button entfernt, da kein expliziter Speichern-Button gewünscht */}
      </div>

      {/* Search and Filter Controls */}
      <div className="space-y-4">
        {/* Search Bar */}
        <div>
          <input
            type="text"
            placeholder="Suche nach Titel, Beschreibung oder Tags..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Content Type Filter */}
        <div className="bg-green-50 p-4 rounded-lg">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-medium text-gray-700">Content-Type Filter</h3>
          </div>
          <div className="flex flex-wrap gap-3">
            <label className="flex items-center space-x-2 cursor-pointer">
              <input
                type="checkbox"
                checked={contentTypeFilter.film}
                onChange={() => handleContentTypeToggle('film')}
                className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
              />
              <span className="text-sm font-medium text-gray-700">
                🎬 Filme
              </span>
            </label>
            <label className="flex items-center space-x-2 cursor-pointer">
              <input
                type="checkbox"
                checked={contentTypeFilter.serie}
                onChange={() => handleContentTypeToggle('serie')}
                className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
              />
              <span className="text-sm font-medium text-gray-700">
                📺 Serien
              </span>
            </label>
            <label className="flex items-center space-x-2 cursor-pointer">
              <input
                type="checkbox"
                checked={contentTypeFilter.buch}
                onChange={() => handleContentTypeToggle('buch')}
                className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
              />
              <span className="text-sm font-medium text-gray-700">
                📚 Bücher
              </span>
            </label>
          </div>
        </div>

        {/* User Rating Filter */}
        <div className="bg-gray-50 p-4 rounded-lg">
          <h3 className="text-sm font-medium text-gray-700 mb-3">Filter nach User-Bewertungen</h3>
          
          {/* User-specific filter dropdown */}
          {user && (
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-600 mb-1">Meine Filme</label>
              <select
                value={userFilter.type}
                onChange={(e) => setUserFilter({
                  ...userFilter, 
                  type: e.target.value as 'all' | 'rated' | 'watchlist',
                  userName: ''
                })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">🎬 Alle Filme</option>
                <option value="rated">⭐ Nur von mir bewertete Filme</option>
                <option value="watchlist">👁️ Nur meine Watchlist</option>
              </select>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">User</label>
              <select
                value={userFilter.userName}
                onChange={(e) => setUserFilter({...userFilter, userName: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Alle User</option>
                {availableUsers.map(user => (
                  <option key={user} value={user}>{user}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Rating slider - only show for rated movies or when filtering by ratings */}
          {(userFilter.type === 'rated' || userFilter.userName || userFilter.type === 'all') && (
            <div className="flex flex-col gap-2 w-full mt-4">
              <Range
                step={1}
                min={0}
                max={5}
                values={[userFilter.minRating ?? 0, userFilter.maxRating ?? 5]}
                onChange={(values: number[]) => setUserFilter({ ...userFilter, minRating: values[0], maxRating: values[1] })}
                renderTrack={({ props, children }: RangeTrackProps) => {
                  const { key, ...rest } = props;
                  return (
                    <div key={key} {...rest} className="h-2 w-full rounded bg-gray-200 my-4" style={{ ...props.style }}>
                      <div className="h-2 rounded bg-yellow-400" style={{
                        position: 'absolute',
                        left: `${((userFilter.minRating ?? 0) / 5) * 100}%`,
                        width: `${(((userFilter.maxRating ?? 5) - (userFilter.minRating ?? 0)) / 5) * 100}%`,
                        top: 0,
                        bottom: 0
                      }} />
                      {children}
                    </div>
                  );
                }}
                renderThumb={({ props, index }: RangeThumbProps) => {
                  const { key, ...rest } = props;
                  return (
                    <div
                      key={key}
                      {...rest}
                      className="w-5 h-5 bg-yellow-400 border-2 border-yellow-600 rounded-full flex items-center justify-center shadow"
                      style={{ ...props.style }}
                    >
                      <span className="text-xs font-bold text-white select-none">{[userFilter.minRating ?? 0, userFilter.maxRating ?? 5][index]}</span>
                    </div>
                  );
                }}
              />
              <div className="flex justify-between text-xs text-gray-500 w-full px-1">
                <span>0</span>
                <span>1</span>
                <span>2</span>
                <span>3</span>
                <span>4</span>
                <span>5</span>
              </div>
            </div>
          )}
        </div>

        {/* Tag Filter */}
        <div className="bg-blue-50 p-4 rounded-lg">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-4">
              <h3 className="text-sm font-medium text-gray-700">Filter nach Tags</h3>
              <label className="flex items-center gap-2 cursor-pointer bg-white rounded px-2 py-1 shadow text-xs font-medium">
                <button
                  type="button"
                  onClick={() => setRequireAllTags(v => !v)}
                  className={`relative w-10 h-6 flex items-center rounded-full transition-colors duration-200 focus:outline-none ${requireAllTags ? 'bg-blue-600' : 'bg-gray-300'}`}
                  aria-pressed={requireAllTags}
                  aria-label="Match all tags"
                >
                  <span className={`absolute left-1 top-1 w-4 h-4 rounded-full bg-white shadow transition-transform duration-200 ${requireAllTags ? 'translate-x-4' : ''}`}></span>
                </button>
                <span className="ml-2 select-none">Match all tags</span>
              </label>
            </div>
            {selectedTags.length > 0 && (
              <button
                onClick={clearTagFilter}
                className="text-xs text-blue-600 hover:text-blue-800 underline"
              >
                Alle Tags entfernen
              </button>
            )}
          </div>
          <div className="flex flex-wrap gap-2">
            {(showAllTags ? 
              availableTagsForCurrentFilters.sort((a, b) => a.name.localeCompare(b.name)) : 
              availableTagsForCurrentFilters.sort((a, b) => (tagUsageCount[b.name] || 0) - (tagUsageCount[a.name] || 0)).slice(0, 20)
            ).map(tag => (
              <button
                key={tag.id}
                onClick={() => {
                  setSelectedTags(selectedTags.includes(tag.name)
                    ? selectedTags.filter(t => t !== tag.name)
                    : [...selectedTags, tag.name])
                }}
                className={`px-3 py-1 rounded-full text-sm font-medium text-white transition-opacity ${selectedTags.includes(tag.name) ? 'opacity-100 bg-blue-600' : 'opacity-60 bg-gray-500 hover:opacity-100'}`}
                style={{ backgroundColor: tag.color }}
              >
                {tag.name}
                <span className="ml-1 text-xs">({tag.count})</span>
              </button>
            ))}
          </div>
          {(availableTagsForCurrentFilters.length > 20) && (
            <button
              type="button"
              className="mt-2 text-xs text-blue-600 hover:underline focus:outline-none"
              onClick={() => setShowAllTags(v => !v)}
            >
              {showAllTags ? 'Weniger anzeigen' : 'Alle anzeigen'}
            </button>
          )}
        </div>
      </div>

      
      <div className="text-sm text-gray-600">
        {filteredMovies.length} {filteredMovies.length === 1 ? 'Eintrag' : 'Einträge'} gefunden
      </div>

      {/* Conditional View Based on Mode */}
      {viewMode === 'movie-based' ? (
        /* Movie-Based View */
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6">
        {filteredMovies
          .slice()
          .sort((a, b) => {
            // 1. Sort by number of matching selected tags (desc)
            const matchA = countMatchingTags(a.tags, selectedTags)
            const matchB = countMatchingTags(b.tags, selectedTags)
            if (matchB !== matchA) return matchB - matchA
            // 2. Then by best average rating (desc)
            return (b.averageRating || 0) - (a.averageRating || 0)
          })
          .map((movie) => (
            <div key={movie.id} className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow cursor-pointer group flex flex-col sm:p-0 p-0">
              <div className="flex flex-col h-full" onClick={() => setSelectedMovieForEdit(movie)}>
                {/* Movie Poster */}
                {movie.poster_url ? (
                  <div className="w-full h-60 bg-gray-100 flex items-center justify-center overflow-hidden">
                    <img
                      src={movie.poster_url}
                      alt={movie.title}
                      className="object-cover w-full h-full transition-transform duration-200 group-hover:scale-105"
                      style={{ maxHeight: '240px', minHeight: '180px', background: '#eee' }}
                    />
                  </div>
                ) : (
                  <div className="w-full h-60 bg-gray-200 flex items-center justify-center text-gray-400 text-5xl">
                    <span>🎬</span>
                  </div>
                )}
                <div className="p-4 sm:p-6 flex-1 flex flex-col">
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="text-base sm:text-lg font-semibold text-gray-900 truncate max-w-[70vw]">{movie.title}</h3>
                        <span className="text-sm text-gray-400 group-hover:text-blue-600 transition-colors">✏️</span>
                      </div>
                      <div className="flex flex-wrap items-center gap-2 mb-2">
                        <span className="inline-block bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full">
                          {movie.content_type === 'film' ? '🎬' : movie.content_type === 'serie' ? '📺' : '📚'} {movie.content_type}
                        </span>
                        {movie.created_by && (
                          <span className="text-xs text-gray-500">von {movie.created_by}</span>
                        )}
                      </div>
                    </div>
                  </div>

                  {movie.description && (
                    <p className="text-gray-600 text-sm mb-2 line-clamp-2 sm:line-clamp-3">{movie.description}</p>
                  )}

                  {/* YouTube Trailer Button */}
                  {movie.trailer_url && (
                    <div className="mb-3">
                      <a
                        href={movie.trailer_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center px-3 py-1 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors text-xs font-medium gap-2"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 24 24" className="w-4 h-4"><path d="M23.498 6.186a2.994 2.994 0 0 0-2.107-2.117C19.228 3.5 12 3.5 12 3.5s-7.228 0-9.391.569A2.994 2.994 0 0 0 .502 6.186C0 8.36 0 12 0 12s0 3.64.502 5.814a2.994 2.994 0 0 0 2.107 2.117C4.772 20.5 12 20.5 12 20.5s7.228 0 9.391-.569a2.994 2.994 0 0 0 2.107-2.117C24 15.64 24 12 24 12s0-3.64-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/></svg>
                        YouTube Trailer
                      </a>
                    </div>
                  )}

                  {/* Tags */}
                  {movie.tags.length > 0 && (
                    <TagListDisplay tags={movie.tags} />
                  )}

                  {/* Average Rating */}
                  <div className="flex items-center justify-between mb-2 text-sm sm:text-base">
                    <div className="flex items-center space-x-2">
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
                      <span className="text-sm text-gray-600">
                        {movie.averageRating.toFixed(1)} ({movie.ratingCount} Bewertungen)
                      </span>
                    </div>
                  </div>

                  {/* User's Personal Rating */}
                  {user && (
                    <div className="mb-3 p-2 sm:p-3 bg-blue-50 rounded-lg" onClick={(e) => e.stopPropagation()}>
                      <h4 className="text-sm font-medium text-gray-700 mb-2">
                        Deine Bewertung ({user.name}):
                      </h4>
                      <div className="flex items-center space-x-1 text-lg sm:text-xl mb-3">
                        {[1, 2, 3, 4, 5].map((star) => {
                          const userRating = getUserRating(movie.ratings, user.id)
                          const isActive = star <= userRating
                          return (
                            <button
                              key={star}
                              onClick={() => handleStarClick(movie.id, star)}
                              className={`w-6 h-6 text-lg transition-colors hover:scale-110 ${
                                isActive ? 'text-yellow-400' : 'text-gray-300 hover:text-yellow-300'
                              }`}
                            >
                              ★
                            </button>
                          )
                        })}
                        <span className="text-sm text-gray-600 ml-2">
                          {getUserRating(movie.ratings, user.id) > 0 
                            ? `${getUserRating(movie.ratings, user.id)} Sterne` 
                            : 'Noch nicht bewertet'}
                        </span>
                        {/* Button to delete rating */}
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

                      {/* Watchlist Button - jetzt als eigener Button unter der Bewertung */}
                      <button
                        onClick={() => handleWatchlistToggle(movie.id)}
                        className={`w-full flex items-center justify-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                          isInWatchlist(movie.id)
                            ? 'bg-green-100 text-green-700 hover:bg-green-200 border border-green-300'
                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200 border border-gray-300'
                        }`}
                        title={isInWatchlist(movie.id) ? 'Aus Watchlist entfernen' : 'Zur Watchlist hinzufügen'}
                      >
                        <span className="text-lg">
                          {isInWatchlist(movie.id) ? '👁️' : '👁️‍🗨️'}
                        </span>
                        <span>
                          {isInWatchlist(movie.id) ? 'Auf Watchlist' : 'Zur Watchlist hinzufügen'}
                        </span>
                      </button>
                    </div>
                  )}

                  {/* Individual User Ratings */}
                  {movie.ratings.length > 0 && (
                    <div className="mt-2 pt-2 border-t border-gray-200 text-xs sm:text-sm">
                      <h4 className="text-sm font-medium text-gray-700 mb-2">User-Bewertungen:</h4>
                      <div className="space-y-1">
                        {movie.ratings.map((rating, index) => (
                          <div key={index} className="flex items-center justify-between text-sm">
                            <span className="text-gray-600">{rating.user_name}</span>
                            <div className="flex items-center">
                              <span className="text-yellow-400 mr-1">
                                {'★'.repeat(rating.rating)}
                              </span>
                              <span className="text-gray-400">
                                {'☆'.repeat(5 - rating.rating)}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* Tag-Based View */
        <div className="space-y-6">
          {getTagBasedData().map(({ tagName, tag, movies }) => (
            <div key={tagName} className="bg-white rounded-lg shadow-md overflow-hidden">
              <div className="p-4 border-b border-gray-200" style={{ backgroundColor: tag.color + '20' }}>
                <div className="flex items-center gap-2">
                  <span
                    className="w-4 h-4 rounded-full"
                    style={{ backgroundColor: tag.color }}
                  />
                  <h3 className="text-lg font-semibold text-gray-900">{tagName}</h3>
                  <span className="text-sm text-gray-500">({movies.length} Einträge)</span>
                </div>
              </div>
              <div className="p-4 space-y-4">
                {movies.map((movie) => (
                  <div key={`${tagName}-${movie.id}`} className="flex items-start gap-4 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 cursor-pointer transition-colors" onClick={() => setSelectedMovieForEdit(movie)}>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-medium text-gray-900">{movie.title}</h4>
                        <span className="inline-block bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full">
                          {movie.content_type === 'film' ? '🎬' : movie.content_type === 'serie' ? '📺' : '📚'} {movie.content_type}
                        </span>
                        <span className="text-sm text-gray-400 hover:text-blue-600 transition-colors">✏️</span>
                      </div>
                      {movie.description && (
                        <p className="text-sm text-gray-600 line-clamp-2">{movie.description}</p>
                      )}
                      
                      {/* Show tags */}
                      {movie.tags.length > 0 && (
                        <TagListDisplay tags={movie.tags} />
                      )}
                    </div>
                    
                    {/* Rating info */}
                    <div className="text-right">
                      {movie.averageRating > 0 && (
                        <div className="text-sm text-gray-600">
                          <div className="flex items-center">
                            <span className="text-yellow-400 mr-1">★</span>
                            {movie.averageRating.toFixed(1)}
                          </div>
                          <div className="text-xs text-gray-500">
                            {movie.ratingCount} Bewertung{movie.ratingCount !== 1 ? 'en' : ''}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {filteredMovies.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-500 text-lg">Keine Filme gefunden.</p>
          <p className="text-gray-400 text-sm mt-2">
            Versuche eine andere Suche oder füge neue Filme hinzu.
          </p>
        </div>
      )}

      {/* Movie Detail Modal */}
      {selectedMovieForEdit !== null && (
        <MovieDetailModal
          movie={selectedMovieForEdit}
          isOpen={true}
          onClose={() => setSelectedMovieForEdit(null)}
          onMovieUpdated={async (updatedMovie?: any) => {
            console.log('🎬 Debug: onMovieUpdated called!')
            
            // Simple approach: just reload everything
            // The useEffect will automatically handle watchlist updates when movies.length changes
            await fetchMoviesWithDetails()
            
            setSelectedMovieForEdit(null)
          }}
          hideWatchlistFeature={true} // Neue Prop um Watchlist-Feature zu verstecken
        />
      )}
    </div>
  )
}