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
          className={`transition-opacity ${
            selectedTypes.flatrate ? 'opacity-100' : 'opacity-50 hover:opacity-70'
          }`}
          title="Im Abo"
        >
          <img src="/buttons/06_abo_filter.png" alt="Im Abo" className="h-10 w-auto" />
        </button>
        
        <button
          onClick={() => toggleFilter('rent')}
          className={`transition-opacity ${
            selectedTypes.rent ? 'opacity-100' : 'opacity-50 hover:opacity-70'
          }`}
          title="Leihen"
        >
          <img src="/buttons/06_leihen_filter.png" alt="Leihen" className="h-10 w-auto" />
        </button>
        
        <button
          onClick={() => toggleFilter('buy')}
          className={`transition-opacity ${
            selectedTypes.buy ? 'opacity-100' : 'opacity-50 hover:opacity-70'
          }`}
          title="Kaufen"
        >
          <img src="/buttons/06_kaufen_filter.png" alt="Kaufen" className="h-10 w-auto" />
        </button>
        
        <button
          onClick={() => toggleFilter('unavailable')}
          className={`transition-opacity ${
            selectedTypes.unavailable ? 'opacity-100' : 'opacity-50 hover:opacity-70'
          }`}
          title="Nicht verfügbar"
        >
          <img src="/buttons/06_notavailable_filter.png" alt="Nicht verfügbar" className="h-10 w-auto" />
        </button>
      </div>
    </div>
  )
}
