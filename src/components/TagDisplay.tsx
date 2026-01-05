import React, { useState } from 'react'
import { Tag } from '@/lib/supabase'

const TagDisplay: React.FC<{ tags: Tag[] }> = ({ tags }) => {
  const [expanded, setExpanded] = useState(false)

  if (!tags?.length) return null

  const sortedTags = [...tags].sort((a, b) => a.name.localeCompare(b.name))
  const visibleTags = expanded ? sortedTags : sortedTags.slice(0, 8)
  const hasMore = sortedTags.length > visibleTags.length

  return (
    <div className="flex flex-wrap gap-2 mt-2">
      {visibleTags.map((tag) => (
        <span
          key={tag.id}
          className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium"
          style={{
            backgroundColor: tag.color + '20',
            color: tag.color
          }}
        >
          {tag.name}
        </span>
      ))}
      {hasMore && (
        <button
          className="ml-2 text-xs text-blue-600 underline hover:text-blue-800"
          onClick={() => setExpanded(!expanded)}
        >
          {expanded ? 'Weniger anzeigen' : 'Alle anzeigen'}
        </button>
      )}
    </div>
  )
}

export default TagDisplay
