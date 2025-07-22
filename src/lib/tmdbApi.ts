// src/lib/tmdbApi.ts
import type { MovieDetails } from './types';

const TMDB_API_KEY = process.env.TMDB_API_KEY || process.env.NEXT_PUBLIC_TMDB_API_KEY;
const TMDB_BASE_URL = 'https://api.themoviedb.org/3';

if (!TMDB_API_KEY) {
  throw new Error('TMDb API key not set');
}

export async function searchTMDb(title: string) {
  // Suche nach Filmen und Serien
  const url = `${TMDB_BASE_URL}/search/multi?api_key=${TMDB_API_KEY}&query=${encodeURIComponent(title)}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error('TMDb search failed');
  const data = await res.json();
  // Nur Filme und Serien zulassen
  return data.results.filter((item: any) => item.media_type === 'movie' || item.media_type === 'tv');
}

export async function getTMDbDetails(movieId: number): Promise<MovieDetails & { trailerUrl?: string, director?: string, actors?: string }> {
  // Hole Movie-Details inkl. Videos und Credits (Cast & Crew)
  const url = `${TMDB_BASE_URL}/movie/${movieId}?api_key=${TMDB_API_KEY}&append_to_response=videos,credits`;
  const res = await fetch(url);
  if (!res.ok) throw new Error('TMDb details failed');
  const data = await res.json();
  let trailerUrl;
  if (data.videos && data.videos.results) {
    const yt = data.videos.results.find((v: any) => v.site === 'YouTube' && v.type === 'Trailer');
    if (yt) trailerUrl = `https://www.youtube.com/watch?v=${yt.key}`;
  }
  // Regisseur extrahieren
  let director = '';
  if (data.credits && data.credits.crew) {
    const dir = data.credits.crew.find((c: any) => c.job === 'Director');
    if (dir) director = dir.name;
  }
  // Hauptdarsteller extrahieren (max. 3)
  let actors = '';
  if (data.credits && data.credits.cast) {
    actors = data.credits.cast.slice(0, 3).map((a: any) => a.name).join(', ');
  }
  return { ...data, trailerUrl, director, actors };
}
