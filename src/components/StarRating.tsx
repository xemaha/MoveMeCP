'use client'

import Rating from 'react-rating'
import { ComponentType } from 'react'

interface StarRatingProps {
  rating: number
  onRate: (rating: number) => void
  disabled?: boolean
}

interface RatingProps {
  initialRating: number
  onChange: (value: number) => void
  readonly: boolean
  fractions: number
  emptySymbol: React.ReactNode
  fullSymbol: React.ReactNode
}

// Star icon component
const StarIcon = ({ filled }: { filled: boolean }) => (
  <svg
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill={filled ? "#fbbf24" : "none"}
    stroke="#fbbf24"
    strokeWidth="2"
    style={{ marginRight: '4px', cursor: 'pointer' }}
  >
    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
  </svg>
)

const RatingComponent = Rating as unknown as ComponentType<RatingProps>

export function StarRating({ rating, onRate, disabled = false }: StarRatingProps) {
  return (
    <RatingComponent
      initialRating={rating}
      onChange={onRate}
      readonly={disabled}
      fractions={2}
      emptySymbol={<StarIcon filled={false} />}
      fullSymbol={<StarIcon filled={true} />}
    />
  )
}
