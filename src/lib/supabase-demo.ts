// Demo version with local storage - no Supabase needed for testing
export interface Movie {
  id: string
  title: string
  description?: string
  year?: number
  poster_url?: string
  created_at: string
}

export interface Rating {
  id: string
  movie_id: string
  rating: number
  user_id?: string
  created_at: string
}

export interface Tag {
  id: string
  name: string
  color: string
  created_at: string
}

export interface MovieTag {
  movie_id: string
  tag_id: string
}

// Demo data storage (local storage)
class DemoSupabase {
  private getMovies(): Movie[] {
    if (typeof window === 'undefined') return []
    const movies = localStorage.getItem('demo-movies')
    return movies ? JSON.parse(movies) : []
  }

  private getRatings(): Rating[] {
    if (typeof window === 'undefined') return []
    const ratings = localStorage.getItem('demo-ratings')
    return ratings ? JSON.parse(ratings) : []
  }

  private getTags(): Tag[] {
    if (typeof window === 'undefined') return []
    const tags = localStorage.getItem('demo-tags')
    return tags ? JSON.parse(tags) : []
  }

  private getMovieTags(): MovieTag[] {
    if (typeof window === 'undefined') return []
    const movieTags = localStorage.getItem('demo-movie-tags')
    return movieTags ? JSON.parse(movieTags) : []
  }

  private setMovies(movies: Movie[]) {
    if (typeof window === 'undefined') return
    localStorage.setItem('demo-movies', JSON.stringify(movies))
  }

  private setRatings(ratings: Rating[]) {
    if (typeof window === 'undefined') return
    localStorage.setItem('demo-ratings', JSON.stringify(ratings))
  }

  private setTags(tags: Tag[]) {
    if (typeof window === 'undefined') return
    localStorage.setItem('demo-tags', JSON.stringify(tags))
  }

  private setMovieTags(movieTags: MovieTag[]) {
    if (typeof window === 'undefined') return
    localStorage.setItem('demo-movie-tags', JSON.stringify(movieTags))
  }

  from(table: string) {
    return {
      select: (columns = '*') => {
        if (table === 'movies') {
          return {
            order: (column: string, options: any) => ({
              then: (resolve: any) => {
                const movies = this.getMovies().sort((a, b) => 
                  new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
                )
                resolve({ data: movies, error: null })
              }
            }),
            ilike: (column: string, value: string) => ({
              then: (resolve: any) => {
                const movies = this.getMovies().filter(movie => 
                  movie.title.toLowerCase().includes(value.toLowerCase())
                )
                resolve({ data: movies, error: null })
              }
            })
          }
        }
        if (table === 'ratings') {
          return {
            eq: (column: string, value: string) => ({
              then: (resolve: any) => {
                const ratings = this.getRatings().filter(r => r.movie_id === value)
                resolve({ data: ratings, error: null })
              }
            })
          }
        }
        if (table === 'tags') {
          return {
            eq: (column: string, value: string) => ({
              single: () => ({
                then: (resolve: any) => {
                  const tag = this.getTags().find(t => t.name === value)
                  resolve({ data: tag, error: null })
                }
              }),
              then: (resolve: any) => {
                const tags = this.getTags().filter(t => t[column] === value)
                resolve({ data: tags, error: null })
              }
            })
          }
        }
        if (table === 'movie_tags') {
          return {
            eq: (column: string, value: string) => ({
              then: (resolve: any) => {
                const movieTags = this.getMovieTags().filter(mt => mt.movie_id === value)
                const tags = this.getTags()
                const result = movieTags.map(mt => ({
                  tags: tags.find(t => t.id === mt.tag_id)
                }))
                resolve({ data: result, error: null })
              }
            })
          }
        }
        return { then: (resolve: any) => resolve({ data: [], error: null }) }
      },
      insert: (data: any[]) => ({
        select: () => ({
          single: () => ({
            then: (resolve: any) => {
              if (table === 'movies') {
                const movies = this.getMovies()
                const newMovie = {
                  ...data[0],
                  id: Date.now().toString(),
                  created_at: new Date().toISOString()
                }
                movies.push(newMovie)
                this.setMovies(movies)
                resolve({ data: newMovie, error: null })
              } else if (table === 'tags') {
                const tags = this.getTags()
                const newTag = {
                  ...data[0],
                  id: Date.now().toString(),
                  color: data[0].color || '#3B82F6',
                  created_at: new Date().toISOString()
                }
                tags.push(newTag)
                this.setTags(tags)
                resolve({ data: newTag, error: null })
              }
            }
          })
        }),
        then: (resolve: any) => {
          if (table === 'movies') {
            const movies = this.getMovies()
            const newMovie = {
              ...data[0],
              id: Date.now().toString(),
              created_at: new Date().toISOString()
            }
            movies.push(newMovie)
            this.setMovies(movies)
            resolve({ data: [newMovie], error: null })
          } else if (table === 'ratings') {
            const ratings = this.getRatings()
            const newRating = {
              ...data[0],
              id: Date.now().toString(),
              created_at: new Date().toISOString()
            }
            ratings.push(newRating)
            this.setRatings(ratings)
            resolve({ data: [newRating], error: null })
          } else if (table === 'tags') {
            const tags = this.getTags()
            const newTag = {
              ...data[0],
              id: Date.now().toString(),
              color: data[0].color || '#3B82F6',
              created_at: new Date().toISOString()
            }
            tags.push(newTag)
            this.setTags(tags)
            resolve({ data: [newTag], error: null })
          } else if (table === 'movie_tags') {
            const movieTags = this.getMovieTags()
            const existing = movieTags.find(mt => 
              mt.movie_id === data[0].movie_id && mt.tag_id === data[0].tag_id
            )
            if (existing) {
              resolve({ data: [], error: { message: 'duplicate key' } })
            } else {
              movieTags.push(data[0])
              this.setMovieTags(movieTags)
              resolve({ data: data, error: null })
            }
          }
        }
      })
    }
  }
}

