'use client'

import { useUser } from '@/lib/UserContext'

export function UserHeader() {
  const { user, setUser } = useUser()

  const handleLogout = () => {
    setUser(null)
  }

  if (!user) return null

  return (
    <div className="bg-white shadow-sm border-b">
      <div className="max-w-7xl mx-auto px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <h1 className="text-2xl font-bold text-gray-900">🎬 MoveMe</h1>
            <span className="text-sm text-gray-600">
              von <span className="font-medium text-blue-600">{user.name}</span>
            </span>
          </div>
          
          <button
            onClick={handleLogout}
            className="text-sm text-gray-500 hover:text-gray-700 transition-colors"
          >
            Abmelden
          </button>
        </div>
      </div>
    </div>
  )
}
