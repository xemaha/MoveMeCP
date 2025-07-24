'use client'

import { useState } from 'react'
import { addToWatchlistClient, removeFromWatchlistClient } from '@/lib/watchlist'
import { Eye, EyeOff } from 'lucide-react'

interface WatchlistButtonProps {
  movieId: string
  isInWatchlist: boolean
  onToggle?: (movieId: string, isInWatchlist: boolean) => void
}

export default function WatchlistButton({ movieId, isInWatchlist, onToggle }: WatchlistButtonProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [inWatchlist, setInWatchlist] = useState(isInWatchlist)

  const handleToggle = async () => {
    setIsLoading(true)
    
    try {
      console.log('🔍 WatchlistButton - Toggle for movie:', movieId, 'Current state:', inWatchlist)
      
      if (inWatchlist) {
        await removeFromWatchlistClient(movieId)
        setInWatchlist(false)
        onToggle?.(movieId, false)
        console.log('✅ Removed from watchlist')
      } else {
        await addToWatchlistClient(movieId)
        setInWatchlist(true)
        onToggle?.(movieId, true)
        console.log('✅ Added to watchlist')
      }
    } catch (error) {
      console.error('❌ Error toggling watchlist:', error)
      alert(`Fehler: ${error instanceof Error ? error.message : 'Unbekannter Fehler'}`)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <button
      onClick={handleToggle}
      disabled={isLoading}
      className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
        inWatchlist
          ? 'bg-green-100 text-green-700 hover:bg-green-200'
          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
      } ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
    >
      {inWatchlist ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
      {isLoading ? 'Loading...' : inWatchlist ? 'Auf Watchlist' : 'Zur Watchlist hinzufügen'}
    </button>
  )
}

