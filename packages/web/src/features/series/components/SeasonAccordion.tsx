import { useState, useEffect } from "react";
import {
  ChevronDown,
  ChevronUp,
  Calendar,
  Clock,
  Star,
  Plus,
} from "lucide-react";
import { Button } from "../../../shared/components/ui/button";
import { Card } from "../../../shared/components/ui/card";
import { Badge } from "../../../shared/components/ui/badge";
import { Checkbox } from "../../../shared/components/ui/checkbox";
import { Progress } from "../../../shared/components/ui/progress";
import type { Season, Episode } from "../../../interfaces/Series";
import { getSeasonEpisodes } from "../services/imdb";
import {
  toggleEpisodeWatchedApi,
  getSeriesProgressApi,
  markSeasonWatchedApi,
} from "../services/series";
import { useAuth } from "../../auth/hooks/useAuth";

interface Props {
  seriesId: string;
  season: Season;
  seasonNumber: number;
  onProgressChange?: () => void;
  initialWatchedEpisodes?: WatchedEpisode[];
}

interface WatchedEpisode {
  seasonNumber: number;
  episodeNumber: number;
  watchedAt: Date;
  count?: number;
}

export function SeasonAccordion({
  seriesId,
  season,
  seasonNumber,
  onProgressChange,
  initialWatchedEpisodes,
}: Props) {
  const [isOpen, setIsOpen] = useState(false);
  const [episodes, setEpisodes] = useState<Episode[]>([]);
  const [loading, setLoading] = useState(false);
  // Initialize with passed prop, fallback to empty
  const [watchedEpisodes, setWatchedEpisodes] = useState<WatchedEpisode[]>(
    initialWatchedEpisodes || []
  );
  const { user } = useAuth();

  /* State for pagination */
  const [nextPageToken, setNextPageToken] = useState<string | undefined>(
    undefined
  );
  // Initialize with metadata count, updated by API fetch
  const [totalEpisodesCount, setTotalEpisodesCount] = useState<number>(
    season.episodeCount || 0
  );

  useEffect(() => {
    if (isOpen && episodes.length === 0) {
      setLoading(true);
      getSeasonEpisodes(seriesId, season.season)
        .then((data) => {
          // @ts-ignore - Handle potential old return type while transitioning or strict metadata return
          if (data.episodes) {
            // New Return Type
            setEpisodes(data.episodes);
            setTotalEpisodesCount(data.totalCount);
            setNextPageToken(data.nextPageToken);
          } else {
            // Fallback (should not happen with updated service)
            // @ts-ignore
            setEpisodes(data);
          }
        })
        .catch((err) => console.error("Error loading episodes:", err))
        .finally(() => setLoading(false));
    }
  }, [isOpen, seriesId, season.season]);

  const loadMoreEpisodes = () => {
    if (!nextPageToken) return;
    setLoading(true);
    getSeasonEpisodes(seriesId, season.season, nextPageToken)
      .then((data) => {
        setEpisodes((prev) => [...prev, ...data.episodes]);
        setNextPageToken(data.nextPageToken);
        // Don't overwrite totalCount on appends usually, safe to keep or update
      })
      .catch((err) => console.error("Error loading more episodes:", err))
      .finally(() => setLoading(false));
  };

  // Sync with prop updates if they change
  useEffect(() => {
    if (initialWatchedEpisodes) {
      setWatchedEpisodes(initialWatchedEpisodes);
    }
  }, [initialWatchedEpisodes]);

  const getWatchedEpisodeData = (episodeNumber: number) => {
    return watchedEpisodes.find(
      (ep) =>
        ep.seasonNumber === seasonNumber && ep.episodeNumber === episodeNumber
    );
  };

  const toggleEpisodeWatched = async (episodeNumber: number, force = false) => {
    if (!user || !seriesId) return;

    const existingEp = getWatchedEpisodeData(episodeNumber);
    const isCurrentlyWatched = !!existingEp;

    // Optimistic update
    if (force) {
      // Increment
      setWatchedEpisodes((prev) =>
        prev.map((ep) =>
          ep.seasonNumber === seasonNumber && ep.episodeNumber === episodeNumber
            ? { ...ep, count: (ep.count || 1) + 1, watchedAt: new Date() }
            : ep
        )
      );
    } else if (isCurrentlyWatched) {
      // Remove
      setWatchedEpisodes((prev) =>
        prev.filter(
          (ep) =>
            !(
              ep.seasonNumber === seasonNumber &&
              ep.episodeNumber === episodeNumber
            )
        )
      );
    } else {
      // Add
      setWatchedEpisodes((prev) => [
        ...prev,
        {
          seasonNumber,
          episodeNumber,
          watchedAt: new Date(),
          count: 1,
        },
      ]);
    }

    try {
      await toggleEpisodeWatchedApi({
        seriesId,
        seasonNumber,
        episodeNumber,
        force,
      });

      if (onProgressChange) {
        onProgressChange();
      }
    } catch (err) {
      console.error("Error toggling episode:", err);
      // Revert/Refetch
      getSeriesProgressApi(seriesId)
        .then((data) => setWatchedEpisodes(data.episodes || []))
        .catch(() => {});
    }
  };

  const markEntireSeasonWatched = async () => {
    if (!user || !seriesId) return; // Removed episodes.length check (server filling support)

    // Detect if this is a "Re-watch" (Incremental) action
    const isRewatch = isSeasonFullyWatched;
    const now = new Date();

    // Optimistic Update
    // If not loaded all, we only update what we have.
    // Backend will handle the rest (DB Filling).
    if (episodes.length > 0) {
      setWatchedEpisodes((prev) => {
        const next = [...prev];
        episodes.forEach((ep) => {
          const existingIndex = next.findIndex(
            (w) =>
              w.seasonNumber === seasonNumber &&
              w.episodeNumber === ep.episodeNumber
          );
          if (existingIndex > -1) {
            if (isRewatch) {
              // Increment
              next[existingIndex] = {
                ...next[existingIndex],
                count: (next[existingIndex].count || 1) + 1,
                watchedAt: now,
              };
            }
          } else {
            // Add
            next.push({
              seasonNumber,
              episodeNumber: ep.episodeNumber,
              watchedAt: now,
              count: 1,
            });
          }
        });
        return next;
      });
    }

    try {
      // Send EMPTY episodes list to trigger Server-Side Filling (Authoritative Fetch)
      // Pass 'increment' flag for re-watch logic
      await markSeasonWatchedApi({
        seriesId,
        seasonNumber,
        episodes: [],
        increment: isRewatch,
      });

      if (onProgressChange) onProgressChange();
    } catch (err) {
      console.error("Error marking season:", err);
      getSeriesProgressApi(seriesId)
        .then((data) => setWatchedEpisodes(data.episodes || []))
        .catch(() => {});
    }
  };

  const watchedCount = watchedEpisodes.filter(
    (ep) => ep.seasonNumber === seasonNumber
  ).length;

  // Use the API total count if available, otherwise fallback
  const totalCount =
    totalEpisodesCount > 0
      ? totalEpisodesCount
      : season.episodeCount || episodes.length || 0;

  const progress = totalCount > 0 ? (watchedCount / totalCount) * 100 : 0;
  const isSeasonFullyWatched = totalCount > 0 && watchedCount >= totalCount;

  const formatDate = (date: { year: number; month: number; day: number }) => {
    if (!date) return "N/A";
    return `${date.day}/${date.month}/${date.year}`;
  };

  const formatRuntime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    return `${minutes} min`;
  };

  return (
    <div className="border rounded-lg overflow-hidden bg-card">
      <Button
        variant="ghost"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full justify-between p-4 hover:bg-muted/50 transition-colors"
      >
        <div className="flex items-center gap-3">
          <span className="text-lg font-bold">Temporada {seasonNumber}</span>
          <Badge variant="secondary" className="text-xs">
            {totalCount} episodios
          </Badge>
          {user && watchedCount > 0 && (
            <Badge variant="default" className="text-xs bg-green-600">
              {watchedCount}/{totalCount} vistos
            </Badge>
          )}
        </div>
        {isOpen ? (
          <ChevronUp className="w-5 h-5 text-muted-foreground" />
        ) : (
          <ChevronDown className="w-5 h-5 text-muted-foreground" />
        )}
      </Button>

      {isOpen && (
        <div className="border-t bg-muted/20">
          {user && totalCount > 0 && (
            <div className="p-4 bg-muted/10 space-y-3">
              <div className="flex items-center gap-3">
                <Progress value={progress} className="flex-1" />
                <span className="text-xs text-muted-foreground font-medium">
                  {Math.round(progress)}%
                </span>
              </div>
              {!isSeasonFullyWatched && episodes.length > 0 && (
                <Button
                  size="sm"
                  variant="outline"
                  className="w-full text-xs h-8 border-primary/20 hover:bg-primary/10 text-primary"
                  onClick={markEntireSeasonWatched}
                >
                  Marcar toda la temporada como vista
                </Button>
              )}
              {isSeasonFullyWatched && (
                <Button
                  size="sm"
                  variant="outline"
                  className="w-full text-xs h-8 border-primary/20 hover:bg-primary/10 text-primary mt-2"
                  onClick={markEntireSeasonWatched}
                >
                  Ver toda la temporada de nuevo (+1)
                </Button>
              )}
            </div>
          )}

          {episodes.length === 0 && loading ? (
            <div className="p-8 text-center text-muted-foreground">
              Cargando episodios...
            </div>
          ) : episodes.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground">
              No hay episodios disponibles
            </div>
          ) : (
            <div className="divide-y">
              {episodes.map((episode) => {
                const watchedData = getWatchedEpisodeData(
                  episode.episodeNumber
                );
                const isWatched = !!watchedData;
                const count = watchedData?.count || (isWatched ? 1 : 0);

                return (
                  <Card
                    key={episode.id}
                    className={`border-0 rounded-none bg-transparent hover:bg-muted/30 transition-colors ${
                      isWatched ? "opacity-90" : ""
                    }`}
                  >
                    <div className="p-4 flex gap-4">
                      {user && (
                        <div className="flex flex-col items-center gap-2 pt-1">
                          <Checkbox
                            checked={isWatched}
                            onCheckedChange={() =>
                              toggleEpisodeWatched(episode.episodeNumber)
                            }
                            className="mt-1"
                          />
                          {isWatched && (
                            <div className="flex flex-col items-center">
                              <span className="text-[10px] text-muted-foreground font-mono">
                                x{count}
                              </span>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-5 w-5 rounded-full hover:bg-muted"
                                onClick={() =>
                                  toggleEpisodeWatched(
                                    episode.episodeNumber,
                                    true
                                  )
                                }
                                title="Ver otra vez (+1)"
                              >
                                <Plus className="h-3 w-3" />
                              </Button>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Episode image */}
                      {episode.primaryImage && (
                        <div className="shrink-0 w-32 h-20 rounded-md overflow-hidden bg-muted">
                          <img
                            src={episode.primaryImage.url}
                            alt={episode.title}
                            className="w-full h-full object-cover"
                          />
                        </div>
                      )}

                      {/* Episode info */}
                      <div className="flex-1 space-y-2">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <h4
                              className={`font-semibold text-sm ${
                                isWatched
                                  ? "line-through text-muted-foreground"
                                  : ""
                              }`}
                            >
                              {episode.episodeNumber}. {episode.title}
                            </h4>
                            <p className="text-xs text-muted-foreground line-clamp-2 mt-1">
                              {episode.plot}
                            </p>
                          </div>
                          {episode.rating &&
                            episode.rating.aggregateRating > 0 && (
                              <Badge
                                variant="secondary"
                                className="gap-1 shrink-0"
                              >
                                <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                                {episode.rating.aggregateRating.toFixed(1)}
                              </Badge>
                            )}
                        </div>

                        <div className="flex items-center gap-4 text-xs text-muted-foreground">
                          {episode.releaseDate && (
                            <span className="flex items-center gap-1">
                              <Calendar className="w-3 h-3" />
                              {formatDate(episode.releaseDate)}
                            </span>
                          )}
                          {episode.runtimeSeconds > 0 && (
                            <span className="flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {formatRuntime(episode.runtimeSeconds)}
                            </span>
                          )}
                          {isWatched && (
                            <Badge
                              variant="default"
                              className="bg-green-600 text-xs"
                            >
                              Visto {count > 1 ? `(${count})` : ""}
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  </Card>
                );
              })}

              {/* Load More Button */}
              {nextPageToken && (
                <div className="p-4 text-center">
                  <Button
                    variant="outline"
                    onClick={loadMoreEpisodes}
                    disabled={loading}
                    className="w-full"
                  >
                    {loading ? "Cargando..." : "Cargar más episodios"}
                  </Button>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
