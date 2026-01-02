'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useUser } from '@/lib/UserContext'

interface MovieSuggestion {
  id: string
  title: string
  year?: number
  creator_name?: string
}

export function AddMovieForm() {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [year, setYear] = useState('')
  const [rating, setRating] = useState<number>(0)
  const [tags, setTags] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [suggestions, setSuggestions] = useState<MovieSuggestion[]>([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [selectedMovie, setSelectedMovie] = useState<MovieSuggestion | null>(null)
  const { user } = useUser()

  // Autocomplete für Filme
  useEffect(() => {
    const fetchSuggestions = async () => {
      if (title.trim().length < 2) {
        setSuggestions([])
        setShowSuggestions(false)
        return
      }

      try {
        const { data: movies } = await supabase
          .from('movies')
          .select('id, title, year, created_by')
          .ilike('title', `%${title.trim()}%`)
          .limit(5)

        if (movies && movies.length > 0) {
          setSuggestions(movies.map(movie => ({
            id: movie.id,
            title: movie.title,
            year: movie.year,
            creator_name: movie.created_by
          })))
          setShowSuggestions(true)
        } else {
          setSuggestions([])
          setShowSuggestions(false)
        }
      } catch (error) {
        console.error('Error fetching suggestions:', error)
      }
    }

    const timer = setTimeout(fetchSuggestions, 300)
    return () => clearTimeout(timer)
  }, [title])

  const handleSuggestionClick = (suggestion: MovieSuggestion) => {
    setSelectedMovie(suggestion)
    setTitle(suggestion.title)
    setYear(suggestion.year?.toString() || '')
    setShowSuggestions(false)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      let movieId: string

      if (selectedMovie) {
        // Use existing movie
        movieId = selectedMovie.id
        console.log('Film existiert bereits, füge Tags/Bewertung hinzu')
      } else {
        // Check if movie already exists (case-insensitive)
        const { data: existingMovies } = await supabase
          .from('movies')
          .select('*')
          .ilike('title', title.trim())

        if (existingMovies && existingMovies.length > 0) {
          movieId = existingMovies[0].id as string
          console.log('Film existiert bereits, füge Tags/Bewertung hinzu')
        } else {
          // Create new movie
          const { data: newMovie, error: movieError } = await supabase
            .from('movies')
            .insert([
              {
                title: title.trim(),
                description: description.trim() || null,
                year: year ? parseInt(year) : null,
                created_by: user?.name || 'Unbekannt',
              },
            ])
            .select()
            .single()

          if (movieError) throw movieError
          movieId = newMovie.id
          console.log('Neuer Film erstellt')
        }
      }

      // Add rating if provided
      if (rating > 0) {
        const { error: ratingError } = await supabase
          .from('ratings')
          .insert([
            {
              movie_id: movieId,
              rating: rating,
              user_id: user?.id,
              user_name: user?.name,
            },
          ])

        if (ratingError) throw ratingError
      }

      // Add tags if provided
      if (tags.trim()) {
        const tagNames = tags.split(',').map(tag => tag.trim().toLowerCase()).filter(Boolean)
        
        for (const tagName of tagNames) {
          // Check if tag exists
          let { data: existingTag } = await supabase
            .from('tags')
            .select('*')
            .eq('name', tagName)
            .single()

          let tagId: string

          if (existingTag) {
            tagId = existingTag.id
          } else {
            // Create new tag
            const colors = ['#EF4444', '#F59E0B', '#8B5CF6', '#EC4899', '#06B6D4', '#10B981', '#7C3AED']
            const randomColor = colors[Math.floor(Math.random() * colors.length)]
            
            const { data: newTag, error: tagError } = await supabase
              .from('tags')
              .insert([{ name: tagName, color: randomColor }])
              .select()
              .single()

            if (tagError) throw tagError
            tagId = newTag.id
          }

          // Link movie to tag
          await supabase
            .from('movie_tags')
            .insert([
              {
                movie_id: movieId,
                tag_id: tagId,
              },
            ])
        }
      }

      // Reset form
      setTitle('')
      setDescription('')
      setYear('')
      setRating(0)
      setTags('')
      setSelectedMovie(null)
      setSuggestions([])
      setShowSuggestions(false)
      
      // Refresh the page to show updated data
      window.location.reload()
    } catch (error) {
      console.error('Error adding movie:', error)
      alert('Fehler beim Hinzufügen des Films')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Title with Autocomplete */}
      <div className="relative">
        <label htmlFor="title" className="block text-sm font-medium text-gray-700">
          Filmtitel *
        </label>
        <input
          type="text"
          id="title"
          value={title}
          onChange={(e) => {
            setTitle(e.target.value)
            setSelectedMovie(null)
          }}
          onBlur={() => {
            // Hide suggestions after a short delay
            setTimeout(() => setShowSuggestions(false), 200)
          }}
          onFocus={() => {
            if (suggestions.length > 0) setShowSuggestions(true)
          }}
          className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          placeholder="z.B. Mulholland Drive"
          required
        />
        
        {/* Autocomplete Dropdown */}
        {showSuggestions && suggestions.length > 0 && (
          <div className="absolute z-10 mt-1 w-full bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-y-auto">
            {suggestions.map((suggestion) => (
              <div
                key={suggestion.id}
                onClick={() => handleSuggestionClick(suggestion)}
                className="px-3 py-2 hover:bg-gray-100 cursor-pointer border-b border-gray-100 last:border-b-0"
              >
                <div className="font-medium text-gray-900">{suggestion.title}</div>
                <div className="text-sm text-gray-500">
                  {suggestion.year && `${suggestion.year} • `}
                  {/* creator name intentionally hidden for cleaner UI */}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div>
        <label htmlFor="description" className="block text-sm font-medium text-gray-700">
          Beschreibung
        </label>
        <textarea
          id="description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={3}
          className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          placeholder="Kurze Beschreibung des Films..."
        />
      </div>

      <div>
        <label htmlFor="year" className="block text-sm font-medium text-gray-700">
          Erscheinungsjahr
        </label>
        <input
          type="number"
          id="year"
          value={year}
          onChange={(e) => setYear(e.target.value)}
          min="1900"
          max="2030"
          className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          placeholder="z.B. 2023"
        />
      </div>

      {/* Rating */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Bewertung
        </label>
        <div className="flex space-x-1">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              type="button"
              onClick={() => setRating(star)}
              className={`w-8 h-8 ${
                star <= rating ? 'text-yellow-400' : 'text-gray-300'
              } hover:text-yellow-400 transition-colors`}
            >
              ★
            </button>
          ))}
        </div>
      </div>

      <div>
        <label htmlFor="tags" className="block text-sm font-medium text-gray-700">
          Tags (durch Komma getrennt)
        </label>
        <input
          type="text"
          id="tags"
          value={tags}
          onChange={(e) => setTags(e.target.value)}
          className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          placeholder="z.B. thriller, mindblow, klassiker"
        />
      </div>

      <button
        type="submit"
        disabled={isLoading}
        className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isLoading ? 'Wird hinzugefügt...' : 'Film hinzufügen'}
      </button>
    </form>
  )
}
