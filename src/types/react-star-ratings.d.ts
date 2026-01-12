declare module 'react-star-ratings' {
  import React from 'react'

  interface StarRatingsProps {
    rating: number
    changeRating: (rating: number) => void
    isAggregateRating?: boolean
    numberOfStars: number
    starDimension: string
    starSpacing?: string
    starRatedColor?: string
    starEmptyColor?: string
    starHoverColor?: string
    name: string
    isSelectable?: boolean
  }

  const StarRatings: React.FC<StarRatingsProps>
  export default StarRatings
}
