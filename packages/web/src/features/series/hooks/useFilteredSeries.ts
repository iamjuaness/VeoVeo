import { useMemo } from "react";
import type { Series } from "../../../interfaces/Series";

import type { Genre } from "../../../shared/lib/genres";

interface UseFilteredSeriesProps {
  series: Series[];
  seriesWatchedList: Series[];
  seriesWatchLaterList: Series[];
  seriesInProgressList: Series[];
  filterStatus: "all" | "watched" | "watchLater" | "inProgress";
  searchTerm: string;
  selectedGenres: {
    all: Genre;
    watched: Genre;
    watchLater: Genre;
    inProgress: Genre;
  };
  selectedRatings: {
    all: any;
    watched: any;
    watchLater: any;
    inProgress: any;
  };
  watchedOrder: "asc" | "desc";
  genreSeries?: Series[];
}

export function useFilteredSeries({
  series,
  seriesWatchedList,
  seriesWatchLaterList,
  seriesInProgressList,
  filterStatus,
  searchTerm,
  selectedGenres,
  selectedRatings,
  watchedOrder,
  genreSeries,
}: UseFilteredSeriesProps) {
  return useMemo(() => {
    let base: Series[] = [];

    const currentGenre = selectedGenres[filterStatus];

    if (filterStatus === "watchLater") {
      base = [...seriesWatchLaterList];
    } else if (filterStatus === "watched") {
      base = [...seriesWatchedList];
      // Implement watchedOrder if applicable, assuming series have watchedAt or similar
      // If watchedAt is not consistently available, skip sorting or assume sort logic
    } else if (filterStatus === "inProgress") {
      base = [...seriesInProgressList];
    } else {
      if (currentGenre && currentGenre !== "All" && genreSeries) {
        base = genreSeries.filter((s) =>
          Array.isArray(s.genres) && s.genres.includes(currentGenre)
        );
      } else {
        base = [...series];
      }
    }

    if (filterStatus !== "all" && currentGenre && currentGenre !== "All") {
      base = base.filter((s) =>
        Array.isArray(s.genres) && s.genres.includes(currentGenre)
      );
    }

    if (searchTerm.trim() !== "") {
      const lowerSearch = searchTerm.toLowerCase();
      base = base.filter((s) =>
        typeof s.title === "string" && s.title.toLowerCase().includes(lowerSearch)
      );
    }

    // Filtrar por rating
    const currentRating = selectedRatings[filterStatus];
    if (currentRating !== "All") {
      base = base.filter(
        (s) => (s.rating ?? 0) >= Number(currentRating)
      );
    }

    return base;
  }, [
    filterStatus,
    series,
    searchTerm,
    seriesWatchLaterList,
    seriesWatchedList,
    seriesInProgressList,
    selectedGenres,
    selectedRatings,
    watchedOrder,
    genreSeries,
  ]);
}
