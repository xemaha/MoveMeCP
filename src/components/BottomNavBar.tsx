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
        <div className="flex-1 flex justify-start pr-8 items-center"> {/* pr-8 für mehr Abstand */}
          <button
            onClick={() => router.push('/')}
            className="flex items-center hover:opacity-80 transition-opacity cursor-pointer"
            aria-label="Home"
            style={{ minWidth: 0 }}
          >
            <img
              src="/buttons/00_logo_bild.png"
              alt="Logo"
              className="h-14 w-auto"
              style={{ display: 'block', maxHeight: '3.5rem', width: 'auto', minHeight: 40, minWidth: 40 }}
              draggable={false}
            />
          </button>
        </div>
        {/* Vier Buttons rechtsbündig und näher zusammen */}
        <div
          className="flex flex-1 justify-end gap-3 sm:gap-5 items-center"
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
                  maxHeight: '3.2rem',
                  minHeight: 36,
                  maxWidth: 60,
                  marginTop: 4,
                  marginBottom: 4,
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
