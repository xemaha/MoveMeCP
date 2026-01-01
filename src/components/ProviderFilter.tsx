'use client'

import { useState, useEffect } from 'react'

interface Provider {
  provider_id: number
  provider_name: string
  logo_path: string
}

interface ProviderFilterProps {
  availableProviders: Provider[]
  isLoading: boolean
  filter: {
    categories: {
      flatrate: boolean
      rent: boolean
      buy: boolean
    }
    providers: Set<number>
  }
  onChange: (filter: any) => void
}

export function ProviderFilter({ availableProviders, isLoading, filter, onChange }: ProviderFilterProps) {
  const [showProviderFilter, setShowProviderFilter] = useState(false)

  const toggleProvider = (providerId: number) => {
    const newProviders = new Set(filter.providers)
    
    // If currently all are selected (empty set), start by selecting only this one
    if (newProviders.size === 0) {
      newProviders.add(providerId)
      onChange({ ...filter, providers: newProviders })
      return
    }
    
    // Toggle this specific provider
    if (newProviders.has(providerId)) {
      newProviders.delete(providerId)
      // If we deselected the last one, go back to "all selected"
      if (newProviders.size === 0) {
        onChange({ ...filter, providers: new Set() })
      } else {
        onChange({ ...filter, providers: newProviders })
      }
    } else {
      newProviders.add(providerId)
      // If all providers are now selected, clear the set (= show all)
      if (newProviders.size === availableProviders.length) {
        onChange({ ...filter, providers: new Set() })
      } else {
        onChange({ ...filter, providers: newProviders })
      }
    }
  }

  const isProviderSelected = (providerId: number) => {
    // If providers set is empty, all are selected
    if (filter.providers.size === 0) return true
    return filter.providers.has(providerId)
  }

  const toggleAllProviders = () => {
    if (filter.providers.size === 0) {
      // Currently all selected, deselect all
      onChange({ ...filter, providers: new Set() })
    } else {
      // Some selected, select all
      onChange({ ...filter, providers: new Set() })
    }
  }

  return (
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
                onClick={() => onChange({
                  ...filter,
                  categories: { ...filter.categories, flatrate: !filter.categories.flatrate }
                })}
                className={`px-4 py-2 rounded-lg border-2 transition-all ${
                  filter.categories.flatrate
                    ? 'bg-blue-50 border-blue-500 text-blue-700'
                    : 'bg-gray-50 border-gray-300 text-gray-500'
                }`}
              >
                Im Abo
              </button>
              <button
                onClick={() => onChange({
                  ...filter,
                  categories: { ...filter.categories, rent: !filter.categories.rent }
                })}
                className={`px-4 py-2 rounded-lg border-2 transition-all ${
                  filter.categories.rent
                    ? 'bg-green-50 border-green-500 text-green-700'
                    : 'bg-gray-50 border-gray-300 text-gray-500'
                }`}
              >
                Zum Leihen
              </button>
              <button
                onClick={() => onChange({
                  ...filter,
                  categories: { ...filter.categories, buy: !filter.categories.buy }
                })}
                className={`px-4 py-2 rounded-lg border-2 transition-all ${
                  filter.categories.buy
                    ? 'bg-purple-50 border-purple-500 text-purple-700'
                    : 'bg-gray-50 border-gray-300 text-gray-500'
                }`}
              >
                Zum Kaufen
              </button>
            </div>
          </div>

          {/* Provider Icons */}
          <div className="mb-4">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-semibold text-gray-700">Anbieter:</p>
              {availableProviders.length > 0 && (
                <button
                  onClick={toggleAllProviders}
                  className="text-xs text-blue-600 hover:text-blue-800 underline"
                >
                  {filter.providers.size === 0 ? 'Alle abwählen' : 'Alle auswählen'}
                </button>
              )}
            </div>
            
            {isLoading ? (
              <div className="text-sm text-gray-500">Lade Anbieter...</div>
            ) : availableProviders.length === 0 ? (
              <div className="text-sm text-gray-500">Keine Anbieter gefunden</div>
            ) : (
              <>
                <p className="text-xs text-gray-500 mb-3">
                  {filter.providers.size === 0 
                    ? 'Alle Anbieter ausgewählt' 
                    : `${filter.providers.size} von ${availableProviders.length} Anbietern ausgewählt`}
                </p>
                <div className="flex flex-wrap gap-3">
                  {availableProviders.map((provider) => (
                    <button
                      key={provider.provider_id}
                      onClick={() => toggleProvider(provider.provider_id)}
                      className={`relative group transition-all ${
                        isProviderSelected(provider.provider_id)
                          ? 'opacity-100 scale-100'
                          : 'opacity-40 scale-95 grayscale'
                      }`}
                      title={provider.provider_name}
                    >
                      <img
                        src={`https://image.tmdb.org/t/p/original${provider.logo_path}`}
                        alt={provider.provider_name}
                        className={`w-12 h-12 rounded-lg border-2 transition-all ${
                          isProviderSelected(provider.provider_id)
                            ? 'border-blue-500'
                            : 'border-gray-300'
                        }`}
                      />
                      {isProviderSelected(provider.provider_id) && (
                        <div className="absolute -top-1 -right-1 w-5 h-5 bg-blue-500 text-white rounded-full flex items-center justify-center text-xs">
                          ✓
                        </div>
                      )}
                      <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-800 text-white text-xs rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50">
                        {provider.provider_name}
                      </div>
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
