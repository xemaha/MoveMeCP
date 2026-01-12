"use client"
import { useRouter, usePathname } from 'next/navigation'
import { useUser } from '@/lib/UserContext'

export function ResponsiveNavBar() {
  const router = useRouter()
  const pathname = usePathname()
  const { user } = useUser()
  if (!user) return null

  const navigationItems = [
    { label: 'Home', path: '/', image: '/buttons/00_logo_bild.png' },
    { label: 'Hinzufügen', path: '/add', image: '/buttons/01_add.png' },
    { label: 'Suchen', path: '/search', image: '/buttons/01_search.png' },
    { label: 'Empfehlungen', path: '/recommendations', image: '/buttons/01_reco.png' },
    { label: 'Watchlist', path: '/watchlist', image: '/buttons/01_watchlist.png' }
  ]

  return (
    <nav
      className="z-50 w-full bg-white border-t shadow fixed bottom-0 left-0 flex flex-row items-center justify-center"
      style={{ backgroundColor: '#fcfcfd' }}
    >
      <div className="flex justify-around items-center w-full max-w-2xl mx-auto px-2 py-1">
        {navigationItems.map(item => (
          <button
            key={item.path}
            onClick={() => router.push(item.path)}
            className={`flex flex-col items-center hover:opacity-80 transition-opacity px-2 py-1 ${
              pathname === item.path ? 'opacity-100' : 'opacity-70'
            }`}
            title={item.label}
            aria-label={item.label}
          >
            <img src={item.image} alt={item.label} className={item.path === '/' ? 'h-10 w-auto' : 'h-8 w-auto'} />
          </button>
        ))}
      </div>
    </nav>
  )
}