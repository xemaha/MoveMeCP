'use client'

import { useRouter, usePathname } from 'next/navigation'
import { useUser } from '@/lib/UserContext'

export function BottomNavBar() {
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
    <nav className="fixed bottom-0 left-0 w-full z-50 bg-[#fcfcfd] border-t shadow-md" style={{ borderTopColor: '#e5e5e5' }}>
      <div className="max-w-2xl mx-auto flex justify-around items-center py-2">
        <button
          onClick={() => router.push('/')}
          className="flex items-center hover:opacity-80 transition-opacity cursor-pointer"
          aria-label="Home"
        >
          <img src="/buttons/00_logo_bild.png" alt="Logo" className="h-10 w-auto" />
        </button>
        {navigationItems.map(item => (
          <button
            key={item.path}
            onClick={() => router.push(item.path)}
            className={`hover:opacity-80 transition-opacity ${pathname === item.path ? 'opacity-100' : 'opacity-70'}`}
            title={item.label}
            aria-label={item.label}
          >
            <img src={item.image} alt={item.label} className="h-10 w-auto" />
          </button>
        ))}
      </div>
    </nav>
  )
}
