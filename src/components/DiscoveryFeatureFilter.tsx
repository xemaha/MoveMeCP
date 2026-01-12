'use client'

import React from 'react'

export type DiscoveryFeature = 'genres' | 'directors' | 'actors' | 'keywords'

export interface DiscoveryFeatureFilterProps {
  selected: Record<DiscoveryFeature, boolean>
  onChange: (selected: Record<DiscoveryFeature, boolean>) => void
}

const featureMeta: Record<DiscoveryFeature, { label: string; emoji: string }> = {
  genres: { label: 'Genres', emoji: '🎞️' },
  directors: { label: 'Regie', emoji: '🎬' },
  actors: { label: 'Schauspieler:innen', emoji: '🎭' },
  keywords: { label: 'Themen/Keywords', emoji: '🔑' }
}

export function DiscoveryFeatureFilter({ selected, onChange }: DiscoveryFeatureFilterProps) {
  const handleToggle = (feature: DiscoveryFeature) => {
    onChange({ ...selected, [feature]: !selected[feature] })
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
      <h3 className="text-sm font-semibold text-gray-800 mb-2">Discovery-Logik steuern</h3>
      <div className="flex flex-wrap gap-3">
        {Object.entries(featureMeta).map(([key, { label, emoji }]) => (
          <button
            key={key}
            onClick={() => handleToggle(key as DiscoveryFeature)}
            className={`transition-opacity px-4 py-2 rounded-lg font-medium border-2 ${
              selected[key as DiscoveryFeature]
                ? 'bg-blue-600 text-white border-blue-600 shadow-md hover:bg-blue-700'
                : 'bg-gray-100 text-gray-700 border-gray-300 hover:bg-gray-200'
            }`}
            title={label}
          >
            <span className="mr-2">{emoji}</span>
            {label}
          </button>
        ))}
      </div>
      <p className="text-xs text-gray-500 mt-3">Wähle, welche Merkmale für die Empfehlungen genutzt werden sollen.</p>
    </div>
  )
}
