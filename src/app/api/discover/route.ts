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

    // Basis-Discovery-Call (vote_average >= 7, genug Votes/Popularität)
    const params = new URLSearchParams({
      api_key: TMDB_API_KEY,
      sort_by: 'popularity.desc',
      'vote_average.gte': '7',
      'vote_count.gte': '1000', // Bekanntheit: mindestens 1000 Stimmen
      include_adult: 'false',
      page: '1'
    })
    if (genreIds.length > 0) {
      params.set('with_genres', genreIds.join(','))
    }

    const discoverUrl = `${TMDB_BASE_URL}/discover/movie?${params.toString()}`
    const res = await fetch(discoverUrl)
    if (!res.ok) {
      const text = await res.text()
      console.error('TMDb discover failed', res.status, text)
      return NextResponse.json({ error: 'TMDb discover failed' }, { status: 500 })
    }
    const data = await res.json()

    // Kandidaten hart filtern: hohe Vote-Count + Mindest-Popularität
    const candidates = (data.results || [])
      .filter((c: any) => (c.vote_count || 0) >= 1000 && (c.vote_average || 0) >= 7 && (c.popularity || 0) >= 50)
      .slice(0, 20)
      .filter((c: any) => !excludeTmdbIds.includes(c.id))

    // Hole Details (inkl. Credits) für bessere Bewertung
    const enriched = [] as any[]
    for (const cand of candidates) {
      try {
        const details = await getTMDbDetails(cand.id, 'movie')
        enriched.push({ base: cand, details })
      } catch (err) {
        console.warn('TMDb details failed for', cand.id, err)
        // überspringe fehlgeschlagene Details
      }
    }

    // Scoring: Director stark, Genre mittel, Actors leicht
    const scored = enriched.map(({ base, details }) => {
      const director = details.director || ''
      const actors = (details.actors || '').split(',').map((a: string) => a.trim()).filter(Boolean)
      const genres: string[] = (details.genres || []).map((g: any) => (g.name as string).toLowerCase())

      let score = (base.vote_average || 0) * 0.6 + (base.popularity || 0) * 0.01 + Math.log1p(base.vote_count || 0) * 0.3

      const matchReasons: string[] = []

      if (director && preferredDirectors.map((d) => d.toLowerCase()).includes(director.toLowerCase())) {
        score += 3
        matchReasons.push(`Regie: ${director}`)
      }

      const prefActors = preferredActors.map((a) => a.toLowerCase())
      const matchedActors = actors.filter((a: string) => prefActors.includes(a.toLowerCase()))
      if (matchedActors.length > 0) {
        score += matchedActors.length * 0.8
        matchReasons.push(`Schauspiel: ${matchedActors.slice(0, 3).join(', ')}`)
      }

      const prefGenres = preferredGenres.map((g) => g.toLowerCase())
      const matchedGenres = genres.filter((g) => prefGenres.includes(g))
      if (matchedGenres.length > 0) {
        score += matchedGenres.length * 0.5
        matchReasons.push(`Genres: ${matchedGenres.slice(0, 3).join(', ')}`)
      }

      // Generic popularity signal as fallback reason
      if (matchReasons.length === 0) {
        matchReasons.push(`Beliebt: TMDb ${base.vote_average?.toFixed?.(1) ?? '7+'} bei ${base.vote_count} Stimmen`)
      } else {
        matchReasons.push(`Beliebt: TMDb ${base.vote_average?.toFixed?.(1) ?? '7+'} bei ${base.vote_count} Stimmen`)
      }

      return {
        tmdb_id: base.id,
        title: base.title,
        overview: base.overview,
        poster_path: base.poster_path,
        release_date: base.release_date,
        vote_average: base.vote_average,
        vote_count: base.vote_count,
        popularity: base.popularity,
        director,
        actors,
        genres: details.genres || [],
        trailer_url: details.trailerUrl,
        score,
        matchReasons
      }
    })

    scored.sort((a, b) => b.score - a.score)

    return NextResponse.json({ results: scored.slice(0, 12) })
  } catch (err) {
    console.error('Discover error', err)
    return NextResponse.json({ error: 'Discover failed' }, { status: 500 })
  }
}
