import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  type ReactNode,
  useRef,
} from "react";
import { getUserSeriesStatus } from "../services/series";

import type { Series } from "../../../interfaces/Series";
import { useAuth } from "../../auth/hooks/useAuth";
import { io, Socket } from "socket.io-client";
import type { DefaultEventsMap } from "@socket.io/component-emitter";
import { API_BASE_URL } from "../../../shared/utils/urls";
import {
  fetchSeriesFromEndpoint,
  getSeriesByIds,
  searchSeries,
} from "../services/imdb";

interface SeriesContextType {
  series: Series[];
  setSeries: React.Dispatch<React.SetStateAction<Series[]>>;
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
  seriesPerPage: number;
  nextPageToken?: string;
  setNextPageToken: React.Dispatch<React.SetStateAction<string | undefined>>;
  hasMore: boolean;
  setHasMore: React.Dispatch<React.SetStateAction<boolean>>;
  seriesWatchLaterList: Series[];
  setSeriesWatchLaterList: React.Dispatch<React.SetStateAction<Series[]>>;
  seriesWatchedList: Series[];
  setSeriesWatchedList: React.Dispatch<React.SetStateAction<Series[]>>;
  loadSeriesWatchLater: () => Promise<Series[]>;
  loadSeriesWatched: () => Promise<Series[]>;
  searchTerm: string;
  setSearchTerm: React.Dispatch<React.SetStateAction<string>>;
  searchResults: Series[];
  searchLoading: boolean;
  performSearch: (query: string) => Promise<void>;
  setSearchResults: React.Dispatch<React.SetStateAction<Series[]>>;
  filterStatus: "all" | "watched" | "watchLater" | "inProgress";
  setFilterStatus: React.Dispatch<
    React.SetStateAction<"all" | "watched" | "watchLater" | "inProgress">
  >;
  seriesInProgressList: Series[];
  setSeriesInProgressList: React.Dispatch<React.SetStateAction<Series[]>>;
  lastScrollPosition: number;
  setLastScrollPosition: React.Dispatch<React.SetStateAction<number>>;
}

const SeriesContext = createContext<SeriesContextType | undefined>(undefined);

interface SeriesProviderProps {
  children: ReactNode;
}

