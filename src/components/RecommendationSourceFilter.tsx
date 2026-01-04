'use client'

interface RecommendationSourceFilterProps {
  selected: 'all' | 'ai' | 'personal'
  onChange: (source: 'all' | 'ai' | 'personal') => void
}

export function RecommendationSourceFilter({ selected, onChange }: RecommendationSourceFilterProps) {
  const options = [
    { value: 'all' as const, label: 'Alle Empfehlungen', image: '/buttons/05_all_filter.png' },
    { value: 'ai' as const, label: 'KI-Empfehlungen', image: '/buttons/05_ai_reco_filter.png' },
    { value: 'personal' as const, label: 'Von Freundinnen', image: '/buttons/05_friends_reco_filter.png' }
  ]

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
      <h3 className="text-sm font-medium text-gray-700 mb-3">Empfehlungsquelle</h3>
      <div className="flex flex-wrap gap-3">
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
            <img src={option.image} alt={option.label} className="h-10 w-auto" />
          </button>
        ))}
      </div>
    </div>
  )
}