export const supabase = new DemoSupabase() as any

// Initialize with some demo data
if (typeof window !== 'undefined' && !localStorage.getItem('demo-movies')) {
  const demoMovies = [
    {
      id: '1',
      title: 'Inception',
      description: 'Ein Traum in einem Traum - komplexer Sci-Fi Thriller',
      year: 2010,
      created_at: '2024-01-01T12:00:00Z'
    },
    {
      id: '2', 
      title: 'The Matrix',
      description: 'Die Realität ist eine Illusion',
      year: 1999,
      created_at: '2024-01-02T12:00:00Z'
    },
    {
      id: '3',
      title: 'Interstellar',
      description: 'Liebe überwindet Raum und Zeit',
      year: 2014,
      created_at: '2024-01-03T12:00:00Z'
    }
  ]
  
  const demoRatings = [
    {
      id: '1',
      movie_id: '1',
      rating: 5,
      created_at: '2024-01-01T12:00:00Z'
    },
    {
      id: '2',
      movie_id: '1', 
      rating: 4,
      created_at: '2024-01-01T13:00:00Z'
    },
    {
      id: '3',
      movie_id: '2',
      rating: 5,
      created_at: '2024-01-02T12:00:00Z'
    },
    {
      id: '4',
      movie_id: '3',
      rating: 5,
      created_at: '2024-01-03T12:00:00Z'
    }
  ]

  const demoTags = [
    {
      id: '1',
      name: 'mindblow',
      color: '#8B5CF6',
      created_at: '2024-01-01T12:00:00Z'
    },
    {
      id: '2',
      name: 'sci-fi',
      color: '#06B6D4',
      created_at: '2024-01-01T12:00:00Z'
    },
    {
      id: '3',
      name: 'komplexe-handlung',
      color: '#EF4444',
      created_at: '2024-01-01T12:00:00Z'
    },
    {
      id: '4',
      name: 'zeitreise',
      color: '#F59E0B',
      created_at: '2024-01-01T12:00:00Z'
    }
  ]

  const demoMovieTags = [
    { movie_id: '1', tag_id: '1' },
    { movie_id: '1', tag_id: '2' },
    { movie_id: '1', tag_id: '3' },
    { movie_id: '2', tag_id: '1' },
    { movie_id: '2', tag_id: '2' },
    { movie_id: '3', tag_id: '1' },
    { movie_id: '3', tag_id: '2' },
    { movie_id: '3', tag_id: '4' }
  ]
  
  localStorage.setItem('demo-movies', JSON.stringify(demoMovies))
  localStorage.setItem('demo-ratings', JSON.stringify(demoRatings))
  localStorage.setItem('demo-tags', JSON.stringify(demoTags))
  localStorage.setItem('demo-movie-tags', JSON.stringify(demoMovieTags))
}
