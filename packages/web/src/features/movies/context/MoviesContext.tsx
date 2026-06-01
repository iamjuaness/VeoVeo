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
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
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
  activeSearchTerm: string;
  setActiveSearchTerm: React.Dispatch<React.SetStateAction<string>>;
  searchResults: Movie[];
  searchLoading: boolean;
  searchError: string | null;
  performSearch: (query: string) => Promise<void>;
  clearSearch: () => void;
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
  processingMovies: Record<string, boolean>;
}

const MoviesContext = createContext<MoviesContextType | undefined>(undefined);

interface MoviesProviderProps {
  children: ReactNode;
}

export function MoviesProvider({ children }: MoviesProviderProps) {
  const { user, accessToken } = useAuth();
  const queryClient = useQueryClient();
  const socketRef = useRef<Socket<DefaultEventsMap, DefaultEventsMap> | null>(
    null,
  );
  const ENDPOINT = API_BASE_URL;

  const [moviesByPage] = useState<Record<number, Movie[]>>({});
  const [movies, setMovies] = useState<Movie[]>([]);
  const [totalPages, setTotalPages] = useState(1);
  const [totalResults, setTotalResults] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [moviesPerPage] = useState(50);
  const [moviesWatched] = useState<Movie[]>([]);
  const [nextPageToken, setNextPageToken] = useState<string | undefined>(
    undefined,
  );
  const [hasMore, setHasMore] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeSearchTerm, setActiveSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState<Movie[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<
    "all" | "watched" | "watchLater"
  >("all");
  const [processingMovies, setProcessingMovies] = useState<
    Record<string, boolean>
  >({});
  const [lastScrollPosition, setLastScrollPosition] = useState(0);
  const [selectedGenre, setSelectedGenre] = useState<Genre>("All");
  const [genreMovies, setGenreMovies] = useState<Movie[]>([]);
  const isFetchingRef = useRef(false);

  // TanStack Query for User Movie Status
  const { data: userMovieStatus, isLoading: statsLoading } = useQuery({
    queryKey: ["userMovieStatus", user?.id],
    queryFn: getUserMovieStatus,
    enabled: !!user && !!accessToken,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  useEffect(() => {
    queryClient.invalidateQueries({
      queryKey: ["userMovieStatus"],
    });
  }, [user?.id, accessToken, queryClient]);

  const moviesWatchedList = useMemo(() => {
    if (!userMovieStatus?.moviesWatched) return [];
    return userMovieStatus.moviesWatched.map((movie: any) => ({
      ...movie,
      id: movie.id || movie.movieId,
      watchCount: movie.count ?? 0,
      duration: movie.duration,
      watchedAt: movie.watchedAt || [],
    }));
  }, [userMovieStatus]);

  const moviesWatchLaterList = useMemo(() => {
    if (!userMovieStatus?.watchLater) return [];
    return userMovieStatus.watchLater.map((movie: any) => ({
      ...movie,
      id: movie.id || movie.movieId,
      watchLater: true,
    }));
  }, [userMovieStatus]);

  const movieStats = useMemo(() => {
    if (userMovieStatus?.stats) return userMovieStatus.stats;
    return {
      watchedCount: moviesWatchedList.length,
      watchLaterCount: moviesWatchLaterList.length,
    };
  }, [userMovieStatus, moviesWatchedList.length, moviesWatchLaterList.length]);

  // Backward compatibility state setters that do nothing (or invalidate query) to avoid breaking signature
  const setMoviesWatchedList = useCallback(() => {}, []);
  const setMoviesWatchLaterList = useCallback(() => {}, []);
  const setStatsLoading = useCallback(() => {}, []);
  const reportManualUpdate = useCallback(() => {}, []);

  const loadMoviesWatched = useCallback(async () => {
    queryClient.invalidateQueries({ queryKey: ["userMovieStatus", user?.id] });
    return moviesWatchedList;
  }, [queryClient, user?.id, moviesWatchedList]);

  const loadMoviesWatchLater = useCallback(async () => {
    queryClient.invalidateQueries({ queryKey: ["userMovieStatus", user?.id] });
    return moviesWatchLaterList;
  }, [queryClient, user?.id, moviesWatchLaterList]);

  // Socket.IO for real-time invalidation
  useEffect(() => {
    if (!user) return;
    socketRef.current = io(ENDPOINT);
    socketRef.current.on("connect", () => {
      socketRef.current?.emit("join", String(user.id));
    });

    const refreshQuery = () =>
      queryClient.invalidateQueries({
        queryKey: ["userMovieStatus", user?.id],
      });
    socketRef.current.on("movies-watched", refreshQuery);
    socketRef.current.on("movies-reset", refreshQuery);
    socketRef.current.on("watch-later-toggled", refreshQuery);

    socketRef.current.on("connect_error", (err) => {
      console.error("Error de conexión en socket:", err);
    });

    return () => {
      socketRef.current?.disconnect();
    };
  }, [ENDPOINT, user, queryClient]);

  // Syncing flags locally
  const syncMoviesFlags = useCallback(
    (baseMovies: Movie[]) => {
      return baseMovies.map((movie) => {
        const watchedMovie = moviesWatchedList.find(
          (w: { id: string }) => w.id === movie.id,
        );
        const isWatchLater = moviesWatchLaterList.some(
          (wl: { id: string }) => wl.id === movie.id,
        );
        return {
          ...movie,
          watchCount: watchedMovie ? watchedMovie.watchCount : 0,
          watchLater: isWatchLater,
          watchedAt: watchedMovie ? watchedMovie.watchedAt : [],
          duration: watchedMovie ? watchedMovie.duration : movie.duration,
        };
      });
    },
    [moviesWatchedList, moviesWatchLaterList],
  );

  // Sync state whenever lists update
  useEffect(() => {
    setMovies((prev) => syncMoviesFlags(prev));
    setSearchResults((prev) => syncMoviesFlags(prev));
    setGenreMovies((prev) => syncMoviesFlags(prev));
  }, [syncMoviesFlags]);

  // Mutations
  const incrementMutation = useMutation({
    mutationFn: async (id: string) => {
      const durationData = await getMovieDurationById(id);
      const watchedAtNew = new Date().toISOString();

      const isWatchLater = moviesWatchLaterList.some(
        (m: { id: string }) => m.id === id,
      );
      if (isWatchLater) {
        await toggleWatchLaterApi({ movieId: id });
      }
      return addOrIncrementWatched({
        movieId: id,
        duration: durationData.duration,
        watchedAt: [watchedAtNew],
      });
    },
    onMutate: (id) => setProcessingMovies((prev) => ({ ...prev, [id]: true })),
    onSettled: (_, __, id) => {
      setProcessingMovies((prev) => ({ ...prev, [id]: false }));
      queryClient.invalidateQueries({
        queryKey: ["userMovieStatus", user?.id],
      });
    },
  });

  const resetMutation = useMutation({
    mutationFn: async (id: string) => resetWatched({ movieId: id }),
    onMutate: (id) => setProcessingMovies((prev) => ({ ...prev, [id]: true })),
    onSettled: (_, __, id) => {
      setProcessingMovies((prev) => ({ ...prev, [id]: false }));
      queryClient.invalidateQueries({
        queryKey: ["userMovieStatus", user?.id],
      });
    },
  });

  const toggleWatchLaterMutation = useMutation({
    mutationFn: async (id: string) => toggleWatchLaterApi({ movieId: id }),
    onMutate: (id) => setProcessingMovies((prev) => ({ ...prev, [id]: true })),
    onSettled: (_, __, id) => {
      setProcessingMovies((prev) => ({ ...prev, [id]: false }));
      queryClient.invalidateQueries({
        queryKey: ["userMovieStatus", user?.id],
      });
    },
  });

  const incrementWatchCount = async (id: string) =>
    incrementMutation.mutateAsync(id);
  const resetWatchCount = async (id: string) => resetMutation.mutateAsync(id);
  const toggleWatchLater = async (id: string) =>
    toggleWatchLaterMutation.mutateAsync(id);

  // Pagination & Feed Loading
  useEffect(() => {
    if (filterStatus !== "all" || activeSearchTerm || !hasMore || isFetchingRef.current) return;

    isFetchingRef.current = true;
    setLoading(true);

    fetchMoviesFromEndpoint(nextPageToken)
      .then((movieData) => {
        const synced = syncMoviesFlags(movieData.movies);
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
        if (err?.message?.includes("429")) {
          setHasMore(false);
        }
      })
      .finally(() => {
        setLoading(false);
        isFetchingRef.current = false;
      });
  }, [currentPage, selectedGenre, activeSearchTerm, filterStatus]); // Re-run feed fetch

  // Search logic
  const performSearch = async (query: string) => {
    if (searchLoading && query === activeSearchTerm) return;
    setActiveSearchTerm(query);
    if (!query.trim()) {
      setSearchResults([]);
      setSearchTerm("");
      return;
    }
    setSearchLoading(true);
    setSearchError(null);
    try {
      const results = await searchMovies(query);
      setSearchResults(syncMoviesFlags(results));
      if (results.length === 0) {
        setSearchError("No se encontraron películas para esta búsqueda.");
      }
    } catch (err) {
      console.error("Error al buscar películas:", err);
      setSearchError("Hubo un error al realizar la búsqueda. Por favor, intenta de nuevo.");
      setSearchResults([]);
    } finally {
      setSearchLoading(false);
      setSearchTerm(""); // Limpiar el campo de búsqueda luego de buscar
    }
  };

  const clearSearch = () => {
    setActiveSearchTerm("");
    setSearchResults([]);
    setSearchError(null);
  };

  // Scroll persistence
  useEffect(() => {
    const savedScroll = localStorage.getItem("moviesLastScroll");
    if (savedScroll) setLastScrollPosition(Number(savedScroll));
  }, []);

  useEffect(() => {
    if (lastScrollPosition > 0) {
      localStorage.setItem("moviesLastScroll", lastScrollPosition.toString());
    }
  }, [lastScrollPosition]);

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
      activeSearchTerm,
      setActiveSearchTerm,
      searchResults,
      searchLoading,
      searchError,
      performSearch,
      clearSearch,
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
      processingMovies,
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
      activeSearchTerm,
      searchResults,
      searchLoading,
      searchError,
      filterStatus,
      lastScrollPosition,
      movieStats,
      selectedGenre,
      genreMovies,
      processingMovies,
    ],
  );

  return (
    <MoviesContext.Provider value={contextValue}>
      {children}
    </MoviesContext.Provider>
  );
}

export function useMovies() {
  const ctx = useContext(MoviesContext);
  if (!ctx) throw new Error("useMovies debe usarse dentro de <MoviesProvider>");
  return ctx;
}
