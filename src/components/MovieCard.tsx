import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card"
import { Badge } from "./ui/badge"
import { Eye, EyeOff, Clock, Star, Calendar } from "lucide-react"
import type { Movie } from "../interfaces/Movie"
import { Button } from "./ui/button"

interface Props {
  movie: Movie
  incrementWatchCount: (id: number) => void
  resetWatchCount: (id: number) => void
  toggleWatchLater: (id: number) => void
}

export function MovieCard({ movie, incrementWatchCount, resetWatchCount, toggleWatchLater }: Props) {
  return (
    <Card className="overflow-hidden hover:shadow-lg transition-shadow">
      <div className="relative">
        <img src={movie.poster || "/placeholder.svg"} alt={movie.title} className="object-cover rounded-t-sm" />
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
          <Calendar className="w-3 h-3" /> {movie.year} • {movie.genre}
        </CardDescription>
      </CardHeader>
      <CardContent className="pt-0">
        <p className="text-sm text-muted-foreground mb-4 line-clamp-2">{movie.description}</p>
        <div className="flex gap-2 pb-3">
          <Button variant={movie.watchCount > 0 ? "default" : "outline"} size="sm" onClick={() => incrementWatchCount(movie.id)} className="flex-1 gap-1">
            <Eye className="w-4 h-4" />
            {movie.watchCount > 0 ? `(${movie.watchCount})` : ""}
          </Button>
          {movie.watchCount > 0 && (
            <Button variant="outline" size="sm" onClick={() => resetWatchCount(movie.id)} className="gap-1">
              <EyeOff className="w-4 h-4" />
            </Button>
          )}
          <Button variant={movie.watchLater ? "default" : "outline"} size="sm" onClick={() => toggleWatchLater(movie.id)} className="gap-1">
            <Clock className="w-4 h-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
