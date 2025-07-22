import { createClient } from '@supabase/supabase-js';
import fetch from 'node-fetch';

// === CONFIG ===
const SUPABASE_URL = process.env.SUPABASE_URL!;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const OMDB_API_KEY = process.env.OMDB_API_KEY!;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY || !OMDB_API_KEY) {
  throw new Error('Please set SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, and OMDB_API_KEY in your environment.');
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function fetchOMDb(title: string) {
  const url = `https://www.omdbapi.com/?apikey=${OMDB_API_KEY}&t=${encodeURIComponent(title)}`;
  const res = await fetch(url);
  if (!res.ok) return null;
  const data = await res.json();
  if (data.Response === 'False') return null;
  return data;
}

async function main() {
  console.log('Fetching movies from Supabase...');
  const { data: movies, error } = await supabase.from('movies').select('id, title, poster_url, director, actor, year, genre, description');
  if (error) throw error;
  if (!movies) return;

  let updated = 0;
  for (const movie of movies) {
    const omdb = await fetchOMDb(movie.title);
    if (!omdb) {
      console.log(`No OMDb match for: ${movie.title}`);
      continue;
    }
    // Only update if OMDb has data and field is missing or empty
    const patch: any = {};
    if (!movie.poster_url && omdb.Poster && omdb.Poster !== 'N/A') patch.poster_url = omdb.Poster;
    if (!movie.director && omdb.Director && omdb.Director !== 'N/A') patch.director = omdb.Director;
    if (!movie.actor && omdb.Actors && omdb.Actors !== 'N/A') patch.actor = omdb.Actors;
    if (!movie.year && omdb.Year && omdb.Year !== 'N/A') patch.year = Number(omdb.Year);
    if (!movie.genre && omdb.Genre && omdb.Genre !== 'N/A') patch.genre = omdb.Genre;
    if (!movie.description && omdb.Plot && omdb.Plot !== 'N/A') patch.description = omdb.Plot;
    if (Object.keys(patch).length === 0) {
      console.log(`No new data for: ${movie.title}`);
      continue;
    }
    const { error: updateError } = await supabase.from('movies').update(patch).eq('id', movie.id);
    if (updateError) {
      console.error(`Failed to update ${movie.title}:`, updateError.message);
    } else {
      updated++;
      console.log(`Updated: ${movie.title}`);
    }
  }
  console.log(`Done. Updated ${updated} movies.`);
}

main().catch(e => {
  console.error(e);
  process.exit(1);
});
