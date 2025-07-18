'use client'

import { useState, useEffect } from 'react'
import { supabase, Movie, Tag } from '@/lib/supabase'
import { useUser } from '@/lib/UserContext'

interface MovieWithDetails extends Movie {
  tags: Tag[]
  averageRating: number
  ratingCount: number
  ratings: Array<{
    rating: number
    user_name: string
    user_id: string
  }>
}

interface MovieDetailModalProps {
  movie: MovieWithDetails
  isOpen: boolean
  onClose: () => void
  onMovieUpdated: () => void
}

export function MovieDetailModal({ movie, isOpen, onClose, onMovieUpdated }: MovieDetailModalProps) {
  const [editedMovie, setEditedMovie] = useState<Partial<Movie>>({})
  const [allTags, setAllTags] = useState<Tag[]>([])
  const [selectedTags, setSelectedTags] = useState<string[]>([])
  const [newTagName, setNewTagName] = useState('')
  const [newTagColor, setNewTagColor] = useState('#3B82F6')
  const [isLoading, setIsLoading] = useState(false)
  const { user } = useUser()

  useEffect(() => {
    if (isOpen && movie) {
      // Initialize edit form with current movie data
      setEditedMovie({
        title: movie.title,
        description: movie.description || '',
        content_type: movie.content_type
      })
      setSelectedTags(movie.tags.map(tag => tag.name))
      fetchAllTags()
    }
  }, [isOpen, movie])

  const fetchAllTags = async () => {
    try {
      const { data, error } = await supabase
        .from('tags')
        .select('*')
        .order('name')

      if (error) {
        console.error('Error fetching tags:', error)
      } else {
        setAllTags((data as unknown as Tag[]) || [])
      }
    } catch (error) {
      console.error('Error fetching tags:', error)
    }
  }

  const handleSave = async () => {
    setIsLoading(true)
    try {
      // Update movie details
      const { error: movieError } = await supabase
        .from('movies')
        .update({
          title: editedMovie.title,
          description: editedMovie.description,
          content_type: editedMovie.content_type
        })
        .eq('id', movie.id)

      if (movieError) {
        console.error('Error updating movie:', movieError)
        alert('Fehler beim Aktualisieren des Films')
        return
      }

      // Update tags
      await updateMovieTags()

      onMovieUpdated()
      onClose()
    } catch (error) {
      console.error('Error saving movie:', error)
      alert('Fehler beim Speichern')
    } finally {
      setIsLoading(false)
    }
  }

  const updateMovieTags = async () => {
    try {
      // Remove all existing tags for this movie
      await supabase
        .from('movie_tags')
        .delete()
        .eq('movie_id', movie.id)

      // Add selected tags
      if (selectedTags.length > 0) {
        const tagInserts = selectedTags.map(tagName => {
          const tag = allTags.find(t => t.name === tagName)
          return {
            movie_id: movie.id,
            tag_id: tag?.id
          }
        }).filter(insert => insert.tag_id) // Only include valid tag IDs

        if (tagInserts.length > 0) {
          const { error } = await supabase
            .from('movie_tags')
            .insert(tagInserts)

          if (error) {
            console.error('Error updating movie tags:', error)
          }
        }
      }
    } catch (error) {
      console.error('Error updating tags:', error)
    }
  }

  const createNewTag = async () => {
    if (!newTagName.trim()) return

    try {
      const { data, error } = await supabase
        .from('tags')
        .insert([{
          name: newTagName.trim(),
          color: newTagColor
        }])
        .select()

      if (error) {
        console.error('Error creating tag:', error)
        alert('Fehler beim Erstellen des Tags')
        return
      }

      if (data && data[0]) {
        const newTag = data[0] as unknown as Tag
        setAllTags([...allTags, newTag])
        setSelectedTags([...selectedTags, newTag.name])
        setNewTagName('')
        setNewTagColor('#3B82F6')
      }
    } catch (error) {
      console.error('Error creating tag:', error)
      alert('Fehler beim Erstellen des Tags')
    }
  }

  const toggleTag = (tagName: string) => {
    setSelectedTags(prev => 
      prev.includes(tagName) 
        ? prev.filter(t => t !== tagName)
        : [...prev, tagName]
    )
  }

  const handleDeleteMovie = async () => {
    if (!confirm(`Möchtest du "${movie.title}" wirklich löschen?`)) {
      return
    }

    try {
      const { error } = await supabase
        .from('movies')
        .delete()
        .eq('id', movie.id)

      if (error) {
        console.error('Error deleting movie:', error)
        alert('Fehler beim Löschen')
        return
      }

      onMovieUpdated()
      onClose()
    } catch (error) {
      console.error('Error deleting movie:', error)
      alert('Fehler beim Löschen')
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-0 sm:p-4 z-50">
      <div className="bg-white rounded-t-lg sm:rounded-lg shadow-xl w-full sm:max-w-2xl max-h-[100vh] sm:max-h-[90vh] overflow-y-auto flex flex-col">
        <div className="p-4 sm:p-6 flex-1 flex flex-col">
          <div className="flex justify-between items-center mb-4 sm:mb-6">
            <h2 className="text-lg sm:text-xl font-bold text-gray-900">Tags bearbeiten</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 text-2xl"
            >
              ×
            </button>
          </div>

          <div className="space-y-3 sm:space-y-4">
            {/* Title */}
            {/* Nur Tags bearbeiten auf Mobile */}

            {/* Tags */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tags bearbeiten
              </label>
              
              {/* Current Tags */}
              <div className="mb-4">
                <h4 className="text-sm font-medium text-gray-600 mb-2">Aktuelle Tags:</h4>
                <div className="flex flex-wrap gap-2">
                  {selectedTags.map(tagName => {
                    const tag = allTags.find(t => t.name === tagName)
                    return (
                      <button
                        key={tagName}
                        onClick={() => toggleTag(tagName)}
                        className="flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium text-white hover:opacity-80 transition-opacity"
                        style={{ backgroundColor: tag?.color || '#6B7280' }}
                      >
                        {tagName}
                        <span className="text-xs">✕</span>
                      </button>
                    )
                  })}
                  {selectedTags.length === 0 && (
                    <p className="text-sm text-gray-500 italic">Keine Tags ausgewählt</p>
                  )}
                </div>
              </div>

              {/* Available Tags to Add */}
              <div className="mb-4">
                <h4 className="text-sm font-medium text-gray-600 mb-2">Tags hinzufügen:</h4>
                <div className="flex flex-wrap gap-2">
                  {allTags.filter(tag => !selectedTags.includes(tag.name)).map(tag => (
                    <button
                      key={tag.id}
                      onClick={() => toggleTag(tag.name)}
                      className="px-3 py-1 rounded-full text-sm font-medium text-white opacity-60 hover:opacity-100 transition-opacity"
                      style={{ backgroundColor: tag.color }}
                    >
                      {tag.name}
                      <span className="ml-1 text-xs">+</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* New Tag Creation */}
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Neuer Tag..."
                  value={newTagName}
                  onChange={(e) => setNewTagName(e.target.value)}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <input
                  type="color"
                  value={newTagColor}
                  onChange={(e) => setNewTagColor(e.target.value)}
                  className="w-12 h-10 border border-gray-300 rounded-md cursor-pointer"
                />
                <button
                  onClick={createNewTag}
                  disabled={!newTagName.trim()}
                  className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50"
                >
                  + Tag
                </button>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center pt-4 sm:pt-6 border-t border-gray-200 mt-4 sm:mt-6 gap-2 sm:gap-0">
            <button
              onClick={handleDeleteMovie}
              className="w-full sm:w-auto mb-2 sm:mb-0 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
            >
              🗑️ Löschen
            </button>
            <div className="flex gap-2 w-full sm:w-auto">
              <button
                onClick={onClose}
                className="flex-1 sm:flex-none px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400 transition-colors"
              >
                Abbrechen
              </button>
              <button
                onClick={handleSave}
                disabled={isLoading}
                className="flex-1 sm:flex-none px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 transition-colors"
              >
                {isLoading ? 'Speichert...' : 'Speichern'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
