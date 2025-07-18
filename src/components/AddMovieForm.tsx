'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'

export function AddMovieForm() {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [year, setYear] = useState('')
  const [rating, setRating] = useState<number>(0)
  const [tags, setTags] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      // Check if movie already exists
      const { data: existingMovies } = await supabase
        .from('movies')
        .select('*')
        .ilike('title', title.trim())

      let movieId: string

      if (existingMovies && existingMovies.length > 0) {
        // Movie exists, use existing ID
        movieId = existingMovies[0].id
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
            },
          ])
          .select()
          .single()

        if (movieError) throw movieError
        movieId = newMovie.id
        console.log('Neuer Film erstellt')
      }

      // Add rating if provided
      if (rating > 0) {
        const { error: ratingError } = await supabase
          .from('ratings')
          .insert([
            {
              movie_id: movieId,
              rating: rating,
            },
          ])

        if (ratingError) throw ratingError
      }

      // Add tags if provided
      if (tags.trim()) {
        const tagList = tags.split(',').map(tag => tag.trim().toLowerCase()).filter(tag => tag)
        
        for (const tagName of tagList) {
          // Create tag if it doesn't exist
          const { data: existingTag } = await supabase
            .from('tags')
            .select('*')
            .eq('name', tagName)
            .single()

          let tagId: string

          if (existingTag) {
            tagId = existingTag.id
          } else {
            const { data: newTag, error: tagError } = await supabase
              .from('tags')
              .insert([{ name: tagName }])
              .select()
              .single()

            if (tagError) throw tagError
            tagId = newTag.id
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

          if (linkError && !linkError.message.includes('duplicate key')) {
            throw linkError
          }
        }
      }

      // Reset form
      setTitle('')
      setDescription('')
      setYear('')
      setRating(0)
      setTags('')
      
      // Refresh page to show changes
      window.location.reload()
    } catch (error) {
      console.error('Error adding movie:', error)
      alert('Fehler beim Hinzufügen des Films')
    } finally {
      setIsLoading(false)
    }
  }

  const renderStars = () => {
    return Array.from({ length: 5 }, (_, index) => {
      const starValue = index + 1
      return (
        <button
          key={index}
          type="button"
          onClick={() => setRating(starValue)}
          className={`text-2xl hover:text-yellow-400 cursor-pointer transition-colors ${
            starValue <= rating ? 'text-yellow-400' : 'text-gray-300'
          }`}
        >
          ★
        </button>
      )
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
          Film-Titel *
        </label>
        <input
          type="text"
          id="title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          placeholder="z.B. Inception"
        />
      </div>

      <div>
        <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
          Beschreibung
        </label>
        <textarea
          id="description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={3}
          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          placeholder="Kurze Beschreibung..."
        />
      </div>

      <div>
        <label htmlFor="year" className="block text-sm font-medium text-gray-700 mb-1">
          Jahr
        </label>
        <input
          type="number"
          id="year"
          value={year}
          onChange={(e) => setYear(e.target.value)}
          min="1900"
          max="2030"
          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          placeholder="z.B. 2010"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Deine Bewertung
        </label>
        <div className="flex gap-1">
          {renderStars()}
        </div>
        {rating > 0 && (
          <p className="text-sm text-gray-500 mt-1">{rating} von 5 Sternen</p>
        )}
      </div>

      <div>
        <label htmlFor="tags" className="block text-sm font-medium text-gray-700 mb-1">
          Tags (kommagetrennt)
        </label>
        <input
          type="text"
          id="tags"
          value={tags}
          onChange={(e) => setTags(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          placeholder="z.B. mindblow, sci-fi, komplexe-handlung"
        />
        <p className="text-xs text-gray-500 mt-1">
          Mehrere Tags mit Komma trennen
        </p>
      </div>

      <button
        type="submit"
        disabled={isLoading || !title.trim()}
        className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:bg-gray-400 disabled:cursor-not-allowed"
      >
        {isLoading ? 'Wird hinzugefügt...' : 'Film hinzufügen'}
      </button>
    </form>
  )
}
