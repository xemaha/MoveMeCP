'use client'

import { useRouter, usePathname } from 'next/navigation'
import { useUser } from '@/lib/UserContext'

export function UserHeader() {
  const router = useRouter()
  const pathname = usePathname()
  const { user } = useUser()

  if (!user) return null

  const navigationItems = [
    { label: 'Hinzufügen', path: '/add', emoji: '➕' },
    { label: 'Suchen', path: '/search', emoji: '🔍' },
    { label: 'Empfehlungen', path: '/recommendations', emoji: '✨' },
    { label: 'Watchlist', path: '/watchlist', emoji: '👁️' }
  ]

  return (
    <div className="bg-white shadow-sm border-b">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center justify-between py-3">
          <button
            onClick={() => router.push('/')}
            className="text-2xl font-bold text-gray-900 hover:text-blue-600 transition-colors cursor-pointer whitespace-nowrap"
          >
            🎬 MoveMe
          </button>
          
          {/* Navigation Buttons - Hidden on mobile, shown on md and up */}
          <div className="hidden md:flex gap-2">
            {navigationItems.map(item => (
              <button
                key={item.path}
                onClick={() => router.push(item.path)}
                className={`px-3 py-1 rounded-md text-sm font-medium transition-colors whitespace-nowrap ${
                  pathname === item.path
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>

          {/* Mobile Navigation - Shown only on mobile */}
          <div className="md:hidden flex gap-2">
            {navigationItems.map(item => (
              <button
                key={item.path}
                onClick={() => router.push(item.path)}
                className={`flex flex-col items-center justify-center px-3 py-2 rounded-lg border text-sm transition-colors whitespace-nowrap ${
                  pathname === item.path
                    ? 'bg-blue-50 border-blue-300 text-blue-800 shadow-sm'
                    : 'bg-white border-gray-200 text-gray-700 hover:border-blue-200 hover:bg-blue-50'
                }`}
                title={item.label}
              >
                <span className="text-xl" aria-hidden>
                  {item.emoji}
                </span>
                <span className="text-[11px] leading-tight mt-1 font-medium">
                  {item.label}
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
