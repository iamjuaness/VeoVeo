import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  type ReactNode,
  useRef,
} from "react";
import { getUserMovieStatus } from "../api/movie";

import { initialMovies } from "../components/initialMovies";
import type { Movie } from "../interfaces/Movie";
import { useAuth } from "./useAuth";
import { io, Socket } from "socket.io-client";
import type { DefaultEventsMap } from "@socket.io/component-emitter";
import { prod_url } from "../utils/urls";

interface MoviesContextType {
  movies: Movie[];
  setMovies: React.Dispatch<React.SetStateAction<Movie[]>>;
  reloadMoviesStatus: () => Promise<void>;
}

const MoviesContext = createContext<MoviesContextType | undefined>(undefined);

interface MoviesProviderProps {
  children: ReactNode;
}

export function MoviesProvider({ children }: MoviesProviderProps) {
  const { user, token } = useAuth();
  const [movies, setMovies] = useState<Movie[]>(() =>
    // Inicializar con catálogo, marcando watchCount y watchLater con 0/false
    initialMovies.map((m) => ({ ...m, watchCount: 0, watchLater: false }))
  );
  const socketRef = useRef<Socket<DefaultEventsMap, DefaultEventsMap> | null>(
    null
  );
  const ENDPOINT = prod_url;

  // Función para cargar el estado del usuario y mezclar con las películas
  const reloadMoviesStatus = async () => {
    if (!user || !token) return;
    try {
      const data = await getUserMovieStatus();
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
    } catch (err) {
      console.error("Error cargando estado de películas:", err);
    }
  };

  // Cargar estado del usuario cuando cambia el usuario (login) o token
  useEffect(() => {
    reloadMoviesStatus();
  }, [user, token]);

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
    <MoviesContext.Provider value={{ movies, setMovies, reloadMoviesStatus }}>
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
