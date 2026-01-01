'use client'

import { Movie } from '@/lib/types'

interface WatchProvidersDisplayProps {
  movie: Movie
  size?: 'small' | 'large'
}

export function WatchProvidersDisplay({ movie, size = 'small' }: WatchProvidersDisplayProps) {
  if (!movie.watch_providers) {
    return null
  }

  // Versuche Daten für Deutschland zu holen, fallback auf das erste verfügbare Land
  const countryData = movie.watch_providers.DE || Object.values(movie.watch_providers)[0] as any
  
  if (!countryData) {
    return null
  }

  // Sammle Provider nach Typ
  const flatrateProviders = countryData.flatrate || []
  const rentProviders = countryData.rent || []
  const buyProviders = countryData.buy || []

  // Dedupliziere alle Provider
  const allProviders = [...flatrateProviders, ...rentProviders, ...buyProviders]
  const uniqueProviders = Array.from(
    new Map(allProviders.map(p => [p.provider_id, p])).values()
  )

  if (uniqueProviders.length === 0) {
    return null
  }

  const iconSize = size === 'small' ? 'w-8 h-8' : 'w-10 h-10'

  const renderProviderSection = (title: string, providers: any[]) => {
    if (providers.length === 0) return null
    
    return (
      <div className="mb-3">
        <p className="text-xs font-semibold text-gray-600 mb-2">{title}</p>
        <div className="flex flex-wrap gap-2">
          {providers.map((provider: any) => (
            <a
              key={provider.provider_id}
              href={countryData.link}
              target="_blank"
              rel="noopener noreferrer"
              title={`${provider.provider_name} - Auf JustWatch ansehen`}
              className="relative group"
              onClick={(e) => e.stopPropagation()}
            >
              {provider.logo_path ? (
                <img
                  src={`https://image.tmdb.org/t/p/original${provider.logo_path}`}
                  alt={provider.provider_name}
                  className={`${iconSize} rounded-lg border-2 border-gray-300 hover:border-blue-500 transition-all hover:scale-110 shadow-sm`}
                />
              ) : (
                <div className={`${iconSize} bg-gray-300 rounded-lg flex items-center justify-center text-xs font-bold`}>
                  {provider.provider_name.substring(0, 2)}
                </div>
              )}
              <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-800 text-white text-xs rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50">
                {provider.provider_name}
              </div>
            </a>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-1">
      <p className="text-sm font-semibold text-gray-700 mb-1">📺 Verfügbar bei:</p>
      {renderProviderSection('Im Abo', flatrateProviders)}
      {renderProviderSection('Leihen', rentProviders)}
      {renderProviderSection('Kaufen', buyProviders)}
    </div>
  )
}
