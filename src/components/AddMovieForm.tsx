'use client'


import { useState, useEffect, useRef } from 'react'
import { supabase } from '@/lib/supabase'
import { useUser } from '@/lib/UserContext'
import { searchTMDb, getTMDbDetails } from '@/lib/tmdbApi'
import type { MovieDetails } from '@/lib/types'

interface MovieSuggestion {
  id: string
  title: string
  content_type: string
  creator_name?: string
}

interface TmdbSuggestion {
  id: number
  title?: string
  name?: string
  release_date?: string
  first_air_date?: string
  poster_path?: string
  media_type: 'movie' | 'tv';
}

export default function AddMovieForm() {
  // Tag Autocomplete
  const [allTags, setAllTags] = useState<{ name: string; color: string }[]>([]);
  const [showTagSuggestions, setShowTagSuggestions] = useState(false);
  useEffect(() => {
    // Fetch all tags from Supabase once on mount
    const fetchTags = async () => {
      const { data, error } = await supabase.from('tags').select('name, color').order('name');
      if (!error && data) setAllTags((data as { name: string; color: string }[]).filter(t => typeof t.name === 'string' && typeof t.color === 'string'));
    };
    fetchTags();
  }, []);
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  // Typ-Auswahl: film | serie | buch
  const [contentType, setContentType] = useState<'film' | 'serie' | 'buch'>('film')
  const [rating, setRating] = useState<number>(0)
  const [tags, setTags] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [suggestions, setSuggestions] = useState<MovieSuggestion[]>([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [selectedMovie, setSelectedMovie] = useState<MovieSuggestion | null>(null)
  const { user } = useUser()
  // TMDb Autocomplete
  const [tmdbSuggestions, setTmdbSuggestions] = useState<TmdbSuggestion[]>([])
  const [showTmdbSuggestions, setShowTmdbSuggestions] = useState(false)
  const [director, setDirector] = useState('')
  const [actor, setActor] = useState('')
  const [year, setYear] = useState('')
  const [genre, setGenre] = useState('')
  const [posterUrl, setPosterUrl] = useState('')

  // Autocomplete für Filme (Supabase + TMDb)
  // Click outside ref for TMDb dropdown
  const tmdbDropdownRef = useRef<HTMLDivElement>(null);
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
      // Supabase interne Suche (immer)
            // Supabase interne Suche (immer)
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
        // Fehlerbehandlung
      }
      // TMDb Autocomplete nur für Film/Serie
      if (contentType === 'film' || contentType === 'serie') {
        try {
          const tmdbType = contentType === 'film' ? 'movie' : 'tv';
          const res = await fetch(`/api/tmdb?title=${encodeURIComponent(title.trim())}`);
          const data = await res.json();
          if (!ignore) {
            if (data && data.results && data.results.length > 0) {
              // Filtere nach Typ
              setTmdbSuggestions(data.results.filter((r: any) => r.media_type === tmdbType));
              setShowTmdbSuggestions(true);
            } else {
              setTmdbSuggestions([]);
              setShowTmdbSuggestions(false);
            }
          }
        } catch (error) {
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
    return () => { ignore = true; };
  }, [title, contentType]);

  // Click outside handler for OMDb dropdown (schließt nur, wenn explizit außerhalb getippt wird, nicht bei Input-Blur)
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

  // Merker, ob nach Supabase-Auswahl noch eine TMDb-Auswahl kam
  const [tmdbSelected, setTmdbSelected] = useState(false);

  const handleSuggestionClick = (suggestion: MovieSuggestion) => {
    setSelectedMovie(suggestion);
    setTitle(suggestion.title);
    // Nur setzen, wenn nicht direkt danach eine TMDb-Auswahl kommt
    if (!tmdbSelected) {
    setContentType(suggestion.content_type as 'film' | 'serie' | 'buch');
    }
    setShowSuggestions(false);
    setTmdbSelected(false); // Reset, falls wieder Supabase gewählt wird
  }

  // TMDb Auswahl
  const [trailerUrl, setTrailerUrl] = useState<string | undefined>(undefined);
  const handleTmdbSuggestionClick = async (tmdb: TmdbSuggestion) => {
    setTitle(tmdb.title || tmdb.name || '');
    const yearStr = tmdb.release_date || tmdb.first_air_date || '';
    setYear(yearStr ? yearStr.slice(0, 4) : '');
    setShowTmdbSuggestions(false);
    // Typ automatisch setzen
    let detectedType = 'film';
    let apiMediaType: 'movie' | 'tv' = 'movie';
    if (tmdb.media_type === 'tv') {
      detectedType = 'serie';
      apiMediaType = 'tv';
    }
    setContentType(detectedType as 'film' | 'serie' | 'buch');
    setTmdbSelected(true); // Merker setzen, damit Supabase-Auswahl nicht Typ überschreibt
    setSelectedMovie(null); // Wichtig: Supabase-Auswahl zurücksetzen, damit alle Felder übernommen werden
    // Details holen via API route
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
      // Fehlerbehandlung
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    let movieId: string | undefined
    try {

      // Immer: Check ob Film/Serie schon existiert (case-insensitive)
      let movieExists = false;
      if (selectedMovie) {
        movieId = selectedMovie.id;
        movieExists = true;
      } else {
        const { data: existingMovies } = await supabase
          .from('movies')
          .select('*')
          .ilike('title', title.trim());
        if (existingMovies && existingMovies.length > 0) {
          movieId = existingMovies[0].id as string;
          movieExists = true;
        }
      }

      if (movieExists) {
        // Update movie fields with current state (immer State verwenden!)
        const { error: updateError } = await supabase
          .from('movies')
          .update({
            title: title.trim(),
            description: description.trim() || null,
            content_type: contentType,
            created_by: user?.name || 'Unbekannt',
            poster_url: posterUrl || null,
            director: director || null,
            actor: actor || null,
            year: year ? Number(year) : null,
            genre: genre || null,
            trailer_url: trailerUrl || null,
          })
          .eq('id', movieId ?? '');
        if (updateError) {
          console.error('Movie update error:', updateError);
          throw new Error(`Fehler beim Aktualisieren des Eintrags: ${updateError.message || updateError.details || 'Unbekannter Datenbankfehler'}`);
        }
        console.log('Eintrag existiert bereits, Felder wurden aktualisiert, füge Tags/Bewertung hinzu');
      } else {
        // Create new movie
        const { data: newMovie, error: movieError } = await supabase
          .from('movies')
          .insert([
            {
              title: title.trim(),
              description: description.trim() || null,
              content_type: contentType,
              created_by: user?.name || 'Unbekannt',
              poster_url: posterUrl || null,
              director: director || null,
              actor: actor || null,
              year: year ? Number(year) : null,
              genre: genre || null,
              trailer_url: trailerUrl || null,
            },
          ])
          .select()
          .single();
        if (movieError) {
          console.error('Movie creation error:', movieError);
          throw new Error(`Fehler beim Erstellen des Eintrags: ${movieError.message || movieError.details || 'Unbekannter Datenbankfehler'}`);
        }
        movieId = newMovie.id as string;
        console.log('Neuer Eintrag erstellt');
      }

      // Add or update rating if provided
      if (rating > 0) {
        // Check if rating already exists for this user/movie
        const { data: existingRating, error: ratingFetchError } = await supabase
          .from('ratings')
          .select('id')
          .eq('movie_id', movieId ?? '')
          .eq('user_id', user?.id ?? '')
          .maybeSingle();

        if (ratingFetchError) {
          console.error('Rating fetch error:', ratingFetchError);
          throw new Error(`Fehler beim Überprüfen der Bewertung: ${ratingFetchError.message || ratingFetchError.details || 'Unbekannter Datenbankfehler'}`);
        }

        if (existingRating) {
          // Update existing rating
          const { error: ratingUpdateError } = await supabase
            .from('ratings')
            .update({ rating: rating, user_name: user?.name })
            .eq('id', (existingRating as { id?: string })?.id ?? '');
          if (ratingUpdateError) {
            console.error('Rating update error:', ratingUpdateError);
            throw new Error(`Fehler beim Aktualisieren der Bewertung: ${ratingUpdateError.message || ratingUpdateError.details || 'Unbekannter Datenbankfehler'}`);
          }
        } else {
          // Insert new rating
          const { error: ratingError } = await supabase
            .from('ratings')
            .insert([
              {
                movie_id: movieId,
                rating: rating,
                user_id: user?.id,
                user_name: user?.name,
              },
            ]);
          if (ratingError) {
            console.error('Rating creation error:', ratingError);
            throw new Error(`Fehler beim Hinzufügen der Bewertung: ${ratingError.message || ratingError.details || 'Unbekannter Datenbankfehler'}`);
          }
        }
      }

      // Add tags if provided
      if (tags.trim()) {
        const tagNames = tags.split(',').map(tag => tag.trim().toLowerCase()).filter(Boolean)
        
        for (const tagName of tagNames) {
          try {
            // Check if tag exists
            let { data: existingTag, error: tagSearchError } = await supabase
              .from('tags')
              .select('*')
              .eq('name', tagName)
              .single()

            let tagId: string

            if (existingTag) {
              tagId = existingTag.id as string
              console.log(`Tag "${tagName}" existiert bereits`)
            } else {
              // Create new tag
              const colors = ['#EF4444', '#F59E0B', '#8B5CF6', '#EC4899', '#06B6D4', '#10B981', '#7C3AED']
              const randomColor = colors[Math.floor(Math.random() * colors.length)]
              
              const { data: newTag, error: tagError } = await supabase
                .from('tags')
                .insert([{ name: tagName, color: randomColor }])
                .select()
                .single()

              if (tagError) {
                console.error(`Fehler beim Erstellen des Tags "${tagName}":`, tagError)
                throw new Error(`Fehler beim Erstellen des Tags "${tagName}": ${tagError.message || tagError.details || 'Unbekannter Fehler'}`)
              }
              
              tagId = newTag.id as string
              console.log(`Neuer Tag "${tagName}" erstellt`)
            }

            // Link movie to tag
            const { error: linkError } = await supabase
              .from('movie_tags')
              .insert([
                {
                  movie_id: movieId,
                  tag_id: tagId,
                },
              ])

            if (linkError) {
              console.error(`Fehler beim Verknüpfen des Tags "${tagName}":`, linkError)
              throw new Error(`Fehler beim Verknüpfen des Tags "${tagName}": ${linkError.message || linkError.details || 'Unbekannter Fehler'}`)
            }
            
            console.log(`Tag "${tagName}" erfolgreich verknüpft`)
          } catch (tagProcessError) {
            console.error(`Fehler beim Verarbeiten des Tags "${tagName}":`, tagProcessError)
            // Continue with other tags even if one fails
          }
        }
      }

      // Reset form
      setTitle('')
      setDescription('')
      setContentType('film')
      setRating(0)
      setTags('')
      setSelectedMovie(null)
      setSuggestions([])
      setShowSuggestions(false)
      setTmdbSelected(false)
      
      // Refresh the page to show updated data
      window.location.reload()
    } catch (error) {
      console.error('Error adding movie:', error)
      
      let errorMessage = 'Unbekannter Fehler'
      
      if (error instanceof Error) {
        errorMessage = error.message
      } else if (typeof error === 'object' && error !== null) {
        // Handle Supabase errors
        if ('message' in error) {
          errorMessage = String(error.message)
        } else if ('details' in error) {
          errorMessage = String(error.details)
        } else {
          errorMessage = JSON.stringify(error)
        }
      } else {
        errorMessage = String(error)
      }
      
      alert(`Fehler beim Hinzufügen: ${errorMessage}`)
    } finally {
      setIsLoading(false)
    }
  }


    return (
      <form onSubmit={handleSubmit} className="space-y-6">
      {/* Typ Dropdown */}
      <div>
        <label htmlFor="contentType" className="block text-sm font-medium text-gray-700 mb-1">Typ *</label>
        <select
          id="contentType"
          value={contentType}
          onChange={e => {
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

      {/* Title Input (mit/ohne Autocomplete je nach Typ) */}
      <div className="relative">
        <label htmlFor="title" className="block text-sm font-medium text-gray-700">
          Titel *
        </label>
        <input
          type="text"
          id="title"
          value={title}
          onChange={(e) => {
            setTitle(e.target.value)
            setSelectedMovie(null)
          }}
          onFocus={() => {
            if (contentType !== 'buch' && tmdbSuggestions.length > 0) setShowTmdbSuggestions(true)
          }}
          className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          placeholder={contentType === 'buch' ? 'z.B. Der Steppenwolf' : 'z.B. Mulholland Drive'}
          required
          autoComplete="off"
          disabled={isLoading}
        />

        {/* TMDb Autocomplete Dropdown - nur für Film/Serie */}
        {contentType !== 'buch' && showTmdbSuggestions && tmdbSuggestions.length > 0 && (
          <div
            ref={tmdbDropdownRef}
            className="absolute z-50 mt-1 w-full bg-white border border-blue-400 rounded-md shadow-2xl max-h-80 overflow-y-auto left-0"
            style={{ top: '100%' }}
          >
            {/* Mobile Close Button */}
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
                onClick={async () => {
                  await handleTmdbSuggestionClick(tmdb);
                  // Nach Auswahl Fokus auf das nächste Feld (z.B. Beschreibung)
                  setTimeout(() => {
                    const descInput = document.getElementById('description');
                    if (descInput) (descInput as HTMLInputElement).focus();
                  }, 0);
                }}
                className="px-3 py-2 hover:bg-blue-50 cursor-pointer border-b border-gray-100 last:border-b-0 flex items-center gap-2"
              >
                {tmdb.poster_path && (
                  <img src={`https://image.tmdb.org/t/p/w92${tmdb.poster_path}`} alt={tmdb.title || tmdb.name} className="w-8 h-12 object-cover rounded mr-2" />
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

        {/* Poster Preview (direkt nach TMDb-Auswahl) */}
        {posterUrl && (
          <div className="mt-2 flex justify-center transition-all animate-fade-in">
            <img
              src={posterUrl}
              alt="Poster Preview"
              className="rounded shadow max-h-64"
              style={{ maxWidth: '180px', objectFit: 'contain' }}
            />
          </div>
        )}
      </div>



      {/* Beschreibung (damit der Fokus nach TMDb-Auswahl gesetzt werden kann) */}
      <div style={{ display: 'none' }}>
        <input id="description" value={description} readOnly tabIndex={-1} />
      </div>
      {/* Content Type wird automatisch gesetzt (kein Dropdown mehr) */}

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
              .filter(tag => {
                // Only show tags not already in the input
                const inputTags = tags.split(',').map(t => t.trim().toLowerCase());
                return tag.name && !inputTags.includes(tag.name.toLowerCase()) && (tags === '' || tag.name.toLowerCase().includes(tags.split(',').pop()?.trim().toLowerCase() || ''));
              })
              .slice(0, 15)
              .map(tag => (
                <button
                  key={tag.name}
                  type="button"
                  className="block w-full text-left px-3 py-2 hover:bg-blue-100 text-sm flex items-center gap-2"
                  style={{ color: tag.color }}
                  onMouseDown={() => {
                    // Add tag to input, keeping existing tags
                    const inputTags = tags.split(',').map(t => t.trim()).filter(Boolean);
                    inputTags[inputTags.length - 1] = tag.name; // Replace last partial with selected
                    setTags(inputTags.join(', ') + ', ');
                    setShowTagSuggestions(false);
                  }}
                >
                  <span className="inline-block w-2 h-2 rounded-full mr-2" style={{ backgroundColor: tag.color }}></span>
                  {tag.name}
                </button>
              ))}
            {allTags.filter(tag => {
              const inputTags = tags.split(',').map(t => t.trim().toLowerCase());
              return tag.name && !inputTags.includes(tag.name.toLowerCase()) && (tags === '' || tag.name.toLowerCase().includes(tags.split(',').pop()?.trim().toLowerCase() || ''));
            }).length === 0 && (
              <div className="px-3 py-2 text-gray-400 text-sm">Keine passenden Tags</div>
            )}
          </div>
        )}
      </div>

      <button
        type="submit"
        disabled={isLoading}
        className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isLoading ? 'Wird hinzugefügt...' : 'Hinzufügen'}
      </button>
    </form>
  );
}
