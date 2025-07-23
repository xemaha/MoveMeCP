'use server';

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

export async function addToWatchlist(movieId: string, userId: string = 'default-user') {
  try {
    const { data, error } = await supabase
      .from('watchlist')
      .insert([{
        movie_id: movieId,
        user_id: userId,
      }])
      .select();

    if (error) throw error;
    return { success: true, data };
  } catch (error: any) {
    console.error('Error adding to watchlist:', error);
    return { success: false, error: error.message };
  }
}

export async function getMoviesWithFilter(filterType: 'all' | 'rated' | 'watchlist' = 'all', userId: string = 'default-user') {
  try {
    let query = supabase.from('movies').select(`
      *,
      ratings!left(rating, user_id),
      watchlist!left(user_id)
    `);

    if (filterType === 'rated') {
      query = query.not('ratings', 'is', null).eq('ratings.user_id', userId);
    } else if (filterType === 'watchlist') {
      query = query.not('watchlist', 'is', null).eq('watchlist.user_id', userId);
    }

    const { data, error } = await query.order('created_at', { ascending: false });

    if (error) throw error;
    return { success: true, data: data || [] };
  } catch (error: any) {
    console.error('Error fetching filtered movies:', error);
    return { success: false, error: error.message, data: [] };
  }
}