import { useState, useMemo, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Search, Eye, EyeOff, Clock, Star, Calendar } from "lucide-react"
import type { Movie } from "../interfaces/Movie"


// Base de datos simulada de películas
const initialMovies: Movie[] = [
  {
    id: 1,
    title: "El Padrino",
    year: 1972,
    genre: "Drama",
    rating: 9.2,
    description: "La historia de una familia de la mafia italiana en Nueva York.",
    poster: "https://www.infobae.com/new-resizer/hiIfl67IpVcJFdCYJpJOoaGgStE=/arc-anglerfish-arc2-prod-infobae/public/Z7TNUJTHKJESBNNHCEGLCMKLWA.jfif",
    watchCount: 0, // Cambiar watched: false por watchCount: 0
    watchLater: false,
  },
  {
    id: 2,
    title: "Pulp Fiction",
    year: 1994,
    genre: "Crimen",
    rating: 8.9,
    description: "Historias entrelazadas de crimen en Los Ángeles.",
    poster: "https://musicart.xboxlive.com/7/292c0b00-0000-0000-0000-000000000002/504/image.jpg",
    watchCount: 2, // Cambiar watched: true por watchCount: 2
    watchLater: false,
  },
  {
    id: 3,
    title: "El Señor de los Anillos",
    year: 2001,
    genre: "Fantasía",
    rating: 8.8,
    description: "Un hobbit debe destruir un anillo mágico para salvar la Tierra Media.",
    poster: "https://es.web.img2.acsta.net/c_310_420/medias/nmedia/18/89/67/45/20061512.jpg",
    watchCount: 0, // Cambiar watched: false por watchCount: 0
    watchLater: true,
  },
  {
    id: 4,
    title: "Inception",
    year: 2010,
    genre: "Ciencia Ficción",
    rating: 8.7,
    description: "Un ladrón que roba secretos del subconsciente durante el sueño.",
    poster: "https://m.media-amazon.com/images/M/MV5BMjAxMzY3NjcxNF5BMl5BanBnXkFtZTcwNTI5OTM0Mw@@._V1_.jpg",
    watchCount: 0, // Cambiar watched: false por watchCount: 0
    watchLater: false,
  },
  {
    id: 5,
    title: "Forrest Gump",
    year: 1994,
    genre: "Drama",
    rating: 8.8,
    description: "La vida extraordinaria de un hombre con discapacidad intelectual.",
    poster: "https://m.media-amazon.com/images/S/pv-target-images/9fe3eef6b0b80d9440cccaf618c2b7785a433b96a7812bb4e8e18945b4e7a231.jpg",
    watchCount: 1, // Cambiar watched: true por watchCount: 1
    watchLater: false,
  },
  {
    id: 6,
    title: "Matrix",
    year: 1999,
    genre: "Ciencia Ficción",
    rating: 8.7,
    description: "Un programador descubre que la realidad es una simulación.",
    poster: "https://m.media-amazon.com/images/M/MV5BN2NmN2VhMTQtMDNiOS00NDlhLTliMjgtODE2ZTY0ODQyNDRhXkEyXkFqcGc@._V1_FMjpg_UX1000_.jpg",
    watchCount: 0, // Cambiar watched: false por watchCount: 0
    watchLater: true,
  },
  {
    id: 7,
    title: "Titanic",
    year: 1997,
    genre: "Romance",
    rating: 7.9,
    description: "Una historia de amor a bordo del famoso barco condenado.",
    poster: "https://play-lh.googleusercontent.com/560-H8NVZRHk00g3RltRun4IGB-Ndl0I0iKy33D7EQ0cRRwH78-c46s90lZ1ho_F1so=w240-h480-rw",
    watchCount: 3, // Cambiar watched: true por watchCount: 3
    watchLater: false,
  },
  {
    id: 8,
    title: "Gladiador",
    year: 2000,
    genre: "Acción",
    rating: 8.5,
    description: "Un general romano busca venganza contra el emperador corrupto.",
    poster: "https://es.web.img3.acsta.net/medias/nmedia/18/70/92/02/20149073.jpg",
    watchCount: 0, // Cambiar watched: false por watchCount: 0
    watchLater: false,
  },
]

