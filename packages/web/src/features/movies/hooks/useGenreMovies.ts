import { useState, useEffect, useCallback, useRef } from "react";
import { getMoviesByGenres } from "../services/imdb";
import type { Movie } from "../../../interfaces/Movie";
import type { Genre } from "../../../shared/lib/genres";
import { useMovies } from "../context/MoviesContext";

export function useGenreMovies(selectedGenre: Genre) {
  const {
    moviesWatchedList,
    moviesWatchLaterList,
    setSelectedGenre,
    setGenreMovies: setGenreMoviesContext,
  } = useMovies();
  const [genreMovies, setGenreMovies] = useState<Movie[]>([]);
  const [isLoadingGenre, setIsLoadingGenre] = useState(false);
  const [errorGenre, setErrorGenre] = useState<string | null>(null);
  const [nextPageToken, setNextPageToken] = useState<string | undefined>(
    undefined
  );
  const [hasMoreGenre, setHasMoreGenre] = useState(true);

  const isFetchingRef = useRef(false);

  useEffect(() => {
    if (setSelectedGenre) {
      setSelectedGenre(selectedGenre);
    }
  }, [selectedGenre, setSelectedGenre]);

  // Resetear cuando cambia el género
  useEffect(() => {
    setGenreMovies([]);
    setNextPageToken(undefined);
    setHasMoreGenre(true);
    setErrorGenre(null);
    isFetchingRef.current = false;
  }, [selectedGenre]);

  const syncMoviesFlags = useCallback(
    (movies: Movie[]) => {
      return movies.map((movie) => {
        const watchedMovie = moviesWatchedList.find(
          (w: { id: string }) => w.id === movie.id
        );
        const isWatched = moviesWatchedList.some(
          (w: { id: string }) => w.id === movie.id
        );
        const isWatchLater = moviesWatchLaterList.some(
          (wl: { id: string }) => wl.id === movie.id
        );

        return {
          ...movie,
          watchCount: isWatched ? watchedMovie?.watchCount ?? 1 : 0,
          watchLater: isWatchLater,
          watchedAt: watchedMovie ? watchedMovie.watchedAt : [],
          duration: watchedMovie ? watchedMovie.duration : movie.duration,
        };
      });
    },
    [moviesWatchedList, moviesWatchLaterList]
  );

  // Fetch inicial y subsiguientes
  const fetchGenreMovies = useCallback(
    async (pageToken?: string) => {
      if (selectedGenre === "All") {
        setGenreMovies([]);
        setHasMoreGenre(false);
        return;
      }

      //Prevenir fetches simultáneos
      if (isFetchingRef.current) {
        return;
      }

      isFetchingRef.current = true;
      setIsLoadingGenre(true);
      setErrorGenre(null);

      try {
        const data = await getMoviesByGenres(selectedGenre, pageToken);

        // Transformar los datos según la estructura de tu API
        const movies: Movie[] = (data.titles ?? []).map((item: any) => ({
          id: item.id,
          type: item.type,
          title: item.primaryTitle ?? item.originalTitle ?? "",
          year: item.startYear ?? 0,
          genres: item.genres ?? [],
          rating: item.rating?.aggregateRating ?? 0,
          description: item.plot ?? "",
          poster: item.primaryImage?.url ?? "",
          backdrop: item.primaryImage?.url ?? "",
          watchCount: 0,
          watchLater: false,
          duration: item.runtimeSeconds ?? 0,
          watchedAt: [],
        }));

        const syncedMovies = syncMoviesFlags(movies);

        // Append o reemplazar según si hay pageToken
        setGenreMovies((prev) => {
          const newMovies = pageToken
            ? [...prev, ...syncedMovies]
            : syncedMovies;
          return newMovies;
        });

        setNextPageToken(data.nextPageToken);
        setHasMoreGenre(!!data.nextPageToken);
      } catch (error) {
        console.error("Error fetching movies by genre:", error);
        setErrorGenre("Error al cargar películas por género");
        setGenreMovies([]);
      } finally {
        setIsLoadingGenre(false);
        isFetchingRef.current = false;
      }
    },
    [selectedGenre, syncMoviesFlags]
  );

  useEffect(() => {
    if (genreMovies.length > 0) {
      const synced = syncMoviesFlags(genreMovies);
      setGenreMovies(synced);

      if (setGenreMoviesContext) {
        setGenreMoviesContext(synced);
      }
    }
  }, [moviesWatchedList, moviesWatchLaterList]);

  // Fetch inicial cuando cambia el género
  useEffect(() => {
    if (selectedGenre !== "All") {
      fetchGenreMovies();
    }
  }, [selectedGenre]);

  // Función para cargar más (scroll infinito)
  const loadMoreGenreMovies = useCallback(() => {
    if (
      !isLoadingGenre &&
      hasMoreGenre &&
      nextPageToken &&
      !isFetchingRef.current
    ) {
      fetchGenreMovies(nextPageToken);
    }
  }, [isLoadingGenre, hasMoreGenre, nextPageToken, fetchGenreMovies]);

  return {
    genreMovies,
    isLoadingGenre,
    errorGenre,
    hasMoreGenre,
    loadMoreGenreMovies,
    setGenreMovies,
  };
}
