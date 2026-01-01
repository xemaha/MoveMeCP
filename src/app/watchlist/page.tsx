'use client'

import { useState, useEffect, useRef } from 'react'
import AuthForm from '@/components/AuthForm'
import { UserHeader } from '@/components/UserHeader'
import { UserProvider, useUser } from '@/lib/UserContext'
import { MovieList } from '@/components/MovieList'
import { ContentTypeFilter } from '@/components/ContentTypeFilter'
import { ProviderFilter } from '@/components/ProviderFilter'
import { ProviderTypeFilter } from '@/components/ProviderTypeFilter'
import { MyProvidersSetup } from '@/components/MyProvidersSetup'
import { loadUserProviderProfile, saveUserProviderProfile } from '@/lib/providerProfile'
import { calculatePredictedRatings } from '@/lib/recommendations'
import { supabase } from '@/lib/supabase'

interface Provider {
  provider_id: number
  provider_name: string
  logo_path: string
}

interface UserProviderProfile {
  flatrate: Set<number>
  rent: Set<number>
  buy: Set<number>
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
  const [providerProfile, setProviderProfile] = useState<UserProviderProfile>({
    flatrate: new Set(),
    rent: new Set(),
    buy: new Set()
  })
  const [providerTypeFilter, setProviderTypeFilter] = useState({
    flatrate: true,
    rent: true,
    buy: true,
    unavailable: true
  })
  const [availableProviders, setAvailableProviders] = useState<Provider[]>([])
  const [isLoadingProviders, setIsLoadingProviders] = useState(false)

  // Common streaming providers in Germany
  const commonProviders: Provider[] = [
    { provider_id: 8, provider_name: 'Netflix', logo_path: '/t2yyOv40HZeVlLjYsCsPHnWLk4W.jpg' },
    { provider_id: 9, provider_name: 'Amazon Prime Video', logo_path: '/emthp39XA2YScoYL1p0sdbAH2WA.jpg' },
    { provider_id: 337, provider_name: 'Disney Plus', logo_path: '/7rwgEs15tFwyR9NPQ5vpzxTj19Q.jpg' },
    { provider_id: 350, provider_name: 'Apple TV Plus', logo_path: '/6uhKBfmtzFqOcLousHwZuzcrScK.jpg' },
    { provider_id: 119, provider_name: 'Amazon Prime Video', logo_path: '/emthp39XA2YScoYL1p0sdbAH2WA.jpg' },
    { provider_id: 2, provider_name: 'Apple TV', logo_path: '/peURlLlr8jggOwK53fJ5wdQl05y.jpg' },
    { provider_id: 3, provider_name: 'Google Play Movies', logo_path: '/tbEdFQDwx5LEVr8WpSeXQSIirVq.jpg' },
    { provider_id: 10, provider_name: 'Amazon Video', logo_path: '/emthp39XA2YScoYL1p0sdbAH2WA.jpg' },
    { provider_id: 192, provider_name: 'YouTube', logo_path: '/cQ8QBHQHBojTov3PQiyFE78KXQA.jpg' },
    { provider_id: 68, provider_name: 'Microsoft Store', logo_path: '/shq88b09gTBYC4hA7K7MUL8Q4zP.jpg' },
    { provider_id: 29, provider_name: 'Sky Store', logo_path: '/2PmNUOCJrN7FHPPGTPKGq5xGlMp.jpg' },
    { provider_id: 130, provider_name: 'Sky Go', logo_path: '/8z7rC8uIDaTM91X0ZfkRf04ydj2.jpg' },
    { provider_id: 207, provider_name: 'Sky X', logo_path: '/8z7rC8uIDaTM91X0ZfkRf04ydj2.jpg' },
    { provider_id: 1899, provider_name: 'Max', logo_path: '/zxrVdFjIjLqkfnwyghnfywTn3Lh.jpg' },
    { provider_id: 531, provider_name: 'Paramount Plus', logo_path: '/xbhHHa1YgtpwhC8lb1NQ3ACVcLd.jpg' }
  ]

  useEffect(() => {
    // Use common providers as default
    setAvailableProviders(commonProviders)
  }, [])

  // Load user's provider profile when user logs in
  useEffect(() => {
    if (user?.id) {
      loadUserProviderProfile(user.id).then(profile => {
        setProviderProfile(profile)
      })
    }
  }, [user?.id])

  // Save provider profile whenever it changes
  useEffect(() => {
    if (user?.id) {
      // Debounce the save to avoid too many requests
      const timer = setTimeout(() => {
        saveUserProviderProfile(user.id, providerProfile)
      }, 500)
      return () => clearTimeout(timer)
    }
  }, [providerProfile, user?.id])

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

        <MyProvidersSetup
          availableProviders={availableProviders}
          isLoading={isLoadingProviders}
          profile={providerProfile}
          onChange={setProviderProfile}
        />

        {(providerProfile.flatrate.size > 0 || providerProfile.rent.size > 0 || providerProfile.buy.size > 0) && (
          <ProviderTypeFilter
            selectedTypes={providerTypeFilter}
            onChange={setProviderTypeFilter}
            hasPersonalProviders={true}
          />
        )}

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <MovieList 
            hideRecommendations 
            watchlistOnly 
            showPredictions={showPredictions} 
            contentTypeFilter={contentTypes}
            providerProfile={providerProfile}
            providerTypeFilter={providerTypeFilter}
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
