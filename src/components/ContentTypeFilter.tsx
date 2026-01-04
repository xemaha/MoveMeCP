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
    { key: 'film', label: 'Filme', image: '/buttons/02_Filme_filter.png' },
    { key: 'serie', label: 'Serien', image: '/buttons/02_serien_filter.png' },
    { key: 'buch', label: 'Bücher', image: '/buttons/02_books_filter.png' }
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
        {types.map(({ key, label, image }) => (
          <button
            key={key}
            onClick={() => handleClick(key)}
            className={`transition-opacity ${
              selected[key as keyof typeof selected]
                ? 'opacity-100'
                : 'opacity-50 hover:opacity-70'
            }`}
            title={label}
          >
            <img src={image} alt={label} className="h-10 w-auto" />
          </button>
        ))}
      </div>
    </div>
  )
}
