'use client'

import Link from 'next/link'

interface NavigationButtonsProps {
  currentPage?: 'add' | 'search' | 'recommendations' | 'watchlist'
}

export function NavigationButtons({ currentPage }: NavigationButtonsProps) {
  const buttons = [
    { href: '/add', label: 'Add new', emoji: '🎬', key: 'add' },
    { href: '/search', label: 'Search', emoji: '🔎', key: 'search' },
    { href: '/recommendations', label: 'Get rec.', emoji: '✨', key: 'recommendations' },
    { href: '/watchlist', label: 'Watchlist', emoji: '👁️', key: 'watchlist' }
  ] as const

  return (
    <div className="flex gap-2">
      {buttons.map(button => (
        <Link
          key={button.key}
          href={button.href}
          className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${
            currentPage === button.key
              ? 'bg-blue-600 text-white shadow-md'
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`}
        >
          {button.emoji} {button.label}
        </Link>
      ))}
    </div>
  )
}
