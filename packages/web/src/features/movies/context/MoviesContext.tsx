import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  type ReactNode,
  useRef,
  useMemo,
  useCallback,
} from "react";
import { getUserMovieStatus } from "../services/movie";

import type { Movie } from "../../../interfaces/Movie";
import { useAuth } from "../../auth/hooks/useAuth";
import { io, Socket } from "socket.io-client";
import type { DefaultEventsMap } from "@socket.io/component-emitter";
import { API_BASE_URL } from "../../../shared/utils/urls";
import {
  fetchMoviesFromEndpoint,
  searchMovies,
  getMovieDurationById,
} from "../../../features/movies/services/imdb";
import {
  addOrIncrementWatched,
  resetWatched,
  toggleWatchLaterApi,
} from "../services/movie";
import type { Genre } from "../../../shared/lib/genres";

interface MoviesContextType {
  movies: Movie[];
  setMovies: React.Dispatch<React.SetStateAction<Movie[]>>;
  currentPage: number;
  setCurrentPage: React.Dispatch<React.SetStateAction<number>>;
  totalPages: number;
  setTotalPages: React.Dispatch<React.SetStateAction<number>>;
  totalResults: number;
  setTotalResults: React.Dispatch<React.SetStateAction<number>>;
  loading: boolean;
  setLoading: React.Dispatch<React.SetStateAction<boolean>>;
  statsLoading: boolean;
  setStatsLoading: React.Dispatch<React.SetStateAction<boolean>>;
  moviesByPage: Record<number, Movie[]>;
  moviesPerPage: number;
  moviesWatched: Movie[];
  nextPageToken?: string;
  setNextPageToken: React.Dispatch<React.SetStateAction<string | undefined>>;
  hasMore: boolean;
  setHasMore: React.Dispatch<React.SetStateAction<boolean>>;
  moviesWatchedList: Movie[];
  moviesWatchLaterList: Movie[];
  setMoviesWatchedList: React.Dispatch<React.SetStateAction<Movie[]>>;
  setMoviesWatchLaterList: React.Dispatch<React.SetStateAction<Movie[]>>;
  loadMoviesWatched: () => Promise<Movie[]>;
  loadMoviesWatchLater: () => Promise<Movie[]>;
  searchTerm: string;
  setSearchTerm: React.Dispatch<React.SetStateAction<string>>;
  searchResults: Movie[];
  searchLoading: boolean;
  performSearch: (query: string) => Promise<void>;
  setSearchResults: React.Dispatch<React.SetStateAction<Movie[]>>;
  filterStatus: "all" | "watched" | "watchLater";
  setFilterStatus: React.Dispatch<
    React.SetStateAction<"all" | "watched" | "watchLater">
  >;
  lastScrollPosition: number;
  setLastScrollPosition: React.Dispatch<React.SetStateAction<number>>;
  reportManualUpdate: () => void;
  movieStats: { watchedCount: number; watchLaterCount: number };
  selectedGenre?: Genre;
  setSelectedGenre?: (genre: Genre) => void;
  genreMovies: Movie[];
  setGenreMovies?: React.Dispatch<React.SetStateAction<Movie[]>>;
  incrementWatchCount: (id: string) => Promise<void>;
  resetWatchCount: (id: string) => Promise<void>;
  toggleWatchLater: (id: string) => Promise<void>;
}

const MoviesContext = createContext<MoviesContextType | undefined>(undefined);

interface MoviesProviderProps {
  children: ReactNode;
}

