import { NextRequest, NextResponse } from 'next/server';
import { searchTMDb, getTMDbDetails } from '@/lib/tmdbApi';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const title = searchParams.get('title');
  const tmdbId = searchParams.get('tmdbId');
  const mediaType = searchParams.get('mediaType');

  if (tmdbId) {
    try {
      // mediaType: 'movie' | 'tv' (default: 'movie')
      const details = await getTMDbDetails(Number(tmdbId), mediaType === 'tv' ? 'tv' : 'movie');
      return NextResponse.json(details);
    } catch (e) {
      return NextResponse.json({ error: 'TMDb details fetch failed' }, { status: 500 });
    }
  } else if (title) {
    try {
      const results = await searchTMDb(title);
      return NextResponse.json({ results });
    } catch (e) {
      return NextResponse.json({ error: 'TMDb search failed' }, { status: 500 });
    }
  } else {
    return NextResponse.json({ error: 'Missing title or tmdbId' }, { status: 400 });
  }
}
