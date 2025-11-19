import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  type ReactNode,
  useRef,
} from "react";
import { getUserMovieStatus } from "../services/movie";

import type { Movie } from "../../../interfaces/Movie";
import { useAuth } from "../../auth/hooks/useAuth";
import { io, Socket } from "socket.io-client";
import type { DefaultEventsMap } from "@socket.io/component-emitter";
import { prod_url } from "../../../shared/utils/urls";
import {
  fetchMoviesFromEndpoint,
  getMoviesByIds,
  searchMovies,
} from "../../../features/movies/services/imdb";

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
  const ENDPOINT = prod_url;
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
  const [moviesWatchedList, setMoviesWatchedList] = useState<Movie[]>(() => {
    const raw = localStorage.getItem("moviesWatched");
    if (!raw) return [];
    try {
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  });
  const [moviesWatchLaterList, setMoviesWatchLaterList] = useState<Movie[]>(
    () => {
      const raw = localStorage.getItem("moviesWatchLater");
      if (!raw) return [];
      try {
        const parsed = JSON.parse(raw);
        return Array.isArray(parsed) ? parsed : [];
      } catch {
        return [];
      }
    }
  );
  const [statsLoading, setStatsLoading] = useState(false);

  // Después de cargar las lists específicas:
  const syncMoviesFlags = (
    baseMovies: Movie[],
    watched: Movie[],
    watchLater: Movie[]
  ) => {
    return baseMovies.map((movie) => {
      const isWatched = watched.some((w) => w.id === movie.id);
      const isWatchLater = watchLater.some((wl) => wl.id === movie.id);
      return {
        ...movie,
        watchCount: isWatched
          ? watched.find((w) => w.id === movie.id)?.watchCount ?? 1
          : 0,
        watchLater: isWatchLater,
      };
    });
  };

  useEffect(() => {
    if (!user || !token) return;
    if (lastLoadedUserRef.current === user.id) return;
    lastLoadedUserRef.current = user.id;

    const fetchSequential = async () => {
      setStatsLoading(true);
      // Primero películas vistas
      if (!moviesWatchedList.length) {
        const moviesWatched = await loadMoviesWatched();
        setMoviesWatchedList(moviesWatched);
        localStorage.setItem("moviesWatched", JSON.stringify(moviesWatched));
      }
      // Luego películas por ver
      if (!moviesWatchLaterList.length) {
        const moviesWatchLater = await loadMoviesWatchLater();
        setMoviesWatchLaterList(moviesWatchLater);
        localStorage.setItem(
          "moviesWatchLater",
          JSON.stringify(moviesWatchLater)
        );
      }
      setStatsLoading(false);
    };

    fetchSequential();
  }, [token, user]);

  useEffect(() => {
    localStorage.setItem("moviesWatched", JSON.stringify(moviesWatchedList));
  }, [moviesWatchedList]);
  useEffect(() => {
    localStorage.setItem(
      "moviesWatchLater",
      JSON.stringify(moviesWatchLaterList)
    );
  }, [moviesWatchLaterList]);

  useEffect(() => {
    const syncedMovies = syncMoviesFlags(
      movies,
      moviesWatchedList,
      moviesWatchLaterList
    );
    // Solo actualiza si realmente hay cambios
    if (JSON.stringify(syncedMovies) !== JSON.stringify(movies)) {
      setMovies(syncedMovies);
    }
  }, [movies, moviesWatchedList, moviesWatchLaterList]);

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
            watchLater: userStatus.watchLater.includes(String(movie.id)),
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

  useEffect(() => {
    if (!hasMore) return; // Detener si no hay más páginas

    setLoading(true);

    fetchMoviesFromEndpoint(nextPageToken)
      .then((movieData) => {
        // Sin mezcla con estado de usuario
        setMovies((prev) => {
          const idsExistentes = new Set(prev.map((m) => m.id));
          const nuevos = movieData.movies.filter(
            (m) => !idsExistentes.has(m.id)
          );
          return [...prev, ...nuevos];
        });

        setNextPageToken(movieData.nextPageToken);
        setHasMore(!!movieData.nextPageToken);
        setTotalPages(movieData.totalPages);
        setTotalResults(movieData.totalResults);
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, [currentPage]);

  const loadMoviesWatched = async (): Promise<Movie[]> => {
    try {
      const status = await getUserMovieStatus();
      const ids = status.moviesWatched.map((m: any) => m.movieId);
      const movies = await getMoviesByIds(ids);

      const withCount = movies.map((movie) => {
        const watched = status.moviesWatched.find(
          (mw: any) => mw.movieId === movie.id
        );
        return {
          ...movie,
          watchCount: watched?.count ?? 0,
          duration: watched?.duration ?? movie.duration,
          watchedAt: watched?.watchedAt ?? [],
        };
      });

      setMoviesWatchedList(withCount);
      return withCount; // <--- Agrega este return
    } catch (err) {
      console.error("Error cargando películas vistas:", err);
      return []; // <--- En caso de error, retorna array vacío
    }
  };

  const loadMoviesWatchLater = async (): Promise<Movie[]> => {
    try {
      const status = await getUserMovieStatus();
      const ids = status.watchLater;
      const movies = await getMoviesByIds(ids);

      // marcamos watchLater en true
      const withFlag = movies.map((movie) => ({
        ...movie,
        watchLater: true,
      }));

      setMoviesWatchLaterList(withFlag);
      return withFlag; // <--- retorna el array
    } catch (err) {
      console.error("Error cargando películas por ver:", err);
      return []; // <--- retorna un array vacío en caso de error
    }
  };

  useEffect(() => {
    if (!user) return;

    socketRef.current = io(ENDPOINT, { transports: ["websocket"] });

    socketRef.current.on("connect", () => {
      socketRef.current?.emit("join", String(user.id));
    });

    socketRef.current.on("movies-watched", () => {
      getUserMovieStatus()
        .then((data) => {
          setMovies((prev) =>
            prev.map((movie) => ({
              ...movie,
              watchCount:
                data.moviesWatched.find(
                  (m: any) => String(m.movieId) === String(movie.id)
                )?.count || 0,
              watchLater: data.watchLater.includes(String(movie.id)),
            }))
          );
        })
        .catch((err) => {
          console.error("Error cargando estado de películas:", err);
        });
    });

    socketRef.current.on("movies-reset", () => {
      getUserMovieStatus()
        .then((data) => {
          setMovies((prev) =>
            prev.map((movie) => ({
              ...movie,
              watchCount:
                data.moviesWatched.find(
                  (m: any) => String(m.movieId) === String(movie.id)
                )?.count || 0,
              watchLater: data.watchLater.includes(String(movie.id)),
            }))
          );
        })
        .catch((err) => {
          console.error("Error cargando estado de películas:", err);
        });
    });

    socketRef.current.on("watch-later-toggled", () => {
      // Actualiza estado local con payload.watchLater
      getUserMovieStatus()
        .then((data) => {
          setMovies((prev) =>
            prev.map((movie) => ({
              ...movie,
              watchCount:
                data.moviesWatched.find(
                  (m: any) => String(m.movieId) === String(movie.id)
                )?.count || 0,
              watchLater: data.watchLater.includes(String(movie.id)),
            }))
          );
        })
        .catch((err) => {
          console.error("Error cargando estado de películas:", err);
        });
    });

    socketRef.current.on("connect_error", (err) => {
      console.error("Error de conexión en socket:", err);
    });

    return () => {
      socketRef.current?.disconnect();
    };
  }, [ENDPOINT, user]);

  return (
    <MoviesContext.Provider
      value={{
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
        loadMoviesWatched: loadMoviesWatched,
        loadMoviesWatchLater: loadMoviesWatchLater,
      }}
    >
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
