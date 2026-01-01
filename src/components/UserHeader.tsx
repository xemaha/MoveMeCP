'use client'

import { useRouter, usePathname } from 'next/navigation'
import { useUser } from '@/lib/UserContext'

export function UserHeader() {
  const router = useRouter()
  const pathname = usePathname()
  const { user, setUser } = useUser()

  const handleLogout = () => {
    setUser(null)
  }

  if (!user) return null

  const navigationItems = [
    { label: 'Hinzufügen', path: '/add' },
    { label: 'Suchen', path: '/search' },
    { label: 'Empfehlungen', path: '/recommendations' },
    { label: 'Watchlist', path: '/watchlist' }
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
          <div className="md:hidden flex gap-1">
            {navigationItems.map(item => (
              <button
                key={item.path}
                onClick={() => router.push(item.path)}
                className={`px-2 py-1 rounded text-xs font-medium transition-colors whitespace-nowrap ${
                  pathname === item.path
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                }`}
              >
                {item.label.substring(0, 3)}
              </button>
            ))}
          </div>
          
          <button
            onClick={handleLogout}
            className="text-sm text-gray-500 hover:text-gray-700 transition-colors whitespace-nowrap"
          >
            Abmelden
          </button>
        </div>
      </div>
    </div>
  )
}
