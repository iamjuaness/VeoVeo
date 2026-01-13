import { memo, useState } from "react";
import { Card } from "../../../shared/components/ui/card";
import { Badge } from "../../../shared/components/ui/badge";
import { Eye, EyeOff, Clock, Star, Calendar } from "lucide-react";
import type { Movie } from "../../../interfaces/Movie";
import { Button } from "../../../shared/components/ui/button";
import type { User } from "../../../interfaces/User";

interface Props {
  movie: Movie;
  incrementWatchCount: (id: string) => void;
  resetWatchCount: (id: string) => void;
  toggleWatchLater: (id: string) => void;
  user: User | null;
  openLoginModal: () => void;
}

export const MovieCard = memo(function MovieCard({
  movie,
  incrementWatchCount,
  resetWatchCount,
  toggleWatchLater,
  user,
  openLoginModal,
}: Props) {
  const [isLoaded, setIsLoaded] = useState(false);
  function handleIncrement(e: React.MouseEvent<HTMLButtonElement>) {
    e.stopPropagation();
    if (!user) {
      openLoginModal();
      return;
    }
    incrementWatchCount(movie.id);
  }

  function handleResetWatchCount(e: React.MouseEvent<HTMLButtonElement>) {
    e.stopPropagation();
    resetWatchCount(movie.id);
  }

  function handleToggleWatchLater(e: React.MouseEvent<HTMLButtonElement>) {
    e.stopPropagation();
    if (!user) {
      openLoginModal();
      return;
    }
    toggleWatchLater(movie.id);
  }

  return (
    <Card className="group relative overflow-hidden hover:shadow-xl transition-all duration-300 ease-out w-full h-full flex flex-col border-border/50 bg-card/50 backdrop-blur-sm hover:border-primary/50 will-change-transform">
      {/* 🔹 Contenedor de imagen con aspect ratio 2:3 */}
      <div className="relative w-full aspect-2/3 overflow-hidden rounded-t-lg">
        <img
          src={
            movie.poster && movie.poster.trim() !== ""
              ? movie.poster
              : "/placeholder.svg"
          }
          alt={movie.title}
          onLoad={() => setIsLoaded(true)}
          className={`object-cover w-full h-full transition-all duration-700 group-hover:scale-105 ${
            isLoaded ? "opacity-100" : "opacity-0"
          }`}
        />

        {/* Overlay gradiente para mejor legibilidad de badges */}
        <div className="absolute inset-0 bg-linear-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

        {/* Badges de estado */}
        <div className="absolute top-2 left-2 flex flex-col gap-1.5 z-10">
          {movie.watchCount > 0 && (
            <Badge className="bg-green-500/90 hover:bg-green-600 backdrop-blur-md shadow-sm border-0 text-gray-900">
              <Eye className="w-3 h-3 mr-1.5" />
              Vista {movie.watchCount > 1 ? `${movie.watchCount}x` : ""}
            </Badge>
          )}
          {movie.watchLater && (
            <Badge className="bg-blue-500/90 hover:bg-blue-600 text-gray-900 backdrop-blur-md shadow-sm border-0">
              <Clock className="w-3 h-3 mr-1.5" />
              Pendiente
            </Badge>
          )}
        </div>

        {/* Calificación */}
        <div className="absolute top-2 right-2 z-10">
          <Badge
            variant="secondary"
            className="gap-1 bg-black/60 text-white backdrop-blur-md border-0"
          >
            <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
            {movie.rating.toFixed(1)}
          </Badge>
        </div>
      </div>

      {/* 🔹 Contenido de la tarjeta */}
      <div className="flex flex-col flex-1 p-3 sm:p-4 gap-2">
        <div className="space-y-1">
          <h3
            className="font-bold text-base leading-tight line-clamp-1 group-hover:text-primary transition-colors"
            title={movie.title}
          >
            {movie.title}
          </h3>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <Calendar className="w-3 h-3" /> {movie.year}
            </span>
            <span>•</span>
            <span
              className="truncate max-w-[120px]"
              title={
                Array.isArray(movie.genres)
                  ? movie.genres.join(", ")
                  : movie.genres
              }
            >
              {Array.isArray(movie.genres) ? movie.genres[0] : movie.genres}
            </span>
          </div>
        </div>

        {/* Descripción */}
        <p className="text-[10px] sm:text-xs text-muted-foreground line-clamp-1 sm:line-clamp-2 mt-1 flex-1">
          {movie.description}
        </p>

        {/* 🔹 Botones de acción */}
        <div className="flex items-center gap-2 mt-auto pt-2">
          <Button
            variant={movie.watchCount > 0 ? "default" : "secondary"}
            size="sm"
            onClick={handleIncrement}
            className={`flex-1 gap-1.5 h-8 text-xs font-medium transition-all ${
              movie.watchCount > 0 ? "bg-green-600 hover:bg-green-700" : ""
            }`}
          >
            <Eye className="w-3.5 h-3.5" />
            {movie.watchCount > 0 ? "Visto" : "Ver"}
          </Button>

          {movie.watchCount > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleResetWatchCount}
              className="h-8 w-8 p-0 shrink-0 text-muted-foreground hover:text-destructive hover:border-destructive/50"
              title="Resetear"
            >
              <EyeOff className="w-3.5 h-3.5" />
            </Button>
          )}

          <Button
            variant={movie.watchLater ? "default" : "outline"}
            size="sm"
            onClick={handleToggleWatchLater}
            disabled={movie.watchCount > 0}
            className={`h-8 w-8 p-0 shrink-0 transition-colors ${
              movie.watchLater ? "bg-blue-600 hover:bg-blue-700 text-white" : ""
            }`}
            title={movie.watchLater ? "Quitar de pendientes" : "Ver después"}
          >
            <Clock className="w-3.5 h-3.5" />
          </Button>
        </div>
      </div>
    </Card>
  );
});
