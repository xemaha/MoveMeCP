export async function searchOMDb(title: string) {
  const apiKey = process.env.NEXT_PUBLIC_OMDB_API_KEY;
  const res = await fetch(`https://www.omdbapi.com/?apikey=${apiKey}&s=${encodeURIComponent(title)}`);
  const data = await res.json();
  return data.Search || [];
}

export async function getOMDbDetails(imdbID: string) {
  const apiKey = process.env.NEXT_PUBLIC_OMDB_API_KEY;
  const res = await fetch(`https://www.omdbapi.com/?apikey=${apiKey}&i=${imdbID}`);
  return res.json();
}
