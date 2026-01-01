'use client'

import { useState, useEffect, useRef } from 'react'
import AuthForm from '@/components/AuthForm'
import { UserHeader } from '@/components/UserHeader'
import { UserProvider, useUser } from '@/lib/UserContext'
import { MovieList } from '@/components/MovieList'
import { ContentTypeFilter } from '@/components/ContentTypeFilter'
import { calculatePredictedRatings } from '@/lib/recommendations'

function WatchlistContent() {
  const { user, isLoading } = useUser()
  const [showPredictions, setShowPredictions] = useState(false)
  const [contentTypes, setContentTypes] = useState({
    film: true,
    serie: true,
    buch: false
  })
  const hasCalcPredictions = useRef(false)
  const [showProviderFilter, setShowProviderFilter] = useState(false)
  const [providerFilter, setProviderFilter] = useState({
    categories: {
      flatrate: true,
      rent: true,
      buy: true
    },
    providers: new Set<number>() // Empty = all selected
  })

  useEffect(() => {
    // Auto-calculate predictions when watchlist loads
    if (!hasCalcPredictions.current && user) {
      setShowPredictions(true)
      hasCalcPredictions.current = true
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

        {/* Provider Filter */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <button
            onClick={() => setShowProviderFilter(!showProviderFilter)}
            className="w-full px-6 py-4 flex items-center justify-between text-left hover:bg-gray-50 transition-colors"
          >
            <span className="font-semibold text-gray-900">📺 Verfügbarkeit Filter</span>
            <span className="text-gray-500">{showProviderFilter ? '▼' : '▶'}</span>
          </button>
          
          {showProviderFilter && (
            <div className="px-6 pb-6 border-t border-gray-200 pt-4">
              {/* Category Filter */}
              <div className="mb-4">
                <p className="text-sm font-semibold text-gray-700 mb-2">Verfügbarkeit:</p>
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => setProviderFilter(prev => ({
                      ...prev,
                      categories: { ...prev.categories, flatrate: !prev.categories.flatrate }
                    }))}
                    className={`px-4 py-2 rounded-lg border-2 transition-all ${
                      providerFilter.categories.flatrate
                        ? 'bg-blue-50 border-blue-500 text-blue-700'
                        : 'bg-gray-50 border-gray-300 text-gray-500'
                    }`}
                  >
                    Im Abo
                  </button>
                  <button
                    onClick={() => setProviderFilter(prev => ({
                      ...prev,
                      categories: { ...prev.categories, rent: !prev.categories.rent }
                    }))}
                    className={`px-4 py-2 rounded-lg border-2 transition-all ${
                      providerFilter.categories.rent
                        ? 'bg-green-50 border-green-500 text-green-700'
                        : 'bg-gray-50 border-gray-300 text-gray-500'
                    }`}
                  >
                    Zum Leihen
                  </button>
                  <button
                    onClick={() => setProviderFilter(prev => ({
                      ...prev,
                      categories: { ...prev.categories, buy: !prev.categories.buy }
                    }))}
                    className={`px-4 py-2 rounded-lg border-2 transition-all ${
                      providerFilter.categories.buy
                        ? 'bg-purple-50 border-purple-500 text-purple-700'
                        : 'bg-gray-50 border-gray-300 text-gray-500'
                    }`}
                  >
                    Zum Kaufen
                  </button>
                </div>
              </div>

              {/* Provider Icons - will be populated dynamically */}
              <div className="mb-4">
                <p className="text-sm font-semibold text-gray-700 mb-2">Anbieter:</p>
                <p className="text-xs text-gray-500 mb-2">
                  {providerFilter.providers.size === 0 ? 'Alle Anbieter ausgewählt' : `${providerFilter.providers.size} Anbieter ausgewählt`}
                </p>
                <div className="text-sm text-gray-500">
                  Anbieter-Filter wird beim Laden der Filme verfügbar
                </div>
              </div>
            </div>
          )}
        </div>

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
