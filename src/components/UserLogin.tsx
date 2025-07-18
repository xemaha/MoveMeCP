'use client'

import { useState } from 'react'
import { useUser } from '@/lib/UserContext'

export function UserLogin() {
  const [name, setName] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const { setUser } = useUser()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return

    setIsLoading(true)

    try {
      // Create a simple user object
      const user = {
        id: `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        name: name.trim(),
        created_at: new Date().toISOString()
      }

      setUser(user)
      console.log('User logged in:', user)
    } catch (error) {
      console.error('Error logging in:', error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="max-w-md w-full space-y-8 p-8">
        <div className="text-center">
          <h2 className="mt-6 text-3xl font-bold text-gray-900">
            🎬 MoveMe
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Willkommen! Gib deinen Namen ein, um zu starten.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700">
              Dein Name
            </label>
            <input
              id="name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="z.B. Max Mustermann"
              required
            />
          </div>

          <button
            type="submit"
            disabled={isLoading || !name.trim()}
            className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? 'Anmelden...' : 'Los geht\'s! 🚀'}
          </button>
        </form>

        <div className="text-center text-xs text-gray-500">
          <p>Kein Passwort erforderlich. Dein Name wird lokal gespeichert.</p>
        </div>
      </div>
    </div>
  )
}
