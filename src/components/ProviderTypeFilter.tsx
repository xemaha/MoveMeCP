'use client'

interface ProviderTypeFilterProps {
  selectedTypes: {
    flatrate: boolean
    rent: boolean
    buy: boolean
    unavailable: boolean
  }
  onChange: (selectedTypes: any) => void
  hasPersonalProviders: boolean
}

export function ProviderTypeFilter({
  selectedTypes,
  onChange,
  hasPersonalProviders
}: ProviderTypeFilterProps) {
  if (!hasPersonalProviders) {
    return null
  }

  const toggleFilter = (type: 'flatrate' | 'rent' | 'buy' | 'unavailable') => {
    onChange({
      ...selectedTypes,
      [type]: !selectedTypes[type]
    })
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
      <div className="flex flex-wrap items-center gap-3">
        <span className="text-sm font-semibold text-gray-700">Nach Verfügbarkeit:</span>
        
        <button
          onClick={() => toggleFilter('flatrate')}
          className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${
            selectedTypes.flatrate
              ? 'bg-blue-500 text-white'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          💳 Im Abo
        </button>
        
        <button
          onClick={() => toggleFilter('rent')}
          className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${
            selectedTypes.rent
              ? 'bg-green-500 text-white'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          🎬 Leihen
        </button>
        
        <button
          onClick={() => toggleFilter('buy')}
          className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${
            selectedTypes.buy
              ? 'bg-purple-500 text-white'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          🛒 Kaufen
        </button>
        
        <button
          onClick={() => toggleFilter('unavailable')}
          className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${
            selectedTypes.unavailable
              ? 'bg-gray-700 text-white'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          ❌ Nicht verfügbar
        </button>
      </div>
    </div>
  )
}
