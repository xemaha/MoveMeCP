'use client'

interface RecommendationSourceFilterProps {
  selected: 'all' | 'ai' | 'personal' | 'discover'
  onChange: (source: 'all' | 'ai' | 'personal' | 'discover') => void
}

export function RecommendationSourceFilter({ selected, onChange }: RecommendationSourceFilterProps) {
  const options = [
    { value: 'all' as const, label: 'Alle Empfehlungen', image: '/buttons/05_all_filter.png' },
    { value: 'ai' as const, label: 'KI-Empfehlungen', image: '/buttons/05_ai_reco_filter.png' },
    { value: 'personal' as const, label: 'Von Freundinnen', image: '/buttons/05_friends_reco_filter.png' },
    { value: 'discover' as const, label: 'Discover new movies', image: null }
  ]

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
      <h3 className="text-sm font-semibold text-gray-800 mb-2">Empfehlungsquelle</h3>
      <div className="flex flex-wrap gap-2 sm:gap-3">
        {options.map(option => (
          <button
            key={option.value}
            onClick={() => onChange(option.value)}
            className={`transition-opacity ${
              selected === option.value
                ? 'opacity-100'
                : 'opacity-50 hover:opacity-70'
            }`}
            title={option.label}
          >
            {option.image ? (
              <img src={option.image} alt={option.label} className="h-8 w-auto" />
            ) : (
              <span className="text-xs font-medium text-gray-800 px-2.5 py-1.5 rounded-md border border-gray-200 bg-white">
                {option.label}
              </span>
            )}
          </button>
        ))}
      </div>
    </div>
  )
}
