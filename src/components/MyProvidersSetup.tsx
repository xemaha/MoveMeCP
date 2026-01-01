'use client'

import { useState, useMemo } from 'react'

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

const FEATURED_PROVIDER_IDS = [8, 9, 350, 192, 130, 337] // Netflix, Prime, Apple TV+, YouTube, Sky Go, Disney+

// Group providers by their main brand (e.g., all Amazon variants under one group)
const PROVIDER_GROUPS: Record<string, { mainId: number; variants: number[]; displayName: string }> = {
  'amazon': {
    mainId: 9,
    variants: [9, 10, 119], // Amazon Prime Video, Amazon Video
    displayName: 'Amazon Prime Video'
  },
  'apple': {
    mainId: 350,
    variants: [350, 2], // Apple TV+, Apple TV
    displayName: 'Apple TV'
  },
  'sky': {
    mainId: 130,
    variants: [130, 207, 29], // Sky Go, Sky X, Sky Store
    displayName: 'Sky'
  }
}

export function MyProvidersSetup({ availableProviders, isLoading, profile, onChange }: MyProvidersSetupProps) {
  const [showSetup, setShowSetup] = useState(false)
  const [showAllProviders, setShowAllProviders] = useState(false)

  // Deduplicate and group providers
  const processedProviders = useMemo(() => {
    const seen = new Set<string>()
    const processed = availableProviders.filter(provider => {
      const normalizedName = provider.provider_name.toLowerCase().trim()
      if (seen.has(normalizedName)) return false
      seen.add(normalizedName)
      return true
    })

    // For grouped providers, use main ID and display name
    return processed.map(provider => {
      for (const [, group] of Object.entries(PROVIDER_GROUPS)) {
        if (group.variants.includes(provider.provider_id)) {
          return {
            ...provider,
            provider_id: group.mainId,
            provider_name: group.displayName
          }
        }
      }
      return provider
    })
  }, [availableProviders])

  // Deduplicate by provider_id to avoid showing same group twice
  const deduplicatedProviders = useMemo(() => {
    const seen = new Set<number>()
    return processedProviders.filter(p => {
      if (seen.has(p.provider_id)) return false
      seen.add(p.provider_id)
      return true
    })
  }, [processedProviders])

  // Split into featured and others
  const featuredProviders = useMemo(() => {
    return deduplicatedProviders
      .filter(p => FEATURED_PROVIDER_IDS.includes(p.provider_id))
      .sort((a, b) => {
        const indexA = FEATURED_PROVIDER_IDS.indexOf(a.provider_id)
        const indexB = FEATURED_PROVIDER_IDS.indexOf(b.provider_id)
        return indexA - indexB
      })
  }, [deduplicatedProviders])

  const otherProviders = useMemo(() => {
    return deduplicatedProviders
      .filter(p => !FEATURED_PROVIDER_IDS.includes(p.provider_id))
      .sort((a, b) => a.provider_name.localeCompare(b.provider_name))
  }, [deduplicatedProviders])

  const toggleProvider = (providerId: number, category: 'flatrate' | 'rent' | 'buy') => {
    const newProfile = {
      flatrate: new Set(profile.flatrate),
      rent: new Set(profile.rent),
      buy: new Set(profile.buy)
    }
    
    // Check if this is a grouped provider - if so, toggle all variants
    let providerIds = [providerId]
    for (const [, group] of Object.entries(PROVIDER_GROUPS)) {
      if (group.mainId === providerId) {
        providerIds = group.variants
        break
      }
    }
    
    // Check if any variant is currently selected
    const anySelected = providerIds.some(id => newProfile[category].has(id))
    
    // Toggle all variants together
    if (anySelected) {
      providerIds.forEach(id => newProfile[category].delete(id))
    } else {
      providerIds.forEach(id => newProfile[category].add(id))
    }
    
    onChange(newProfile)
  }

  const isProviderSelected = (providerId: number, category: 'flatrate' | 'rent' | 'buy') => {
    // Check if this is a grouped provider
    for (const [, group] of Object.entries(PROVIDER_GROUPS)) {
      if (group.mainId === providerId) {
        // For grouped providers, check if ANY variant is selected
        return group.variants.some(id => profile[category].has(id))
      }
    }
    return profile[category].has(providerId)
  }

  const getProviderCategories = (providerId: number) => {
    const categories: string[] = []
    
    // Check if this is a grouped provider
    let checkIds = [providerId]
    for (const [, group] of Object.entries(PROVIDER_GROUPS)) {
      if (group.mainId === providerId) {
        checkIds = group.variants
        break
      }
    }
    
    // Check categories for all variants
    if (checkIds.some(id => profile.flatrate.has(id))) categories.push('Abo')
    if (checkIds.some(id => profile.rent.has(id))) categories.push('Leihen')
    if (checkIds.some(id => profile.buy.has(id))) categories.push('Kaufen')
    return categories
  }

  const totalSelected = profile.flatrate.size + profile.rent.size + profile.buy.size

  const renderProvider = (provider: Provider) => {
    const categories = getProviderCategories(provider.provider_id)
    const isSelected = categories.length > 0
    
    return (
      <div
        key={provider.provider_id}
        className={`flex items-center gap-3 p-3 rounded-lg border-2 transition-all ${
          isSelected ? 'border-blue-300 bg-blue-50' : 'border-gray-200 bg-white'
        }`}
      >
        {/* Provider Logo */}
        <img
          src={`https://image.tmdb.org/t/p/original${provider.logo_path}`}
          alt={provider.provider_name}
          className="w-10 h-10 rounded-lg flex-shrink-0 object-cover"
          onError={(e) => {
            e.currentTarget.style.backgroundColor = '#f3f4f6'
          }}
        />
        
        {/* Provider Name */}
        <div className="flex-1 min-w-0">
          <p className="font-medium text-gray-900 text-sm truncate">{provider.provider_name}</p>
          {isSelected && (
            <p className="text-xs text-blue-600 mt-0.5">
              {categories.join(', ')}
            </p>
          )}
        </div>
        
        {/* Category Buttons */}
        <div className="flex gap-1.5 flex-shrink-0">
          <button
            onClick={() => toggleProvider(provider.provider_id, 'flatrate')}
            className={`px-2.5 py-1 rounded-md text-xs font-medium transition-all ${
              isProviderSelected(provider.provider_id, 'flatrate')
                ? 'bg-blue-500 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
            title="Abo"
          >
            Abo
          </button>
          <button
            onClick={() => toggleProvider(provider.provider_id, 'rent')}
            className={`px-2.5 py-1 rounded-md text-xs font-medium transition-all ${
              isProviderSelected(provider.provider_id, 'rent')
                ? 'bg-green-500 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
            title="Leihen"
          >
            Leihen
          </button>
          <button
            onClick={() => toggleProvider(provider.provider_id, 'buy')}
            className={`px-2.5 py-1 rounded-md text-xs font-medium transition-all ${
              isProviderSelected(provider.provider_id, 'buy')
                ? 'bg-purple-500 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
            title="Kaufen"
          >
            Kaufen
          </button>
        </div>
      </div>
    )
  }

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
        <div className="px-6 pb-6 border-t border-gray-200 pt-4 space-y-4">
          <p className="text-sm text-gray-600">
            Wähle deine verfügbaren Streaming-Dienste aus. Der Filter zeigt dann nur Filme, die du tatsächlich schauen kannst.
          </p>

          {isLoading ? (
            <div className="text-sm text-gray-500">Lade Anbieter...</div>
          ) : deduplicatedProviders.length === 0 ? (
            <div className="text-sm text-gray-500">Keine Anbieter gefunden</div>
          ) : (
            <div className="space-y-4">
              {/* Featured Providers */}
              {featuredProviders.length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-gray-500 uppercase mb-3">Beliebte Dienste</p>
                  <div className="space-y-2">
                    {featuredProviders.map(provider => renderProvider(provider))}
                  </div>
                </div>
              )}

              {/* Other Providers - Collapsible */}
              {otherProviders.length > 0 && (
                <div>
                  <button
                    onClick={() => setShowAllProviders(!showAllProviders)}
                    className="w-full text-left py-2 px-2 rounded-lg text-sm font-medium text-blue-600 hover:bg-blue-50 transition-colors flex items-center gap-2"
                  >
                    <span>{showAllProviders ? '▼' : '▶'} Weitere Dienste ({otherProviders.length})</span>
                  </button>
                  
                  {showAllProviders && (
                    <div className="mt-3 space-y-2 pl-2">
                      {otherProviders.map(provider => renderProvider(provider))}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
          
          {totalSelected > 0 && (
            <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
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
