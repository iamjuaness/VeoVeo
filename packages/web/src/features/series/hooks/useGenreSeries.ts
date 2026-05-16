import { useState, useEffect, useCallback, useRef } from "react";
import { getSeriesByGenres } from "../services/imdb";
import type { Series } from "../../../interfaces/Series";
import type { Genre } from "../../../shared/lib/genres";
import { useSeries } from "../context/SeriesContext";

export function useGenreSeries(selectedGenre: Genre) {
  const {
    seriesWatchedList,
    seriesWatchLaterList,
    seriesInProgressList,
    setSelectedGenre,
    setGenreSeries: setGenreSeriesContext,
  } = useSeries();
  const [genreSeries, setGenreSeries] = useState<Series[]>([]);
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
    setGenreSeries([]);
    setNextPageToken(undefined);
    setHasMoreGenre(true);
    setErrorGenre(null);
    isFetchingRef.current = false;
  }, [selectedGenre]);

  const syncSeriesFlags = useCallback(
    (seriesList: Series[]) => {
      return seriesList.map((seriesItem) => {
        const isWatched = seriesWatchedList.some(
          (w: { id: string }) => w.id === seriesItem.id
        );
        const isWatchLater = seriesWatchLaterList.some(
          (wl: { id: string }) => wl.id === seriesItem.id
        );
        const inProgress = seriesInProgressList.some(
          (ip: { id: string }) => ip.id === seriesItem.id
        );

        return {
          ...seriesItem,
          watchLater: isWatchLater,
          inProgress,
          watched: isWatched,
        };
      });
    },
    [seriesWatchedList, seriesWatchLaterList, seriesInProgressList]
  );

  // Fetch inicial y subsiguientes
  const fetchGenreSeries = useCallback(
    async (pageToken?: string) => {
      if (selectedGenre === "All") {
        setGenreSeries([]);
        setHasMoreGenre(false);
        return;
      }

      // Prevenir fetches simultáneos
      if (isFetchingRef.current) {
        return;
      }

      isFetchingRef.current = true;
      setIsLoadingGenre(true);
      setErrorGenre(null);

      try {
        const data = await getSeriesByGenres(selectedGenre, pageToken);

        const seriesList: Series[] = (data.titles ?? []).map((item: any) => ({
          id: item.id,
          type: item.type,
          title: item.primaryTitle ?? item.originalTitle ?? "",
          year: item.startYear ?? 0,
          endYear: item.endYear,
          genres: item.genres ?? [],
          rating: item.rating?.aggregateRating ?? 0,
          description: item.plot ?? "",
          poster: item.primaryImage?.url ?? "",
          backdrop: item.primaryImage?.url ?? "",
          watchLater: false,
        }));

        const syncedSeries = syncSeriesFlags(seriesList);

        setGenreSeries((prev) => {
          const newSeries = pageToken
            ? [...prev, ...syncedSeries]
            : syncedSeries;
          return newSeries;
        });

        setNextPageToken(data.nextPageToken);
        setHasMoreGenre(!!data.nextPageToken);
      } catch (error) {
        console.error("Error fetching series by genre:", error);
        setErrorGenre("Error al cargar series por género");
        setGenreSeries([]);
      } finally {
        setIsLoadingGenre(false);
        isFetchingRef.current = false;
      }
    },
    [selectedGenre, syncSeriesFlags]
  );

  useEffect(() => {
    if (genreSeries.length > 0) {
      const synced = syncSeriesFlags(genreSeries);
      setGenreSeries(synced);

      if (setGenreSeriesContext) {
        setGenreSeriesContext(synced);
      }
    }
  }, [seriesWatchedList, seriesWatchLaterList, seriesInProgressList]);

  // Fetch inicial cuando cambia el género
  useEffect(() => {
    if (selectedGenre !== "All") {
      fetchGenreSeries();
    }
  }, [selectedGenre]);

  // Función para cargar más (scroll infinito)
  const loadMoreGenreSeries = useCallback(() => {
    if (
      !isLoadingGenre &&
      hasMoreGenre &&
      nextPageToken &&
      !isFetchingRef.current
    ) {
      fetchGenreSeries(nextPageToken);
    }
  }, [isLoadingGenre, hasMoreGenre, nextPageToken, fetchGenreSeries]);

  return {
    genreSeries,
    isLoadingGenre,
    errorGenre,
    hasMoreGenre,
    loadMoreGenreSeries,
    setGenreSeries,
  };
}
