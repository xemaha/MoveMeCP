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
    <div className="shadow-sm border-b" style={{ backgroundColor: '#fcfcfd' }}>
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center justify-between py-3">
          <button
            onClick={() => router.push('/')}
            className="hover:opacity-80 transition-opacity cursor-pointer"
          >
            <img src="/emova.png" alt="EMOVA Logo" className="h-12 w-auto" />
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
          <div className="md:hidden flex gap-1.5">
            {navigationItems.map(item => (
              <button
                key={item.path}
                onClick={() => router.push(item.path)}
                className={`flex items-center justify-center w-10 h-10 rounded-lg border transition-colors ${
                  pathname === item.path
                    ? 'bg-blue-50 border-blue-300 shadow-sm'
                    : 'bg-white border-gray-200 hover:border-blue-200 hover:bg-blue-50'
                }`}
                title={item.label}
                aria-label={item.label}
              >
                <span className="text-lg">
                  {item.emoji}
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
