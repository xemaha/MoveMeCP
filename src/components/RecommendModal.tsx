'use client'

import { useState, useEffect, useRef } from 'react'
import { supabase } from '@/lib/supabase'

interface RecommendModalProps {
  movie: {
    id: string
    title: string
  }
  currentUserId: string
  onClose: () => void
  onSuccess: (recipients: string[]) => void
}

interface User {
  id: string
  username: string
}

export function RecommendModal({ movie, currentUserId, onClose, onSuccess }: RecommendModalProps) {
  const [users, setUsers] = useState<User[]>([])
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isSending, setIsSending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [searchText, setSearchText] = useState('')
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    loadUsers()
  }, [currentUserId])

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const loadUsers = async () => {
    setIsLoading(true)
    setError(null)
    try {
      const { data, error: fetchError } = await supabase
        .from('user_profiles')
        .select('user_id, alias')
        .neq('user_id', currentUserId)
        .order('alias')

      if (fetchError) {
        console.error('Supabase fetch error:', fetchError)
        setError(`Fehler beim Laden der Benutzer: ${fetchError.message}`)
        return
      }
      
      if (!data || data.length === 0) {
        setError('Keine anderen Benutzer gefunden')
        setUsers([])
        return
      }

      // Map to our User interface
      const mappedUsers = (data as any[]).map((profile: any) => ({
        id: profile.user_id,
        username: profile.alias
      }))
      
      setUsers(mappedUsers)
      setError(null)
    } catch (error) {
      console.error('Error loading users:', error)
      setError(`Fehler: ${error instanceof Error ? error.message : 'Unbekannter Fehler'}`)
    } finally {
      setIsLoading(false)
    }
  }

  const filteredUsers = users.filter(user =>
    user.username.toLowerCase().includes(searchText.toLowerCase())
  )

  const selectedUsers = users.filter(u => selectedUserIds.includes(u.id))

  const addUser = (user: User) => {
    if (!selectedUserIds.includes(user.id)) {
      setSelectedUserIds([...selectedUserIds, user.id])
    }
    setSearchText('')
    setIsDropdownOpen(false)
  }

  const removeUser = (userId: string) => {
    setSelectedUserIds(selectedUserIds.filter(id => id !== userId))
  }

  const handleRecommend = async () => {
    if (selectedUserIds.length === 0) {
      setError('Bitte wählen Sie mindestens eine Person aus')
      return
    }

    setIsSending(true)
    setError(null)
    try {
      const recommendations = selectedUserIds.map(toUserId => ({
        movie_id: movie.id,
        from_user_id: currentUserId,
        to_user_id: toUserId
      }))

      console.log('Sending recommendations:', {
        count: recommendations.length,
        movieId: movie.id,
        fromUserId: currentUserId,
        toUserIds: selectedUserIds
      })

      const { data, error: insertError } = await supabase
        .from('personal_recommendations')
        .insert(recommendations)
        .select()

      if (insertError) {
        console.error('Supabase insert error details:', {
          message: insertError.message,
          code: (insertError as any).code,
          details: (insertError as any).details,
          hint: (insertError as any).hint,
          fullError: insertError
        })
        
        // More helpful error messages
        let userMessage = 'Fehler beim Speichern der Empfehlung'
        
        if (insertError.message) {
          if ((insertError as any).code === '42501') {
            userMessage = 'Sie haben keine Berechtigung, Empfehlungen zu erstellen. Bitte überprüfen Sie Ihre Anmeldung.'
          } else if (insertError.message.includes('unique')) {
            userMessage = 'Sie haben diesen Film dieser Person bereits empfohlen.'
          } else if (insertError.message.includes('violates foreign key constraint')) {
            userMessage = 'Ungültige Film- oder Benutzer-ID. Bitte versuchen Sie es erneut.'
          } else {
            userMessage = `Fehler: ${insertError.message}`
          }
        }
        
        setError(userMessage)
        return
      }

      console.log('Recommendations saved successfully:', data?.length || 0, 'recommendations')

      // Get usernames for success message
      const selectedUsernames = selectedUsers.map(u => u.username)
      onSuccess(selectedUsernames)
    } catch (error) {
      console.error('Error creating recommendations:', error)
      setError(`Fehler: ${error instanceof Error ? error.message : 'Unbekannter Fehler'}`)
    } finally {
      setIsSending(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[80vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="bg-blue-600 text-white p-4 flex items-center justify-between flex-shrink-0">
          <h2 className="text-xl font-semibold flex items-center gap-2">
            ↗️ Film empfehlen
          </h2>
          <button
            onClick={onClose}
            className="text-white hover:text-gray-200 text-2xl leading-none"
          >
            ×
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto flex-1">
          <div className="mb-4">
            <p className="text-sm text-gray-600 mb-2">Film:</p>
            <p className="font-semibold text-gray-900">{movie.title}</p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-800">{error}</p>
            </div>
          )}

          {/* User Selection Dropdown */}
          <div className="mb-6">
            <p className="text-sm font-medium text-gray-700 mb-3">
              An folgende Personen empfehlen:
            </p>

            {isLoading ? (
              <div className="text-center py-4 text-gray-500">Lade Benutzer...</div>
            ) : (
              <>
                {/* Dropdown Input */}
                <div className="relative" ref={dropdownRef}>
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="Person suchen und hinzufügen..."
                      value={searchText}
                      onChange={(e) => {
                        setSearchText(e.target.value)
                        setIsDropdownOpen(true)
                      }}
                      onFocus={() => setIsDropdownOpen(true)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                    />
                    {isDropdownOpen && (
                      <svg className="absolute right-3 top-2.5 w-5 h-5 text-gray-400 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                      </svg>
                    )}
                  </div>

                  {/* Dropdown List */}
                  {isDropdownOpen && filteredUsers.length > 0 && (
                    <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-300 rounded-lg shadow-lg z-10">
                      <div className="max-h-48 overflow-y-auto">
                        {filteredUsers.map(user => (
                          <button
                            key={user.id}
                            onClick={() => addUser(user)}
                            disabled={selectedUserIds.includes(user.id)}
                            className="w-full text-left px-3 py-2 hover:bg-blue-50 transition-colors disabled:opacity-50 disabled:bg-gray-50 text-sm"
                          >
                            {selectedUserIds.includes(user.id) && (
                              <span className="text-blue-600 mr-2">✓</span>
                            )}
                            {user.username}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {isDropdownOpen && searchText && filteredUsers.length === 0 && (
                    <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-300 rounded-lg shadow-lg z-10 p-3 text-center text-gray-500 text-sm">
                      Keine Personen gefunden
                    </div>
                  )}
                </div>

                {/* Selected Users Tags */}
                {selectedUsers.length > 0 && (
                  <div className="mt-4 flex flex-wrap gap-2">
                    {selectedUsers.map(user => (
                      <div
                        key={user.id}
                        className="inline-flex items-center gap-2 bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm"
                      >
                        <span>{user.username}</span>
                        <button
                          onClick={() => removeUser(user.id)}
                          className="text-blue-600 hover:text-blue-800 font-bold"
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>

          {selectedUserIds.length > 0 && (
            <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg">
              <p className="text-sm text-green-800">
                ✓ {selectedUserIds.length} {selectedUserIds.length === 1 ? 'Person' : 'Personen'} ausgewählt
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="bg-gray-50 px-6 py-4 flex justify-end gap-3 border-t flex-shrink-0">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-700 hover:bg-gray-200 rounded-lg transition-colors"
          >
            Abbrechen
          </button>
          <button
            onClick={handleRecommend}
            disabled={selectedUserIds.length === 0 || isSending}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {isSending ? (
              <>
                <span className="animate-spin">⏳</span>
                Sende...
              </>
            ) : (
              <>
                ↗️ Empfehlen
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
