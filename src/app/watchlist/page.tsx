'use client'

import { useState, useEffect, useRef } from 'react'
import AuthForm from '@/components/AuthForm'
import { UserHeader } from '@/components/UserHeader'
import { UserProvider, useUser } from '@/lib/UserContext'
import { MovieList } from '@/components/MovieList'
import { ContentTypeFilter } from '@/components/ContentTypeFilter'
import { ProviderFilter } from '@/components/ProviderFilter'
import { calculatePredictedRatings } from '@/lib/recommendations'
import { supabase } from '@/lib/supabase'

interface Provider {
  provider_id: number
  provider_name: string
  logo_path: string
}

function WatchlistContent() {
  const { user, isLoading } = useUser()
  const [showPredictions, setShowPredictions] = useState(false)
  const [contentTypes, setContentTypes] = useState({
    film: true,
    serie: true,
    buch: false
  })
  const hasCalcPredictions = useRef(false)
  const [providerFilter, setProviderFilter] = useState({
    categories: {
      flatrate: true,
      rent: true,
      buy: true,
      unavailable: true
    },
    providers: new Set<number>() // Empty = all selected
  })
  const [availableProviders, setAvailableProviders] = useState<Provider[]>([])
  const [isLoadingProviders, setIsLoadingProviders] = useState(false)

  useEffect(() => {
    // Auto-calculate predictions when watchlist loads
    if (!hasCalcPredictions.current && user) {
      setShowPredictions(true)
      hasCalcPredictions.current = true
    }
  }, [user])

  // Load watch providers for watchlist movies
  useEffect(() => {
    const loadWatchlistProviders = async () => {
      if (!user) return
      
      setIsLoadingProviders(true)
      try {
        // Get watchlist movies
        const { data: watchlistData } = await supabase
          .from('watchlist')
          .select('movie_id')
          .eq('user_id', user.id)
        
        if (!watchlistData || watchlistData.length === 0) {
          setIsLoadingProviders(false)
          return
        }

        const movieIds = watchlistData.map(w => w.movie_id)
        
        // Get movie details in batches to avoid URL length limits
        const batchSize = 10
        const allMovies: any[] = []
        
        for (let i = 0; i < movieIds.length; i += batchSize) {
          const batch = movieIds.slice(i, i + batchSize)
          const { data: batchMovies } = await supabase
            .from('movies')
            .select('id, title, tmdb_id, media_type')
            .in('id', batch)
          
          if (batchMovies) {
            allMovies.push(...batchMovies)
          }
        }
        
        if (allMovies.length === 0) {
          setIsLoadingProviders(false)
          return
        }

        // Load providers from TMDB
        const { getWatchProviders, searchTMDb } = await import('@/lib/tmdbApi')
        const providersMap = new Map<number, Provider>()
        
        console.log('Loading providers for', allMovies.length, 'movies')
        
        await Promise.all(
          allMovies.slice(0, 20).map(async (movie: any) => {
            try {
              let tmdbId = movie.tmdb_id
              let mediaType = movie.media_type || 'movie'
              
              if (!tmdbId) {
                const results = await searchTMDb(movie.title)
                if (results && results.length > 0) {
                  tmdbId = results[0].id
                  mediaType = results[0].media_type || 'movie'
                }
              }
              
              if (tmdbId) {
                const providers = await getWatchProviders(tmdbId, mediaType as 'movie' | 'tv')
                const countryData = providers?.DE || Object.values(providers || {})[0] as any
                
                if (countryData) {
                  const allProviders = [
                    ...(countryData.flatrate || []),
                    ...(countryData.rent || []),
                    ...(countryData.buy || [])
                  ]
                  
                  allProviders.forEach((provider: any) => {
                    if (!providersMap.has(provider.provider_id)) {
                      providersMap.set(provider.provider_id, {
                        provider_id: provider.provider_id,
                        provider_name: provider.provider_name,
                        logo_path: provider.logo_path
                      })
                    }
                  })
                }
              }
            } catch (err) {
              // Ignore errors for individual movies
            }
          })
        )
        
        const providersList = Array.from(providersMap.values())
          .sort((a, b) => a.provider_name.localeCompare(b.provider_name))
        
        console.log('Loaded providers:', providersList.length, providersList)
        setAvailableProviders(providersList)
      } catch (err) {
        console.error('Error loading providers:', err)
      } finally {
        setIsLoadingProviders(false)
      }
    }
    
    if (user) {
      loadWatchlistProviders()
    }
  }, [user])

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
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        <ContentTypeFilter selected={contentTypes} onChange={setContentTypes} />

        <ProviderFilter
          availableProviders={availableProviders}
          isLoading={isLoadingProviders}
          filter={providerFilter}
          onChange={setProviderFilter}
        />

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <MovieList 
            hideRecommendations 
            watchlistOnly 
            showPredictions={showPredictions} 
            contentTypeFilter={contentTypes}
            providerFilter={providerFilter}
          />
        </div>
      </main>
    </div>
  )
}

export default function WatchlistPage() {
  return (
    <UserProvider>
      <WatchlistContent />
    </UserProvider>
  )
}
