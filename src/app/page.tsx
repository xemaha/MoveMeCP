import { MovieList } from '@/components/MovieList'
import { AddMovieForm } from '@/components/AddMovieForm'

export default function Home() {
  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            🎬 MoveMe
          </h1>
          <p className="text-lg text-gray-600">
            Bewerte und tagge deine Filme - durchsuche sie nach Tags
          </p>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Add Movie Form */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                Film hinzufügen
              </h2>
              <AddMovieForm />
            </div>
          </div>
          
          {/* Movie List */}
          <div className="lg:col-span-3">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <MovieList />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
