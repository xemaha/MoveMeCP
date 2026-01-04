'use client'

import Link from 'next/link'
import AuthForm from '@/components/AuthForm'
import { UserHeader } from '@/components/UserHeader'
import { UserProvider, useUser } from '@/lib/UserContext'
import { MovieList } from '@/components/MovieList'
import { ContentTypeFilter } from '@/components/ContentTypeFilter'
import { RecommendationSourceFilter } from '@/components/RecommendationSourceFilter'
import { useState } from 'react'

function RecommendationsContent() {
  const { user, isLoading } = useUser()
  const [contentTypes, setContentTypes] = useState({
    film: true,
    serie: true,
    buch: false
  })
  const [recommendationSource, setRecommendationSource] = useState<'all' | 'ai' | 'personal' | 'discover'>('all')

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Lade App...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return <AuthForm />
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <UserHeader />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        <ContentTypeFilter selected={contentTypes} onChange={setContentTypes} />
        
        <RecommendationSourceFilter selected={recommendationSource} onChange={setRecommendationSource} />

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <MovieList 
            defaultShowRecommendations 
            showOnlyRecommendations 
            contentTypeFilter={contentTypes}
            recommendationSourceFilter={recommendationSource}
          />
        </div>
      </main>
    </div>
  )
}

export default function RecommendationsPage() {
  return (
    <UserProvider>
      <RecommendationsContent />
    </UserProvider>
  )
}
