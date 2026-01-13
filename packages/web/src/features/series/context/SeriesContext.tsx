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
import { getUserSeriesStatus } from "../services/series";

import type { Series } from "../../../interfaces/Series";
import { useAuth } from "../../auth/hooks/useAuth";
import { io, Socket } from "socket.io-client";
import type { DefaultEventsMap } from "@socket.io/component-emitter";
import { API_BASE_URL } from "../../../shared/utils/urls";
import {
  fetchSeriesFromEndpoint,
  searchSeries,
  getSeriesDetailById,
} from "../services/imdb";
import {
  toggleSeriesWatchLaterApi,
  markAllEpisodesWatchedApi,
  resetSeriesWatchedApi,
} from "../services/series";

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
  reportManualUpdate: () => void;
  seriesStats: {
    watchedCount: number;
    inProgressCount: number;
    watchLaterCount: number;
  };
  markAsWatched: (id: string) => Promise<void>;
  resetWatched: (id: string) => Promise<void>;
  toggleWatchLater: (id: string) => Promise<void>;
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
    []
  );
  const [statsLoading, setStatsLoading] = useState(false);
  const [seriesWatchedList, setSeriesWatchedList] = useState<Series[]>([]);
  const isFetchingRef = useRef(false);
  const [lastScrollPosition, setLastScrollPosition] = useState(0);
  const lastManualUpdateRef = useRef<number>(0);
  const [seriesStats, setSeriesStats] = useState({
    watchedCount: 0,
    inProgressCount: 0,
    watchLaterCount: 0,
  });

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
    if (lastLoadedUserRef.current && lastLoadedUserRef.current !== user.id) {
      setSeriesWatchedList([]);
      setSeriesInProgressList([]);
      setSeriesWatchLaterList([]);
      localStorage.removeItem("seriesWatched");
      localStorage.removeItem("seriesInProgress");
      localStorage.removeItem("seriesWatchLater");
    }

    lastLoadedUserRef.current = user.id;

    const fetchInfo = async () => {
      // Always fetch on mount/user change as it is now optimized
      setStatsLoading(true);
      try {
        const status = await getUserSeriesStatus();
        if (status) {
          const allWatched = status.seriesWatched || [];

          // Separate Watched (Completed) vs In Progress
          // Backend provides isCompleted flag
          const watched = allWatched
            .filter((e: any) => e.isCompleted === true)
            .map((e: any) => ({
              ...e,
              id: e.id || e.seriesId,
            }));

          const inProgress = allWatched
            .filter((e: any) => !e.isCompleted)
            .map((e: any) => ({
              ...e,
              id: e.id || e.seriesId,
            }));

          setSeriesWatchedList(watched);
          setSeriesInProgressList(inProgress);

          // Watch Later
          const watchLater = (status.seriesWatchLater || []).map((s: any) => ({
            ...s,
            id: s.id || s.seriesId,
            watchLater: true,
          }));
          setSeriesWatchLaterList(watchLater);

          // Stats
          if (status.stats) {
            setSeriesStats(status.stats);
          } else {
            setSeriesStats({
              watchedCount: watched.length,
              inProgressCount: inProgress.length,
              watchLaterCount: watchLater.length,
            });
          }
        }
      } catch (err) {
        console.error("Error sincronizando series:", err);
      } finally {
        setStatsLoading(false);
      }
    };

    fetchInfo();
  }, [token, user]);

  // Refs to track latest state
  const seriesWatchLaterListRef = useRef(seriesWatchLaterList);

  useEffect(() => {
    seriesWatchLaterListRef.current = seriesWatchLaterList;
  }, [seriesWatchLaterList]);

  // Persist lists to localStorage
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
          watchLater: (userStatus.seriesWatchLater || []).some(
            (wl: any) => String(wl.id || wl.seriesId) === String(s.id)
          ),
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

  // Sync series with watch later list when it changes
  useEffect(() => {
    const syncFn = (prev: Series[]) =>
      syncSeriesFlags(prev, seriesWatchLaterList);

    setSeries(syncFn);
    setSearchResults(syncFn);

    // Update stats immediately
    setSeriesStats({
      watchedCount: seriesWatchedList.length,
      inProgressCount: seriesInProgressList.length,
      watchLaterCount: seriesWatchLaterList.length,
    });
  }, [seriesWatchLaterList, seriesWatchedList, seriesInProgressList]);

  // Persistence for scroll position
  useEffect(() => {
    const savedScroll = localStorage.getItem("seriesLastScroll");
    if (savedScroll) {
      setLastScrollPosition(Number(savedScroll));
    }
  }, []);

  useEffect(() => {
    if (lastScrollPosition > 0) {
      localStorage.setItem("seriesLastScroll", lastScrollPosition.toString());
    }
  }, [lastScrollPosition]);

  useEffect(() => {
    if (filterStatus !== "all" || !hasMore || isFetchingRef.current) return;

    isFetchingRef.current = true;
    setLoading(true);

    fetchSeriesFromEndpoint(nextPageToken)
      .then((seriesData) => {
        const synced = syncSeriesFlags(
          seriesData.series,
          seriesWatchLaterListRef.current
        );
        setSeries((prev) => {
          const idsExistentes = new Set(prev.map((s) => s.id));
          const nuevos = synced.filter((s) => !idsExistentes.has(s.id));
          return [...prev, ...nuevos];
        });

        setNextPageToken(seriesData.nextPageToken);
        setHasMore(!!seriesData.nextPageToken);
        setTotalPages(seriesData.totalPages);
        setTotalResults(seriesData.totalResults);
      })
      .catch((err) => {
        console.error("Error fetching series:", err);
        if (err?.message?.includes("429")) {
          setHasMore(false);
        }
      })
      .finally(() => {
        setLoading(false);
        isFetchingRef.current = false;
      });
  }, [currentPage]);

  const reportManualUpdate = useCallback(() => {
    lastManualUpdateRef.current = Date.now();
  }, []);

  const toggleWatchLater = useCallback(
    async (id: string) => {
      reportManualUpdate();

      const seriesOriginal =
        series.find((s) => s.id === id) ||
        searchResults.find((s) => s.id === id) ||
        seriesWatchLaterList.find((s) => s.id === id) ||
        seriesWatchedList.find((s) => s.id === id) ||
        seriesInProgressList.find((s) => s.id === id);

      if (!seriesOriginal) return;

      const nextWatchLater = !seriesOriginal.watchLater;

      // 1. Optimistic Update for Lists
      const updateFn = (s: Series) =>
        s.id === id ? { ...s, watchLater: nextWatchLater } : s;
      setSeries((prev) => prev.map(updateFn));
      setSearchResults((prev) => prev.map(updateFn));

      setSeriesWatchLaterList((prev) => {
        const exists = prev.some((s) => s.id === id);
        let updated;
        if (exists) {
          updated = prev.filter((s) => s.id !== id);
        } else {
          updated = [...prev, { ...seriesOriginal, watchLater: true }];
        }
        localStorage.setItem("seriesWatchLater", JSON.stringify(updated));
        return updated;
      });

      try {
        await toggleSeriesWatchLaterApi({ seriesId: id });
      } catch (err) {
        console.error("Error toggling series watch later:", err);
      }
    },
    [
      series,
      searchResults,
      seriesWatchLaterList,
      seriesWatchedList,
      seriesInProgressList,
      reportManualUpdate,
    ]
  );

  const markAsWatched = useCallback(
    async (id: string) => {
      reportManualUpdate();

      const seriesOriginal =
        series.find((s) => s.id === id) ||
        searchResults.find((s) => s.id === id) ||
        seriesWatchLaterList.find((s) => s.id === id) ||
        seriesWatchedList.find((s) => s.id === id) ||
        seriesInProgressList.find((s) => s.id === id);

      if (!seriesOriginal) return;

      // 1. If in watch later, remove it
      if (seriesOriginal.watchLater) {
        toggleWatchLater(id);
      }

      // 2. Update Series Array (optimistic)
      setSeries((prev) =>
        prev.map((s) => (s.id === id ? { ...s, watchLater: false } : s))
      );
      setSearchResults((prev) =>
        prev.map((s) => (s.id === id ? { ...s, watchLater: false } : s))
      );

      // 3. Update Watched list
      setSeriesWatchedList((prev) => {
        if (prev.some((s) => s.id === id)) return prev;
        const updated = [...prev, seriesOriginal];
        localStorage.setItem("seriesWatched", JSON.stringify(updated));
        return updated;
      });

      // 4. Remove from in progress
      setSeriesInProgressList((prev) => {
        const updated = prev.filter((s) => s.id !== id);
        localStorage.setItem("seriesInProgress", JSON.stringify(updated));
        return updated;
      });

      try {
        const seriesDetail = await getSeriesDetailById(id);
        const seasons =
          seriesDetail.seasons?.map((season: any) => ({
            seasonNumber: Number(season.season),
            episodeCount: season.episodeCount || 0,
          })) || [];

        await markAllEpisodesWatchedApi({ seriesId: id, seasons });
      } catch (err) {
        console.error("Error marking series as watched:", err);
      }
    },
    [
      series,
      searchResults,
      seriesWatchLaterList,
      seriesWatchedList,
      seriesInProgressList,
      toggleWatchLater,
      reportManualUpdate,
    ]
  );

  const resetWatched = useCallback(
    async (id: string) => {
      reportManualUpdate();

      setSeriesWatchedList((prev) => {
        const updated = prev.filter((s) => s.id !== id);
        localStorage.setItem("seriesWatched", JSON.stringify(updated));
        return updated;
      });

      setSeriesInProgressList((prev) => {
        const updated = prev.filter((s) => s.id !== id);
        localStorage.setItem("seriesInProgress", JSON.stringify(updated));
        return updated;
      });

      try {
        await resetSeriesWatchedApi({ seriesId: id });
      } catch (err) {
        console.error("Error resetting series watched status:", err);
      }
    },
    [reportManualUpdate]
  );

  const loadSeriesWatchLater = async (): Promise<Series[]> => {
    try {
      const status = await getUserSeriesStatus();

      // El backend devuelve objetos completos enriquecidos
      const withFlag = (status.seriesWatchLater || []).map((s: any) => ({
        ...s,
        id: s.id || s.seriesId, // Asegurar ID
        watchLater: true,
      }));

      setSeriesWatchLaterList(withFlag);
      return withFlag;
    } catch (err) {
      console.error("Error cargando series por ver:", err);
      return [];
    }
  };

  const loadSeriesWatched = async (force = false): Promise<Series[]> => {
    if (!force && Date.now() - lastManualUpdateRef.current < 10000) {
      return seriesWatchedList;
    }
    try {
      const status = await getUserSeriesStatus();
      if (!status || (!status.seriesWatched && !status.seriesWatchLater)) {
        console.warn(
          "Invalid status received, skipping refresh to protect localStorage"
        );
        return seriesWatchedList;
      }

      const allEntries = status.seriesWatched || [];

      // Separate based on isCompleted status from backend
      // El backend devuelve todos los campos enriquecidos (title, poster, etc)
      const watched = allEntries
        .filter((e: any) => e.isCompleted === true)
        .map((e: any) => ({
          ...e,
          id: e.id || e.seriesId,
        }));

      const inProgress = allEntries
        .filter((e: any) => !e.isCompleted || e.isCompleted === false)
        .map((e: any) => ({
          ...e,
          id: e.id || e.seriesId,
        }));

      setSeriesWatchedList(watched);
      setSeriesInProgressList(inProgress);

      return watched;
    } catch (err) {
      console.error("Error cargando series vistas:", err);
      return seriesWatchedList; // Return current instead of empty to prevent wipeout
    }
  };

  const refreshSeriesStatus = useCallback(() => {
    loadSeriesWatched();
  }, [loadSeriesWatched]);

  const refreshRef = useRef(refreshSeriesStatus);
  useEffect(() => {
    refreshRef.current = refreshSeriesStatus;
  }, [refreshSeriesStatus]);

  useEffect(() => {
    if (!user) return;

    socketRef.current = io(ENDPOINT, { transports: ["websocket"] });

    socketRef.current.on("connect", () => {
      socketRef.current?.emit("join", String(user.id));
    });

    socketRef.current.on("series-watch-later-toggled", () => {
      // For watch later, we still fetch status to sync flags
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

    socketRef.current.on("series-marked-watched", () => refreshRef.current());
    socketRef.current.on("series-completed-toggled", () =>
      refreshRef.current()
    );
    socketRef.current.on("episode-watched-toggled", () => refreshRef.current());

    socketRef.current.on("connect_error", (err) => {
      console.error("Error de conexión en socket:", err);
    });

    return () => {
      socketRef.current?.disconnect();
    };
  }, [ENDPOINT, user]);

  const contextValue = useMemo(
    () => ({
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
      loadSeriesWatchLater,
      loadSeriesWatched,
      seriesWatchedList,
      setSeriesWatchedList,
      filterStatus,
      setFilterStatus,
      seriesInProgressList,
      setSeriesInProgressList,
      lastScrollPosition,
      setLastScrollPosition,
      reportManualUpdate,
      seriesStats,
      markAsWatched,
      resetWatched,
      toggleWatchLater,
    }),
    [
      series,
      currentPage,
      totalPages,
      totalResults,
      loading,
      statsLoading,
      seriesPerPage,
      nextPageToken,
      hasMore,
      seriesWatchLaterList,
      searchTerm,
      searchResults,
      searchLoading,
      seriesWatchedList,
      filterStatus,
      seriesInProgressList,
      lastScrollPosition,
      setLastScrollPosition,
      reportManualUpdate,
      seriesStats,
      markAsWatched,
      resetWatched,
      toggleWatchLater,
    ]
  );

  return (
    <SeriesContext.Provider value={contextValue}>
      {children}
    </SeriesContext.Provider>
  );
}

export function useSeries() {
  const ctx = useContext(SeriesContext);
  if (!ctx) throw new Error("useSeries debe usarse dentro de <SeriesProvider>");
  return ctx;
}
