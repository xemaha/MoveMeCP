'use client'

interface RecommendationSourceFilterProps {
  selected: 'all' | 'ai' | 'personal'
  onChange: (source: 'all' | 'ai' | 'personal') => void
}

export function RecommendationSourceFilter({ selected, onChange }: RecommendationSourceFilterProps) {
  const options = [
    { value: 'all' as const, label: '🎯 Alle Empfehlungen', color: 'purple' },
    { value: 'ai' as const, label: '🤖 KI-Empfehlungen', color: 'blue' },
    { value: 'personal' as const, label: '👥 Von Freundinnen', color: 'pink' }
  ]

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
      <h3 className="text-sm font-medium text-gray-700 mb-3">Empfehlungsquelle</h3>
      <div className="flex flex-wrap gap-2">
        {options.map(option => (
          <button
            key={option.value}
            onClick={() => onChange(option.value)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              selected === option.value
                ? option.color === 'purple'
                  ? 'bg-purple-600 text-white shadow-md'
                  : option.color === 'blue'
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'bg-pink-600 text-white shadow-md'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {option.label}
          </button>
        ))}
      </div>
    </div>
  )
}
