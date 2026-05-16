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
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
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
import type { Genre } from "../../../shared/lib/genres";

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
  activeSearchTerm: string;
  setActiveSearchTerm: React.Dispatch<React.SetStateAction<string>>;
  searchResults: Series[];
  searchLoading: boolean;
  performSearch: (query: string) => Promise<void>;
  clearSearch: () => void;
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
  selectedGenre?: Genre;
  setSelectedGenre?: (genre: Genre) => void;
  genreSeries: Series[];
  setGenreSeries?: React.Dispatch<React.SetStateAction<Series[]>>;
}

const SeriesContext = createContext<SeriesContextType | undefined>(undefined);

interface SeriesProviderProps {
  children: ReactNode;
}

export function SeriesProvider({ children }: SeriesProviderProps) {
  const { user, token } = useAuth();
  const queryClient = useQueryClient();
  const socketRef = useRef<Socket<DefaultEventsMap, DefaultEventsMap> | null>(
    null,
  );
  const ENDPOINT = API_BASE_URL;

  const [series, setSeries] = useState<Series[]>([]);
  const [totalPages, setTotalPages] = useState(1);
  const [totalResults, setTotalResults] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [seriesPerPage] = useState(50);
  const [nextPageToken, setNextPageToken] = useState<string | undefined>(
    undefined,
  );
  const [hasMore, setHasMore] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeSearchTerm, setActiveSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState<Series[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [filterStatus, setFilterStatus] = useState<
    "all" | "watched" | "watchLater" | "inProgress"
  >("all");
  const [lastScrollPosition, setLastScrollPosition] = useState(0);
  const [selectedGenre, setSelectedGenre] = useState<Genre>("All");
  const [genreSeries, setGenreSeries] = useState<Series[]>([]);
  const isFetchingRef = useRef(false);

  // TanStack Query for User Series Status
  const { data: userSeriesStatus, isLoading: statsLoading } = useQuery({
    queryKey: ["userSeriesStatus", user?.id],
    queryFn: getUserSeriesStatus,
    enabled: !!user && !!token,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  const seriesWatchedList = useMemo(() => {
    if (!userSeriesStatus?.seriesWatched) return [];
    return userSeriesStatus.seriesWatched
      .filter((e: any) => e.isCompleted === true)
      .map((e: any) => ({
        ...e,
        id: e.id || e.seriesId,
      }));
  }, [userSeriesStatus]);

  const seriesInProgressList = useMemo(() => {
    if (!userSeriesStatus?.seriesWatched) return [];
    return userSeriesStatus.seriesWatched
      .filter((e: any) => !e.isCompleted)
      .map((e: any) => ({
        ...e,
        id: e.id || e.seriesId,
      }));
  }, [userSeriesStatus]);

  const seriesWatchLaterList = useMemo(() => {
    if (!userSeriesStatus?.seriesWatchLater) return [];
    return userSeriesStatus.seriesWatchLater.map((s: any) => ({
      ...s,
      id: s.id || s.seriesId,
      watchLater: true,
    }));
  }, [userSeriesStatus]);

  const seriesStats = useMemo(() => {
    if (userSeriesStatus?.stats) return userSeriesStatus.stats;
    return {
      watchedCount: seriesWatchedList.length,
      inProgressCount: seriesInProgressList.length,
      watchLaterCount: seriesWatchLaterList.length,
    };
  }, [
    userSeriesStatus,
    seriesWatchedList.length,
    seriesInProgressList.length,
    seriesWatchLaterList.length,
  ]);

  // Backward compatibility methods
  const setSeriesWatchedList = useCallback(() => {}, []);
  const setSeriesInProgressList = useCallback(() => {}, []);
  const setSeriesWatchLaterList = useCallback(() => {}, []);
  const setStatsLoading = useCallback(() => {}, []);
  const reportManualUpdate = useCallback(() => {}, []);

  const loadSeriesWatched = useCallback(async () => {
    queryClient.invalidateQueries({ queryKey: ["userSeriesStatus", user?.id] });
    return [...seriesWatchedList, ...seriesInProgressList];
  }, [queryClient, user?.id, seriesWatchedList, seriesInProgressList]);

  const loadSeriesWatchLater = useCallback(async () => {
    queryClient.invalidateQueries({ queryKey: ["userSeriesStatus", user?.id] });
    return seriesWatchLaterList;
  }, [queryClient, user?.id, seriesWatchLaterList]);

  // Socket.IO sync
  useEffect(() => {
    if (!user) return;
    socketRef.current = io(ENDPOINT);
    socketRef.current.on("connect", () => {
      socketRef.current?.emit("join", String(user.id));
    });

    const refreshQuery = () =>
      queryClient.invalidateQueries({
        queryKey: ["userSeriesStatus", user?.id],
      });
    socketRef.current.on("series-watch-later-toggled", refreshQuery);
    socketRef.current.on("series-marked-watched", refreshQuery);
    socketRef.current.on("series-completed-toggled", refreshQuery);
    socketRef.current.on("episode-watched-toggled", refreshQuery);

    socketRef.current.on("connect_error", (err) => {
      console.error("Error de conexión en socket:", err);
    });

    return () => {
      socketRef.current?.disconnect();
    };
  }, [ENDPOINT, user, queryClient]);

  const syncSeriesFlags = useCallback(
    (baseSeries: Series[]) => {
      return baseSeries.map((s) => {
        const isWatchLater = seriesWatchLaterList.some(
          (wl: { id: string }) => wl.id === s.id,
        );
        return {
          ...s,
          watchLater: isWatchLater,
        };
      });
    },
    [seriesWatchLaterList],
  );

  useEffect(() => {
    setSeries((prev) => syncSeriesFlags(prev));
    setSearchResults((prev) => syncSeriesFlags(prev));
  }, [syncSeriesFlags]);

  // Mutations
  const markAsWatchedMutation = useMutation({
    mutationFn: async (id: string) => {
      const isWatchLater = seriesWatchLaterList.some(
        (s: { id: string }) => s.id === id,
      );
      if (isWatchLater) {
        await toggleSeriesWatchLaterApi({ seriesId: id });
      }
      const seriesDetail = await getSeriesDetailById(id);
      const seasons =
        seriesDetail.seasons?.map((season: any) => ({
          seasonNumber: Number(season.season),
          episodeCount: season.episodeCount || 0,
        })) || [];
      return markAllEpisodesWatchedApi({ seriesId: id, seasons });
    },
    onSettled: () => {
      queryClient.invalidateQueries({
        queryKey: ["userSeriesStatus", user?.id],
      });
    },
  });

  const resetWatchedMutation = useMutation({
    mutationFn: async (id: string) => resetSeriesWatchedApi({ seriesId: id }),
    onSettled: () => {
      queryClient.invalidateQueries({
        queryKey: ["userSeriesStatus", user?.id],
      });
    },
  });

  const toggleWatchLaterMutation = useMutation({
    mutationFn: async (id: string) =>
      toggleSeriesWatchLaterApi({ seriesId: id }),
    onSettled: () => {
      queryClient.invalidateQueries({
        queryKey: ["userSeriesStatus", user?.id],
      });
    },
  });

  const markAsWatched = async (id: string) =>
    markAsWatchedMutation.mutateAsync(id);
  const resetWatched = async (id: string) =>
    resetWatchedMutation.mutateAsync(id);
  const toggleWatchLater = async (id: string) =>
    toggleWatchLaterMutation.mutateAsync(id);

  // Pagination & Loading
  useEffect(() => {
    if (filterStatus !== "all" || !hasMore || isFetchingRef.current) return;

    isFetchingRef.current = true;
    setLoading(true);

    fetchSeriesFromEndpoint(nextPageToken)
      .then((seriesData) => {
        const synced = syncSeriesFlags(seriesData.series);
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

  // Search logic
  const performSearch = async (query: string) => {
    setActiveSearchTerm(query);
    if (!query.trim()) {
      setSearchResults([]);
      setSearchTerm("");
      return;
    }
    setSearchLoading(true);
    try {
      const results = await searchSeries(query);
      setSearchResults(syncSeriesFlags(results));
    } catch (err) {
      console.error("Error al buscar series:", err);
      setSearchResults([]);
    } finally {
      setSearchLoading(false);
      setSearchTerm("");
    }
  };

  const clearSearch = () => {
    setActiveSearchTerm("");
    setSearchResults([]);
  };

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
      activeSearchTerm,
      setActiveSearchTerm,
      searchResults,
      searchLoading,
      performSearch,
      clearSearch,
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
      selectedGenre,
      setSelectedGenre,
      genreSeries,
      setGenreSeries,
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
      activeSearchTerm,
      searchResults,
      searchLoading,
      seriesWatchedList,
      filterStatus,
      seriesInProgressList,
      lastScrollPosition,
      seriesStats,
      selectedGenre,
      genreSeries,
    ],
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
