import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  type ReactNode,
  useRef,
} from "react";
import { getUserMovieStatus } from "../api/movie";

import type { Movie } from "../interfaces/Movie";
import { useAuth } from "./useAuth";
import { io, Socket } from "socket.io-client";
import type { DefaultEventsMap } from "@socket.io/component-emitter";
import { prod_url } from "../utils/urls";
import {
  fetchMoviesFromEndpoint,
  getMoviesByIds,
  searchMovies,
} from "../api/imbd";

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
  loadMoviesWatched: () => Promise<void>;
  loadMoviesWatchLater: () => Promise<void>;
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
  const [moviesWatchedList, setMoviesWatchedList] = useState<Movie[]>([]);
  const [moviesWatchLaterList, setMoviesWatchLaterList] = useState<Movie[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState<Movie[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [statsLoading, setStatsLoading] = useState(false);
  const loadedRef = useRef(false);

  useEffect(() => {
    if (!user || !token) return;

    if (loadedRef.current) return; // Ya cargó, sal del efecto

    loadedRef.current = true; // Marca que cargó

    setStatsLoading(true);
    loadMoviesWatched()
      .then(() => loadMoviesWatchLater())
      .finally(() => setStatsLoading(false));
  }, [user, token]);
  
const performSearch = async (query: string) => {
  if (!query.trim()) {
    setSearchResults([]);
    return;
  }
  setSearchLoading(true);

  try {
    const [results, userStatus] = await Promise.all([
      searchMovies(query),          // <-- tu llamada de búsqueda
      getUserMovieStatus(),         // <-- estado de usuario (watched, watchLater)
    ]);

    const enrichedResults = results.map((movie) => {
      const watched = userStatus.moviesWatched.find(
        (mw) => String(mw.movieId) === String(movie.id)
      );
      return {
        ...movie,
        watchCount: watched ? watched.count : 0,
        watchLater: userStatus.watchLater.includes(String(movie.id)),
        duration: watched ? watched.duration : movie.duration,
      };
    });

    setSearchResults(enrichedResults);
  } catch (err) {
    console.error("Error al buscar películas:", err);
    setSearchResults([]);
  } finally {
    setSearchLoading(false);
  }
};

  // Función para cargar el estado del usuario y mezclar con las películas
  useEffect(() => {
    if (!user || !token) return;
    if (!hasMore) return; // si ya no hay más datos, no ejecutes
    setLoading(true);

    // Solo carga para la página actual
    Promise.all([fetchMoviesFromEndpoint(nextPageToken), getUserMovieStatus()])
      .then(([movieData, userStatus]) => {
        const mergedMovies = movieData.movies.map((movie) => {
          const watched = userStatus.moviesWatched.find(
            (mw) => String(mw.movieId) === String(movie.id)
          );
          return {
            ...movie,
            watchCount: watched ? watched.count : 0,
            watchLater: userStatus.watchLater.includes(String(movie.id)),
            duration: watched ? watched.duration : movie.duration,
          };
        });

        setMovies((prev) => {
          const idsExistentes = new Set(prev.map((m) => m.id));
          const nuevos = mergedMovies.filter((m) => !idsExistentes.has(m.id));
          return [...prev, ...nuevos];
        });

        setNextPageToken(movieData.nextPageToken);
        setHasMore(!!movieData.nextPageToken); // false si no hay más páginas
        setTotalPages(movieData.totalPages);
        setTotalResults(movieData.totalResults);
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, [user, token, currentPage]); // solo depende de estas

  const loadMoviesWatched = async () => {
    try {
      const status = await getUserMovieStatus();
      const ids = status.moviesWatched.map((m: any) => m.movieId);
      const movies = await getMoviesByIds(ids);

      // agregamos el count
      const withCount = movies.map((movie) => {
        const watched = status.moviesWatched.find(
          (mw: any) => mw.movieId === movie.id
        );
        return {
          ...movie,
          watchCount: watched?.count ?? 0,
          duration: watched?.duration ?? movie.duration,
        };
      });

      setMoviesWatchedList(withCount);
    } catch (err) {
      console.error("Error cargando películas vistas:", err);
    }
  };

  const loadMoviesWatchLater = async () => {
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
    } catch (err) {
      console.error("Error cargando películas por ver:", err);
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
        loadMoviesWatched,
        loadMoviesWatchLater,
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
