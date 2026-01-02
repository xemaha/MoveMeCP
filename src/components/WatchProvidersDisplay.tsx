'use client'

import { Movie } from '@/lib/types'

interface WatchProvidersDisplayProps {
  movie: Movie
  size?: 'small' | 'large'
}

export function WatchProvidersDisplay({ movie, size = 'small' }: WatchProvidersDisplayProps) {
  // Custom inline logos for providers that often lack TMDB logos
  const YOUTUBE_LOGO = "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='120' height='80' viewBox='0 0 120 80'><rect width='120' height='80' rx='12' fill='%23ff0000'/><polygon points='50,25 85,40 50,55' fill='white'/></svg>"
  const WOW_LOGO = "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='140' height='80' viewBox='0 0 140 80'><rect width='140' height='80' rx='12' fill='%2300153f'/><text x='70' y='50' text-anchor='middle' font-family='Arial' font-size='36' font-weight='700' fill='white'>WOW</text></svg>"

  const normalizeProvider = (provider: any) => {
    const name = (provider.provider_name || '').trim()
    const lower = name.toLowerCase()

    // Map any Sky/WOW variant (Sky Ticket, Sky Store, WOW, etc.) to WOW with a custom logo
    if (lower.includes('sky') || lower.includes('wow')) {
      return {
        ...provider,
        provider_id: 'custom-wow',
        provider_name: 'WOW',
        customLogo: WOW_LOGO,
        canonicalKey: 'custom-wow',
      }
    }

    // Map YouTube to a custom logo when TMDB logo is missing
    if (lower.includes('youtube')) {
      return {
        ...provider,
        provider_id: 'custom-youtube',
        provider_name: 'YouTube',
        customLogo: YOUTUBE_LOGO,
        canonicalKey: 'custom-youtube',
      }
    }

    return {
      ...provider,
      canonicalKey: `tmdb-${provider.provider_id}`,
    }
  }

  const normalizeList = (list: any[]) => {
    const map = new Map<string, any>()
    list.forEach((p) => {
      const normalized = normalizeProvider(p)
      if (!map.has(normalized.canonicalKey)) {
        map.set(normalized.canonicalKey, normalized)
      }
    })
    return Array.from(map.values())
  }

  if (!movie.watch_providers) {
    return null
  }

  // Versuche Daten für Deutschland zu holen, fallback auf das erste verfügbare Land
  const countryData = movie.watch_providers.DE || Object.values(movie.watch_providers)[0] as any
  
  if (!countryData) {
    return null
  }

  // Sammle Provider nach Typ (normalisiert & dedupliziert inkl. Sky/WOW mapping)
  const flatrateProviders = normalizeList(countryData.flatrate || [])
  const rentProviders = normalizeList(countryData.rent || [])
  const buyProviders = normalizeList(countryData.buy || [])

  // Dedupliziere über alle Typen hinweg
  const allProviders = normalizeList([...flatrateProviders, ...rentProviders, ...buyProviders])

  if (allProviders.length === 0) {
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
              {provider.customLogo ? (
                <img
                  src={provider.customLogo}
                  alt={provider.provider_name}
                  className={`${iconSize} rounded-lg border-2 border-gray-300 hover:border-blue-500 transition-all hover:scale-110 shadow-sm bg-white object-contain`}
                />
              ) : provider.logo_path ? (
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
