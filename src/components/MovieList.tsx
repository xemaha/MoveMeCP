'use client'

import { useState, useEffect } from 'react'
import { supabase, Movie, Tag } from '@/lib/supabase'
import { MovieDetailModal } from '@/components/MovieDetailModal'
import { useUser } from '@/lib/UserContext'

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
}

interface UserRatingFilter {
  userName: string
  minRating: number
  maxRating: number
}

interface ContentTypeFilter {
  film: boolean
  buch: boolean
  serie: boolean
}

export function MovieList() {
  const [movies, setMovies] = useState<MovieWithDetails[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [userFilter, setUserFilter] = useState<UserRatingFilter>({
    userName: '',
    minRating: 1,
    maxRating: 5
  })
  const [availableUsers, setAvailableUsers] = useState<string[]>([])
  const [allTags, setAllTags] = useState<Tag[]>([])
  const [selectedTags, setSelectedTags] = useState<string[]>([])
  const [contentTypeFilter, setContentTypeFilter] = useState<ContentTypeFilter>({
    film: true,
    buch: true,
    serie: true
  })
  const [viewMode, setViewMode] = useState<'movie-based' | 'tag-based'>('movie-based')
  const [selectedMovieForEdit, setSelectedMovieForEdit] = useState<MovieWithDetails | null>(null)
  const { user } = useUser()

  useEffect(() => {
    fetchMoviesWithDetails()
    fetchAvailableUsers()
    fetchAllTags()
  }, [])

  // Get available tags based on current filters (content type, user ratings, search)
  const availableTagsForCurrentFilters = allTags.filter(tag => {
    // Get movies that match current filters (excluding tag filter)
    const filteredMovies = movies.filter(movie => {
      // Text search filter
      const matchesSearch = searchQuery === '' || 
        movie.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        movie.description?.toLowerCase().includes(searchQuery.toLowerCase())

      // Content type filter
      const matchesContentType = contentTypeFilter[movie.content_type as keyof ContentTypeFilter] || false

      // User rating filter
      let matchesUserFilter = true
      if (userFilter.userName) {
        const userRating = movie.ratings.find(r => r.user_name === userFilter.userName)
        if (!userRating) {
          matchesUserFilter = false
        } else {
          matchesUserFilter = userRating.rating >= userFilter.minRating && userRating.rating <= userFilter.maxRating
        }
      }

      return matchesSearch && matchesContentType && matchesUserFilter
    })

    // Check if this tag is used by any of the filtered movies
    return filteredMovies.some(movie => {
      return movie.tags.some(movieTag => movieTag.name === tag.name)
    })
  }).map(tag => {
    // Add count of how many movies have this tag
    const filteredMovies = movies.filter(movie => {
      // Apply all filters except tag filter
      const matchesSearch = searchQuery === '' || 
        movie.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        movie.description?.toLowerCase().includes(searchQuery.toLowerCase())
      const matchesContentType = contentTypeFilter[movie.content_type as keyof ContentTypeFilter] || false
      let matchesUserFilter = true
      if (userFilter.userName) {
        const userRating = movie.ratings.find(r => r.user_name === userFilter.userName)
        if (!userRating) {
          matchesUserFilter = false
        } else {
          matchesUserFilter = userRating.rating >= userFilter.minRating && userRating.rating <= userFilter.maxRating
        }
      }
      return matchesSearch && matchesContentType && matchesUserFilter
    })

    const count = filteredMovies.filter(movie => 
      movie.tags.some(movieTag => movieTag.name === tag.name)
    ).length

    return { ...tag, count }
  })

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
      
      // Add users from ratings
      if (ratings) {
        ratings.forEach(r => {
          if (r.user_name) allUsers.add(r.user_name as string)
        })
      }
      
      // Add users from movie creators
      if (movies) {
        movies.forEach(m => {
          if (m.created_by) allUsers.add(m.created_by as string)
        })
      }

      setAvailableUsers(Array.from(allUsers).filter(u => Boolean(u) && u !== 'System'))
    } catch (error) {
      console.error('Error fetching users:', error)
    }
  }

  const fetchMoviesWithDetails = async () => {
    try {
      setIsLoading(true)
      
      // Fetch movies
      const { data: moviesData, error: moviesError } = await supabase
        .from('movies')
        .select('*')
        .order('created_at', { ascending: false })

      if (moviesError) throw moviesError

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
    } catch (error) {
      console.error('Error fetching movies:', error)
      setError('Fehler beim Laden der Filme')
    } finally {
      setIsLoading(false)
    }
  }

  // Filter movies based on search and user rating filter
  const filteredMovies = movies.filter(movie => {
    // Text search
    const matchesSearch = movie.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         movie.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         movie.tags.some(tag => tag.name.toLowerCase().includes(searchQuery.toLowerCase()))

    // User rating filter
    let matchesUserFilter = true
    if (userFilter.userName) {
      const userRating = movie.ratings.find(r => r.user_name === userFilter.userName)
      if (!userRating) {
        matchesUserFilter = false
      } else {
        matchesUserFilter = userRating.rating >= userFilter.minRating && userRating.rating <= userFilter.maxRating
      }
    }

    // Tag filter
    let matchesTagFilter = true
    if (selectedTags.length > 0) {
      matchesTagFilter = selectedTags.some(selectedTag => 
        movie.tags.some(movieTag => movieTag.name === selectedTag)
      )
    }

    // Content type filter
    const matchesContentTypeFilter = contentTypeFilter[movie.content_type as keyof ContentTypeFilter] || false

    return matchesSearch && matchesUserFilter && matchesTagFilter && matchesContentTypeFilter
  })

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
        <button
          onClick={fetchMoviesWithDetails}
          disabled={isLoading}
          className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {isLoading ? '� Speichert...' : '� Speichern'}
        </button>
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
            <button
              onClick={resetContentTypeFilter}
              className="text-xs text-green-600 hover:text-green-800 underline"
            >
              Alle anzeigen
            </button>
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
                checked={contentTypeFilter.buch}
                onChange={() => handleContentTypeToggle('buch')}
                className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
              />
              <span className="text-sm font-medium text-gray-700">
                📚 Bücher
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
          </div>
          <div className="mt-2 text-xs text-gray-500">
            Aktiviert: {Object.entries(contentTypeFilter).filter(([_, active]) => active).map(([type, _]) => {
              const icons = { film: '🎬', buch: '📚', serie: '📺' }
              return `${icons[type as keyof typeof icons]} ${type}`
            }).join(', ')}
          </div>
        </div>

        {/* User Rating Filter */}
        <div className="bg-gray-50 p-4 rounded-lg">
          <h3 className="text-sm font-medium text-gray-700 mb-3">Filter nach User-Bewertungen</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">Min. Bewertung</label>
              <select
                value={userFilter.minRating}
                onChange={(e) => setUserFilter({...userFilter, minRating: parseInt(e.target.value)})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {[1, 2, 3, 4, 5].map(rating => (
                  <option key={rating} value={rating}>{rating} ⭐</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">Max. Bewertung</label>
              <select
                value={userFilter.maxRating}
                onChange={(e) => setUserFilter({...userFilter, maxRating: parseInt(e.target.value)})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {[1, 2, 3, 4, 5].map(rating => (
                  <option key={rating} value={rating}>{rating} ⭐</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Tag Filter */}
        <div className="bg-blue-50 p-4 rounded-lg">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-medium text-gray-700">Filter nach Tags</h3>
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
            {availableTagsForCurrentFilters.map((tag) => (
              <button
                key={tag.id}
                onClick={() => handleTagClick(tag.name)}
                className={`inline-block px-3 py-1 rounded-full text-sm font-medium transition-all ${
                  selectedTags.includes(tag.name)
                    ? 'text-white shadow-lg ring-2 ring-white'
                    : 'text-white hover:shadow-md opacity-80 hover:opacity-100'
                }`}
                style={{ backgroundColor: tag.color }}
              >
                {tag.name}
                <span className="ml-1 text-xs opacity-75">({tag.count})</span>
                {selectedTags.includes(tag.name) && (
                  <span className="ml-1 text-xs">✓</span>
                )}
              </button>
            ))}
          </div>
          {availableTagsForCurrentFilters.length === 0 && (
            <p className="text-sm text-gray-500 italic">
              Keine Tags für die ausgewählten Filter verfügbar
            </p>
          )}
          {selectedTags.length > 0 && (
            <div className="mt-3 pt-3 border-t border-blue-200">
              <p className="text-sm text-gray-600">
                Aktive Filter: {selectedTags.join(', ')}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Results Info */}
      <div className="text-sm text-gray-600">
        {filteredMovies.length} {filteredMovies.length === 1 ? 'Eintrag' : 'Einträge'} gefunden
      </div>

      {/* Conditional View Based on Mode */}
      {viewMode === 'movie-based' ? (
        /* Movie-Based View */
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6">
        {filteredMovies.map((movie) => (
          <div key={movie.id} className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow cursor-pointer group sm:p-0 p-0">
            <div className="p-4 sm:p-6" onClick={() => setSelectedMovieForEdit(movie)}>
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

              {/* Tags */}
              {movie.tags.length > 0 && (
                <div className="flex flex-wrap gap-1 mb-2 sm:mb-3">
                  {movie.tags.map((tag) => (
                    <span
                      key={tag.id}
                      className="inline-block px-2 py-1 rounded-full text-xs font-medium text-white"
                      style={{ backgroundColor: tag.color }}
                    >
                      {tag.name}
                    </span>
                  ))}
                </div>
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
                <div className="mb-2 p-2 sm:p-3 bg-blue-50 rounded-lg" onClick={(e) => e.stopPropagation()}>
                  <h4 className="text-sm font-medium text-gray-700 mb-2">
                    Deine Bewertung ({user.name}):
                  </h4>
                  <div className="flex items-center space-x-1 text-lg sm:text-xl">
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
                  </div>
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
                      
                      {/* Show other tags */}
                      {movie.tags.length > 1 && (
                        <div className="flex flex-wrap gap-1 mt-2">
                          {movie.tags.filter(t => t.name !== tagName).map((otherTag) => (
                            <span
                              key={otherTag.id}
                              className="inline-block px-2 py-1 rounded-full text-xs font-medium text-white"
                              style={{ backgroundColor: otherTag.color }}
                            >
                              {otherTag.name}
                            </span>
                          ))}
                        </div>
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
      {selectedMovieForEdit && (
        <MovieDetailModal
          movie={selectedMovieForEdit}
          isOpen={!!selectedMovieForEdit}
          onClose={() => setSelectedMovieForEdit(null)}
          onMovieUpdated={() => {
            fetchMoviesWithDetails()
            setSelectedMovieForEdit(null)
          }}
        />
      )}
    </div>
  )
}