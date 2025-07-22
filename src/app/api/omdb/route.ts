import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const title = searchParams.get('title');
  const imdbID = searchParams.get('imdbID');
  const apiKey = process.env.OMDB_API_KEY || process.env.NEXT_PUBLIC_OMDB_API_KEY;

  if (!apiKey) {
    return NextResponse.json({ error: 'OMDb API key not set' }, { status: 500 });
  }

  let url = `https://www.omdbapi.com/?apikey=${apiKey}`;
  if (imdbID) {
    url += `&i=${encodeURIComponent(imdbID)}`;
  } else if (title) {
    url += `&s=${encodeURIComponent(title)}`;
  } else {
    return NextResponse.json({ error: 'Missing title or imdbID' }, { status: 400 });
  }

  const res = await fetch(url);
  const data = await res.json();
  return NextResponse.json(data);
}
