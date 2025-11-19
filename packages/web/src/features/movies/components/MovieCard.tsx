import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../../../shared/components/ui/card";
import { Badge } from "../../../shared/components/ui/badge";
import { Eye, EyeOff, Clock, Star, Calendar } from "lucide-react";
import type { Movie } from "../../../interfaces/Movie";
import { Button } from "../../../shared/components/ui/button";
import type { User } from "../../../interfaces/User";
import GlareHover from "../../../shared/components/ui/glarehover";

interface Props {
  movie: Movie;
  incrementWatchCount: (id: string) => void;
  resetWatchCount: (id: string) => void;
  toggleWatchLater: (id: string) => void;
  user: User | null;
  openLoginModal: () => void;
}

export function MovieCard({
  movie,
  incrementWatchCount,
  resetWatchCount,
  toggleWatchLater,
  user,
  openLoginModal,
}: Props) {
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
    <Card className="overflow-hidden hover:shadow-lg transform hover:scale-102 transition-transform duration-300 ease-in-out w-72 md:w-80 lg:w-82 max-w-full p-2 sm:p-4">
      {/* 🔹 Contenedor fijo con aspect ratio 2:3 para uniformidad */}
      <div className="relative w-full aspect-[2/3]">
        <GlareHover
          glareColor="#ffffff"
          glareOpacity={0.3}
          glareAngle={-30}
          glareSize={300}
          transitionDuration={1000}
        >
          <img
            src={
              movie.poster && movie.poster.trim() !== ""
                ? movie.poster
                : "/placeholder.svg"
            }
            alt={movie.title}
            className="object-cover w-full h-full rounded-t-sm"
            style={{ backgroundColor: "#eee" }}
            width={300}
            height={450}
          />
        </GlareHover>

        {/* Badges de estado */}
        <div className="absolute top-2 left-2 flex flex-col gap-1">
          {movie.watchCount > 0 && (
            <Badge className="bg-green-600 hover:bg-green-700">
              <Eye className="w-3 h-3 mr-1" />
              Vista {movie.watchCount > 1 ? `${movie.watchCount}x` : ""}
            </Badge>
          )}
          {movie.watchLater && (
            <Badge className="bg-blue-600 hover:bg-blue-700">
              <Clock className="w-3 h-3 mr-1" />
              Ver Después
            </Badge>
          )}
        </div>

        {/* Calificación */}
        <div className="absolute top-2 right-2">
          <Badge variant="secondary" className="gap-1">
            <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
            {movie.rating}
          </Badge>
        </div>
      </div>

      {/* 🔹 Botones para móviles (debajo de la imagen) */}
      <div className="block sm:hidden px-1 py-2">
        {/* Título y año */}
        <div className="text-center mb-2 text-sm font-semibold line-clamp-1 truncate max-w-full px-2">
          {movie.title} ({movie.year})
        </div>

        <div className="flex flex-wrap gap-2 justify-center">
          <Button
            variant={movie.watchCount > 0 ? "default" : "outline"}
            size="sm"
            onClick={(e) => handleIncrement(e)}
            className="gap-1"
          >
            <Eye className="w-4 h-4" />
            {movie.watchCount > 0 ? `(${movie.watchCount})` : ""}
          </Button>

          {movie.watchCount > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={(e) => handleResetWatchCount(e)}
            >
              <EyeOff className="w-4 h-4" />
            </Button>
          )}

          <Button
            variant={movie.watchLater ? "default" : "outline"}
            size="sm"
            onClick={(e) => handleToggleWatchLater(e)}
            disabled={movie.watchCount > 0}
          >
            <Clock className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* 🔹 Info y botones para desktop */}
      <div className="hidden sm:block">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg line-clamp-1">{movie.title}</CardTitle>
          <CardDescription className="flex items-center gap-2 text-sm">
            <Calendar className="w-3 h-3" /> {movie.year} •{" "}
            {movie.genres[0] || "Desconocido"}
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-0">
          <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
            {movie.description}
          </p>
          <div className="flex flex-wrap gap-2 pb-3">
            <Button
              variant={movie.watchCount > 0 ? "default" : "outline"}
              size="sm"
              onClick={(e) => handleIncrement(e)}
              className="flex-1 gap-1"
              title="Marcar como vista"
            >
              <Eye className="w-4 h-4" />
              {movie.watchCount > 0 ? `(${movie.watchCount})` : ""}
            </Button>

            {movie.watchCount > 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={(e) => handleResetWatchCount(e)}
                className="min-w-[36px] px-2 py-1 text-xs"
                title="Restablecer contador de vistas"
              >
                <EyeOff className="w-4 h-4" />
              </Button>
            )}

            <Button
              variant={movie.watchLater ? "default" : "outline"}
              size="sm"
              onClick={(e) => handleToggleWatchLater(e)}
              disabled={movie.watchCount > 0}
              className="min-w-[48px] gap-1 text-xs px-2 py-1"
              title={
                movie.watchCount > 0
                  ? "Ya marcada como vista"
                  : movie.watchLater
                    ? "Quitar de lista de ver después"
                    : "Agregar a lista de ver después"
              }
            >
              <Clock className="w-4 h-4" />
              <span className="hidden xs:inline">
                {movie.watchLater ? "Quitar de Lista" : "Ver Después"}
              </span>
            </Button>
          </div>
        </CardContent>
      </div>
    </Card>
  );
}
