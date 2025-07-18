'use client'

import { useState, useEffect } from 'react'
import { supabase, Movie, Rating, Tag } from '@/lib/supabase'

interface MovieWithDetails extends Movie {
  tags: Tag[]
  averageRating: number
  ratingCount: number
}

export function MovieGrid() {
  const [movies, setMovies] = useState<MovieWithDetails[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')

  useEffect(() => {
    fetchMoviesWithDetails()
  }, [])

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
          // Get ratings
          const { data: ratings } = await supabase
            .from('ratings')
            .select('rating')
            .eq('movie_id', movie.id)

          // Get tags
          const { data: movieTags } = await supabase
            .from('movie_tags')
            .select(`
              tags (
                id,
                name,
                color
              )
            `)
            .eq('movie_id', movie.id)

          const tags = movieTags?.map(mt => mt.tags).filter(Boolean) || []
          const averageRating = ratings && ratings.length > 0 
            ? ratings.reduce((sum, r) => sum + r.rating, 0) / ratings.length 
            : 0
          const ratingCount = ratings?.length || 0

          return {
            ...movie,
            tags,
            averageRating,
            ratingCount
          }
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

  const handleAddRating = async (movieId: string, rating: number) => {
    try {
      const { error } = await supabase
        .from('ratings')
        .insert([{ movie_id: movieId, rating }])

      if (error) throw error

      // Refresh movies to show updated ratings
      await fetchMoviesWithDetails()
    } catch (error) {
      console.error('Error adding rating:', error)
      alert('Fehler beim Bewerten')
    }
  }

  const filteredMovies = movies.filter(movie => {
    if (!searchQuery) return true
    
    const query = searchQuery.toLowerCase()
    
    // Search in title
    if (movie.title.toLowerCase().includes(query)) return true
    
    // Search in tags
    if (movie.tags.some(tag => tag.name.toLowerCase().includes(query))) return true
    
    // Search in description
    if (movie.description?.toLowerCase().includes(query)) return true
    
    return false
  })

  const renderStars = (rating: number, interactive: boolean = false, onRate?: (rating: number) => void) => {
    return Array.from({ length: 5 }, (_, index) => {
      const starValue = index + 1
      return (
        <button
          key={index}
          onClick={interactive && onRate ? () => onRate(starValue) : undefined}
          disabled={!interactive}
          className={`text-lg ${
            interactive ? 'hover:text-yellow-400 cursor-pointer' : 'cursor-default'
          } ${
            starValue <= rating ? 'text-yellow-400' : 'text-gray-300'
          }`}
        >
          ★
        </button>
      )
    })
  }

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2 text-gray-600">Filme werden geladen...</span>
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <p className="text-red-600">{error}</p>
        <button
          onClick={fetchMoviesWithDetails}
          className="mt-2 text-blue-600 hover:text-blue-800"
        >
          Erneut versuchen
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Search Bar */}
      <div className="mb-6">
        <div className="flex gap-2">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Suche nach Filmen oder Tags..."
            className="flex-1 px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
          <button
            onClick={() => setSearchQuery('')}
            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200"
          >
            Zurücksetzen
          </button>
        </div>
        
        {/* Popular Tags */}
        <div className="mt-3 space-y-2">
          <span className="text-sm text-gray-600">Beliebte Tags:</span>
          <div className="flex flex-wrap gap-2">
            {['mindblow', 'sci-fi', 'action', 'comedy', 'drama', 'horror', 'thriller'].map((tag) => (
              <button
                key={tag}
                onClick={() => setSearchQuery(tag)}
                className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm hover:bg-gray-200 hover:text-gray-900 transition-colors"
              >
                #{tag}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Results Info */}
      {searchQuery && (
        <div className="text-sm text-gray-600 mb-4">
          {filteredMovies.length} {filteredMovies.length === 1 ? 'Film' : 'Filme'} gefunden für "{searchQuery}"
        </div>
      )}

      {/* Movies Grid */}
      {filteredMovies.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-gray-500">
            {searchQuery ? 'Keine Filme gefunden.' : 'Noch keine Filme hinzugefügt.'}
          </p>
          <p className="text-gray-400 text-sm mt-1">
            {searchQuery ? 'Versuche einen anderen Suchbegriff.' : 'Füge deinen ersten Film hinzu!'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredMovies.map((movie) => (
            <div key={movie.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
              <div className="flex justify-between items-start mb-2">
                <h3 className="text-lg font-semibold text-gray-900 line-clamp-2">{movie.title}</h3>
                {movie.year && (
                  <span className="text-sm text-gray-500 bg-gray-100 px-2 py-1 rounded ml-2 flex-shrink-0">
                    {movie.year}
                  </span>
                )}
              </div>
              
              {movie.description && (
                <p className="text-gray-600 text-sm mb-3 line-clamp-3">{movie.description}</p>
              )}
              
              {/* Tags */}
              {movie.tags.length > 0 && (
                <div className="flex flex-wrap gap-1 mb-3">
                  {movie.tags.map((tag) => (
                    <span
                      key={tag.id}
                      className="px-2 py-1 text-xs rounded-full text-white"
                      style={{ backgroundColor: tag.color }}
                    >
                      #{tag.name}
                    </span>
                  ))}
                </div>
              )}
              
              {/* Rating */}
              <div className="space-y-2">
                {movie.averageRating > 0 && (
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-600">⌀ Bewertung:</span>
                    <div className="flex">{renderStars(movie.averageRating)}</div>
                    <span className="text-sm text-gray-500">
                      ({movie.averageRating.toFixed(1)}, {movie.ratingCount} {movie.ratingCount === 1 ? 'Bewertung' : 'Bewertungen'})
                    </span>
                  </div>
                )}
                
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-600">Bewerten:</span>
                  <div className="flex">
                    {renderStars(0, true, (rating) => handleAddRating(movie.id, rating))}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
