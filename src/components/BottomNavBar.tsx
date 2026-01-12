'use client'

import { useRouter, usePathname } from 'next/navigation'
import { useUser } from '@/lib/UserContext'

export function BottomNavBar() {
  const router = useRouter()
  const pathname = usePathname()
  const { user } = useUser()


  const navigationItems = [
    { label: 'Hinzufügen', path: '/add', image: '/buttons/01_add.png' },
    { label: 'Suchen', path: '/search', image: '/buttons/01_search.png' },
    { label: 'Empfehlungen', path: '/recommendations', image: '/buttons/01_reco.png' },
    { label: 'Watchlist', path: '/watchlist', image: '/buttons/01_watchlist.png' }
  ]

  return (
    <nav className="fixed bottom-0 left-0 w-full z-50 bg-[#fcfcfd] border-t shadow-md" style={{ borderTopColor: '#e5e5e5' }}>
      <div className="max-w-2xl mx-auto flex flex-row items-center justify-between py-4 px-4">
        {/* Home Button ganz links */}
        <div className="flex-1 flex justify-start">
          <button
            onClick={() => router.push('/')}
            className="flex items-center hover:opacity-80 transition-opacity cursor-pointer"
            aria-label="Home"
          >
            <img src="/buttons/00_logo_bild.png" alt="Logo" className="h-12 w-auto" />
          </button>
        </div>
        {/* Vier Buttons rechtsbündig und näher zusammen */}
        <div
          className="flex flex-1 justify-end gap-2 sm:gap-4"
          style={{ alignItems: 'center', height: '100%' }}
        >
          {navigationItems.map(item => (
            <button
              key={item.path}
              onClick={() => router.push(item.path)}
              className={`hover:opacity-80 transition-opacity ${pathname === item.path ? 'opacity-100' : 'opacity-70'} flex items-center p-0`}
              title={item.label}
              aria-label={item.label}
              style={{ minWidth: 0, paddingTop: 4, paddingBottom: 4 }}
            >
              <img
                src={item.image}
                alt={item.label}
                className="w-auto"
                style={{
                  display: 'block',
                  maxHeight: 'calc(64px + 4vw)', // dynamisch, aber limitiert
                  minHeight: 40,
                  maxWidth: 72,
                  marginTop: 2,
                  marginBottom: 2,
                }}
                draggable={false}
              />
            </button>
          ))}
        </div>
      </div>
    </nav>
  )
}
