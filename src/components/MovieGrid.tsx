import { Movie } from "../interfaces/Movie"
import { MovieCard } from "./MovieCard"

interface Props {
  movies: Movie[]
  incrementWatchCount: (id: number) => void
  resetWatchCount: (id: number) => void
  toggleWatchLater: (id: number) => void
  searchTerm: string
}

export function MovieGrid({
  movies,
  incrementWatchCount,
  resetWatchCount,
  toggleWatchLater,
  searchTerm,
}: Props) {
  if (movies.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-6xl mb-4">🔍</div>
        <h3 className="text-xl font-semibold mb-2">No se encontraron películas</h3>
        <p className="text-muted-foreground">
          {searchTerm ? `No hay resultados para "${searchTerm}"` : "No hay películas en esta categoría"}
        </p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
      {movies.map((movie) => (
        <MovieCard
          key={movie.id}
          movie={movie}
          incrementWatchCount={incrementWatchCount}
          resetWatchCount={resetWatchCount}
          toggleWatchLater={toggleWatchLater}
        />
      ))}
    </div>
  )
}
