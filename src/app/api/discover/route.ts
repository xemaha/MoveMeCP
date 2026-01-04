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
  preferredKeywords?: string[]
  excludeTmdbIds?: number[]
  mediaTypes?: string[]
}

export async function POST(req: NextRequest) {
  const body = (await req.json()) as DiscoverPayload
  const {
    preferredGenres = [],
    preferredDirectors = [],
    preferredActors = [],
    preferredKeywords = [],
    excludeTmdbIds = [],
    mediaTypes = ['movie']
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
      'vote_average.gte': '6.0',
      'vote_count.gte': '100',
      include_adult: 'false'
    })
    if (genreIds.length > 0) {
      params.set('with_genres', genreIds.join(','))
    }

    // Make separate discover calls for each media type
    const allCandidates: any[] = []
    
    for (const mediaType of mediaTypes) {
      // fetch multiple pages until we have enough candidates
      for (let page = 1; page <= 5; page++) {
        params.set('page', String(page))
        const discoverUrl = `${TMDB_BASE_URL}/discover/${mediaType}?${params.toString()}`
        const res = await fetch(discoverUrl)
        if (!res.ok) {
          const text = await res.text()
          console.warn(`TMDb discover failed for ${mediaType} page ${page}`, res.status, text)
          break
        }
        const data = await res.json()
        const candidates = (data.results || [])
          .filter((c: any) => (c.vote_count || 0) >= 100 && (c.vote_average || 0) >= 6.0)
          .map((c: any) => ({ ...c, media_type: mediaType }))
          .filter((c: any) => !excludeTmdbIds.includes(c.id))

        allCandidates.push(...candidates)
        if (allCandidates.length >= 250) break
      }
    }
    
    if (allCandidates.length === 0) {
      return NextResponse.json({ error: 'No candidates found' }, { status: 404 })
    }
    
    // Take top candidates across all media types (large pool)
    const candidates = allCandidates
      .sort((a, b) => (b.popularity || 0) - (a.popularity || 0))
      .slice(0, 400)

    // Hole Details (inkl. Credits) für bessere Bewertung
    const enriched = [] as any[]
    for (const cand of candidates) {
      try {
        const mediaType = cand.media_type || 'movie'
        const details = await getTMDbDetails(cand.id, mediaType)
        enriched.push({ base: cand, details })
      } catch (err) {
        console.warn('TMDb details failed for', cand.id, err)
        // Bei Fehler trotzdem aufnehmen, aber ohne Details
        enriched.push({ base: cand, details: { director: '', actors: '', genres: [], keywords: [], trailerUrl: '' } })
      }
    }

    // Scoring: Director stark, Genre mittel, Actors leicht
    const scored = enriched.map(({ base, details }) => {
      const director = details.director || ''
      const actors = (details.actors || '').split(',').map((a: string) => a.trim()).filter(Boolean)
      const genres: string[] = (details.genres || []).map((g: any) => (g.name as string).toLowerCase())
      const keywords: string[] = details.keywords || []

      const baseScore = (base.vote_average || 0) * 0.6 + (base.popularity || 0) * 0.01 + Math.log1p(base.vote_count || 0) * 0.3
      let score = baseScore

      const matchReasons: string[] = []
      const scoreBreakdown: string[] = []

      // TMDb baseline
      scoreBreakdown.push(`Basis: ${baseScore.toFixed(2)} (TMDb ${base.vote_average?.toFixed?.(1) ?? '7+'}, ${base.vote_count} Stimmen)`)

      // Director matching with name extraction from payload
      const preferredDirectorNames = preferredDirectors.map((d: any) => 
        typeof d === 'string' ? d.toLowerCase() : d.name?.toLowerCase?.()
      ).filter(Boolean)
      
      if (director && preferredDirectorNames.includes(director.toLowerCase())) {
        const boost = 5
        score += boost
        matchReasons.push(`🎬 Regie (du magst): ${director}`)
        scoreBreakdown.push(`+ ${boost} (Regie-Match)`)
      }

      const prefActors = preferredActors.map((a) => a.toLowerCase())
      const matchedActors = actors.filter((a: string) => prefActors.includes(a.toLowerCase()))
      if (matchedActors.length > 0) {
        const boost = matchedActors.length * 0.8
        score += boost
        matchReasons.push(`🎭 Stars: ${matchedActors.slice(0, 3).join(', ')}`)
        scoreBreakdown.push(`+ ${boost.toFixed(2)} (${matchedActors.length} bekannte*r Schauspieler*in)`)
      }

      const prefGenres = preferredGenres.map((g) => g.toLowerCase())
      const matchedGenres = genres.filter((g) => prefGenres.includes(g))
      if (matchedGenres.length > 0) {
        const boost = matchedGenres.length * 2.0
        score += boost
        matchReasons.push(`🎞️ Genres: ${matchedGenres.slice(0, 3).join(', ')}`)
        scoreBreakdown.push(`+ ${boost.toFixed(2)} (${matchedGenres.length} Genre-Match)`)
      }

      // Match keywords with user's preferred keywords from highly-rated movies
      // Build frequency map for color coding
      const keywordFrequencyMap: Record<string, number> = {}
      preferredKeywords.forEach((k: any) => {
        const name = typeof k === 'string' ? k : k.name
        const count = typeof k === 'string' ? 1 : (k.count || 1)
        keywordFrequencyMap[name.toLowerCase()] = count
      })
      
      const prefKeywords = preferredKeywords.map((k: any) => 
        typeof k === 'string' ? k.toLowerCase() : k.name?.toLowerCase?.()
      ).filter(Boolean)
      
      const matchedKeywords = keywords.filter((k) => prefKeywords.includes(k))
      const keywordFrequencies: Record<string, number> = {}
      matchedKeywords.forEach(k => {
        keywordFrequencies[k] = keywordFrequencyMap[k] || 1
      })
      
      if (matchedKeywords.length > 0) {
        const boost = matchedKeywords.length * 3.0
        score += boost
        matchReasons.push(`🔑 Keywords: ${matchedKeywords.slice(0, 3).join(', ')}`)
        scoreBreakdown.push(`+ ${boost.toFixed(2)} (${matchedKeywords.length} Keyword-Match aus deinen Top-Filmen)`)
      }

      if (matchReasons.length === 0) {
        matchReasons.push(`⭐ Hochbewertet: TMDb ${base.vote_average?.toFixed?.(1) ?? '7+'} (${base.vote_count} Stimmen)`)
      }

      scoreBreakdown.push(`= Gesamt: ${score.toFixed(2)}`)

      return {
        tmdb_id: base.id,
        title: base.title || base.name,
        media_type: base.media_type || 'movie',
        overview: base.overview,
        poster_path: base.poster_path,
        release_date: base.release_date,
        vote_average: base.vote_average,
        vote_count: base.vote_count,
        popularity: base.popularity,
        director,
        actors,
        genres: details.genres || [],
        keywords,
        matchedKeywords,
        keywordFrequencies,
        trailer_url: details.trailerUrl,
        score,
        matchReasons,
        scoreBreakdown
      }
    })

    scored.sort((a, b) => b.score - a.score)

    return NextResponse.json({ results: scored.slice(0, 400) })
  } catch (err) {
    console.error('Discover error', err)
    return NextResponse.json({ error: 'Discover failed' }, { status: 500 })
  }
}
