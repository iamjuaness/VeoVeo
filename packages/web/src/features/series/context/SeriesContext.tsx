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
  reportManualUpdate: () => void;
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
    () => {
      const raw = localStorage.getItem("seriesInProgress");
      if (!raw) return [];
      try {
        const parsed = JSON.parse(raw);
        return Array.isArray(parsed) ? parsed : [];
      } catch {
        return [];
      }
    }
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
  const [seriesWatchedList, setSeriesWatchedList] = useState<Series[]>(() => {
    const raw = localStorage.getItem("seriesWatched");
    if (!raw) return [];
    try {
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  });
  const isFetchingRef = useRef(false);
  const [lastScrollPosition, setLastScrollPosition] = useState(0);
  const lastManualUpdateRef = useRef<number>(0);

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
      console.log("User changed, clearing local series state");
      setSeriesWatchedList([]);
      setSeriesInProgressList([]);
      setSeriesWatchLaterList([]);
      localStorage.removeItem("seriesWatched");
      localStorage.removeItem("seriesInProgress");
      localStorage.removeItem("seriesWatchLater");
    }

    lastLoadedUserRef.current = user.id;

    const fetchData = async () => {
      const needsWatchLater = seriesWatchLaterList.length === 0;
      const needsWatched = seriesWatchedList.length === 0;
      const needsInProgress = seriesInProgressList.length === 0;

      if (needsWatchLater || needsWatched || needsInProgress) {
        setStatsLoading(true);
        try {
          const status = await getUserSeriesStatus();

          const laterIds = status.seriesWatchLater || [];
          const watchedEntries = status.seriesWatched || [];
          const watchedIds = watchedEntries
            .filter((e: any) => e.isCompleted)
            .map((e: any) => e.seriesId);
          const inProgressIds = watchedEntries
            .filter((e: any) => !e.isCompleted)
            .map((e: any) => e.seriesId);

          const allIds = Array.from(
            new Set([...laterIds, ...watchedIds, ...inProgressIds])
          );

          if (allIds.length > 0) {
            const allDetails = await getSeriesByIds(allIds);

            if (needsWatchLater) {
              const laterList = allDetails
                .filter((s) => laterIds.includes(s.id))
                .map((s) => ({ ...s, watchLater: true }));
              setSeriesWatchLaterList(laterList);
              localStorage.setItem(
                "seriesWatchLater",
                JSON.stringify(laterList)
              );
            }

            if (needsWatched) {
              const watchedList = allDetails.filter((s) =>
                watchedIds.includes(s.id)
              );
              setSeriesWatchedList(watchedList);
              localStorage.setItem(
                "seriesWatched",
                JSON.stringify(watchedList)
              );
            }

            if (needsInProgress) {
              const inProgressList = allDetails.filter((s) =>
                inProgressIds.includes(s.id)
              );
              setSeriesInProgressList(inProgressList);
              localStorage.setItem(
                "seriesInProgress",
                JSON.stringify(inProgressList)
              );
            }
          }
        } catch (err) {
          console.error("Error sincronizando series:", err);
        } finally {
          setStatsLoading(false);
        }
      }
    };

    fetchData();
  }, [token, user]);

  // Persist lists to localStorage
  useEffect(() => {
    localStorage.setItem("seriesWatched", JSON.stringify(seriesWatchedList));
  }, [seriesWatchedList]);

  useEffect(() => {
    localStorage.setItem(
      "seriesWatchLater",
      JSON.stringify(seriesWatchLaterList)
    );
  }, [seriesWatchLaterList]);

  useEffect(() => {
    localStorage.setItem(
      "seriesInProgress",
      JSON.stringify(seriesInProgressList)
    );
  }, [seriesInProgressList]);

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
    if (filterStatus !== "all" || !hasMore || isFetchingRef.current) return;

    isFetchingRef.current = true;
    setLoading(true);

    fetchSeriesFromEndpoint(nextPageToken)
      .then((seriesData) => {
        const synced = syncSeriesFlags(seriesData.series, seriesWatchLaterList);
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

  const loadSeriesWatched = async (force = false): Promise<Series[]> => {
    if (!force && Date.now() - lastManualUpdateRef.current < 10000) {
      console.log("Ignoring loadSeriesWatched due to recent manual update");
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
      const allIds = allEntries.map((s: any) => s.seriesId);

      if (allIds.length === 0 && seriesWatchedList.length > 0) {
        console.warn(
          "Server returned 0 watched series but local had many. Protecting against wipeout."
        );
        return seriesWatchedList;
      }

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
