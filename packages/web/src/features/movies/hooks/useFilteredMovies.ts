import { useMemo } from "react";
import type { Movie } from "../../../interfaces/Movie";
import type { Genre } from "../../../shared/lib/genres";

interface UseFilteredMoviesProps {
  movies: Movie[];
  moviesWatchedList: Movie[];
  moviesWatchLaterList: Movie[];
  filterStatus: "all" | "watched" | "watchLater";
  searchTerm: string;
  selectedGenres: {
    all: Genre;
    watched: Genre;
    watchLater: Genre;
  };
  selectedRatings: {
    all: any;
    watched: any;
    watchLater: any;
  };
  watchedOrder: "asc" | "desc";
}

export function useFilteredMovies({
  movies,
  moviesWatchedList,
  moviesWatchLaterList,
  filterStatus,
  searchTerm,
  selectedGenres,
  selectedRatings,
  watchedOrder,
}: UseFilteredMoviesProps) {
  return useMemo(() => {
    let base: Movie[] = [];

    if (filterStatus === "watched") {
      base = [...moviesWatchedList].sort((a, b) => {
        const aArr = Array.isArray(a.watchedAt) ? a.watchedAt : [];
        const bArr = Array.isArray(b.watchedAt) ? b.watchedAt : [];
        const aLast = aArr[aArr.length - 1];
        const bLast = bArr[bArr.length - 1];
        const aDate = aLast ? new Date(aLast).getTime() : 0;
        const bDate = bLast ? new Date(bLast).getTime() : 0;
        return watchedOrder === "asc" ? aDate - bDate : bDate - aDate;
      });
    } else if (filterStatus === "watchLater") {
      base = [...moviesWatchLaterList];
    } else {
      base = movies.filter(
        (movie) =>
          movie.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
          movie.genres.some((genre) =>
            genre.toLowerCase().includes(searchTerm.toLowerCase())
          )
      );
    }

    const currentGenre = selectedGenres[filterStatus];
    if (currentGenre && currentGenre !== "All") {
      base = base.filter((movie) => {
        // const movieFirstGenre = Array.isArray(movie.genres)
        //   ? movie.genres[0] // Primer elemento del array
        //   : typeof movie.genres === "string"
        //   ? movie.genres // String completo
        //   : null;

        // return movieFirstGenre === currentGenre;
        if (Array.isArray(movie.genres)) {
          return movie.genres.includes(currentGenre);
        }
        if (typeof movie.genres === "string") {
          return (movie.genres as string) === currentGenre;
        }
        return false;
      });
    }

    const currentRating = selectedRatings[filterStatus];
    if (currentRating !== "All") {
      base = base.filter(
        (movie) => (movie.rating ?? 0) >= Number(currentRating)
      );
    }

    return base;
  }, [
    filterStatus,
    movies,
    moviesWatchedList,
    moviesWatchLaterList,
    searchTerm,
    selectedGenres,
    selectedRatings,
    watchedOrder,
  ]);
}
