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
      description: 'Neuen Film, Serie oder Buch hinzufügen und direkt watchlisten, bewerten oder empfehlen',
      image: '/buttons/01_add.png',
      color: 'bg-blue-50 border-blue-200 hover:border-blue-300'
    },
    {
      href: '/search',
      title: 'Search Database',
      description: 'Stöbere und filtere in deiner Sammlung und den Sammlungen deiner friends',
      image: '/buttons/01_search.png',
      color: 'bg-green-50 border-green-200 hover:border-green-300'
    },
    {
      href: '/recommendations',
      title: 'Get recommendations',
      description: 'Persönliche Empfehlungen deiner friends und AI-Vorschläge basierend auf deinem Geschmack',
      image: '/buttons/01_reco.png',
      color: 'bg-purple-50 border-purple-200 hover:border-purple-300'
    },
    {
      href: '/watchlist',
      title: 'My Watch/Readlist',
      description: 'Alles was du noch sehen oder lesen willst schnell inkl Verfügbarkeit auf DEINEN Plattformen',
      image: '/buttons/01_watchlist.png',
      color: 'bg-orange-50 border-orange-200 hover:border-orange-300'
    }
  ]

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#fcfcfd' }}>
      <UserHeader />
      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center mb-10">
          <img src="/buttons/00_logo_full.png" alt="Logo" className="h-48 w-auto mx-auto mb-8" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {actions.map((action) => (
            <Link
              key={action.href}
              href={action.href}
              className={`group rounded-xl border transition-all shadow-sm ${action.color} p-6 flex flex-col items-start gap-3 hover:shadow-md`}
            >
              <img src={action.image} alt={action.title} className="h-16 w-auto" />
              <div>
                <div className="text-lg font-semibold text-gray-900">{action.title}</div>
                <p className="text-sm text-gray-600">{action.description}</p>
              </div>
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
