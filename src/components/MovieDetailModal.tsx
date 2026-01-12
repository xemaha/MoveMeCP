"use client";

import { useState, useEffect } from "react";
import { supabase, Movie, Tag } from "@/lib/supabase";
import { useUser } from "@/lib/UserContext";
import { WatchProvidersDisplay } from "./WatchProvidersDisplay";
import { RecommendModal } from "./RecommendModal";
import { WhatsAppSuccessModal } from "./WhatsAppSuccessModal";
import { StarRating } from "./StarRating";

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
  tmdb_id?: number;
  media_type?: string;
}

interface MovieDetailModalProps {
  movie: MovieWithDetails;
  isOpen: boolean;
  onClose: () => void;
  onMovieUpdated: () => void;
  hideWatchlistFeature?: boolean
}

export function MovieDetailModal({ 
  movie, 
  isOpen, 
  onClose, 
  onMovieUpdated,
  hideWatchlistFeature = false 
}: MovieDetailModalProps) {
  const [showSuggestions, setShowSuggestions] = useState(false);
  // Map UI fields to DB fields (German names)
  const [editedMovie, setEditedMovie] = useState<any>({});
  const [allTags, setAllTags] = useState<Tag[]>([]);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [newTagName, setNewTagName] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showAllTags, setShowAllTags] = useState(false);
  const { user } = useUser();
  
  // Recommend modal state
  const [showRecommendModal, setShowRecommendModal] = useState(false);
  const [showWhatsAppModal, setShowWhatsAppModal] = useState(false);
  const [whatsAppRecipients, setWhatsAppRecipients] = useState<string[]>([]);

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
  // For keyword color-coding
  const [keywordStats, setKeywordStats] = useState<Record<string, { count3: number; count4: number }>>({});
  const [watchProviders, setWatchProviders] = useState<any>(null);

  // Fetch keyword stats for color-coding (user's rating history)
  useEffect(() => {
    async function fetchKeywordStats() {
      if (!user) return;
      // Query: For each keyword, how many movies has the user rated >=3 and >4 stars with that keyword?
      // This assumes keywords are stored as tags with a certain prefix or in a separate table; adjust as needed.
      // We'll use the tags on the movie and the ratings table.
      // For all movies the user rated >=3, collect all keywords/tags, count frequency.
      // For all movies the user rated >4, collect all keywords/tags, count frequency.
      // We'll use the 'tags' field on movies, assuming keywords are a subset of tags.
      // This is a simplified approach; for more accuracy, join movie_tags, tags, ratings.
      const { data, error } = await supabase
        .from('ratings')
        .select('movie_id, rating')
        .eq('user_id', user.id)
        .gte('rating', 3);
      if (error || !data) return;
      // Get all movie_ids rated >=3
      const movieIds3 = data.map((r: any) => r.movie_id);
      const movieRatings: Record<string, number> = {};
      data.forEach((r: any) => { movieRatings[r.movie_id] = r.rating; });
      // Now fetch tags for these movies
      if (movieIds3.length === 0) { setKeywordStats({}); return; }
      const { data: tagData, error: tagError } = await supabase
        .from('movie_tags')
        .select('movie_id, tags(name)')
        .in('movie_id', movieIds3);
      if (tagError || !tagData) return;
      const stats: Record<string, { count3: number; count4: number }> = {};
      tagData.forEach((row: any) => {
        const kw = row.tags?.name;
        if (!kw) return;
        // Count for >=3
        stats[kw] = stats[kw] || { count3: 0, count4: 0 };
        stats[kw].count3 += 1;
        // Count for >4
        if ((movieRatings[row.movie_id] || 0) > 4) {
          stats[kw].count4 += 1;
        }
      });
      setKeywordStats(stats);
    }
    if (isOpen) fetchKeywordStats();
  }, [isOpen, user]);
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

  // Fetch watch providers when modal opens
  useEffect(() => {
    const fetchWatchProviders = async () => {
      try {
        const { getWatchProviders, searchTMDb } = await import('@/lib/tmdbApi');
        let tmdbId = movie.tmdb_id;
        let mediaType = movie.media_type || 'movie';

        // Falls tmdb_id nicht vorhanden, versuche via Titel zu suchen
        if (!tmdbId) {
          try {
            const results = await searchTMDb(movie.title);
            if (results && results.length > 0) {
              tmdbId = results[0].id;
              mediaType = results[0].media_type || 'movie';
            }
          } catch (searchErr) {
            console.warn('Could not search TMDB for watch providers:', searchErr);
          }
        }

        if (tmdbId && mediaType) {
          const providers = await getWatchProviders(tmdbId as number, mediaType as 'movie' | 'tv');
          setWatchProviders(providers);
        }
      } catch (err) {
        console.error('Error fetching watch providers:', err);
      }
    };

    if (isOpen && movie) {
      fetchWatchProviders();
    }
  }, [isOpen, movie]);

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
      const movieTags = Array.isArray((movie as any).tags) ? (movie as any).tags : [];
      setSelectedTags(movieTags.map((tag: any) => tag.name));
      fetchAllTags();
    }
  }, [isOpen, movie]);

  // Helper for keyword color
  function getKeywordColor(keyword: string) {
    const stat = keywordStats[keyword];
    if (!stat) return '#9ca3af'; // gray
    if (stat.count4 >= 3) return '#10b981'; // green
    if (stat.count3 >= 3) return '#fbbf24'; // yellow
    return '#9ca3af';
  }

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
      // Helper: prüft, ob movie.id eine gültige UUID ist
      function isValidUUID(id: string) {
        return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
      }

      let movieId = movie.id;

      // Wenn movie.id keine UUID ist, Film in Supabase anlegen oder UUID holen
      if (!isValidUUID(movieId)) {
        let { data: existingMovies, error: movieFetchError } = await supabase
          .from('movies')
          .select('id')
          .eq('tmdb_id', movie.tmdb_id)
          .maybeSingle();
        if (existingMovies && existingMovies.id) {
          movieId = existingMovies.id;
        } else {
          // Hole ggf. weitere Metadaten aus TMDb
          let details = {};
          try {
            const { getTMDbDetails } = await import('@/lib/tmdbApi');
            details = await getTMDbDetails(Number(movie.tmdb_id), movie.media_type || 'movie');
          } catch (err) {
            details = {};
          }
          const insertPayload: any = {
            title: movie.title,
            description: movie.description || details.overview || null,
            year: movie.year || (details.release_date ? Number((details.release_date as string).slice(0, 4)) : null),
            poster_url: movie.poster_url || (details.poster_path ? `https://image.tmdb.org/t/p/w500${details.poster_path}` : null),
            director: movie.director || (details as any).director || null,
            actor: movie.actor || (details as any).actors || null,
            trailer_url: movie.trailer_url || (details as any).trailerUrl || null,
            tmdb_id: movie.tmdb_id,
            media_type: movie.media_type || 'movie',
            genre: Array.isArray((details as any).genres) ? (details as any).genres.map((g: any) => g.name) : null,
            tmdb_keywords: (details as any).keywords || null,
          };
          const { data: newMovie, error: insertError } = await supabase
            .from('movies')
            .insert([insertPayload])
            .select()
            .single();
          if (insertError || !newMovie) {
            alert('Fehler beim Anlegen des Films in der Datenbank.');
            setIsLoading(false);
            return;
          }
          movieId = newMovie.id;
        }
      }

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
        .eq("id", movieId);
      if (error) {
        console.error("Supabase update error:", error);
        alert("Fehler beim Aktualisieren des Films: " + (error.message || error.details || error.toString()));
        setIsLoading(false);
        return;
      }

      // --- Tag-Zuordnung aktualisieren ---
      // 1. Alle bisherigen Tags für diesen Film löschen
      await supabase.from("movie_tags").delete().eq("movie_id", movieId);
      // 2. Neue Tags einfügen
      if (selectedTags.length > 0) {
        const tagInserts = selectedTags.map(tagName => {
          const tag = allTags.find(t => t.name === tagName);
          return tag && tag.id ? { movie_id: movieId, tag_id: tag.id } : undefined;
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
  const [userReviewText, setUserReviewText] = useState<string>('');
  const [isEditingReview, setIsEditingReview] = useState<boolean>(false);
  const [editReviewText, setEditReviewText] = useState<string>('');
  const [otherReviews, setOtherReviews] = useState<Array<{ rating: number; review_text: string; user_name: string }>>([]);

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
        setUserReviewText('');
        return;
      }
      
      try {
        const { data, error } = await supabase
          .from('ratings')
          .select('rating, review_text')
          .eq('movie_id', movie.id)
          .eq('user_id', user.id)
          .single();

        if (!error && data) {
          setUserRating(data.rating as number);
          setUserReviewText((data.review_text as string) || '');
        } else {
          setUserRating(0);
          setUserReviewText('');
        }
      } catch (error) {
        console.error('Error fetching user rating:', error);
        setUserRating(0);
        setUserReviewText('');
      }
    };

    fetchUserRating();
  }, [user, movie]);

  useEffect(() => {
    const loadOtherReviews = async () => {
      if (!movie || !user) return;
      
      try {
        const { data, error } = await supabase
          .from('ratings')
          .select('rating, review_text, user_name')
          .eq('movie_id', movie.id)
          .neq('user_id', user.id)
          .order('created_at', { ascending: false });

        if (!error && data) {
          setOtherReviews(data as Array<{ rating: number; review_text: string; user_name: string }>);
        }
      } catch (error) {
        console.error('Error loading other reviews:', error);
      }
    };

    if (isOpen) {
      loadOtherReviews();
    }
  }, [isOpen, user, movie]);

  const handleStarClick = async (rating: number) => {
    if (!user || !movie) {
      alert('Du musst eingeloggt sein, um zu bewerten!');
      return;
    }

    function isValidUUID(id: string) {
      return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
    }

    let movieId = movie.id;

    try {
      if (!isValidUUID(movieId)) {
        let { data: existingMovies } = await supabase
          .from('movies')
          .select('id')
          .eq('tmdb_id', movie.tmdb_id)
          .maybeSingle();
        if (existingMovies && existingMovies.id) {
          movieId = existingMovies.id;
        } else {
          const insertPayload: any = {
            title: movie.title,
            description: movie.description || null,
            year: movie.year || null,
            poster_url: movie.poster_url || null,
            director: movie.director || null,
            actor: movie.actor || null,
            trailer_url: movie.trailer_url || null,
            tmdb_id: movie.tmdb_id,
            media_type: movie.media_type || 'movie',
          };
          const { data: newMovie, error: insertError } = await supabase
            .from('movies')
            .insert([insertPayload])
            .select()
            .single();
          if (insertError || !newMovie) {
            alert('Fehler beim Anlegen des Films in der Datenbank.');
            return;
          }
          movieId = newMovie.id;
        }
      }

      const { data: existingRating } = await supabase
        .from('ratings')
        .select('id')
        .eq('movie_id', movieId)
        .eq('user_id', user.id)
        .single();

      if (existingRating) {
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
        const { error } = await supabase
          .from('ratings')
          .insert([
            {
              movie_id: movieId,
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
      setUserReviewText('');
      console.log('Bewertung erfolgreich gelöscht!');
      
    } catch (error) {
      console.error('Error deleting rating:', error);
      alert('Fehler beim Löschen der Bewertung');
    }
  };

  const handleSaveReviewText = async () => {
    if (!user || !movie) return;
    
    try {
      // Check if rating exists
      const { data: existingRating, error: fetchError } = await supabase
        .from('ratings')
        .select('id')
        .eq('movie_id', movie.id)
        .eq('user_id', user.id)
        .single();

      if (existingRating) {
        // Update existing rating with new review text
        const { error } = await supabase
          .from('ratings')
          .update({ review_text: editReviewText.trim() || null })
          .eq('id', existingRating.id as string);

        if (error) {
          console.error('Error updating review text:', error);
          alert('Fehler beim Speichern des Bewertungstextes');
          return;
        }
      } else {
        // Create new rating with review text only (rating = 0 if not set)
        const { error } = await supabase
          .from('ratings')
          .insert([{
            movie_id: movie.id,
            rating: userRating || 0,
            review_text: editReviewText.trim() || null,
            user_id: user.id,
            user_name: user.name,
          }]);

        if (error) {
          console.error('Error creating review:', error);
          alert('Fehler beim Speichern des Bewertungstextes');
          return;
        }
      }

      setUserReviewText(editReviewText.trim());
      setIsEditingReview(false);
      console.log('Bewertungstext erfolgreich gespeichert!');
      
    } catch (error) {
      console.error('Error saving review text:', error);
      alert('Fehler beim Speichern des Bewertungstextes');
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

  const handleRecommendSuccess = (recipients: string[]) => {
    setShowRecommendModal(false)
    setWhatsAppRecipients(recipients)
    setShowWhatsAppModal(true)
  }

  const handleWhatsAppModalClose = () => {
    setShowWhatsAppModal(false)
    setWhatsAppRecipients([])
  }

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-0 sm:p-4 z-50"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-lg shadow-xl w-full sm:max-w-2xl h-full overflow-y-auto flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
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
            <div className="flex justify-center gap-3 mb-4 flex-wrap">
              {movie.trailer_url && (
                <a
                  href={movie.trailer_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-block hover:opacity-80 transition-opacity"
                  title="YouTube Trailer"
                >
                  <img src="/buttons/04_trailer.png" alt="YouTube Trailer" className="h-10 w-auto" />
                </a>
              )}
              {user && (
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    setShowRecommendModal(true)
                  }}
                  className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors text-sm font-medium gap-2"
                >
                  <span>↗️</span>
                  Empfehlen
                </button>
              )}
            </div>
            
            {/* Watch Providers */}
            {watchProviders && (
              <div className="flex justify-center mb-4">
                <WatchProvidersDisplay movie={{ ...movie, watch_providers: watchProviders }} size="large" />
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
            {/* Tag selection with keyword color-coding */}
            <div className="flex flex-wrap gap-2">
              {(showAllTags ? selectedTags : selectedTags.slice(0, 20)).map(tagName => {
                const tag = allTags.find(t => t.name === tagName);
                // If tag is a keyword (heuristic: not a genre, or you can add a flag to Tag), color it by user stats
                // For now, color all tags by keyword logic if not found in allTags or if tag.color is gray
                const color = tag?.color && tag.color !== '#e5e7eb' ? tag.color : getKeywordColor(tagName);
                return (
                  <button
                    key={tagName}
                    onClick={() => toggleTag(tagName)}
                    className="flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium text-white hover:opacity-80 transition-opacity"
                    style={{ backgroundColor: color }}
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
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center space-x-3">
                  <StarRating rating={userRating} onRate={handleStarClick} disabled={false} />
                  <span className="text-sm text-gray-600">
                    {userRating > 0 ? `${userRating} Sterne` : 'Noch nicht bewertet'}
                  </span>
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
                {!hideWatchlistFeature && (
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
                )}
              </div>

              {/* User Review Text - Editable */}
              <div className="mt-3">
                {isEditingReview ? (
                  <div className="space-y-2">
                    <textarea
                      value={editReviewText}
                      onChange={(e) => setEditReviewText(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Deine Gedanken zum Film, Serie oder Buch..."
                      rows={4}
                    />
                    <div className="flex gap-2">
                      <button
                        onClick={handleSaveReviewText}
                        className="px-3 py-1 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm"
                      >
                        Speichern
                      </button>
                      <button
                        onClick={() => {
                          setIsEditingReview(false);
                          setEditReviewText(userReviewText);
                        }}
                        className="px-3 py-1 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400 text-sm"
                      >
                        Abbrechen
                      </button>
                    </div>
                  </div>
                ) : (
                  <div>
                    {userReviewText ? (
                      <div className="mt-2">
                        <p className="text-sm text-gray-700 whitespace-pre-wrap">{userReviewText}</p>
                      </div>
                    ) : (
                      <p className="text-sm text-gray-500 italic mt-2">Noch keine Textbewertung</p>
                    )}
                    <button
                      onClick={() => {
                        setEditReviewText(userReviewText);
                        setIsEditingReview(true);
                      }}
                      className="mt-2 px-3 py-1 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 text-sm"
                    >
                      {userReviewText ? '✏️ Bearbeiten' : '+ Bewertungstext hinzufügen'}
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Other Reviews Section - Always visible with clear separation */}
          {user && otherReviews.length > 0 && (
            <div className="mt-6 pt-6 border-t-2 border-gray-300">
              <h4 className="text-sm font-semibold text-gray-800 mb-4">
                Bewertungen anderer Nutzer:
              </h4>
              <div className="space-y-3">
                {otherReviews.map((review, index) => (
                  <div key={index} className="p-4 bg-gray-50 rounded-lg border border-gray-200 shadow-sm">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium text-sm text-gray-800">{review.user_name}</span>
                      <div className="flex items-center">
                        <StarRating rating={review.rating} onRate={() => {}} disabled={true} />
                        <span className="text-sm text-gray-600 ml-2">{review.rating}</span>
                      </div>
                    </div>
                    {review.review_text && (
                      <p className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">{review.review_text}</p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

      {/* Recommendation Modal */}
      {showRecommendModal && user && (
        <RecommendModal
          movie={movie}
          currentUserId={user.id}
          onSuccess={handleRecommendSuccess}
          onClose={() => setShowRecommendModal(false)}
        />
      )}

      {/* WhatsApp Success Modal */}
      {showWhatsAppModal && (
        <WhatsAppSuccessModal
          movie={movie}
          recipients={whatsAppRecipients}
          onClose={handleWhatsAppModalClose}
        />
      )}
        </div>
      </div>
    </div>
  );
}
