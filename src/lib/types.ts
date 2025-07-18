export interface User {
  id: string
  name: string
  created_at: string
}

export interface Movie {
  id: string
  title: string
  description?: string
  year?: number
  poster_url?: string
  created_at: string
  created_by?: string
  creator_name?: string
}

export interface Rating {
  id: string
  movie_id: string
  rating: number
  user_id?: string
  user_name?: string
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
  created_at: string
}