export function SeriesProvider({ children }: SeriesProviderProps) {
  const { user, token } = useAuth();
  const [series, setSeries] = useState<Series[]>([]);
  const socketRef = useRef<Socket<DefaultEventsMap, DefaultEventsMap> | null>(
    null
  );
  const ENDPOINT = API_BASE_URL;
  const [totalPages, setTotalPages] = useState(1);
  const [totalResults, setTotalResults] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [seriesPerPage] = useState(50);
  const [nextPageToken, setNextPageToken] = useState<string | undefined>(
    undefined
  );
  const [hasMore, setHasMore] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState<Series[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const lastLoadedUserRef = useRef<string | undefined>(undefined);
  const [filterStatus, setFilterStatus] = useState<
    "all" | "watched" | "watchLater" | "inProgress"
  >("all");
  const [seriesInProgressList, setSeriesInProgressList] = useState<Series[]>(
    []
  );
  const [seriesWatchLaterList, setSeriesWatchLaterList] = useState<Series[]>(
    () => {
      const raw = localStorage.getItem("seriesWatchLater");
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
  const [seriesWatchedList, setSeriesWatchedList] = useState<Series[]>([]);
  const [lastScrollPosition, setLastScrollPosition] = useState(0);

  // Sync series flags with watch later list
  const syncSeriesFlags = (baseSeries: Series[], watchLater: Series[]) => {
    return baseSeries.map((s) => {
      const isWatchLater = watchLater.some((wl) => wl.id === s.id);
      return {
        ...s,
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
      if (!seriesWatchLaterList.length) {
        const seriesWatchLater = await loadSeriesWatchLater();
        setSeriesWatchLaterList(seriesWatchLater);
        localStorage.setItem(
          "seriesWatchLater",
          JSON.stringify(seriesWatchLater)
        );
      }
      if (!seriesWatchedList.length) {
        const watched = await loadSeriesWatched();
        setSeriesWatchedList(watched);
      }
      setStatsLoading(false);
    };

    fetchSequential();
  }, [token, user]);

  useEffect(() => {
    localStorage.setItem(
      "seriesWatchLater",
      JSON.stringify(seriesWatchLaterList)
    );
  }, [seriesWatchLaterList]);

  useEffect(() => {
    const syncedSeries = syncSeriesFlags(series, seriesWatchLaterList);
    if (JSON.stringify(syncedSeries) !== JSON.stringify(series)) {
      setSeries(syncedSeries);
    }
  }, [series, seriesWatchLaterList]);

  const performSearch = async (query: string) => {
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }
    setSearchLoading(true);

    try {
      if (user && token) {
        const [results, userStatus] = await Promise.all([
          searchSeries(query),
          getUserSeriesStatus(),
        ]);

        const enrichedResults = results.map((s) => ({
          ...s,
          watchLater: userStatus.seriesWatchLater.includes(String(s.id)),
        }));

        setSearchResults(enrichedResults);
      } else {
        const results = await searchSeries(query);
        setSearchResults(results);
      }
    } catch (err) {
      console.error("Error al buscar series:", err);
      setSearchResults([]);
    } finally {
      setSearchLoading(false);
    }
  };

  useEffect(() => {
    if (filterStatus !== "all") return;
    if (!hasMore) return;

    setLoading(true);

    fetchSeriesFromEndpoint(nextPageToken)
      .then((seriesData) => {
        setSeries((prev) => {
          const idsExistentes = new Set(prev.map((s) => s.id));
          const nuevos = seriesData.series.filter(
            (s) => !idsExistentes.has(s.id)
          );
          return [...prev, ...nuevos];
        });

        setNextPageToken(seriesData.nextPageToken);
        setHasMore(!!seriesData.nextPageToken);
        setTotalPages(seriesData.totalPages);
        setTotalResults(seriesData.totalResults);
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, [currentPage]);

  const loadSeriesWatchLater = async (): Promise<Series[]> => {
    try {
      const status = await getUserSeriesStatus();
      const ids = status.seriesWatchLater;
      const series = await getSeriesByIds(ids);

      const withFlag = series.map((s) => ({
        ...s,
        watchLater: true,
      }));

      setSeriesWatchLaterList(withFlag);
      return withFlag;
    } catch (err) {
      console.error("Error cargando series por ver:", err);
      return [];
    }
  };

  const loadSeriesWatched = async (): Promise<Series[]> => {
    try {
      const status = await getUserSeriesStatus();

      const allEntries = status.seriesWatched || [];
      const allIds = allEntries.map((s: any) => s.seriesId);

      // Load full series details
      const allDetails = await getSeriesByIds(allIds);

      // Separate based on isCompleted status from backend
      const watched = allDetails.filter((d) =>
        allEntries.some(
          (e: any) => e.seriesId === d.id && e.isCompleted === true
        )
      );

      const inProgress = allDetails.filter((d) =>
        allEntries.some(
          (e: any) =>
            e.seriesId === d.id && (!e.isCompleted || e.isCompleted === false)
        )
      );

      setSeriesWatchedList(watched);
      setSeriesInProgressList(inProgress);

      return watched;
    } catch (err) {
      console.error("Error cargando series vistas:", err);
      return [];
    }
  };

  useEffect(() => {
    if (!user) return;

    socketRef.current = io(ENDPOINT, { transports: ["websocket"] });

    socketRef.current.on("connect", () => {
      socketRef.current?.emit("join", String(user.id));
    });

    socketRef.current.on("series-watch-later-toggled", () => {
      getUserSeriesStatus()
        .then((data) => {
          setSeries((prev) =>
            prev.map((s) => ({
              ...s,
              watchLater: data.seriesWatchLater.includes(String(s.id)),
            }))
          );
          loadSeriesWatchLater();
        })
        .catch((err) => {
          console.error("Error cargando estado de series:", err);
        });
    });

    const refreshSeriesStatus = () => {
      loadSeriesWatched();
    };

    socketRef.current.on("series-marked-watched", refreshSeriesStatus);
    socketRef.current.on("series-completed-toggled", refreshSeriesStatus);
    socketRef.current.on("episode-watched-toggled", refreshSeriesStatus);

    socketRef.current.on("connect_error", (err) => {
      console.error("Error de conexión en socket:", err);
    });

    return () => {
      socketRef.current?.disconnect();
    };
  }, [ENDPOINT, user]);

  return (
    <SeriesContext.Provider
      value={{
        series,
        setSeries,
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
        seriesPerPage,
        nextPageToken,
        setNextPageToken,
        hasMore,
        setHasMore,
        seriesWatchLaterList,
        setSeriesWatchLaterList,
        searchTerm,
        setSearchTerm,
        searchResults,
        searchLoading,
        performSearch,
        setSearchResults,
        loadSeriesWatchLater: loadSeriesWatchLater,
        loadSeriesWatched: loadSeriesWatched,
        seriesWatchedList,
        setSeriesWatchedList,
        filterStatus,
        setFilterStatus,
        seriesInProgressList,
        setSeriesInProgressList,
        lastScrollPosition,
        setLastScrollPosition,
      }}
    >
      {children}
    </SeriesContext.Provider>
  );
}

export function useSeries() {
  const ctx = useContext(SeriesContext);
  if (!ctx) throw new Error("useSeries debe usarse dentro de <SeriesProvider>");
  return ctx;
}
