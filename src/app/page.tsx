'use client'

import Link from 'next/link'
import { UserProvider, useUser } from '@/lib/UserContext'
import AuthForm from '@/components/AuthForm'
import { UserHeader } from '@/components/UserHeader'

function LandingContent() {
  const { user, isLoading, setUser } = useUser()

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Lade App...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return <AuthForm />
  }

  const actions = [
    {
      href: '/add',
      title: 'Add new',
      description: 'Neuen Film, Serie oder Buch hinzufügen',
      icon: '➕',
      color: 'bg-blue-50 border-blue-200 hover:border-blue-300'
    },
    {
      href: '/search',
      title: 'Search database',
      description: 'Filter, suchen und stöbern in deiner Sammlung',
      icon: '🔎',
      color: 'bg-green-50 border-green-200 hover:border-green-300'
    },
    {
      href: '/recommendations',
      title: 'Get recommendations',
      description: 'Personalisierte Vorschläge basierend auf deinem Geschmack',
      icon: '✨',
      color: 'bg-purple-50 border-purple-200 hover:border-purple-300'
    },
    {
      href: '/watchlist',
      title: 'My Watchlist',
      description: 'Alle deine Favoriten schnell verfügbar',
      icon: '👁️',
      color: 'bg-orange-50 border-orange-200 hover:border-orange-300'
    }
  ]

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#fcfcfd' }}>
      <UserHeader />
      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center mb-10">
          <img src="/emova_text.png" alt="EMOVA" className="h-48 w-auto mx-auto mb-8" />
          <p className="text-gray-600">Wähle, was du als Nächstes tun möchtest.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {actions.map((action) => (
            <Link
              key={action.href}
              href={action.href}
              className={`group rounded-xl border transition-all shadow-sm ${action.color} p-6 flex flex-col items-start gap-3 hover:shadow-md`}
            >
              <span className="text-4xl" aria-hidden>
                {action.icon}
              </span>
              <div>
                <div className="text-lg font-semibold text-gray-900">{action.title}</div>
                <p className="text-sm text-gray-600">{action.description}</p>
              </div>
              <span className="mt-auto text-sm font-medium text-blue-600 group-hover:text-blue-700">Weiter →</span>
            </Link>
          ))}
        </div>

        <div className="mt-10 text-center">
          <button
            onClick={() => setUser(null)}
            className="text-sm text-gray-500 hover:text-gray-700 underline"
          >
            Abmelden
          </button>
        </div>
      </main>
    </div>
  )
}

export default function Home() {
  return (
    <UserProvider>
      <LandingContent />
    </UserProvider>
  )
}
