'use client'

import { Movie } from '@/lib/supabase'

interface MovieCardProps {
  movie: Movie
  onSelect?: () => void
}

export function MovieCard({ movie, onSelect }: MovieCardProps) {
  return (
    <div 
      className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer"
      onClick={onSelect}
    >
      {/* Content Type Icon */}
      {movie.content_type && (
        <div className="flex justify-start mb-2">
          <img 
            src={`/buttons/04_${movie.content_type}.png`} 
            alt={movie.content_type} 
            className="h-6 w-auto"
          />
        </div>
      )}
      
      {/* Poster Preview */}
      {movie.poster_url && (
        <div className="flex justify-center mb-3">
          <img
            src={movie.poster_url}
            alt={movie.title}
            className="max-h-48 rounded shadow"
            style={{ maxWidth: '120px', objectFit: 'contain', background: '#eee' }}
          />
        </div>
      )}

      <div className="flex justify-between items-start mb-2">
        <h3 className="text-lg font-semibold text-gray-900">{movie.title}</h3>
        {movie.year && (
          <span className="text-sm text-gray-500 bg-gray-100 px-2 py-1 rounded">
            {movie.year}
          </span>
        )}
      </div>

      {movie.description && (
        <p className="text-gray-600 mb-3 text-sm line-clamp-2">{movie.description}</p>
      )}

      {/* YouTube Trailer Button */}
      {movie.trailer_url && (
        <div className="mb-3">
          <a
            href={movie.trailer_url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block hover:opacity-80 transition-opacity"
            title="YouTube Trailer"
            onClick={(e) => e.stopPropagation()}
          >
            <img src="/buttons/04_trailer.png" alt="YouTube Trailer" className="h-8 w-auto" />
          </a>
        </div>
      )}
    </div>
  )
}
