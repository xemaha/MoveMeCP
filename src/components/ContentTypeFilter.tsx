'use client'

import React from 'react'

interface ContentTypeFilterProps {
  selected: {
    film: boolean
    serie: boolean
    buch: boolean
  }
  onChange: (contentTypes: { film: boolean; serie: boolean; buch: boolean }) => void
  exclusive?: boolean // If true, only one can be selected at a time
}

export function ContentTypeFilter({ selected, onChange, exclusive = false }: ContentTypeFilterProps) {
  const types = [
    { key: 'film', label: '🎬 Filme', color: 'blue' },
    { key: 'serie', label: '📺 Serien', color: 'purple' },
    { key: 'buch', label: '📚 Bücher', color: 'green' }
  ] as const

  const handleClick = (key: 'film' | 'serie' | 'buch') => {
    if (exclusive) {
      // Exclusive mode: toggle the selected one, others become false
      onChange({
        film: key === 'film' ? !selected.film : false,
        serie: key === 'serie' ? !selected.serie : false,
        buch: key === 'buch' ? !selected.buch : false
      })
    } else {
      // Multiple selection mode
      onChange({
        ...selected,
        [key]: !selected[key]
      })
    }
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
      <h3 className="text-sm font-semibold text-gray-800 mb-3">Inhaltstyp</h3>
      <div className="flex gap-3 flex-wrap">
        {types.map(({ key, label }) => (
          <button
            key={key}
            onClick={() => handleClick(key)}
            className={`px-4 py-2 rounded-lg font-medium transition-all ${
              selected[key as keyof typeof selected]
                ? 'shadow-md hover:shadow-lg'
                : 'opacity-60 hover:opacity-80'
            }`}
            style={{
              backgroundColor: selected[key as keyof typeof selected]
                ? key === 'film'
                  ? '#3b82f6'
                  : key === 'serie'
                    ? '#a855f7'
                    : '#22c55e'
                : key === 'film'
                  ? '#e0e7ff'
                  : key === 'serie'
                    ? '#f3e8ff'
                    : '#f0fdf4',
              color: selected[key as keyof typeof selected] ? 'white' : '#6b7280'
            }}
          >
            {label}
          </button>
        ))}
      </div>
    </div>
  )
}
