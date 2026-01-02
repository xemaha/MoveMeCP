'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { MovieDetailModal } from '@/components/MovieDetailModal'

interface Movie {
  id: string
  title: string
  description?: string
  year?: number
  poster_url?: string
  content_type: string
  trailer_url?: string
  created_at?: string
}

export default function MoviePage() {
  const params = useParams()
  const router = useRouter()
  const [movie, setMovie] = useState<Movie | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadMovie()
  }, [params.id])

  const loadMovie = async () => {
    try {
      setIsLoading(true)
      setError(null)

      const rawId = params?.id
      const movieId = Array.isArray(rawId) ? rawId[0] : rawId
      if (!movieId) {
        setError('Film-ID fehlt')
        setIsLoading(false)
        return
      }

      const { data, error: fetchError } = await supabase
        .from('movies')
        .select('*')
        .eq('id', movieId)
        .single()

      if (fetchError) {
        console.error('Error loading movie:', fetchError)
        setError('Film nicht gefunden')
        return
      }

      setMovie(data)
    } catch (err) {
      console.error('Error:', err)
      setError('Fehler beim Laden des Films')
    } finally {
      setIsLoading(false)
    }
  }

  const handleClose = () => {
    router.push('/')
  }

  const handleMovieUpdated = (updatedMovie: any) => {
    setMovie(updatedMovie)
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-pink-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin text-6xl mb-4">🎬</div>
          <p className="text-gray-600">Lade Film...</p>
        </div>
      </div>
    )
  }

  if (error || !movie) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-pink-50 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-6">
          <div className="text-6xl mb-4">😕</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Film nicht gefunden</h1>
          <p className="text-gray-600 mb-6">{error || 'Dieser Film existiert nicht.'}</p>
          <button
            onClick={() => router.push('/')}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Zur Startseite
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-pink-50">
      <MovieDetailModal
        movie={movie}
        isOpen={true}
        onClose={handleClose}
        onMovieUpdated={handleMovieUpdated}
      />
    </div>
  )
}
