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
  const providers = Object.entries(movie.watch_providers).find(([_, data]) => data && data.results && data.results.length > 0)?.[1]

  if (!providers || !providers.results || providers.results.length === 0) {
    return null
  }

  const iconSize = size === 'small' ? 'w-5 h-5' : 'w-8 h-8'
  const containerClass = size === 'small' ? 'gap-2' : 'gap-3'

  return (
    <div className="flex flex-col gap-2">
      <p className="text-xs font-semibold text-gray-700">📺 Verfügbar bei:</p>
      <div className={`flex flex-wrap ${containerClass}`}>
        {providers.results.map((provider: any) => (
          <a
            key={provider.provider_id}
            href={providers.link || '#'}
            target="_blank"
            rel="noopener noreferrer"
            title={provider.provider_name}
            className="relative group"
            onClick={(e) => e.stopPropagation()}
          >
            {provider.logo_path ? (
              <img
                src={`https://image.tmdb.org/t/p/original${provider.logo_path}`}
                alt={provider.provider_name}
                className={`${iconSize} rounded-md border border-gray-300 hover:border-blue-500 transition-all hover:scale-110`}
              />
            ) : (
              <div className={`${iconSize} bg-gray-300 rounded-md flex items-center justify-center text-xs font-bold`}>
                {provider.provider_name.substring(0, 2)}
              </div>
            )}
            <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-800 text-white text-xs rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50">
              {provider.provider_name}
            </div>
          </a>
        ))}
      </div>
      {providers.link && (
        <a
          href={providers.link}
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs text-blue-600 hover:text-blue-800 transition-colors"
          onClick={(e) => e.stopPropagation()}
        >
          Auf JustWatch ansehen →
        </a>
      )}
    </div>
  )
}
