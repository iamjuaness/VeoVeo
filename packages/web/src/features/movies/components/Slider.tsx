import {
  ChevronLeft,
  ChevronRight,
  Star,
  Play,
  Eye,
  Clock,
} from "lucide-react";
import type { Movie } from "../../../interfaces/Movie";
import { Badge } from "../../../shared/components/ui/badge";
import { Button } from "../../../shared/components/ui/button";
import { useNavigate } from "react-router-dom";

interface SliderProps {
  featuredMovies: Movie[];
  currentSlide: number;
  prevSlide: () => void;
  nextSlide: () => void;
  goToSlide: (index: number) => void;
  toggleWatchLater: (id: number) => void;
}

export function Slider({
  featuredMovies,
  currentSlide,
  prevSlide,
  nextSlide,
  goToSlide,
}: SliderProps) {
  const navigate = useNavigate();

  return (
    <div className="relative mb-8 rounded-2xl overflow-hidden shadow-2xl group">
      <div className="relative h-72 md:h-96 lg:h-[450px]">
        {featuredMovies.map((movie, index) => (
          <div
            key={movie.id}
            className={`absolute inset-0 transition-all duration-700 ${
              index === currentSlide
                ? "opacity-100 scale-100"
                : "opacity-0 scale-105"
            }`}
          >
            <div
              className="relative h-full cursor-pointer"
              onClick={() =>
                navigate(`/movie/${featuredMovies[currentSlide].id}`)
              }
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  navigate(`/movie/${featuredMovies[currentSlide].id}`);
                }
              }}
            >
              <img
                src={movie.backdrop || "/placeholder.svg"}
                alt={movie.title}
                className="object-cover w-full h-full absolute inset-0 transition-transform duration-700 group-hover:scale-105"
                loading="lazy"
              />
              <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/40 to-transparent" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-transparent to-transparent" />

              <div className="absolute inset-0 flex flex-col justify-center items-start p-6 md:p-10 lg:p-12 pb-20 md:pb-24">
                <div className="max-w-3xl">
                  <div className="flex items-center gap-2 mb-4">
                    <Badge className="bg-yellow-500/90 hover:bg-yellow-600 text-black font-bold backdrop-blur-sm">
                      <Star className="w-4 h-4 mr-1 fill-current" />
                      {movie.rating.toFixed(1)}
                    </Badge>
                    <Badge
                      variant="secondary"
                      className="backdrop-blur-sm bg-white/20 text-white border-0"
                    >
                      {movie.genres[0]}
                    </Badge>
                    <Badge
                      variant="outline"
                      className="text-white border-white/50 backdrop-blur-sm"
                    >
                      {movie.year}
                    </Badge>

                    {movie.watchCount > 0 && (
                      <Badge className="bg-green-500/90 hover:bg-green-600 text-black font-bold backdrop-blur-sm">
                        <Eye className="w-4 h-4 mr-1" />
                        Vista{" "}
                        {movie.watchCount > 1 ? `(${movie.watchCount}x)` : ""}
                      </Badge>
                    )}

                    {movie.watchLater && (
                      <Badge className="bg-blue-500/90 hover:bg-blue-600 text-white font-bold backdrop-blur-sm">
                        <Clock className="w-4 h-4 mr-1" />
                        Pendiente
                      </Badge>
                    )}
                  </div>

                  <h2 className="text-3xl md:text-5xl lg:text-6xl font-extrabold text-white drop-shadow-2xl mb-4 leading-tight">
                    {movie.title}
                  </h2>

                  <p className="text-sm md:text-base text-white/90 mb-6 line-clamp-2 max-w-2xl drop-shadow-lg">
                    {movie.description}
                  </p>

                  <Button
                    size="lg"
                    className="gap-2 bg-white text-black hover:bg-white/90 font-bold shadow-xl hover:scale-105 transition-transform"
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate(`/movie/${featuredMovies[currentSlide].id}`);
                    }}
                  >
                    <Play className="w-5 h-5 fill-current" />
                    Ver Detalles
                  </Button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Controles del slider */}
      <Button
        variant="outline"
        size="icon"
        className="absolute left-4 top-1/2 -translate-y-1/2 bg-black/60 border-white/30 text-white hover:bg-black/80 backdrop-blur-md opacity-0 group-hover:opacity-100 transition-all hover:scale-110"
        onClick={prevSlide}
      >
        <ChevronLeft className="w-5 h-5" />
      </Button>
      <Button
        variant="outline"
        size="icon"
        className="absolute right-4 top-1/2 -translate-y-1/2 bg-black/60 border-white/30 text-white hover:bg-black/80 backdrop-blur-md opacity-0 group-hover:opacity-100 transition-all hover:scale-110"
        onClick={nextSlide}
      >
        <ChevronRight className="w-5 h-5" />
      </Button>

      {/* Indicadores */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-2">
        {featuredMovies.map((_, index) => (
          <button
            key={index}
            onClick={() => goToSlide(index)}
            className={`h-1.5 rounded-full transition-all ${
              index === currentSlide
                ? "bg-white w-10"
                : "bg-white/50 w-6 hover:bg-white/70"
            }`}
            aria-label={`Go to slide ${index + 1}`}
          />
        ))}
      </div>
    </div>
  );
}
