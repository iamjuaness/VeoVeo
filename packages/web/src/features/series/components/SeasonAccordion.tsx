import { useState, useEffect } from "react";
import { ChevronDown, ChevronUp, Calendar, Clock, Star } from "lucide-react";
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
} from "../services/series";
import { useAuth } from "../../auth/hooks/useAuth";

interface Props {
  seriesId: string;
  season: Season;
  seasonNumber: number;
  onProgressChange?: () => void;
}

interface WatchedEpisode {
  seasonNumber: number;
  episodeNumber: number;
  watchedAt: Date;
}

export function SeasonAccordion({
  seriesId,
  season,
  seasonNumber,
  onProgressChange,
}: Props) {
  const [isOpen, setIsOpen] = useState(false);
  const [episodes, setEpisodes] = useState<Episode[]>([]);
  const [loading, setLoading] = useState(false);
  const [watchedEpisodes, setWatchedEpisodes] = useState<WatchedEpisode[]>([]);
  const { user } = useAuth();

  useEffect(() => {
    if (isOpen && episodes.length === 0) {
      setLoading(true);
      getSeasonEpisodes(seriesId, season.season)
        .then((eps) => setEpisodes(eps))
        .catch((err) => console.error("Error loading episodes:", err))
        .finally(() => setLoading(false));
    }
  }, [isOpen, seriesId, season.season]);

  useEffect(() => {
    if (!user || !seriesId || !isOpen) return;

    getSeriesProgressApi(seriesId)
      .then((data) => {
        setWatchedEpisodes(data.episodes || []);
      })
      .catch((err) => console.error("Error loading progress:", err));
  }, [user, seriesId, isOpen]);

  const isEpisodeWatched = (episodeNumber: number) => {
    return watchedEpisodes.some(
      (ep) =>
        ep.seasonNumber === seasonNumber && ep.episodeNumber === episodeNumber
    );
  };

  const toggleEpisodeWatched = async (episodeNumber: number) => {
    if (!user || !seriesId) return;

    const isCurrentlyWatched = isEpisodeWatched(episodeNumber);

    // Optimistic update - update UI immediately
    if (isCurrentlyWatched) {
      // Remove from watched
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
      // Add to watched
      setWatchedEpisodes((prev) => [
        ...prev,
        {
          seasonNumber,
          episodeNumber,
          watchedAt: new Date(),
        },
      ]);
    }

    try {
      // Call API - trust optimistic update, don't overwrite state
      await toggleEpisodeWatchedApi({
        seriesId,
        seasonNumber,
        episodeNumber,
      });

      // Notify parent to check for completion
      if (onProgressChange) {
        onProgressChange();
      }
    } catch (err) {
      console.error("Error toggling episode:", err);
      // Revert on error only - refetch from server
      getSeriesProgressApi(seriesId)
        .then((data) => setWatchedEpisodes(data.episodes || []))
        .catch(() => {});
    }
  };

  const watchedCount = watchedEpisodes.filter(
    (ep) => ep.seasonNumber === seasonNumber
  ).length;
  const totalCount = season.episodeCount || episodes.length;
  const progress = totalCount > 0 ? (watchedCount / totalCount) * 100 : 0;

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
            {season.episodeCount} episodios
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
          {/* Progress Bar */}
          {user && totalCount > 0 && (
            <div className="p-4 bg-muted/10">
              <div className="flex items-center gap-3">
                <Progress value={progress} className="flex-1" />
                <span className="text-xs text-muted-foreground font-medium">
                  {Math.round(progress)}%
                </span>
              </div>
            </div>
          )}

          {loading ? (
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
                const watched = isEpisodeWatched(episode.episodeNumber);
                return (
                  <Card
                    key={episode.id}
                    className={`border-0 rounded-none bg-transparent hover:bg-muted/30 transition-colors ${
                      watched ? "opacity-70" : ""
                    }`}
                  >
                    <div className="p-4 flex gap-4">
                      {/* Checkbox */}
                      {user && (
                        <div className="flex items-start pt-1">
                          <Checkbox
                            checked={watched}
                            onCheckedChange={() =>
                              toggleEpisodeWatched(episode.episodeNumber)
                            }
                            className="mt-1"
                          />
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
                                watched ? "line-through" : ""
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
                          {watched && (
                            <Badge
                              variant="default"
                              className="bg-green-600 text-xs"
                            >
                              Visto
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
