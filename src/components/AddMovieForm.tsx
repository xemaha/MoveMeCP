'use client'

import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { useUser } from '@/lib/UserContext';
import { searchTMDb, getTMDbDetails } from '@/lib/tmdbApi';
import type { MovieDetails } from '@/lib/types';

interface MovieSuggestion {
  id: string;
  title: string;
  content_type: string;
  creator_name?: string;
}

interface TmdbSuggestion {
  id: number;
  title?: string;
  name?: string;
  release_date?: string;
  first_air_date?: string;
  poster_path?: string;
  media_type: 'movie' | 'tv';
}

export default function AddMovieForm() {
  const [allTags, setAllTags] = useState<{ name: string; color: string }[]>([]);
  const [showTagSuggestions, setShowTagSuggestions] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [contentType, setContentType] = useState<'film' | 'serie' | 'buch'>('film');
  const [rating, setRating] = useState<number>(0);
  const [tags, setTags] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [suggestions, setSuggestions] = useState<MovieSuggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedMovie, setSelectedMovie] = useState<MovieSuggestion | null>(null);
  const [tmdbSuggestions, setTmdbSuggestions] = useState<TmdbSuggestion[]>([]);
  const [showTmdbSuggestions, setShowTmdbSuggestions] = useState(false);
  const [director, setDirector] = useState('');
  const [actor, setActor] = useState('');
  const [year, setYear] = useState('');
  const [genre, setGenre] = useState('');
  const [posterUrl, setPosterUrl] = useState('');
  const [trailerUrl, setTrailerUrl] = useState<string | undefined>(undefined);
  const [actionType, setActionType] = useState<'rate' | 'watchlist' | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState('');
  const [tmdbSelected, setTmdbSelected] = useState(false);

  const { user } = useUser();
  const tmdbDropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchTags = async () => {
      const { data, error } = await supabase.from('tags').select('name, color').order('name');
      if (!error && data) {
        setAllTags(
          data
            .filter((t: any) => t && typeof t.name === 'string' && typeof t.color === 'string')
            .map((t: any) => ({ name: t.name, color: t.color }))
        );
      }
    };
    fetchTags();
  }, []);

  useEffect(() => {
    let ignore = false;
    const fetchSuggestions = async () => {
      if (title.trim().length < 2) {
        setSuggestions([]);
        setShowSuggestions(false);
        setTmdbSuggestions([]);
        setShowTmdbSuggestions(false);
        return;
      }

      // Supabase internal search
      try {
        const { data: movies, error } = await supabase
          .from('movies')
          .select('id, title, content_type, created_by')
          .ilike('title', `%${title.trim()}%`)
          .limit(5);
        
        if (!ignore) {
          if (!error && movies && movies.length > 0) {
            setSuggestions(movies.map(movie => ({
              id: movie.id as string,
              title: movie.title as string,
              content_type: movie.content_type as string,
              creator_name: movie.created_by as string || 'Unbekannt'
            })));
            setShowSuggestions(true);
          } else {
            setSuggestions([]);
            setShowSuggestions(false);
          }
        }
      } catch (error) {
        console.error('Error fetching Supabase suggestions:', error);
      }

      // TMDb Autocomplete only for Film/Serie
      if (contentType === 'film' || contentType === 'serie') {
        try {
          const tmdbType = contentType === 'film' ? 'movie' : 'tv';
          const res = await fetch(`/api/tmdb?title=${encodeURIComponent(title.trim())}`);
          const data = await res.json();
          
          if (!ignore) {
            if (data && data.results && data.results.length > 0) {
              setTmdbSuggestions(data.results.filter((r: any) => r.media_type === tmdbType));
              setShowTmdbSuggestions(true);
            } else {
              setTmdbSuggestions([]);
              setShowTmdbSuggestions(false);
            }
          }
        } catch (error) {
          console.error('Error fetching TMDb suggestions:', error);
          if (!ignore) {
            setTmdbSuggestions([]);
            setShowTmdbSuggestions(false);
          }
        }
      } else {
        setTmdbSuggestions([]);
        setShowTmdbSuggestions(false);
      }
    };

    fetchSuggestions();
    return () => { ignore = true };
  }, [title, contentType]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent | TouchEvent) {
      if (!showTmdbSuggestions) return;
      const input = document.getElementById('title');
      if (
        tmdbDropdownRef.current &&
        !tmdbDropdownRef.current.contains(event.target as Node) &&
        input &&
        !input.contains(event.target as Node)
      ) {
        setShowTmdbSuggestions(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('touchstart', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, [showTmdbSuggestions]);

  const handleSuggestionClick = (suggestion: MovieSuggestion) => {
    setSelectedMovie(suggestion);
    setTitle(suggestion.title);
    if (!tmdbSelected) {
      setContentType(suggestion.content_type as 'film' | 'serie' | 'buch');
    }
    setShowSuggestions(false);
    setTmdbSelected(false);
  };

  const handleTmdbSuggestionClick = async (tmdb: TmdbSuggestion) => {
    setTitle(tmdb.title || tmdb.name || '');
    const yearStr = tmdb.release_date || tmdb.first_air_date || '';
    setYear(yearStr ? yearStr.slice(0, 4) : '');
    setShowTmdbSuggestions(false);

    let detectedType = 'film';
    let apiMediaType: 'movie' | 'tv' = 'movie';
    if (tmdb.media_type === 'tv') {
      detectedType = 'serie';
      apiMediaType = 'tv';
    }
    setContentType(detectedType as 'film' | 'serie' | 'buch');
    setTmdbSelected(true);
    setSelectedMovie(null);

    try {
      const res = await fetch(`/api/tmdb?tmdbId=${tmdb.id}&mediaType=${apiMediaType}`);
      const details: MovieDetails & { trailerUrl?: string } = await res.json();
      setDirector((details as any).director || '');
      setActor((details as any).actors || '');
      setDescription(details.overview || '');
      setGenre(details.genres ? details.genres.map(g => g.name).join(', ') : '');
      setPosterUrl(details.poster_path ? `https://image.tmdb.org/t/p/w500${details.poster_path}` : '');
      setTrailerUrl(details.trailerUrl);
    } catch (error) {
      console.error('Error fetching TMDb details:', error);
    }
  };

  const handleSubmit = async (submitActionType: 'rate' | 'watchlist') => {
    if (!title.trim()) {
      setMessage('Bitte einen Titel eingeben');
      return;
    }

    setIsSubmitting(true);
    setActionType(submitActionType);

    try {
      const { data: movieData, error: movieError } = await supabase
        .from('movies')
        .insert({
          title,
          description,
          year: parseInt(year) || new Date().getFullYear(),
          poster_url: posterUrl,
          content_type: contentType,
          director,
          genre,
          created_by: user?.id || 'anonymous',
        })
        .select()
        .single();

      if (movieError) {
        throw new Error(movieError.message || 'Fehler beim Erstellen des Films');
      }

      const movieId = movieData.id;

      // Tags hinzufügen
      if (tags.trim()) {
        const tagList = tags.split(',').map((t) => t.trim()).filter(Boolean);
        for (const tagName of tagList) {
          const { data: existingTag } = await supabase
            .from('tags')
            .select('id')
            .eq('name', tagName.toLowerCase())
            .single();

          let tagId;
          if (existingTag) {
            tagId = existingTag.id;
          } else {
            const { data: newTag } = await supabase
              .from('tags')
              .insert({ name: tagName.toLowerCase(), color: '#3b82f6' })
              .select('id')
              .single();
            tagId = newTag?.id;
          }

          if (tagId) {
            await supabase
              .from('movie_tags')
              .insert({ movie_id: movieId, tag_id: tagId });
          }
        }
      }

      // Bewertung oder Watchlist
      if (submitActionType === 'rate' && rating > 0) {
        const { error: ratingError } = await supabase
          .from('ratings')
          .insert({
            movie_id: movieId,
            user_id: user?.id || 'anonymous',
            rating: rating,
            user_name: user?.name || 'Anonymous', // Add user_name field
          });

        if (ratingError) throw ratingError;
        setMessage('Film erfolgreich hinzugefügt und bewertet!');
      } else if (submitActionType === 'watchlist') {
        const { error: watchlistError } = await supabase
          .from('watchlist')
          .insert({
            movie_id: movieId,
            user_id: user?.id || 'anonymous',
          });

        if (watchlistError) throw watchlistError;
        setMessage('Film erfolgreich zur Watchlist hinzugefügt!');
      } else if (submitActionType === 'rate' && rating === 0) {
        setMessage('Bitte wählen Sie eine Bewertung aus, bevor Sie absenden');
        setIsSubmitting(false);
        setActionType(null);
        return;
      }

      // Form zurücksetzen
      setTitle('');
      setDescription('');
      setContentType('film');
      setRating(0);
      setTags('');
      setSelectedMovie(null);
      setSuggestions([]);
      setShowSuggestions(false);
      setTmdbSelected(false);
      setDirector('');
      setActor('');
      setYear('');
      setGenre('');
      setPosterUrl('');
      setTrailerUrl(undefined);

      setTimeout(() => {
        window.location.reload();
      }, 1500);
    } catch (error) {
      console.error('Fehler beim Hinzufügen des Films:', error);
      let errorMessage = 'Unbekannter Fehler';
      
      if (error instanceof Error) {
        errorMessage = error.message;
      }
      
      setMessage(`Fehler beim Hinzufügen: ${errorMessage}`);
    } finally {
      setIsSubmitting(false);
      setActionType(null);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-4 bg-white rounded-lg shadow-md">
      <form className="space-y-6">
        {/* Typ Dropdown */}
        <div>
          <label htmlFor="contentType" className="block text-sm font-medium text-gray-700 mb-1">
            Typ *
          </label>
          <select
            id="contentType"
            value={contentType}
            onChange={(e) => {
              setContentType(e.target.value as 'film' | 'serie' | 'buch');
              setTmdbSuggestions([]);
              setShowTmdbSuggestions(false);
              setPosterUrl('');
              setDirector('');
              setActor('');
              setDescription('');
              setGenre('');
              setTrailerUrl(undefined);
            }}
            className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="film">Film</option>
            <option value="serie">Serie</option>
            <option value="buch">Buch</option>
          </select>
        </div>

        {/* Title Input with TMDb Autocomplete */}
        <div className="relative">
          <label htmlFor="title" className="block text-sm font-medium text-gray-700">
            Titel *
          </label>
          <input
            type="text"
            id="title"
            value={title}
            onChange={(e) => {
              setTitle(e.target.value);
              setSelectedMovie(null);
            }}
            onFocus={() => {
              if (contentType !== 'buch' && tmdbSuggestions.length > 0) setShowTmdbSuggestions(true);
            }}
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder={contentType === 'buch' ? 'z.B. Der Steppenwolf' : 'z.B. Mulholland Drive'}
            required
            autoComplete="off"
            disabled={isLoading}
          />

          {/* TMDb Autocomplete Dropdown */}
          {contentType !== 'buch' && showTmdbSuggestions && tmdbSuggestions.length > 0 && (
            <div
              ref={tmdbDropdownRef}
              className="absolute z-50 mt-1 w-full bg-white border border-blue-400 rounded-md shadow-2xl max-h-80 overflow-y-auto left-0"
              style={{ top: '100%' }}
            >
              <div className="block sm:hidden sticky top-0 bg-white z-10 text-right p-2 border-b border-gray-200">
                <button
                  type="button"
                  className="text-gray-500 text-lg px-2 py-1"
                  onClick={() => setShowTmdbSuggestions(false)}
                  aria-label="Schließen"
                >
                  ✕
                </button>
              </div>
              {tmdbSuggestions.map((tmdb) => (
                <div
                  key={tmdb.id}
                  onClick={() => handleTmdbSuggestionClick(tmdb)}
                  className="px-3 py-2 hover:bg-blue-50 cursor-pointer border-b border-gray-100 last:border-b-0 flex items-center gap-2"
                >
                  {tmdb.poster_path && (
                    <img 
                      src={`https://image.tmdb.org/t/p/w92${tmdb.poster_path}`} 
                      alt={tmdb.title || tmdb.name} 
                      className="w-8 h-12 object-cover rounded mr-2" 
                    />
                  )}
                  <div>
                    <span className="font-medium">{tmdb.title || tmdb.name}</span>
                    <span className="ml-2 text-xs text-gray-500">
                      {tmdb.media_type === 'movie' ? 'Film' : tmdb.media_type === 'tv' ? 'Serie' : ''}
                    </span>
                    {(tmdb.release_date || tmdb.first_air_date) && (
                      <span className="ml-2 text-xs text-gray-500">
                        {((tmdb.release_date || tmdb.first_air_date) ?? '').slice(0, 4)}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Poster Preview */}
          {posterUrl && (
            <div className="mt-2 flex justify-center">
              <img
                src={posterUrl}
                alt="Poster Preview"
                className="rounded shadow max-h-64"
                style={{ maxWidth: '180px', objectFit: 'contain' }}
              />
            </div>
          )}
        </div>

        {/* Beschreibung mit Fokus nach TMDb-Auswahl */}
        <div style={{ display: 'none' }}><input id="description" value={description} readOnly tabIndex={-1} /></div>

        {/* Rating */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Bewertung
          </label>
          <div className="flex space-x-1">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                type="button"
                onClick={() => setRating(star)}
                className={`w-8 h-8 ${
                  star <= rating ? 'text-yellow-400' : 'text-gray-300'
                } hover:text-yellow-400 transition-colors`}
              >
                ★
              </button>
            ))}
          </div>
        </div>

        {/* Tags */}
        <div className="relative">
          <label htmlFor="tags" className="block text-sm font-medium text-gray-700">
            Tags (durch Komma getrennt)
          </label>
          <input
            type="text"
            id="tags"
            value={tags}
            onChange={(e) => setTags(e.target.value)}
            onFocus={() => setShowTagSuggestions(true)}
            onBlur={() => setTimeout(() => setShowTagSuggestions(false), 100)}
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="z.B. thriller, mindblow, klassiker"
            autoComplete="off"
          />

          {/* Tag Autocomplete Dropdown */}
          {showTagSuggestions && allTags.length > 0 && (
            <div className="absolute z-50 mt-1 w-full bg-white border border-blue-400 rounded-md shadow-2xl max-h-60 overflow-y-auto left-0" style={{ top: '100%' }}>
              {allTags
                .filter((tag) => {
                  const inputTags = tags.split(',').map((t) => t.trim().toLowerCase());
                  return (
                    tag.name &&
                    !inputTags.includes(tag.name.toLowerCase()) &&
                    (tags === '' || tag.name.toLowerCase().includes(tags.split(',').pop()?.trim().toLowerCase() || ''))
                  );
                })
                .slice(0, 15)
                .map((tag) => (
                  <button
                    key={tag.name}
                    type="button"
                    className="block w-full text-left px-3 py-2 hover:bg-blue-100 text-sm flex items-center gap-2"
                    style={{ color: tag.color }}
                    onMouseDown={() => {
                      const inputTags = tags.split(',').map((t) => t.trim()).filter(Boolean);
                      inputTags[inputTags.length - 1] = tag.name;
                      setTags(inputTags.join(', ') + ', ');
                      setShowTagSuggestions(false);
                    }}
                  >
                    <span 
                      className="inline-block w-2 h-2 rounded-full mr-2" 
                      style={{ backgroundColor: tag.color }}
                    />
                    {tag.name}
                  </button>
                ))}
            </div>
          )}
        </div>

        {/* Two Action Buttons */}
        <div className="space-y-3 pt-4">
          <button
            type="button"
            onClick={() => handleSubmit('rate')}
            disabled={isSubmitting}
            className="w-full py-3 px-4 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isSubmitting && actionType === 'rate' ? 'Wird hinzugefügt...' : 'Bewerten'}
          </button>

          <button
            type="button"
            onClick={() => handleSubmit('watchlist')}
            disabled={isSubmitting}
            className="w-full py-3 px-4 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isSubmitting && actionType === 'watchlist' ? 'Wird hinzugefügt...' : 'Watchlist'}
          </button>
        </div>

        {/* Message Display */}
        {message && (
          <div className={`mt-4 p-3 rounded-md text-sm ${
            message.includes('erfolgreich') 
              ? 'bg-green-100 text-green-700' 
              : 'bg-red-100 text-red-700'
          }`}>
            {message}
          </div>
        )}
      </form>
    </div>
  );
}