export function MoviesProvider({ children }: MoviesProviderProps) {
  const { user, token } = useAuth();
  const [moviesByPage] = useState<Record<number, Movie[]>>({});
  const [movies, setMovies] = useState<Movie[]>([]);
  const socketRef = useRef<Socket<DefaultEventsMap, DefaultEventsMap> | null>(
    null
  );
  const ENDPOINT = API_BASE_URL;
  const [totalPages, setTotalPages] = useState(1);
  const [totalResults, setTotalResults] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [moviesPerPage] = useState(50);
  const [moviesWatched] = useState<Movie[]>([]);
  const [nextPageToken, setNextPageToken] = useState<string | undefined>(
    undefined
  );
  const [hasMore, setHasMore] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState<Movie[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const lastLoadedUserRef = useRef<string | undefined>(undefined);
  const [filterStatus, setFilterStatus] = useState<
    "all" | "watched" | "watchLater"
  >("all");
  const [moviesWatchedList, setMoviesWatchedList] = useState<Movie[]>([]);
  const [moviesWatchLaterList, setMoviesWatchLaterList] = useState<Movie[]>([]);
  const [statsLoading, setStatsLoading] = useState(true);
  const isFetchingRef = useRef(false);
  const [lastScrollPosition, setLastScrollPosition] = useState(0);
  const lastManualUpdateRef = useRef<number>(0);
  const [movieStats, setMovieStats] = useState({
    watchedCount: 0,
    watchLaterCount: 0,
  });
  const [selectedGenre, setSelectedGenre] = useState<Genre>("All");
  const [genreMovies, setGenreMovies] = useState<Movie[]>([]);

  const reportManualUpdate = useCallback(() => {
    lastManualUpdateRef.current = Date.now();
  }, []);

  // Centralized Mutation Functions
  const incrementWatchCount = useCallback(
    async (id: string) => {
      reportManualUpdate();

      // Find movie in any available source
      const movieOriginal =
        movies.find((m) => m.id === id) ||
        searchResults.find((m) => m.id === id) ||
        genreMovies.find((m) => m.id === id) ||
        moviesWatchLaterList.find((m) => m.id === id) ||
        moviesWatchedList.find((m) => m.id === id);

      if (!movieOriginal) {
        console.warn("Movie not found for incrementing watch count:", id);
        return;
      }

      // 1. Optimistic Update for Movies Array
      setMovies((prev) =>
        prev.map((m) =>
          m.id === id
            ? { ...m, watchCount: (m.watchCount ?? 0) + 1, watchLater: false }
            : m
        )
      );

      // 2. Optimistic Update for Search Results
      setSearchResults((prev) =>
        prev.map((m) =>
          m.id === id
            ? { ...m, watchCount: (m.watchCount ?? 0) + 1, watchLater: false }
            : m
        )
      );

      // 3. Optimistic Update for Genre Movies
      setGenreMovies((prev) =>
        prev.map((m) =>
          m.id === id
            ? { ...m, watchCount: (m.watchCount ?? 0) + 1, watchLater: false }
            : m
        )
      );

      // 4. Update Watch Later list (remove)
      setMoviesWatchLaterList((prev) => {
        const filtered = prev.filter((m) => m.id !== id);
        localStorage.setItem("moviesWatchLater", JSON.stringify(filtered));
        return filtered;
      });

      // 5. Update Watched list
      try {
        const durationData = await getMovieDurationById(id.toString());
        const duration = durationData.duration;
        const userOffset = new Date().getTimezoneOffset();
        const watchedAtNew = new Date(
          new Date().getTime() - userOffset * 60 * 1000
        ).toISOString();

        setMoviesWatchedList((prev) => {
          let found = false;
          const updated = prev.map((m) => {
            if (m.id === id) {
              found = true;
              return {
                ...m,
                ...movieOriginal,
                watchCount: (m.watchCount ?? 0) + 1,
                watchLater: false,
                duration,
                watchedAt: Array.isArray(m.watchedAt)
                  ? [...m.watchedAt, watchedAtNew]
                  : [watchedAtNew],
              };
            }
            return m;
          });
          if (!found) {
            updated.push({
              ...movieOriginal,
              watchCount: 1,
              watchLater: false,
              duration,
              watchedAt: [watchedAtNew],
            });
          }
          localStorage.setItem("moviesWatched", JSON.stringify(updated));
          return updated;
        });

        // API calls
        if (
          movieOriginal.watchLater ||
          moviesWatchLaterList.some((m) => m.id === id)
        ) {
          await toggleWatchLaterApi({ movieId: id.toString() });
        }
        await addOrIncrementWatched({
          movieId: id.toString(),
          duration,
          watchedAt: [watchedAtNew],
        });
      } catch (err) {
        console.error("Error updating movie status:", err);
      }
    },
    [
      movies,
      searchResults,
      genreMovies,
      moviesWatchLaterList,
      moviesWatchedList,
      reportManualUpdate,
    ]
  );

  const resetWatchCount = useCallback(
    async (id: string) => {
      reportManualUpdate();

      // Update all lists
      const updateFn = (m: Movie) =>
        m.id === id ? { ...m, watchCount: 0 } : m;
      setMovies((prev) => prev.map(updateFn));
      setSearchResults((prev) => prev.map(updateFn));
      setGenreMovies((prev) => prev.map(updateFn));

      setMoviesWatchedList((prev) => {
        const updated = prev.filter((m) => m.id !== id);
        localStorage.setItem("moviesWatched", JSON.stringify(updated));
        return updated;
      });

      try {
        await resetWatched({ movieId: id.toString() });
      } catch (err) {
        console.error("Error resetting watch count:", err);
      }
    },
    [reportManualUpdate]
  );

  const toggleWatchLater = useCallback(
    async (id: string) => {
      reportManualUpdate();

      const movieOriginal =
        movies.find((m) => m.id === id) ||
        searchResults.find((m) => m.id === id) ||
        genreMovies.find((m) => m.id === id) ||
        moviesWatchLaterList.find((m) => m.id === id) ||
        moviesWatchedList.find((m) => m.id === id);

      if (!movieOriginal) return;

      const nextWatchLater = !movieOriginal.watchLater;

      // Update all lists
      const updateFn = (m: Movie) =>
        m.id === id ? { ...m, watchLater: nextWatchLater } : m;
      setMovies((prev) => prev.map(updateFn));
      setSearchResults((prev) => prev.map(updateFn));
      setGenreMovies((prev) => prev.map(updateFn));

      setMoviesWatchLaterList((prev) => {
        const exists = prev.some((m) => m.id === id);
        let updated;
        if (exists) {
          updated = prev.filter((m) => m.id !== id);
        } else {
          updated = [...prev, { ...movieOriginal, watchLater: true }];
        }
        localStorage.setItem("moviesWatchLater", JSON.stringify(updated));
        return updated;
      });

      try {
        await toggleWatchLaterApi({ movieId: id.toString() });
      } catch (err) {
        console.error("Error toggling watch later:", err);
      }
    },
    [
      movies,
      searchResults,
      genreMovies,
      moviesWatchLaterList,
      moviesWatchedList,
      reportManualUpdate,
    ]
  );

  // Después de cargar las lists específicas:
  const syncMoviesFlags = (
    baseMovies: Movie[],
    watched: Movie[],
    watchLater: Movie[]
  ) => {
    return baseMovies.map((movie) => {
      const watchedMovie = watched.find((w) => w.id === movie.id);
      const isWatched = watched.some((w) => w.id === movie.id);
      const isWatchLater = watchLater.some((wl) => wl.id === movie.id);
      return {
        ...movie,
        watchCount: isWatched
          ? watched.find((w) => w.id === movie.id)?.watchCount ?? 1
          : 0,
        watchLater: isWatchLater,
        watchedAt: watchedMovie ? watchedMovie.watchedAt : [],
        duration: watchedMovie ? watchedMovie.duration : movie.duration,
      };
    });
  };

  useEffect(() => {
    if (!user || !token) return;
    if (lastLoadedUserRef.current && lastLoadedUserRef.current !== user.id) {
      setMoviesWatchedList([]);
      setMoviesWatchLaterList([]);
    }

    lastLoadedUserRef.current = user.id;

    const fetchInfo = async () => {
      setStatsLoading(true);
      try {
        // Single optimized call
        const status = await getUserMovieStatus();
        if (status) {
          // Process Watched
          const watchedWithCount = (status.moviesWatched || []).map(
            (movie: any) => ({
              ...movie,
              id: movie.id || movie.movieId,
              watchCount: movie.count ?? 0,
              duration: movie.duration,
              watchedAt: movie.watchedAt || [],
            })
          );
          setMoviesWatchedList(watchedWithCount);

          // Process Watch Later
          const watchLaterWithFlag = (status.watchLater || []).map(
            (movie: any) => ({
              ...movie,
              id: movie.id || movie.movieId,
              watchLater: true,
            })
          );
          setMoviesWatchLaterList(watchLaterWithFlag);

          // Update Stats
          if (status.stats) {
            setMovieStats(status.stats);
          } else {
            // Fallback calculation
            setMovieStats({
              watchedCount: watchedWithCount.length,
              watchLaterCount: watchLaterWithFlag.length,
            });
          }
        }
      } catch (error) {
        console.error("Error loading movie status:", error);
      } finally {
        setStatsLoading(false);
      }
    };

    fetchInfo();
  }, [token, user]);

  // Refs to track latest state for use in closures (avoiding stale state in effects)
  const moviesWatchedListRef = useRef(moviesWatchedList);
  const moviesWatchLaterListRef = useRef(moviesWatchLaterList);

  useEffect(() => {
    moviesWatchedListRef.current = moviesWatchedList;
  }, [moviesWatchedList]);

  useEffect(() => {
    moviesWatchLaterListRef.current = moviesWatchLaterList;
  }, [moviesWatchLaterList]);

  const performSearch = async (query: string) => {
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }
    setSearchLoading(true);

    try {
      // Si hay usuario logueado, mezcla con estado
      if (user && token) {
        const [results, userStatus] = await Promise.all([
          searchMovies(query),
          getUserMovieStatus(),
        ]);

        const enrichedResults = results.map((movie) => {
          const watched = userStatus.moviesWatched.find(
            (mw: { movieId: any }) => String(mw.movieId) === String(movie.id)
          );
          return {
            ...movie,
            watchCount: watched ? watched.count : 0,
            watchLater: userStatus.watchLater.some(
              (wl: any) => String(wl.id || wl.movieId) === String(movie.id)
            ),
            duration: watched ? watched.duration : movie.duration,
            watchedAt: watched ? watched.watchedAt : [],
          };
        });

        setSearchResults(enrichedResults);
      } else {
        // Si NO hay usuario, solo trae los resultados
        const results = await searchMovies(query);
        setSearchResults(results);
      }
    } catch (err) {
      console.error("Error al buscar películas:", err);
      setSearchResults([]);
    } finally {
      setSearchLoading(false);
    }
  };

  // Sync movies with user lists when they change
  useEffect(() => {
    const syncFn = (prev: Movie[]) =>
      syncMoviesFlags(prev, moviesWatchedList, moviesWatchLaterList);

    setMovies(syncFn);
    setSearchResults(syncFn);
    setGenreMovies(syncFn);

    // Update stats immediately
    setMovieStats({
      watchedCount: moviesWatchedList.length,
      watchLaterCount: moviesWatchLaterList.length,
    });
  }, [moviesWatchedList, moviesWatchLaterList]);

  // Persistence for scroll position
  useEffect(() => {
    const savedScroll = localStorage.getItem("moviesLastScroll");
    if (savedScroll) {
      setLastScrollPosition(Number(savedScroll));
    }
  }, []);

  useEffect(() => {
    if (lastScrollPosition > 0) {
      localStorage.setItem("moviesLastScroll", lastScrollPosition.toString());
    }
  }, [lastScrollPosition]);

  useEffect(() => {
    if (filterStatus !== "all" || !hasMore || isFetchingRef.current) {
      return;
    }

    isFetchingRef.current = true;
    setLoading(true);

    fetchMoviesFromEndpoint(nextPageToken)
      .then((movieData) => {
        const synced = syncMoviesFlags(
          movieData.movies,
          moviesWatchedListRef.current,
          moviesWatchLaterListRef.current
        );
        setMovies((prev) => {
          const idsExistentes = new Set(prev.map((m) => m.id));
          const nuevos = synced.filter((m) => !idsExistentes.has(m.id));
          return [...prev, ...nuevos];
        });

        setNextPageToken(movieData.nextPageToken);
        setHasMore(!!movieData.nextPageToken);
        setTotalPages(movieData.totalPages);
        setTotalResults(movieData.totalResults);
      })
      .catch((err) => {
        console.error("Error fetching movies:", err);
        // Retrying on 429 should be handled by the user scrolling again,
        // do not disable hasMore permanently.
      })
      .finally(() => {
        setLoading(false);
        isFetchingRef.current = false;
      });
  }, [currentPage, selectedGenre]);

  const loadMoviesWatched = async (force = false): Promise<Movie[]> => {
    if (!force && Date.now() - lastManualUpdateRef.current < 10000) {
      return moviesWatchedList;
    }
    try {
      const status = await getUserMovieStatus();
      if (!status || (!status.moviesWatched && !status.watchLater)) {
        console.warn("Invalid status received, skipping movie refresh");
        return moviesWatchedList;
      }

      // El backend ya devuelve los objetos enriquecidos (o parciales básicos)
      // Mapeamos para asegurar compatibilidad con la interfaz Movie del frontend
      const withCount = status.moviesWatched.map((movie: any) => ({
        ...movie,
        id: movie.id || movie.movieId, // Asegurar ID
        watchCount: movie.count ?? 0,
        duration: movie.duration,
        watchedAt: movie.watchedAt || [],
      }));

      setMoviesWatchedList(withCount);
      return withCount;
    } catch (err) {
      console.error("Error cargando películas vistas:", err);
      return moviesWatchedList;
    }
  };

  const refreshMoviesStatus = useCallback(() => {
    loadMoviesWatched();
  }, [loadMoviesWatched, moviesWatchedList]);

  const refreshRef = useRef(refreshMoviesStatus);
  useEffect(() => {
    refreshRef.current = refreshMoviesStatus;
  }, [refreshMoviesStatus]);

  const loadMoviesWatchLater = async (): Promise<Movie[]> => {
    try {
      const status = await getUserMovieStatus();

      // El backend devuelve objetos completos en watchLater
      const withFlag = status.watchLater.map((movie: any) => ({
        ...movie,
        id: movie.id || movie.movieId, // Asegurar ID
        watchLater: true,
      }));

      setMoviesWatchLaterList(withFlag);
      return withFlag;
    } catch (err) {
      console.error("Error cargando películas por ver:", err);
      return [];
    }
  };

  useEffect(() => {
    if (!user) return;

    socketRef.current = io(ENDPOINT, { transports: ["websocket"] });

    socketRef.current.on("connect", () => {
      socketRef.current?.emit("join", String(user.id));
    });

    socketRef.current.on("movies-watched", () => refreshRef.current());
    socketRef.current.on("movies-reset", () => refreshRef.current());
    socketRef.current.on("watch-later-toggled", () => refreshRef.current());

    socketRef.current.on("connect_error", (err) => {
      console.error("Error de conexión en socket:", err);
    });

    return () => {
      socketRef.current?.disconnect();
    };
  }, [ENDPOINT, user]);

  const contextValue = useMemo(
    () => ({
      movies,
      setMovies,
      currentPage,
      setCurrentPage,
      totalPages,
      setTotalPages,
      setTotalResults,
      totalResults,
      loading,
      setLoading,
      statsLoading,
      setStatsLoading,
      moviesByPage,
      moviesPerPage,
      moviesWatched,
      nextPageToken,
      setNextPageToken,
      hasMore,
      setHasMore,
      moviesWatchedList,
      moviesWatchLaterList,
      setMoviesWatchedList,
      setMoviesWatchLaterList,
      searchTerm,
      setSearchTerm,
      searchResults,
      searchLoading,
      performSearch,
      setSearchResults,
      loadMoviesWatched,
      loadMoviesWatchLater,
      filterStatus,
      setFilterStatus,
      lastScrollPosition,
      setLastScrollPosition,
      reportManualUpdate,
      movieStats,
      selectedGenre,
      setSelectedGenre,
      genreMovies,
      setGenreMovies,
      incrementWatchCount,
      resetWatchCount,
      toggleWatchLater,
    }),
    [
      movies,
      currentPage,
      totalPages,
      totalResults,
      loading,
      statsLoading,
      moviesByPage,
      moviesPerPage,
      moviesWatched,
      nextPageToken,
      hasMore,
      moviesWatchedList,
      moviesWatchLaterList,
      searchTerm,
      searchResults,
      searchLoading,
      filterStatus,
      lastScrollPosition,
      setLastScrollPosition,
      reportManualUpdate,
      selectedGenre,
      genreMovies,
      incrementWatchCount,
      resetWatchCount,
      toggleWatchLater,
    ]
  );

  return (
    <MoviesContext.Provider value={contextValue}>
      {children}
    </MoviesContext.Provider>
  );
}
// Hook para usar el contexto
export function useMovies() {
  const ctx = useContext(MoviesContext);
  if (!ctx) throw new Error("useMovies debe usarse dentro de <MoviesProvider>");
  return ctx;
}
