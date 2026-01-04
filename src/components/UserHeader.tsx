'use client'

import { useRouter, usePathname } from 'next/navigation'
import { useUser } from '@/lib/UserContext'

export function UserHeader() {
  const router = useRouter()
  const pathname = usePathname()
  const { user } = useUser()

  if (!user) return null

  const navigationItems = [
    { label: 'Hinzufügen', path: '/add', image: '/buttons/01_add.png' },
    { label: 'Suchen', path: '/search', image: '/buttons/01_search.png' },
    { label: 'Empfehlungen', path: '/recommendations', image: '/buttons/01_reco.png' },
    { label: 'Watchlist', path: '/watchlist', image: '/buttons/01_watchlist.png' }
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
          <div className="hidden md:flex gap-3">
            {navigationItems.map(item => (
              <button
                key={item.path}
                onClick={() => router.push(item.path)}
                className={`hover:opacity-80 transition-opacity ${
                  pathname === item.path ? 'opacity-100' : 'opacity-70'
                }`}
                title={item.label}
              >
                <img src={item.image} alt={item.label} className="h-10 w-auto" />
              </button>
            ))}
          </div>

          {/* Mobile Navigation - Shown only on mobile */}
          <div className="md:hidden flex gap-1.5">
            {navigationItems.map(item => (
              <button
                key={item.path}
                onClick={() => router.push(item.path)}
                className={`hover:opacity-80 transition-opacity ${
                  pathname === item.path ? 'opacity-100' : 'opacity-70'
                }`}
                title={item.label}
                aria-label={item.label}
              >
                <img src={item.image} alt={item.label} className="h-10 w-auto" />
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
