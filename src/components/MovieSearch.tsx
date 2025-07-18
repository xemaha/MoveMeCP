'use client'

import { useState } from 'react'

interface MovieSearchProps {
  onSearch: (query: string) => void
  onTagFilter: (tag: string) => void
}

export function MovieSearch({ onSearch, onTagFilter }: MovieSearchProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'title' | 'tags'>('all')

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    onSearch(searchQuery)
  }

  const handleTagClick = (tag: string) => {
    onTagFilter(tag)
    setSearchQuery(tag)
  }

  const commonTags = [
    'mindblow', 'sci-fi', 'action', 'comedy', 'drama', 'horror', 
    'thriller', 'romance', 'animation', 'documentary', 'fantasy'
  ]

  return (
    <div className="mb-6 space-y-4">
      {/* Search Form */}
      <form onSubmit={handleSearch} className="flex gap-2">
        <div className="flex-1">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Suche nach Filmen oder Tags..."
            className="w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
        <button
          type="submit"
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
        >
          🔍 Suchen
        </button>
      </form>

      {/* Filter Options */}
      <div className="flex flex-wrap gap-2 items-center">
        <span className="text-sm text-gray-600">Filtern nach:</span>
        <div className="flex gap-2">
          <button
            onClick={() => setSelectedFilter('all')}
            className={`px-3 py-1 rounded-full text-sm ${
              selectedFilter === 'all' 
                ? 'bg-blue-100 text-blue-800' 
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Alle
          </button>
          <button
            onClick={() => setSelectedFilter('title')}
            className={`px-3 py-1 rounded-full text-sm ${
              selectedFilter === 'title' 
                ? 'bg-blue-100 text-blue-800' 
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Titel
          </button>
          <button
            onClick={() => setSelectedFilter('tags')}
            className={`px-3 py-1 rounded-full text-sm ${
              selectedFilter === 'tags' 
                ? 'bg-blue-100 text-blue-800' 
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Tags
          </button>
        </div>
      </div>

      {/* Common Tags */}
      <div className="space-y-2">
        <span className="text-sm text-gray-600">Beliebte Tags:</span>
        <div className="flex flex-wrap gap-2">
          {commonTags.map((tag) => (
            <button
              key={tag}
              onClick={() => handleTagClick(tag)}
              className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm hover:bg-gray-200 hover:text-gray-900 transition-colors"
            >
              #{tag}
            </button>
          ))}
        </div>
      </div>

      {/* Clear Search */}
      {searchQuery && (
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-600">Suche nach: "{searchQuery}"</span>
          <button
            onClick={() => {
              setSearchQuery('')
              onSearch('')
            }}
            className="text-sm text-blue-600 hover:text-blue-800"
          >
            Zurücksetzen
          </button>
        </div>
      )}
    </div>
  )
}

// Simple version without props for initial implementation
export function MovieSearchSimple() {
  const [searchQuery, setSearchQuery] = useState('')

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    // This will be handled by the parent component
    console.log('Searching for:', searchQuery)
  }

  const commonTags = [
    'mindblow', 'sci-fi', 'action', 'comedy', 'drama', 'horror', 
    'thriller', 'romance', 'animation', 'documentary', 'fantasy'
  ]

  return (
    <div className="mb-6 space-y-4">
      {/* Search Form */}
      <form onSubmit={handleSearch} className="flex gap-2">
        <div className="flex-1">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Suche nach Filmen oder Tags..."
            className="w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
        <button
          type="submit"
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
        >
          🔍 Suchen
        </button>
      </form>

      {/* Common Tags */}
      <div className="space-y-2">
        <span className="text-sm text-gray-600">Beliebte Tags:</span>
        <div className="flex flex-wrap gap-2">
          {commonTags.map((tag) => (
            <button
              key={tag}
              onClick={() => setSearchQuery(tag)}
              className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm hover:bg-gray-200 hover:text-gray-900 transition-colors"
            >
              #{tag}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
