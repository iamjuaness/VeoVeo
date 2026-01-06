import { memo } from "react";
import { Card } from "../../../shared/components/ui/card";
import { Badge } from "../../../shared/components/ui/badge";
import { Eye, EyeOff, Clock, Star, Calendar, Tv } from "lucide-react";
import type { Series } from "../../../interfaces/Series";
import { Button } from "../../../shared/components/ui/button";
import type { User } from "../../../interfaces/User";

interface Props {
  series: Series;
  toggleWatchLater: (id: string) => void;
  markAsWatched?: (id: string) => void;
  resetWatched?: (id: string) => void;
  user: User | null;
  openLoginModal: () => void;
  watched?: boolean;
  inProgress?: boolean;
}

export const SeriesCard = memo(function SeriesCard({
  series,
  toggleWatchLater,
  markAsWatched,
  resetWatched,
  user,
  openLoginModal,
  watched = false,
  inProgress = false,
}: Props) {
  function handleToggleWatchLater(e: React.MouseEvent<HTMLButtonElement>) {
    e.stopPropagation();
    if (!user) {
      openLoginModal();
      return;
    }
    toggleWatchLater(series.id);
  }

  function handleMarkWatched(e: React.MouseEvent<HTMLButtonElement>) {
    e.stopPropagation();
    if (!user) {
      openLoginModal();
      return;
    }
    if (markAsWatched) {
      markAsWatched(series.id);
    }
  }

  function handleResetWatched(e: React.MouseEvent<HTMLButtonElement>) {
    e.stopPropagation();
    if (resetWatched) {
      resetWatched(series.id);
    }
  }

  return (
    <Card className="group relative overflow-hidden hover:shadow-xl transition-all duration-300 ease-out w-full h-full flex flex-col border-border/50 bg-card/50 backdrop-blur-sm hover:border-primary/50 will-change-transform">
      {/* Image container with aspect ratio 2:3 */}
      <div className="relative w-full aspect-2/3 overflow-hidden rounded-t-lg">
        <img
          src={
            series.poster && series.poster.trim() !== ""
              ? series.poster
              : "/placeholder.svg"
          }
          alt={series.title}
          className="object-cover w-full h-full transition-transform duration-500 group-hover:scale-105"
        />

        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-linear-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

        {/* Status badges */}
        <div className="absolute top-2 left-2 flex flex-col gap-1.5 z-10">
          {inProgress && !watched && (
            <Badge className="bg-yellow-500/90 hover:bg-yellow-600 text-white backdrop-blur-md shadow-sm border-0">
              <Tv className="w-3 h-3 mr-1.5" />
              En Progreso
            </Badge>
          )}
          {watched && (
            <Badge className="bg-green-500/90 hover:bg-green-600 text-white backdrop-blur-md shadow-sm border-0">
              <Eye className="w-3 h-3 mr-1.5" />
              Vista
            </Badge>
          )}
          {series.watchLater && (
            <Badge className="bg-blue-500/90 hover:bg-blue-600 text-white backdrop-blur-md shadow-sm border-0">
              <Clock className="w-3 h-3 mr-1.5" />
              Pendiente
            </Badge>
          )}
        </div>

        {/* Rating */}
        <div className="absolute top-2 right-2 z-10">
          <Badge
            variant="secondary"
            className="gap-1 bg-black/60 text-white backdrop-blur-md border-0"
          >
            <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
            {series.rating.toFixed(1)}
          </Badge>
        </div>
      </div>

      {/* Card content */}
      <div className="flex flex-col flex-1 p-3 sm:p-4 gap-2">
        <div className="space-y-1">
          <h3
            className="font-bold text-base leading-tight line-clamp-1 group-hover:text-primary transition-colors"
            title={series.title}
          >
            {series.title}
          </h3>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <Calendar className="w-3 h-3" /> {series.year}
              {series.endYear && ` - ${series.endYear}`}
            </span>
            <span>•</span>
            <span
              className="truncate max-w-[120px]"
              title={
                Array.isArray(series.genres)
                  ? series.genres.join(", ")
                  : series.genres
              }
            >
              {Array.isArray(series.genres) ? series.genres[0] : series.genres}
            </span>
          </div>
        </div>

        {/* Description (desktop only) */}
        <p className="hidden sm:block text-xs text-muted-foreground line-clamp-2 mt-1 flex-1">
          {series.description}
        </p>

        {/* Action buttons */}
        <div className="flex items-center gap-2 mt-auto pt-2">
          <Button
            variant={watched ? "default" : "secondary"}
            size="sm"
            onClick={handleMarkWatched}
            className={`flex-1 gap-1.5 h-8 text-xs font-medium transition-all ${
              watched ? "bg-green-600 hover:bg-green-700" : ""
            }`}
          >
            <Tv className="w-3.5 h-3.5" />
            {watched ? "Vista" : "Marcar Vista"}
          </Button>

          {watched && resetWatched && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleResetWatched}
              className="h-8 w-8 p-0 shrink-0 text-muted-foreground hover:text-destructive hover:border-destructive/50"
              title="Resetear"
            >
              <EyeOff className="w-3.5 h-3.5" />
            </Button>
          )}

          <Button
            variant={series.watchLater ? "default" : "outline"}
            size="sm"
            onClick={handleToggleWatchLater}
            disabled={watched}
            className={`h-8 w-8 p-0 shrink-0 transition-colors ${
              series.watchLater
                ? "bg-blue-600 hover:bg-blue-700 text-white"
                : ""
            }`}
            title={series.watchLater ? "Quitar de pendientes" : "Ver después"}
          >
            <Clock className="w-3.5 h-3.5" />
          </Button>
        </div>
      </div>
    </Card>
  );
});
