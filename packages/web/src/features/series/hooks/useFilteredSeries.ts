import { useMemo } from "react";
import type { Series } from "../../../interfaces/Series";

interface UseFilteredSeriesProps {
  series: Series[];
  seriesWatchedList: Series[];
  seriesWatchLaterList: Series[];
  seriesInProgressList: Series[];
  filterStatus: "all" | "watched" | "watchLater" | "inProgress";
  searchTerm: string;
}

export function useFilteredSeries({
  series,
  seriesWatchedList,
  seriesWatchLaterList,
  seriesInProgressList,
  filterStatus,
  searchTerm,
}: UseFilteredSeriesProps) {
  return useMemo(() => {
    let base: Series[] = [];

    if (filterStatus === "watchLater") {
      base = [...seriesWatchLaterList];
    } else if (filterStatus === "watched") {
      base = [...seriesWatchedList];
    } else if (filterStatus === "inProgress") {
      base = [...seriesInProgressList];
    } else {
      base = series.filter((s) =>
        s.title.toLowerCase().includes(searchTerm.toLowerCase())
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
  ]);
}
