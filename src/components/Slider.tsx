import { ChevronLeft, ChevronRight, Star } from "lucide-react";
import type { Movie } from "../interfaces/Movie";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";

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
  return (
    <div className="relative mb-8 rounded-xl overflow-hidden">
      <div className="relative h-64 md:h-80 lg:h-96">
        {featuredMovies.map((movie, index) => (
          <div
            key={movie.id}
            className={`absolute inset-0 transition-opacity duration-500 ${
              index === currentSlide ? "opacity-100" : "opacity-0"
            }`}
          >
            <div className="relative h-full">
              <img
                src={movie.backdrop || "/placeholder.svg"}
                alt={movie.title}
                className="object-cover w-full h-full absolute inset-0"
                loading="lazy"
              />
              <div className="absolute inset-0 bg-gradient-to-r from-black/30 via-black/50 to-transparent" />
              <div className="absolute inset-0 flex">
                <div className="container mx-auto px-4 mt-3">
                  <div className="max-w-2xl text-white">
                    <div className="flex items-center gap-2 mb-2">
                      <Badge className="bg-yellow-600 hover:bg-yellow-700">
                        <Star className="w-3 h-3 mr-1 fill-current" />
                        {movie.rating}
                      </Badge>
                      <Badge variant="secondary">{movie.genres[0]}</Badge>
                      <Badge
                        variant="outline"
                        className="text-white border-white/50"
                      >
                        {movie.year}
                      </Badge>
                    </div>
                    <div className="flex gap-3"></div>
                  </div>
                </div>
                <div className="absolute bottom-0 left-0 w-full bg-gradient-to-t from-black/60 via-black/10 to-transparent px-6 py-8 lg:py-12">
                  <h2 className="text-2xl md:text-4xl lg:text-5xl font-bold text-white drop-shadow-sm">
                    {movie.title}
                  </h2>
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
        className="absolute left-4 top-1/2 -translate-y-1/2 bg-black/50 border-white/30 text-white hover:bg-black/70"
        onClick={prevSlide}
      >
        <ChevronLeft className="w-4 h-4" />
      </Button>
      <Button
        variant="outline"
        size="icon"
        className="absolute right-4 top-1/2 -translate-y-1/2 bg-black/50 border-white/30 text-white hover:bg-black/70"
        onClick={nextSlide}
      >
        <ChevronRight className="w-4 h-4" />
      </Button>

      {/* Indicadores */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
        {featuredMovies.map((_, index) => (
          <button
            key={index}
            onClick={() => goToSlide(index)}
            className={`w-2 h-2 rounded-full transition-all ${
              index === currentSlide ? "bg-white w-8" : "bg-white/50"
            }`}
          />
        ))}
      </div>
    </div>
  );
}
