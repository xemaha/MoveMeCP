'use client'

import Link from 'next/link'
import { useState, useEffect } from 'react'
import AddMovieForm from '@/components/AddMovieForm'
import AuthForm from '@/components/AuthForm'
import { UserHeader } from '@/components/UserHeader'
import { ContentTypeFilter } from '@/components/ContentTypeFilter'
import { UserProvider, useUser } from '@/lib/UserContext'
import { MovieDetailModal } from '@/components/MovieDetailModal'
import { supabase } from '@/lib/supabase'
import type { Movie, Tag } from '@/lib/supabase'

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
}

function AddContent() {
  const { user, isLoading } = useUser()
  const [contentTypes, setContentTypes] = useState({
    film: true,
    serie: false,
    buch: false
  })
  const [selectedMovie, setSelectedMovie] = useState<EnhancedMovie | null>(null)
  const [isLoadingMovie, setIsLoadingMovie] = useState(false)

  const handleMovieAdded = async (movieId: string) => {
    console.log('🎬 handleMovieAdded called with movieId:', movieId)
    // Load the full movie details to show in modal
    setIsLoadingMovie(true)
    try {
      console.log('Loading movie details from Supabase...')
      const { data: movieData, error: movieError } = await supabase
        .from('movies')
        .select('*')
        .eq('id', movieId)
        .single()

      if (movieError) throw movieError
      console.log('Movie data loaded:', movieData)

      // Load tags
      const { data: tagsData } = await supabase
        .from('movie_tags')
        .select('tag_id, tags(id, name, color)')
        .eq('movie_id', movieId)

      const tags = tagsData?.map((mt: any) => mt.tags).filter(Boolean) || []
      console.log('Tags loaded:', tags)

      // Load ratings
      const { data: ratingsData } = await supabase
        .from('ratings')
        .select('rating, user_name, user_id')
        .eq('movie_id', movieId)

      const ratings = ratingsData || []
      const averageRating = ratings.length > 0
        ? ratings.reduce((sum: number, r: any) => sum + r.rating, 0) / ratings.length
        : 0

      const enhancedMovie: EnhancedMovie = {
        ...movieData,
        tags,
        ratings,
        averageRating,
        ratingCount: ratings.length
      }

      console.log('Opening modal with movie:', enhancedMovie)
      setSelectedMovie(enhancedMovie)
    } catch (error) {
      console.error('Error loading movie details:', error)
      alert('Fehler beim Laden der Film-Details')
    } finally {
      setIsLoadingMovie(false)
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Lade App...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return <AuthForm />
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <UserHeader />
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        <ContentTypeFilter selected={contentTypes} onChange={setContentTypes} exclusive={true} />

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <AddMovieForm 
            selectedContentType={contentTypes} 
            onMovieAdded={handleMovieAdded}
          />
        </div>
      </main>

      {/* Movie Detail Modal */}
      {selectedMovie && (
        <MovieDetailModal
          movie={selectedMovie}
          isOpen={!!selectedMovie}
          onClose={() => setSelectedMovie(null)}
          onMovieUpdated={() => {}}
          hideWatchlistFeature={false}
        />
      )}
    </div>
  )
}

export default function AddPage() {
  return (
    <UserProvider>
      <AddContent />
    </UserProvider>
  )
}
