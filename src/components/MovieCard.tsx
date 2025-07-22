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
            className="inline-flex items-center px-3 py-1 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors text-xs font-medium gap-2"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 24 24" className="w-4 h-4"><path d="M23.498 6.186a2.994 2.994 0 0 0-2.107-2.117C19.228 3.5 12 3.5 12 3.5s-7.228 0-9.391.569A2.994 2.994 0 0 0 .502 6.186C0 8.36 0 12 0 12s0 3.64.502 5.814a2.994 2.994 0 0 0 2.107 2.117C4.772 20.5 12 20.5 12 20.5s7.228 0 9.391-.569a2.994 2.994 0 0 0 2.107-2.117C24 15.64 24 12 24 12s0-3.64-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/></svg>
            YouTube Trailer
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
