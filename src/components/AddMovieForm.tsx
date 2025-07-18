'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useUser } from '@/lib/UserContext'

interface MovieSuggestion {
  id: string
  title: string
  content_type: string
  creator_name?: string
}

export function AddMovieForm() {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [contentType, setContentType] = useState('film')
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
        const { data: movies, error } = await supabase
          .from('movies')
          .select('id, title, content_type, created_by')
          .ilike('title', `%${title.trim()}%`)
          .limit(5)

        if (error) {
          console.error('Supabase error:', error)
          setSuggestions([])
          setShowSuggestions(false)
          return
        }

        if (movies && movies.length > 0) {
          console.log('Found movies:', movies)
          setSuggestions(movies.map(movie => ({
            id: movie.id as string,
            title: movie.title as string,
            content_type: movie.content_type as string,
            creator_name: movie.created_by as string || 'Unbekannt'
          })))
          setShowSuggestions(true)
        } else {
          console.log('No movies found for:', title)
          setSuggestions([])
          setShowSuggestions(false)
        }
      } catch (error) {
        console.error('Error fetching suggestions:', error)
        setSuggestions([])
        setShowSuggestions(false)
      }
    }

    const timer = setTimeout(fetchSuggestions, 300)
    return () => clearTimeout(timer)
  }, [title])

  const handleSuggestionClick = (suggestion: MovieSuggestion) => {
    setSelectedMovie(suggestion)
    setTitle(suggestion.title)
    setContentType(suggestion.content_type)
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
        console.log('Eintrag existiert bereits, füge Tags/Bewertung hinzu')
      } else {
        // Check if movie already exists (case-insensitive)
        const { data: existingMovies } = await supabase
          .from('movies')
          .select('*')
          .ilike('title', title.trim())

        if (existingMovies && existingMovies.length > 0) {
          movieId = existingMovies[0].id as string
          console.log('Eintrag existiert bereits, füge Tags/Bewertung hinzu')
        } else {
          // Create new movie
          const { data: newMovie, error: movieError } = await supabase
            .from('movies')
            .insert([
              {
                title: title.trim(),
                description: description.trim() || null,
                content_type: contentType,
                created_by: user?.name || 'Unbekannt',
              },
            ])
            .select()
            .single()

          if (movieError) {
            console.error('Movie creation error:', movieError)
            throw new Error(`Fehler beim Erstellen des Eintrags: ${movieError.message || movieError.details || 'Unbekannter Datenbankfehler'}`)
          }
          
          movieId = newMovie.id as string
          console.log('Neuer Eintrag erstellt')
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

        if (ratingError) {
          console.error('Rating creation error:', ratingError)
          throw new Error(`Fehler beim Hinzufügen der Bewertung: ${ratingError.message || ratingError.details || 'Unbekannter Datenbankfehler'}`)
        }
      }

      // Add tags if provided
      if (tags.trim()) {
        const tagNames = tags.split(',').map(tag => tag.trim().toLowerCase()).filter(Boolean)
        
        for (const tagName of tagNames) {
          try {
            // Check if tag exists
            let { data: existingTag, error: tagSearchError } = await supabase
              .from('tags')
              .select('*')
              .eq('name', tagName)
              .single()

            let tagId: string

            if (existingTag) {
              tagId = existingTag.id as string
              console.log(`Tag "${tagName}" existiert bereits`)
            } else {
              // Create new tag
              const colors = ['#EF4444', '#F59E0B', '#8B5CF6', '#EC4899', '#06B6D4', '#10B981', '#7C3AED']
              const randomColor = colors[Math.floor(Math.random() * colors.length)]
              
              const { data: newTag, error: tagError } = await supabase
                .from('tags')
                .insert([{ name: tagName, color: randomColor }])
                .select()
                .single()

              if (tagError) {
                console.error(`Fehler beim Erstellen des Tags "${tagName}":`, tagError)
                throw new Error(`Fehler beim Erstellen des Tags "${tagName}": ${tagError.message || tagError.details || 'Unbekannter Fehler'}`)
              }
              
              tagId = newTag.id as string
              console.log(`Neuer Tag "${tagName}" erstellt`)
            }

            // Link movie to tag
            const { error: linkError } = await supabase
              .from('movie_tags')
              .insert([
                {
                  movie_id: movieId,
                  tag_id: tagId,
                },
              ])

            if (linkError) {
              console.error(`Fehler beim Verknüpfen des Tags "${tagName}":`, linkError)
              throw new Error(`Fehler beim Verknüpfen des Tags "${tagName}": ${linkError.message || linkError.details || 'Unbekannter Fehler'}`)
            }
            
            console.log(`Tag "${tagName}" erfolgreich verknüpft`)
          } catch (tagProcessError) {
            console.error(`Fehler beim Verarbeiten des Tags "${tagName}":`, tagProcessError)
            // Continue with other tags even if one fails
          }
        }
      }

      // Reset form
      setTitle('')
      setDescription('')
      setContentType('film')
      setRating(0)
      setTags('')
      setSelectedMovie(null)
      setSuggestions([])
      setShowSuggestions(false)
      
      // Refresh the page to show updated data
      window.location.reload()
    } catch (error) {
      console.error('Error adding movie:', error)
      
      let errorMessage = 'Unbekannter Fehler'
      
      if (error instanceof Error) {
        errorMessage = error.message
      } else if (typeof error === 'object' && error !== null) {
        // Handle Supabase errors
        if ('message' in error) {
          errorMessage = String(error.message)
        } else if ('details' in error) {
          errorMessage = String(error.details)
        } else {
          errorMessage = JSON.stringify(error)
        }
      } else {
        errorMessage = String(error)
      }
      
      alert(`Fehler beim Hinzufügen: ${errorMessage}`)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Title with Autocomplete */}
      <div className="relative">
        <label htmlFor="title" className="block text-sm font-medium text-gray-700">
          Titel *
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
                  <span className="inline-block bg-gray-200 rounded-full px-2 py-1 text-xs font-semibold text-gray-700 mr-2">
                    {suggestion.content_type}
                  </span>
                  {suggestion.creator_name && `von ${suggestion.creator_name}`}
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

      {/* Content Type */}
      <div>
        <label htmlFor="contentType" className="block text-sm font-medium text-gray-700">
          Typ *
        </label>
        <select
          id="contentType"
          value={contentType}
          onChange={(e) => setContentType(e.target.value)}
          className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          required
        >
          <option value="film">🎬 Film</option>
          <option value="buch">📚 Buch</option>
          <option value="serie">📺 Serie</option>
        </select>
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
        {isLoading ? 'Wird hinzugefügt...' : 'Hinzufügen'}
      </button>
    </form>
  )
}
