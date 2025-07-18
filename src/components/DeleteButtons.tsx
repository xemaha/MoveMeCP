'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'

interface DeleteMovieButtonProps {
  movieId: string
  movieTitle: string
  onDeleted: () => void
}

export function DeleteMovieButton({ movieId, movieTitle, onDeleted }: DeleteMovieButtonProps) {
  const [isDeleting, setIsDeleting] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)

  const handleDelete = async () => {
    setIsDeleting(true)
    try {
      // Delete movie (will cascade delete ratings and movie_tags)
      const { error } = await supabase
        .from('movies')
        .delete()
        .eq('id', movieId)

      if (error) throw error

      console.log('Film erfolgreich gelöscht')
      onDeleted()
    } catch (error) {
      console.error('Error deleting movie:', error)
      alert('Fehler beim Löschen des Films')
    } finally {
      setIsDeleting(false)
      setShowConfirm(false)
    }
  }

  if (showConfirm) {
    return (
      <div className="flex items-center space-x-2">
        <span className="text-sm text-gray-600">Film &quot;{movieTitle}&quot; löschen?</span>
        <button
          onClick={handleDelete}
          disabled={isDeleting}
          className="px-2 py-1 bg-red-600 text-white text-xs rounded hover:bg-red-700 disabled:opacity-50"
        >
          {isDeleting ? 'Lösche...' : 'Ja, löschen'}
        </button>
        <button
          onClick={() => setShowConfirm(false)}
          className="px-2 py-1 bg-gray-300 text-gray-700 text-xs rounded hover:bg-gray-400"
        >
          Abbrechen
        </button>
      </div>
    )
  }

  return (
    <button
      onClick={() => setShowConfirm(true)}
      className="text-red-600 hover:text-red-800 text-sm"
    >
      🗑️ Löschen
    </button>
  )
}

interface DeleteTagButtonProps {
  tagId: string
  tagName: string
  onDeleted: () => void
}

export function DeleteTagButton({ tagId, tagName, onDeleted }: DeleteTagButtonProps) {
  const [isDeleting, setIsDeleting] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)

  const handleDelete = async () => {
    setIsDeleting(true)
    try {
      // Delete tag (will cascade delete movie_tags)
      const { error } = await supabase
        .from('tags')
        .delete()
        .eq('id', tagId)

      if (error) throw error

      console.log('Tag erfolgreich gelöscht')
      onDeleted()
    } catch (error) {
      console.error('Error deleting tag:', error)
      alert('Fehler beim Löschen des Tags')
    } finally {
      setIsDeleting(false)
      setShowConfirm(false)
    }
  }

  if (showConfirm) {
    return (
      <div className="flex items-center space-x-1">
        <span className="text-xs text-gray-600">Tag löschen?</span>
        <button
          onClick={handleDelete}
          disabled={isDeleting}
          className="px-1 py-0.5 bg-red-600 text-white text-xs rounded hover:bg-red-700 disabled:opacity-50"
        >
          {isDeleting ? '...' : 'Ja'}
        </button>
        <button
          onClick={() => setShowConfirm(false)}
          className="px-1 py-0.5 bg-gray-300 text-gray-700 text-xs rounded hover:bg-gray-400"
        >
          Nein
        </button>
      </div>
    )
  }

  return (
    <button
      onClick={() => setShowConfirm(true)}
      className="text-red-600 hover:text-red-800 text-xs ml-1"
    >
      ×
    </button>
  )
}