export default function MovieTracker() {
  const [movies, setMovies] = useState<Movie[]>(initialMovies)
  const [searchTerm, setSearchTerm] = useState("")
  const [filterStatus, setFilterStatus] = useState<"all" | "watched" | "watchLater">("all")
  const [currentPage, setCurrentPage] = useState(1)
  const moviesPerPage = 25

  // Filtrar películas basado en búsqueda y estado
  const filteredMovies = useMemo(() => {
    let filtered = movies.filter(
      (movie) =>
        movie.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        movie.genre.toLowerCase().includes(searchTerm.toLowerCase()),
    )

    if (filterStatus === "watched") {
      filtered = filtered.filter((movie) => movie.watchCount > 0)
    } else if (filterStatus === "watchLater") {
      filtered = filtered.filter((movie) => movie.watchLater)
    }

    return filtered
  }, [movies, searchTerm, filterStatus])

  // Calcular paginación
  const totalPages = Math.ceil(filteredMovies.length / moviesPerPage)
  const startIndex = (currentPage - 1) * moviesPerPage
  const endIndex = startIndex + moviesPerPage
  const currentMovies = filteredMovies.slice(startIndex, endIndex)

  // Resetear página cuando cambien los filtros
  const resetPage = () => setCurrentPage(1)

  useEffect(() => {
    setCurrentPage(1)
  }, [searchTerm, filterStatus])

  // Incrementar contador de veces vista
  const incrementWatchCount = (id: number) => {
    setMovies(movies.map((movie) => (movie.id === id ? { ...movie, watchCount: movie.watchCount + 1 } : movie)))
  }

  // Resetear contador de veces vista
  const resetWatchCount = (id: number) => {
    setMovies(movies.map((movie) => (movie.id === id ? { ...movie, watchCount: 0 } : movie)))
  }

  // Toggle watchLater status
  const toggleWatchLater = (id: number) => {
    setMovies(movies.map((movie) => (movie.id === id ? { ...movie, watchLater: !movie.watchLater } : movie)))
  }

  // Estadísticas
  const stats = {
    total: movies.length,
    watched: movies.filter((m) => m.watchCount > 0).length, // Cambiar m.watched por m.watchCount > 0
    watchLater: movies.filter((m) => m.watchLater).length,
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-6">
          <h1 className="text-3xl font-bold text-center mb-6">🎬 Mi Colección de Películas</h1>

          {/* Estadísticas */}
          <div className="flex justify-center gap-6 mb-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-primary">{stats.total}</div>
              <div className="text-sm text-muted-foreground">Total</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{stats.watched}</div>
              <div className="text-sm text-muted-foreground">Vistas</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{stats.watchLater}</div>
              <div className="text-sm text-muted-foreground">Ver Después</div>
            </div>
          </div>

          {/* Barra de búsqueda */}
          <div className="max-w-md mx-auto mb-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                type="text"
                placeholder="Buscar películas por título o género..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          {/* Filtros */}
          <div className="flex justify-center gap-2 flex-wrap">
            <Button
              variant={filterStatus === "all" ? "default" : "outline"}
              size="sm"
              onClick={() => setFilterStatus("all")}
            >
              Todas ({stats.total})
            </Button>
            <Button
              variant={filterStatus === "watched" ? "default" : "outline"}
              size="sm"
              onClick={() => setFilterStatus("watched")}
              className="gap-1"
            >
              <Eye className="w-4 h-4" />
              Vistas ({stats.watched})
            </Button>
            <Button
              variant={filterStatus === "watchLater" ? "default" : "outline"}
              size="sm"
              onClick={() => setFilterStatus("watchLater")}
              className="gap-1"
            >
              <Clock className="w-4 h-4" />
              Ver Después ({stats.watchLater})
            </Button>
          </div>
        </div>
      </header>

      {/* Grid de películas */}
      <main className="container mx-auto px-4 py-8">
        {currentMovies.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">🔍</div>
            <h3 className="text-xl font-semibold mb-2">No se encontraron películas</h3>
            <p className="text-muted-foreground">
              {searchTerm ? `No hay resultados para "${searchTerm}"` : "No hay películas en esta categoría"}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {currentMovies.map((movie) => (
              <Card key={movie.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                <div className="relative">
                  <img src={movie.poster || "/placeholder.svg"} alt={movie.title} className="w-full h-100 object-cover rounded-t-sm" />


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

                  {/* Rating */}
                  <div className="absolute top-2 right-2">
                    <Badge variant="secondary" className="gap-1">
                      <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                      {movie.rating}
                    </Badge>
                  </div>
                </div>

                <CardHeader className="pb-2">
                  <CardTitle className="text-lg line-clamp-1">{movie.title}</CardTitle>
                  <CardDescription className="flex items-center gap-2 text-sm">
                    <Calendar className="w-3 h-3" />
                    {movie.year} • {movie.genre}
                  </CardDescription>
                </CardHeader>

                <CardContent className="pt-0">
                  <p className="text-sm text-muted-foreground mb-4 line-clamp-2">{movie.description}</p>

                  {/* Botones de acción */}
                  <div className="flex gap-2">
                    <Button
                      variant={movie.watchCount > 0 ? "default" : "outline"}
                      size="sm"
                      onClick={() => incrementWatchCount(movie.id)}
                      className="flex-1 gap-1"
                    >
                      <Eye className="w-4 h-4" />
                      {movie.watchCount > 0 ? `Vista (${movie.watchCount})` : "Marcar Vista"}
                    </Button>

                    {movie.watchCount > 0 && (
                      <Button variant="outline" size="sm" onClick={() => resetWatchCount(movie.id)} className="gap-1">
                        <EyeOff className="w-4 h-4" />
                        Reset
                      </Button>
                    )}

                    <Button
                      variant={movie.watchLater ? "default" : "outline"}
                      size="sm"
                      onClick={() => toggleWatchLater(movie.id)}
                      className="gap-1"
                    >
                      <Clock className="w-4 h-4" />
                      {movie.watchLater ? "Quitar" : "Ver Después"}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
        {/* Paginación */}
        {totalPages > 1 && (
          <div className="flex justify-center items-center gap-2 mt-8">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1}
            >
              Anterior
            </Button>

            <div className="flex gap-1">
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                let pageNum
                if (totalPages <= 5) {
                  pageNum = i + 1
                } else if (currentPage <= 3) {
                  pageNum = i + 1
                } else if (currentPage >= totalPages - 2) {
                  pageNum = totalPages - 4 + i
                } else {
                  pageNum = currentPage - 2 + i
                }

                return (
                  <Button
                    key={pageNum}
                    variant={currentPage === pageNum ? "default" : "outline"}
                    size="sm"
                    onClick={() => setCurrentPage(pageNum)}
                    className="w-10"
                  >
                    {pageNum}
                  </Button>
                )
              })}
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
              disabled={currentPage === totalPages}
            >
              Siguiente
            </Button>

            <div className="ml-4 text-sm text-muted-foreground">
              Página {currentPage} de {totalPages} ({filteredMovies.length} películas)
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
