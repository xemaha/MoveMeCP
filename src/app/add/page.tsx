'use client'

import Link from 'next/link'
import { useState } from 'react'
import AddMovieForm from '@/components/AddMovieForm'
import AuthForm from '@/components/AuthForm'
import { UserHeader } from '@/components/UserHeader'
import { ContentTypeFilter } from '@/components/ContentTypeFilter'
import { UserProvider, useUser } from '@/lib/UserContext'

function AddContent() {
  const { user, isLoading } = useUser()
  const [contentTypes, setContentTypes] = useState({
    film: true,
    serie: false,
    buch: false
  })

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
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        <ContentTypeFilter selected={contentTypes} onChange={setContentTypes} exclusive={true} />

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <AddMovieForm selectedContentType={contentTypes} />
        </div>
      </main>
    </div>
  )
}

export default function AddPage() {
  return (
    <UserProvider>
      <AddContent />
    </UserProvider>
  )
}
