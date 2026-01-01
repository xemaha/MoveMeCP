'use client'

import { useState, useEffect } from 'react'

interface Provider {
  provider_id: number
  provider_name: string
  logo_path: string
}

interface UserProviderProfile {
  flatrate: Set<number>  // Streaming subscriptions I have
  rent: Set<number>      // Where I can rent
  buy: Set<number>       // Where I can buy
}

interface MyProvidersSetupProps {
  availableProviders: Provider[]
  isLoading: boolean
  profile: UserProviderProfile
  onChange: (profile: UserProviderProfile) => void
}

export function MyProvidersSetup({ availableProviders, isLoading, profile, onChange }: MyProvidersSetupProps) {
  const [showSetup, setShowSetup] = useState(false)

  const toggleProvider = (providerId: number, category: 'flatrate' | 'rent' | 'buy') => {
    const newProfile = {
      flatrate: new Set(profile.flatrate),
      rent: new Set(profile.rent),
      buy: new Set(profile.buy)
    }
    
    if (newProfile[category].has(providerId)) {
      newProfile[category].delete(providerId)
    } else {
      newProfile[category].add(providerId)
    }
    
    onChange(newProfile)
  }

  const isProviderSelected = (providerId: number, category: 'flatrate' | 'rent' | 'buy') => {
    return profile[category].has(providerId)
  }

  const getProviderCategories = (providerId: number) => {
    const categories: string[] = []
    if (profile.flatrate.has(providerId)) categories.push('Abo')
    if (profile.rent.has(providerId)) categories.push('Leihen')
    if (profile.buy.has(providerId)) categories.push('Kaufen')
    return categories
  }

  const totalSelected = profile.flatrate.size + profile.rent.size + profile.buy.size

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200">
      <button
        onClick={() => setShowSetup(!showSetup)}
        className="w-full px-6 py-4 flex items-center justify-between text-left hover:bg-gray-50 transition-colors"
      >
        <div>
          <span className="font-semibold text-gray-900">⚙️ Meine Streaming-Dienste</span>
          {totalSelected > 0 && (
            <span className="ml-2 text-sm text-gray-500">
              ({totalSelected} {totalSelected === 1 ? 'Dienst' : 'Dienste'} konfiguriert)
            </span>
          )}
        </div>
        <span className="text-gray-500">{showSetup ? '▼' : '▶'}</span>
      </button>
      
      {showSetup && (
        <div className="px-6 pb-6 border-t border-gray-200 pt-4">
          <p className="text-sm text-gray-600 mb-4">
            Wähle deine verfügbaren Streaming-Dienste aus. Der Filter zeigt dann nur Filme, die du tatsächlich schauen kannst.
          </p>

          {isLoading ? (
            <div className="text-sm text-gray-500">Lade Anbieter...</div>
          ) : availableProviders.length === 0 ? (
            <div className="text-sm text-gray-500">Keine Anbieter gefunden</div>
          ) : (
            <div className="space-y-4">
              {availableProviders.map((provider) => {
                const categories = getProviderCategories(provider.provider_id)
                const isSelected = categories.length > 0
                
                return (
                  <div
                    key={provider.provider_id}
                    className={`flex items-center gap-4 p-3 rounded-lg border-2 transition-all ${
                      isSelected ? 'border-blue-300 bg-blue-50' : 'border-gray-200 bg-white'
                    }`}
                  >
                    {/* Provider Logo */}
                    <img
                      src={`https://image.tmdb.org/t/p/original${provider.logo_path}`}
                      alt={provider.provider_name}
                      className="w-12 h-12 rounded-lg"
                    />
                    
                    {/* Provider Name */}
                    <div className="flex-1">
                      <p className="font-semibold text-gray-900">{provider.provider_name}</p>
                      {isSelected && (
                        <p className="text-xs text-blue-600 mt-1">
                          {categories.join(', ')}
                        </p>
                      )}
                    </div>
                    
                    {/* Category Buttons */}
                    <div className="flex gap-2">
                      <button
                        onClick={() => toggleProvider(provider.provider_id, 'flatrate')}
                        className={`px-3 py-1 rounded-md text-xs font-medium transition-all ${
                          isProviderSelected(provider.provider_id, 'flatrate')
                            ? 'bg-blue-500 text-white'
                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                        }`}
                      >
                        Abo
                      </button>
                      <button
                        onClick={() => toggleProvider(provider.provider_id, 'rent')}
                        className={`px-3 py-1 rounded-md text-xs font-medium transition-all ${
                          isProviderSelected(provider.provider_id, 'rent')
                            ? 'bg-green-500 text-white'
                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                        }`}
                      >
                        Leihen
                      </button>
                      <button
                        onClick={() => toggleProvider(provider.provider_id, 'buy')}
                        className={`px-3 py-1 rounded-md text-xs font-medium transition-all ${
                          isProviderSelected(provider.provider_id, 'buy')
                            ? 'bg-purple-500 text-white'
                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                        }`}
                      >
                        Kaufen
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
          
          {totalSelected > 0 && (
            <div className="mt-4 p-3 bg-blue-50 rounded-lg">
              <p className="text-sm text-blue-800">
                ✓ Der Filter zeigt jetzt nur Filme, die bei deinen {totalSelected} konfigurierten {totalSelected === 1 ? 'Dienst' : 'Diensten'} verfügbar sind.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
