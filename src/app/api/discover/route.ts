import { NextRequest, NextResponse } from 'next/server'
import { getTMDbDetails } from '@/lib/tmdbApi'

const TMDB_API_KEY = process.env.TMDB_API_KEY || process.env.NEXT_PUBLIC_TMDB_API_KEY
const TMDB_BASE_URL = 'https://api.themoviedb.org/3'

if (!TMDB_API_KEY) {
  throw new Error('TMDb API key not set')
}

// Rudimentäre Genre-Mapping Tabelle (Name -> TMDb ID)
const GENRE_MAP: Record<string, number> = {
  action: 28,
  adventure: 12,
  animation: 16,
  comedy: 35,
  crime: 80,
  documentary: 99,
  drama: 18,
  family: 10751,
  fantasy: 14,
  history: 36,
  horror: 27,
  music: 10402,
  mystery: 9648,
  romance: 10749,
  'science fiction': 878,
  scifi: 878,
  thriller: 53,
  war: 10752,
  western: 37
}

interface DiscoverPayload {
  preferredGenres?: string[]
  preferredDirectors?: string[]
  preferredActors?: string[]
  excludeTmdbIds?: number[]
}

export async function POST(req: NextRequest) {
  const body = (await req.json()) as DiscoverPayload
  const {
    preferredGenres = [],
    preferredDirectors = [],
    preferredActors = [],
    excludeTmdbIds = []
  } = body || {}

  try {
    // Map Genre-Namen auf IDs (best effort, toLowerCase)
    const genreIds = preferredGenres
      .map((g) => GENRE_MAP[g.trim().toLowerCase()])
      .filter(Boolean) as number[]

    // Basis-Discovery-Call (vote_average >= 7, sort by rating)
    const params = new URLSearchParams({
      api_key: TMDB_API_KEY,
      sort_by: 'vote_average.desc',
      'vote_average.gte': '7',
      include_adult: 'false',
      page: '1'
    })
    if (genreIds.length > 0) {
      params.set('with_genres', genreIds.join(','))
    }

    const discoverUrl = `${TMDB_BASE_URL}/discover/movie?${params.toString()}`
    const res = await fetch(discoverUrl)
    if (!res.ok) {
      return NextResponse.json({ error: 'TMDb discover failed' }, { status: 500 })
    }
    const data = await res.json()

    // Kandidaten auf 20 beschränken
    const candidates = (data.results || []).slice(0, 20).filter((c: any) => !excludeTmdbIds.includes(c.id))

    // Hole Details (inkl. Credits) für bessere Bewertung
    const enriched = [] as any[]
    for (const cand of candidates) {
      try {
        const details = await getTMDbDetails(cand.id, 'movie')
        enriched.push({ base: cand, details })
      } catch (err) {
        // überspringe fehlgeschlagene Details
      }
    }

    // Scoring: Director stark, Genre mittel, Actors leicht
    const scored = enriched.map(({ base, details }) => {
      const director = details.director || ''
      const actors = (details.actors || '').split(',').map((a: string) => a.trim()).filter(Boolean)
      const genres: string[] = (details.genres || []).map((g: any) => (g.name as string).toLowerCase())

      let score = (base.vote_average || 0) * 0.6 + (base.popularity || 0) * 0.01

      if (director && preferredDirectors.map((d) => d.toLowerCase()).includes(director.toLowerCase())) {
        score += 3
      }

      const prefActors = preferredActors.map((a) => a.toLowerCase())
      const actorMatches = actors.filter((a: string) => prefActors.includes(a.toLowerCase())).length
      score += actorMatches * 0.8

      const prefGenres = preferredGenres.map((g) => g.toLowerCase())
      const genreMatches = genres.filter((g) => prefGenres.includes(g)).length
      score += genreMatches * 0.5

      return {
        tmdb_id: base.id,
        title: base.title,
        overview: base.overview,
        poster_path: base.poster_path,
        release_date: base.release_date,
        vote_average: base.vote_average,
        popularity: base.popularity,
        director,
        actors,
        genres: details.genres || [],
        trailer_url: details.trailerUrl,
        score
      }
    })

    scored.sort((a, b) => b.score - a.score)

    return NextResponse.json({ results: scored.slice(0, 12) })
  } catch (err) {
    console.error('Discover error', err)
    return NextResponse.json({ error: 'Discover failed' }, { status: 500 })
  }
}
