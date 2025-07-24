"use client";

import { useState, useEffect } from "react";
import { supabase, Movie, Tag } from "@/lib/supabase";
import { useUser } from "@/lib/UserContext";

interface MovieWithDetails extends Movie {
  tags: Tag[];
  averageRating: number;
  ratingCount: number;
  ratings: Array<{
    rating: number;
    user_name: string;
    user_id: string;
  }>;
  actor?: string;
  director?: string;
  trailer_url?: string;
}

interface MovieDetailModalProps {
  movie: MovieWithDetails;
  isOpen: boolean;
  onClose: () => void;
  onMovieUpdated: () => void;
}

export function MovieDetailModal({ movie, isOpen, onClose, onMovieUpdated }: MovieDetailModalProps) {
  const [showSuggestions, setShowSuggestions] = useState(false);
  // Map UI fields to DB fields (German names)
  const [editedMovie, setEditedMovie] = useState<any>({});
  const [allTags, setAllTags] = useState<Tag[]>([]);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [newTagName, setNewTagName] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showAllTags, setShowAllTags] = useState(false);
  const { user } = useUser();

  const hasDetails = !!(movie.poster_url || movie.director || movie.actor || movie.year);

  function countMatchingTags(movieTags: Tag[], selectedTags: string[]): number {
    return movieTags.filter(tag => selectedTags.includes(tag.name)).length;
  }

  const toggleTag = (tagName: string) => {
    setSelectedTags(prev =>
      prev.includes(tagName)
        ? prev.filter(t => t !== tagName)
        : [...prev, tagName]
    );
  };

  const [tagUsageCount, setTagUsageCount] = useState<Record<string, number>>({});
  useEffect(() => {
    const fetchTagUsage = async () => {
      const { data, error } = await supabase
        .from('movie_tags')
        .select('tag_id, tags(name)');
      if (!error && data) {
        const countMap: Record<string, number> = {};
        data.forEach((row: any) => {
          const tagName = row.tags?.name;
          if (tagName) {
            countMap[tagName] = (countMap[tagName] || 0) + 1;
          }
        });
        setTagUsageCount(countMap);
      }
    };
    fetchTagUsage();
  }, [isOpen]);

  const topTags = [...allTags]
    .sort((a, b) => (tagUsageCount[b.name] || 0) - (tagUsageCount[a.name] || 0))
    .slice(0, 20);

  const allTagsSorted = [...allTags].sort((a, b) => a.name.localeCompare(b.name));

  useEffect(() => {
    if (isOpen && movie) {
      setEditedMovie({
        title: movie.title,
        description: movie.description || "",
        content_type: movie.content_type,
        actor: movie.actor || "",
        director: movie.director || "",
        year: movie.year ? String(movie.year) : '',
        genre: (movie as any).genre || ''
      });
      setSelectedTags(movie.tags.map(tag => tag.name));
      fetchAllTags();
    }
  }, [isOpen, movie]);

  const fetchAllTags = async () => {
    try {
      const { data, error } = await supabase.from("tags").select("*").order("name");
      if (!error && data) setAllTags(data as unknown as Tag[]);
    } catch (e) {
      // ignore
    }
  };

  const handleSave = async () => {
    setIsLoading(true);
    try {
      // Prepare only allowed fields, remove empty strings and undefined
      const updatePayload: any = {
        title: editedMovie.title,
        description: editedMovie.description,
        content_type: editedMovie.content_type,
        actor: editedMovie.actor,
        director: editedMovie.director
      };
      if (editedMovie.year && editedMovie.year.trim() !== "") {
        updatePayload.year = Number(editedMovie.year);
      } else {
        updatePayload.year = null;
      }
      if (editedMovie.genre && editedMovie.genre.trim() !== "") {
        updatePayload.genre = editedMovie.genre;
      } else {
        updatePayload.genre = null;
      }
      const { error } = await supabase
        .from("movies")
        .update(updatePayload)
        .eq("id", movie.id);
      if (error) {
        console.error("Supabase update error:", error);
        alert("Fehler beim Aktualisieren des Films: " + (error.message || error.details || error.toString()));
        setIsLoading(false);
        return;
      }

      // --- Tag-Zuordnung aktualisieren ---
      // 1. Alle bisherigen Tags für diesen Film löschen
      await supabase.from("movie_tags").delete().eq("movie_id", movie.id);
      // 2. Neue Tags einfügen
      if (selectedTags.length > 0) {
        const tagInserts = selectedTags.map(tagName => {
          const tag = allTags.find(t => t.name === tagName);
          return tag && tag.id ? { movie_id: movie.id, tag_id: tag.id } : undefined;
        }).filter((v): v is { movie_id: string; tag_id: string } => !!v);
        if (tagInserts.length > 0) {
          const { error: tagError } = await supabase.from("movie_tags").insert(tagInserts);
          if (tagError) {
            console.error("Fehler beim Speichern der Tags:", tagError);
            alert("Fehler beim Speichern der Tags: " + (tagError.message || tagError.details || tagError.toString()));
            setIsLoading(false);
            return;
          }
        }
      }

      onMovieUpdated();
      onClose();
    } catch (e) {
      alert("Fehler beim Speichern");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteMovie = async () => {
    if (!confirm(`Möchtest du "${movie.title}" wirklich löschen?`)) return;
    try {
      const { error } = await supabase.from("movies").delete().eq("id", movie.id);
      if (error) alert("Fehler beim Löschen");
      else {
        onMovieUpdated();
        onClose();
      }
    } catch {
      alert("Fehler beim Löschen");
    }
  };

  const createNewTag = async () => {
    if (!newTagName.trim()) return;
    const palette = [
      "#2563EB", "#059669", "#D97706", "#DC2626", "#7C3AED", "#EA580C",
      "#0D9488", "#B91C1C", "#A21CAF", "#15803D", "#1D4ED8", "#BE185D",
      "#CA8A04", "#4B5563", "#6D28D9"
    ];
    const color = palette[allTags.length % palette.length];
    try {
      const { data, error } = await supabase.from("tags").insert([{ name: newTagName.trim(), color }]).select().single();
      if (!error && data && typeof data.name === 'string') {
        setAllTags(prev => [...prev, data as unknown as Tag]);
        setSelectedTags(prev => [...prev, data.name as string]);
        setNewTagName("");
        setShowSuggestions(false);
      } else {
        alert("Fehler beim Erstellen des Tags");
      }
    } catch {
      alert("Fehler beim Erstellen des Tags");
    }
  };

  const [isInWatchlist, setIsInWatchlist] = useState<boolean>(false);
  const [userRating, setUserRating] = useState<number>(0);

  useEffect(() => {
    const fetchWatchlistStatus = async () => {
      if (!user || !movie) {
        setIsInWatchlist(false);
        return;
      }
      
      try {
        const { data, error } = await supabase
          .from('watchlist')
          .select('id')
          .eq('movie_id', movie.id)
          .eq('user_id', user.id)
          .single();

        setIsInWatchlist(!error && !!data);
      } catch (error) {
        console.error('Error fetching watchlist status:', error);
        setIsInWatchlist(false);
      }
    };

    fetchWatchlistStatus();
  }, [user, movie]);

  useEffect(() => {
    const fetchUserRating = async () => {
      if (!user || !movie) {
        setUserRating(0);
        return;
      }
      
      try {
        const { data, error } = await supabase
          .from('ratings')
          .select('rating')
          .eq('movie_id', movie.id)
          .eq('user_id', user.id)
          .single();

        setUserRating(!error && data ? (data.rating as number) : 0);
      } catch (error) {
        console.error('Error fetching user rating:', error);
        setUserRating(0);
      }
    };

    fetchUserRating();
  }, [user, movie]);

  const handleStarClick = async (rating: number) => {
    if (!user || !movie) {
      alert('Du musst eingeloggt sein, um zu bewerten!');
      return;
    }

    try {
      // Check if user already rated this movie
      const { data: existingRating, error: fetchError } = await supabase
        .from('ratings')
        .select('id')
        .eq('movie_id', movie.id)
        .eq('user_id', user.id)
        .single();

      if (existingRating) {
        // Update existing rating
        const { error } = await supabase
          .from('ratings')
          .update({ rating })
          .eq('id', existingRating.id as string);

        if (error) {
          console.error('Error updating rating:', error);
          alert('Fehler beim Aktualisieren der Bewertung');
          return;
        }
      } else {
        // Create new rating
        const { error } = await supabase
          .from('ratings')
          .insert([
            {
              movie_id: movie.id,
              rating: rating,
              user_id: user.id,
              user_name: user.name,
            },
          ]);

        if (error) {
          console.error('Error creating rating:', error);
          alert('Fehler beim Erstellen der Bewertung');
          return;
        }
      }

      setUserRating(rating);
      console.log('Bewertung erfolgreich gespeichert!');
      
    } catch (error) {
      console.error('Error handling rating:', error);
      alert('Fehler beim Verarbeiten der Bewertung');
    }
  };

  const handleDeleteRating = async () => {
    if (!user || !movie) return;
    
    try {
      const { error } = await supabase
        .from('ratings')
        .delete()
        .eq('movie_id', movie.id)
        .eq('user_id', user.id);

      if (error) {
        console.error('Error deleting rating:', error);
        alert('Fehler beim Löschen der Bewertung');
        return;
      }

      setUserRating(0);
      console.log('Bewertung erfolgreich gelöscht!');
      
    } catch (error) {
      console.error('Error deleting rating:', error);
      alert('Fehler beim Löschen der Bewertung');
    }
  };

  const handleWatchlistToggle = async () => {
    if (!user || !movie) {
      alert('Du musst eingeloggt sein, um Filme zur Watchlist hinzuzufügen!')
      return
    }

    try {
      if (isInWatchlist) {
        // Remove from watchlist
        const { error } = await supabase
          .from('watchlist')
          .delete()
          .eq('movie_id', movie.id)
          .eq('user_id', user.id)

        if (error) {
          console.error('Error removing from watchlist:', error)
          alert('Fehler beim Entfernen aus der Watchlist')
          return
        }

        setIsInWatchlist(false)
      } else {
        // Add to watchlist
        const { error } = await supabase
          .from('watchlist')
          .insert([
            {
              movie_id: movie.id,
              user_id: user.id,
              user_name: user.name,
            },
          ])

        if (error) {
          console.error('Error adding to watchlist:', error)
          alert('Fehler beim Hinzufügen zur Watchlist')
          return
        }

        setIsInWatchlist(true)
      }

      console.log('Watchlist erfolgreich aktualisiert!')
      
    } catch (error) {
      console.error('Error handling watchlist:', error)
      alert('Fehler beim Verarbeiten der Watchlist')
    }
  }

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-0 sm:p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl w-full sm:max-w-2xl h-full overflow-y-auto flex flex-col">
        <div className="p-4 sm:p-6 flex-1 flex flex-col">
          <div className="flex justify-between items-center mb-4 sm:mb-6">
            <h2 className="text-lg sm:text-xl font-bold text-gray-900">Details &amp; Tags bearbeiten</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 text-2xl"
            >
              ×
            </button>
          </div>

          {/* Movie details now shown as plain text below */}

          <div className="space-y-3 sm:space-y-4">
            {/* Title as heading */}
            <h3 className="text-2xl font-bold text-gray-900 mb-2">{editedMovie.title}</h3>
            {/* Poster */}
            {movie.poster_url && (
              <div className="flex justify-center mb-4">
                <img
                  src={movie.poster_url}
                  alt={movie.title}
                  className="max-h-80 rounded shadow"
                  style={{ background: '#eee' }}
                />
              </div>
            )}
            {/* YouTube Trailer Button */}
            {movie.trailer_url && (
              <div className="flex justify-center mb-4">
                <a
                  href={movie.trailer_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors text-sm font-medium gap-2"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 24 24" className="w-5 h-5"><path d="M23.498 6.186a2.994 2.994 0 0 0-2.107-2.117C19.228 3.5 12 3.5 12 3.5s-7.228 0-9.391.569A2.994 2.994 0 0 0 .502 6.186C0 8.36 0 12 0 12s0 3.64.502 5.814a2.994 2.994 0 0 0 2.107 2.117C4.772 20.5 12 20.5 12 20.5s7.228 0 9.391-.569a2.994 2.994 0 0 0 2.107-2.117C24 15.64 24 12 24 12s0-3.64-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/></svg>
                  YouTube Trailer
                </a>
              </div>
            )}
            {/* Director */}
            {editedMovie.director && (
              <div className="text-base text-gray-700"><span className="font-semibold">Director:</span> {editedMovie.director}</div>
            )}
            {/* Actor */}
            {editedMovie.actor && (
              <div className="text-base text-gray-700"><span className="font-semibold">Actor:</span> {editedMovie.actor}</div>
            )}
            {/* Year */}
            {editedMovie.year && (
              <div className="text-base text-gray-700"><span className="font-semibold">Year:</span> {editedMovie.year}</div>
            )}
            {/* Genre */}
            {editedMovie.genre && (
              <div className="text-base text-gray-700"><span className="font-semibold">Genre:</span> {editedMovie.genre}</div>
            )}
            {/* Description */}
            {editedMovie.description && (
              <div className="text-base text-gray-700 whitespace-pre-line mt-2"><span className="font-semibold">Description:</span> {editedMovie.description}</div>
            )}
          {/* Tag selection and rest of modal follows... */}
            {/* Tag selection */}
            <div className="flex flex-wrap gap-2">
              {(showAllTags ? selectedTags : selectedTags.slice(0, 20)).map(tagName => {
                const tag = allTags.find(t => t.name === tagName);
                return (
                  <button
                    key={tagName}
                    onClick={() => toggleTag(tagName)}
                    className="flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium text-white hover:opacity-80 transition-opacity"
                    style={{ backgroundColor: tag?.color || '#6B7280' }}
                  >
                    {tagName}
                    <span className="text-xs">✕</span>
                  </button>
                );
              })}
              {selectedTags.length === 0 && (
                <p className="text-sm text-gray-500 italic">Keine Tags ausgewählt</p>
              )}
            </div>
            {selectedTags.length > 20 && (
              <button
                type="button"
                className="mt-2 text-xs text-blue-600 hover:underline focus:outline-none"
                onClick={() => setShowAllTags(v => !v)}
              >
                {showAllTags ? 'Weniger anzeigen' : 'Alle anzeigen'}
              </button>
            )}
          </div>

          {/* Available Tags to Add */}
          <div className="mb-4">
            <h4 className="text-sm font-medium text-gray-600 mb-2">Tags hinzufügen:</h4>
            <div className="flex flex-wrap gap-2">
              {(showAllTags ? allTagsSorted : topTags)
                .filter(tag => !selectedTags.includes(tag.name))
                .map(tag => (
                  <button
                    key={tag.id}
                    onClick={() => toggleTag(tag.name)}
                    className="px-3 py-1 rounded-full text-sm font-medium text-white opacity-60 hover:opacity-100 transition-opacity"
                    style={{ backgroundColor: tag.color }}
                  >
                    {tag.name}
                    <span className="ml-1 text-xs">+</span>
                  </button>
                ))}
            </div>
            {allTags.length > 10 && (
              <button
                type="button"
                className="mt-2 text-xs text-blue-600 hover:underline focus:outline-none"
                onClick={() => setShowAllTags(v => !v)}
              >
                {showAllTags ? 'Weniger anzeigen' : 'Alle anzeigen'}
              </button>
            )}
          </div>

          {/* New Tag Creation */}
          <div className="relative flex gap-2">
            <input
              type="text"
              placeholder="Neuer Tag..."
              value={newTagName}
              onChange={(e) => setNewTagName(e.target.value.toLowerCase())}
              className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              autoComplete="off"
              onFocus={() => setShowSuggestions(true)}
              onBlur={() => setTimeout(() => setShowSuggestions(false), 100)}
            />
            <button
              onClick={createNewTag}
              disabled={!newTagName.trim()}
              className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50"
            >
              + Tag
            </button>
            {/* Autocomplete Suggestions */}
            {showSuggestions && newTagName.trim() && (
              <div className="absolute left-0 top-full mt-1 w-full bg-white border border-gray-200 rounded-md shadow-lg z-10 max-h-40 overflow-y-auto">
                {allTags
                  .filter(tag =>
                    tag.name.toLowerCase().includes(newTagName.trim().toLowerCase()) &&
                    !selectedTags.includes(tag.name)
                  )
                  .slice(0, 10)
                  .map(tag => (
                    <button
                      key={tag.id}
                      type="button"
                      className="block w-full text-left px-3 py-2 hover:bg-blue-100 text-sm"
                      onMouseDown={() => {
                        setSelectedTags(prev => [...prev, tag.name]);
                        setNewTagName('');
                        setShowSuggestions(false);
                      }}
                    >
                      {tag.name}
                    </button>
                  ))}
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center pt-4 sm:pt-6 border-t border-gray-200 mt-4 sm:mt-6 gap-2 sm:gap-0">
            <button
              onClick={handleDeleteMovie}
              className="w-full sm:w-auto mb-2 sm:mb-0 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
            >
              🗑️ Löschen
            </button>
            <div className="flex gap-2 w-full sm:w-auto">
              <button
                onClick={handleSave}
                className="flex-1 sm:flex-none px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                type="button"
                disabled={isLoading}
              >
                {isLoading ? 'Speichern...' : 'Speichern'}
              </button>
              <button
                onClick={onClose}
                className="flex-1 sm:flex-none px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400 transition-colors"
                type="button"
              >
                Abbrechen
              </button>
            </div>
          </div>

          {/* Personal Rating Section */}
          {user && (
            <div className="bg-blue-50 p-4 rounded-lg mt-4">
              <h4 className="text-sm font-medium text-gray-700 mb-3">
                Deine Bewertung ({user.name}):
              </h4>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      onClick={() => handleStarClick(star)}
                      className={`w-8 h-8 text-2xl transition-colors hover:scale-110 ${
                        star <= userRating ? 'text-yellow-400' : 'text-gray-300 hover:text-yellow-300'
                      }`}
                    >
                      ★
                    </button>
                  ))}
                  <span className="ml-3 text-sm text-gray-600">
                    {userRating > 0 ? `${userRating} Sterne` : 'Noch nicht bewertet'}
                  </span>
                  {/* Delete rating button */}
                  {userRating > 0 && (
                    <button
                      onClick={handleDeleteRating}
                      className="ml-2 px-2 py-1 text-xs bg-gray-200 text-gray-700 rounded hover:bg-red-100 hover:text-red-600 transition-colors"
                      title="Bewertung löschen"
                    >
                      ✕
                    </button>
                  )}
                </div>

                {/* Watchlist Eye Button */}
                <button
                  onClick={handleWatchlistToggle}
                  className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm transition-colors ${
                    isInWatchlist
                      ? 'bg-green-100 text-green-700 hover:bg-green-200'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                  title={isInWatchlist ? 'Aus Watchlist entfernen' : 'Zur Watchlist hinzufügen'}
                >
                  <span className="text-xl">
                    {isInWatchlist ? '👁️' : '👁️‍🗨️'}
                  </span>
                  <span>
                    {isInWatchlist ? 'Auf Liste' : 'Merken'}
                  </span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
