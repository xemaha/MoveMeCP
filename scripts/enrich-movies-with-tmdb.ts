import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';
import fetch from 'node-fetch';

const SUPABASE_URL = process.env.SUPABASE_URL!;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const TMDB_API_KEY = process.env.TMDB_API_KEY!;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY || !TMDB_API_KEY) {
  throw new Error('Bitte SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY und TMDB_API_KEY in .env.local setzen!');
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function searchTMDb(title: string, year?: number) {
  const url = `https://api.themoviedb.org/3/search/multi?api_key=${TMDB_API_KEY}&query=${encodeURIComponent(title)}${year ? `&year=${year}` : ''}`;
  const res = await fetch(url);
  if (!res.ok) return null;
  const data = await res.json();
  // Nur Filme und Serien zulassen
  return data.results?.filter((item: any) => item.media_type === 'movie' || item.media_type === 'tv') || [];
}

async function getTMDbDetails(tmdbId: number, mediaType: 'movie' | 'tv') {
  const url = `https://api.themoviedb.org/3/${mediaType}/${tmdbId}?api_key=${TMDB_API_KEY}&append_to_response=videos,credits`;
  const res = await fetch(url);
  if (!res.ok) return null;
  const data = await res.json();
  let trailerUrl;
  if (data.videos && data.videos.results) {
    const yt = data.videos.results.find((v: any) => v.site === 'YouTube' && v.type === 'Trailer');
    if (yt) trailerUrl = `https://www.youtube.com/watch?v=${yt.key}`;
  }
  let director = '';
  if (data.credits && data.credits.crew) {
    const dir = data.credits.crew.find((c: any) => c.job === 'Director' || c.job === 'Regisseur');
    if (dir) director = dir.name;
  }
  let actors = '';
  if (data.credits && data.credits.cast) {
    actors = data.credits.cast.slice(0, 3).map((a: any) => a.name).join(', ');
  }
  return { ...data, trailerUrl, director, actors };
}

async function main() {
  const { data: movies, error } = await supabase.from('movies').select('*');
  if (error) throw error;
  for (const movie of movies) {
    const title = movie.title;
    const year = movie.year;
    console.log(`\nSuche TMDb für: ${title} (${year || ''})`);
    const results = await searchTMDb(title, year);
    if (!results || results.length === 0) {
      console.warn('Kein TMDb-Treffer gefunden!');
      continue;
    }
    // Nimm das beste Ergebnis (erster Treffer)
    const tmdb = results[0];
    const mediaType = tmdb.media_type;
    const details = await getTMDbDetails(tmdb.id, mediaType);
    if (!details) {
      console.warn('Details konnten nicht geladen werden!');
      continue;
    }
    // Update in Supabase
    const update = {
      poster_url: details.poster_path ? `https://image.tmdb.org/t/p/w500${details.poster_path}` : null,
      description: details.overview || null,
      content_type: mediaType === 'tv' ? 'serie' : 'film',
      director: details.director || null,
      actor: details.actors || null,
      year: details.release_date ? Number(details.release_date.slice(0, 4)) : (details.first_air_date ? Number(details.first_air_date.slice(0, 4)) : null),
      genre: details.genres ? details.genres.map((g: any) => g.name).join(', ') : null,
      trailer_url: details.trailerUrl || null,
    };
    const { error: updateError } = await supabase.from('movies').update(update).eq('id', movie.id);
    if (updateError) {
      console.error('Fehler beim Update:', updateError);
    } else {
      console.log('Erfolgreich aktualisiert:', title);
    }
    // TMDb API nicht zu schnell abfragen
    await new Promise(r => setTimeout(r, 500));
  }
  console.log('\nFertig!');
}

main().catch(e => {
  console.error(e);
  process.exit(1);
});
