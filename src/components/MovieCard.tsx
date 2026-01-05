'use client'

import { useState, useEffect, useCallback } from 'react'
import { supabase, Movie } from '@/lib/supabase'

interface MovieCardProps {
  movie: Movie
}

export function MovieCard({ movie }: MovieCardProps) {
  const [rating, setRating] = useState<number>(0)
  const [averageRating, setAverageRating] = useState<number>(0)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const fetchRatings = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('ratings')
        .select('rating')
        .eq('movie_id', movie.id)

      if (error) throw error

      if (data && data.length > 0) {
        // Ensure r.rating is number
        const avg = data.reduce((sum: number, r: any) => sum + Number(r.rating), 0) / data.length
        setAverageRating(avg)
      }
    } catch (error) {
      console.error('Error fetching ratings:', error)
    }
  }, [movie.id])

  useEffect(() => {
    fetchRatings()
  }, [fetchRatings])

  const handleRating = async (newRating: number) => {
    setIsSubmitting(true)
    try {
      const { error } = await supabase
        .from('ratings')
        .insert([
          {
            movie_id: movie.id,
            rating: newRating,
          },
        ])

      if (error) throw error

      setRating(newRating)
      await fetchRatings() // Refresh average rating
    } catch (error) {
      console.error('Error adding rating:', error)
      alert('Fehler beim Bewerten')
    } finally {
      setIsSubmitting(false)
    }
  }

  const renderStars = (currentRating: number, interactive: boolean = false) => {
    return Array.from({ length: 5 }, (_, index) => {
      const starValue = index + 1
      return (
        <button
          key={index}
          onClick={interactive ? () => handleRating(starValue) : undefined}
          disabled={!interactive || isSubmitting}
          className={`text-2xl ${
            interactive ? 'hover:text-yellow-400 cursor-pointer' : 'cursor-default'
          } ${
            starValue <= currentRating ? 'text-yellow-400' : 'text-gray-300'
          }`}
        >
          ★
        </button>
      )
    })
  }

  return (
    <div className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
      {/* Content Type Icon */}
      {movie.content_type && (
        <div className="flex justify-start mb-2">
          <img 
            src={`/buttons/04_${movie.content_type}.png`} 
            alt={movie.content_type} 
            className="h-6 w-auto"
          />
        </div>
      )}
      
      {/* Poster Preview */}
      {movie.poster_url && (
        <div className="flex justify-center mb-3">
          <img
            src={movie.poster_url}
            alt={movie.title}
            className="max-h-48 rounded shadow"
            style={{ maxWidth: '120px', objectFit: 'contain', background: '#eee' }}
          />
        </div>
      )}
      <div className="flex justify-between items-start mb-2">
        <h3 className="text-lg font-semibold text-gray-900">{movie.title}</h3>
        {movie.year && (
          <span className="text-sm text-gray-500 bg-gray-100 px-2 py-1 rounded">
            {movie.year}
          </span>
        )}
      </div>


      {movie.description && (
        <p className="text-gray-600 mb-3">{movie.description}</p>
      )}

      {/* YouTube Trailer Button */}
      {movie.trailer_url && (
        <div className="mb-3">
          <a
            href={movie.trailer_url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block hover:opacity-80 transition-opacity"
            title="YouTube Trailer"
          >
            <img src="/buttons/04_trailer.png" alt="YouTube Trailer" className="h-8 w-auto" />
          </a>
        </div>
      )}

      <div className="space-y-2">
        {averageRating > 0 && (
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600">Durchschnitt:</span>
            <div className="flex">{renderStars(averageRating)}</div>
            <span className="text-sm text-gray-500">({averageRating.toFixed(1)})</span>
          </div>
        )}

        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-600">Bewerten:</span>
          <div className="flex">{renderStars(rating, true)}</div>
          {isSubmitting && <span className="text-sm text-gray-500">Wird gespeichert...</span>}
        </div>
      </div>
    </div>
  )
}
