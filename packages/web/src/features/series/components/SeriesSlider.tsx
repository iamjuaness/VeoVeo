import { ChevronLeft, ChevronRight, Star, Play } from "lucide-react";
import type { Series } from "../../../interfaces/Series";
import { Badge } from "../../../shared/components/ui/badge";
import { Button } from "../../../shared/components/ui/button";
import { useNavigate } from "react-router-dom";

interface SliderProps {
  featuredSeries: Series[];
  currentSlide: number;
  prevSlide: () => void;
  nextSlide: () => void;
  goToSlide: (index: number) => void;
}

export function SeriesSlider({
  featuredSeries,
  currentSlide,
  prevSlide,
  nextSlide,
  goToSlide,
}: SliderProps) {
  const navigate = useNavigate();

  if (!featuredSeries || featuredSeries.length === 0) {
    return null;
  }

  return (
    <div
      className="relative mb-8 rounded-2xl overflow-hidden shadow-2xl group"
      role="region"
      aria-roledescription="carousel"
      aria-label="Series Destacadas"
    >
      <div className="relative h-72 md:h-96 lg:h-[450px]" aria-live="polite">
        {featuredSeries.map((series, index) => (
          <div
            key={series.id}
            className={`absolute inset-0 transition-all duration-700 ${
              index === currentSlide
                ? "opacity-100 scale-100 z-10"
                : "opacity-0 scale-105 z-0"
            }`}
            aria-hidden={index !== currentSlide}
            role="group"
            aria-roledescription="slide"
            aria-label={`${index + 1} de ${featuredSeries.length}: ${series.title}`}
          >
            <div
              className="relative h-full cursor-pointer"
              onClick={() =>
                navigate(`/series/${featuredSeries[currentSlide].id}`)
              }
              role="button"
              tabIndex={index === currentSlide ? 0 : -1}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  navigate(`/series/${featuredSeries[currentSlide].id}`);
                }
              }}
              aria-label={`Ver detalles de ${series.title}`}
            >
              <img
                src={series.backdrop || series.poster || "/placeholder.svg"}
                alt={series.title}
                className="object-cover w-full h-full absolute inset-0 transition-transform duration-700 group-hover:scale-105"
                loading="lazy"
              />
              <div className="absolute inset-0 bg-linear-to-r from-black/70 via-black/40 to-transparent" />
              <div className="absolute inset-0 bg-linear-to-t from-black/90 via-transparent to-transparent" />

              <div className="absolute inset-0 flex flex-col justify-center items-start p-6 md:p-10 lg:p-12 pb-20 md:pb-24">
                <div className="max-w-3xl">
                  <div className="flex items-center gap-2 mb-4">
                    <Badge className="bg-yellow-500/90 hover:bg-yellow-600 text-black font-bold backdrop-blur-sm">
                      <Star
                        className="w-4 h-4 mr-1 fill-current"
                        aria-hidden="true"
                      />
                      {series.rating.toFixed(1)}
                    </Badge>
                    {series.genres && series.genres[0] && (
                      <Badge
                        variant="secondary"
                        className="backdrop-blur-sm bg-white/20 text-white border-0"
                      >
                        {series.genres[0]}
                      </Badge>
                    )}
                    <Badge
                      variant="outline"
                      className="text-white border-white/50 backdrop-blur-sm"
                    >
                      {series.year}
                      {series.endYear && ` - ${series.endYear}`}
                    </Badge>
                  </div>

                  <h2 className="text-3xl md:text-5xl lg:text-6xl font-extrabold text-white drop-shadow-2xl mb-4 leading-tight">
                    {series.title}
                  </h2>

                  <p className="text-sm md:text-base text-white/90 mb-6 line-clamp-2 max-w-2xl drop-shadow-lg">
                    {series.description}
                  </p>

                  <Button
                    size="lg"
                    className="gap-2 bg-white text-black hover:bg-white/90 font-bold shadow-xl hover:scale-105 transition-transform"
                    tabIndex={index === currentSlide ? 0 : -1}
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate(`/series/${featuredSeries[currentSlide].id}`);
                    }}
                  >
                    <Play className="w-5 h-5 fill-current" aria-hidden="true" />
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
        className="absolute left-4 top-1/2 -translate-y-1/2 bg-black/60 border-white/30 text-white hover:bg-black/80 backdrop-blur-md opacity-0 group-hover:opacity-100 transition-all hover:scale-110 z-20"
        onClick={prevSlide}
        aria-label="Anterior serie"
      >
        <ChevronLeft className="w-5 h-5" aria-hidden="true" />
      </Button>
      <Button
        variant="outline"
        size="icon"
        className="absolute right-4 top-1/2 -translate-y-1/2 bg-black/60 border-white/30 text-white hover:bg-black/80 backdrop-blur-md opacity-0 group-hover:opacity-100 transition-all hover:scale-110 z-20"
        onClick={nextSlide}
        aria-label="Siguiente serie"
      >
        <ChevronRight className="w-5 h-5" aria-hidden="true" />
      </Button>

      {/* Indicadores */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-2 z-20">
        {featuredSeries.map((_, index) => (
          <button
            key={index}
            onClick={() => goToSlide(index)}
            className={`h-1.5 rounded-full transition-all ${
              index === currentSlide
                ? "bg-white w-10"
                : "bg-white/50 w-6 hover:bg-white/70"
            }`}
            aria-label={`Ir a la serie ${index + 1}`}
            aria-current={index === currentSlide ? "true" : "false"}
          />
        ))}
      </div>
    </div>
  );
}
