import {
  Activity,
  ArrowLeft,
  Award,
  BarChart3,
  Calendar,
  Clock,
  Eye,
  PieChart,
  Star,
  TrendingUp,
} from "lucide-react";
import { Button } from "../components/ui/button";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardDescription,
} from "../components/ui/card";
import { Progress } from "../components/ui/progress";
import { Badge } from "../components/ui/badge";
import { useMovies } from "../context/MoviesContext";
import { Link } from "react-router-dom";
import { UserMenu } from "../components/UserMenu";
import { useMemo, useState } from "react";
import { FullScreenLoader } from "../components/Loader";

export default function StatsPage() {
  const { totalResults } = useMovies();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const { moviesWatchedList, moviesWatchLaterList, statsLoading } = useMovies();

  // Calcular estadísticas
  const stats = useMemo(() => {
    const totalSeconds = moviesWatchedList.reduce((acc, movie) => {
      return acc + (movie.duration ?? 0);
    }, 0);

    const totalMinutes = Math.floor(totalSeconds / 60);
    const totalHours = Math.floor(totalMinutes / 60);
    const remainingMinutes = totalMinutes % 60;
    const genreCountMap: Record<string, number> = {};

    // Contar solo el primer género de cada película
    moviesWatchedList.forEach((movie) => {
      const firstGenre =
        movie.genres && movie.genres.length > 0 ? movie.genres[0] : null;
      if (firstGenre) {
        genreCountMap[firstGenre] = (genreCountMap[firstGenre] || 0) + 1;
      }
    });

    const topGenres = Object.entries(genreCountMap)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 6);

    // Películas más vistas
    const mostWatchedMovies = moviesWatchedList
      .filter((m) => m.watchCount > 0)
      .sort((a, b) => b.watchCount - a.watchCount)
      .slice(0, 10);

    // Décadas más vistas
    const decadeStats = moviesWatchedList.reduce((acc, movie) => {
      const decade = Math.floor(movie.year / 10) * 10;
      acc[decade] = (acc[decade] || 0) + 1; // Incrementa solo 1 por película
      return acc;
    }, {} as Record<number, number>);

    const topDecades = Object.entries(decadeStats)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5);

    return {
      totalMovies: totalResults,
      watchedMovies: moviesWatchedList.length,
      totalSeconds,
      totalMinutes,
      totalHours,
      remainingMinutes,
      averageRating:
        moviesWatchedList.reduce((acc, m) => acc + m.rating, 0) /
          moviesWatchedList.length || 0,
      topGenres,
      mostWatchedMovies,
      topDecades,
      watchLaterCount: moviesWatchLaterList.length,
      completionRate: (moviesWatchedList.length / totalResults) * 100,
    };
  }, [moviesWatchLaterList, moviesWatchedList, totalResults]);

  if (statsLoading) {
    return <FullScreenLoader message="Estamos preparando tus estadísticas 😊" />;
  }
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 border-b bg-card">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center gap-4">
            <Link to="/">
              <Button
                variant="outline"
                size="sm"
                className="gap-2 bg-transparent"
              >
                <ArrowLeft className="w-4 h-4" />
                Volver
              </Button>
            </Link>
            <div>
              <h1 className="text-xl font-bold">📊 Mis Estadísticas</h1>
              <p className="text-muted-foreground text-[12px]">
                Análisis detallado de tu actividad cinematográfica
              </p>
            </div>
          </div>
        </div>
        {/* UserMenu afuera y posicionado */}
        <div className="fixed right-4 top-6 z-50">
          <UserMenu open={showUserMenu} setOpen={setShowUserMenu} />
        </div>
      </header>

      <main className="container mx-auto px-4 pt-28 pb-8">
        <div>
          {/* Estadísticas generales */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 mt-1">
                <CardTitle className="text-sm font-medium">
                  Películas Vistas
                </CardTitle>
                <Eye className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">
                  {stats.watchedMovies.toLocaleString("es-ES")}
                </div>
                <p className="text-xs text-muted-foreground">
                  de {stats.totalMovies.toLocaleString("es-ES")} total (
                  {stats.completionRate.toFixed(2)}
                  %)
                </p>
                <Progress value={stats.completionRate} className="mt-2" />
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 mt-1">
                <CardTitle className="text-sm font-medium">
                  Tiempo Total
                </CardTitle>
                <Clock className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-600">
                  {stats.totalHours}h {stats.remainingMinutes}m
                </div>
                <p className="text-xs text-muted-foreground">
                  {Math.floor(stats.totalHours / 24)} días de contenido
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 mt-1">
                <CardTitle className="text-sm font-medium">
                  Rating Promedio
                </CardTitle>
                <Star className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-yellow-600">
                  {stats.averageRating.toFixed(1)}
                </div>
                <p className="text-xs text-muted-foreground">
                  Calidad de tu selección
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 mt-1">
                <CardTitle className="text-sm font-medium">
                  Ver Después
                </CardTitle>
                <Calendar className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-purple-600">
                  {stats.watchLaterCount}
                </div>
                <p className="text-xs text-muted-foreground">
                  En tu lista de pendientes
                </p>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-8">
            {/* Primera fila - Géneros y Películas más vistas */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Géneros más vistos */}
              <Card>
                <CardHeader className="mt-1">
                  <CardTitle className="flex items-center gap-2 pt-2">
                    <PieChart className="w-5 h-5" />
                    Géneros Más Vistos
                  </CardTitle>
                  <CardDescription>
                    Tus preferencias por categoría
                  </CardDescription>
                </CardHeader>
                <CardContent className="mb-5">
                  <div
                    className={`space-y-4 ${
                      stats.topGenres.length > 4
                        ? "max-h-55 overflow-y-auto pr-2"
                        : ""
                    }`}
                  >
                    {stats.topGenres.map(([genre, count], index) => {
                      const percentage =
                        (count /
                          stats.topGenres.reduce((acc, [, c]) => acc + c, 0)) *
                        100;
                      return (
                        <div key={genre} className="space-y-2">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <Badge
                                variant="outline"
                                className="w-6 h-6 p-0 flex items-center justify-center text-xs"
                              >
                                {index + 1}
                              </Badge>
                              <span className="font-medium">{genre}</span>
                            </div>
                            <span className="text-sm text-muted-foreground">
                              {count} película{count > 1 ? "s" : ""}
                            </span>
                          </div>
                          <Progress value={percentage} className="h-2" />
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>

              {/* Películas más vistas */}
              <Card>
                <CardHeader className="mt-1">
                  <CardTitle className="flex items-center gap-2 pt-2">
                    <TrendingUp className="w-5 h-5" />
                    Películas Más Vistas
                  </CardTitle>
                  <CardDescription>
                    Tus favoritas de todos los tiempos
                  </CardDescription>
                </CardHeader>
                <CardContent className="mb-5">
                  <div
                    className={`space-y-4 ${
                      stats.mostWatchedMovies.length > 4
                        ? "max-h-55 overflow-y-auto pr-2"
                        : ""
                    }`}
                  >
                    {stats.mostWatchedMovies.map((movie, index) => (
                      <div key={movie.id} className="flex items-center gap-3">
                        <Badge
                          variant="outline"
                          className="w-6 h-6 p-0 flex items-center justify-center text-xs"
                        >
                          {index + 1}
                        </Badge>
                        <img
                          src={movie.poster || "/placeholder.svg"}
                          width={40}
                          height={60}
                          className="rounded object-cover"
                        />
                        <div className="flex-1 min-w-0">
                          <p className="font-medium truncate">{movie.title}</p>
                          <p className="text-sm text-muted-foreground">
                            {movie.year} • {movie.genres.join(", ")}
                          </p>
                        </div>
                        <div className="text-right">
                          <Badge className="bg-green-600">
                            <Eye className="w-3 h-3 mr-1" />
                            {movie.watchCount}x
                          </Badge>
                          <p className="text-xs text-muted-foreground mt-1">
                            ⭐ {movie.rating}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Segunda fila - Décadas favoritas */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <Card className="lg:col-span-1">
                <CardHeader className="mt-1">
                  <CardTitle className="flex items-center gap-2 pt-2">
                    <BarChart3 className="w-5 h-5" />
                    Décadas Favoritas
                  </CardTitle>
                  <CardDescription>
                    Épocas cinematográficas que más disfrutas
                  </CardDescription>
                </CardHeader>
                <CardContent className="mb-5">
                  <div
                    className={`space-y-4 ${
                      stats.topDecades.length > 4
                        ? "max-h-55 overflow-y-auto pr-2"
                        : ""
                    }`}
                  >
                    {stats.topDecades.map(([decade, count], index) => {
                      const percentage =
                        (count /
                          stats.topDecades.reduce((acc, [, c]) => acc + c, 0)) *
                        100;
                      return (
                        <div key={decade} className="space-y-2">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <Badge
                                variant="outline"
                                className="w-6 h-6 p-0 flex items-center justify-center text-xs"
                              >
                                {index + 1}
                              </Badge>
                              <span className="font-medium">{decade}s</span>
                            </div>
                            <span className="text-sm text-muted-foreground">
                              {count} visualización{count > 1 ? "es" : ""}
                            </span>
                          </div>
                          <Progress value={percentage} className="h-2" />
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>

              {/* Actividad reciente */}
              <Card className="lg:col-span-1">
                <CardHeader className="mt-1">
                  <CardTitle className="flex items-center gap-2 pt-2">
                    <Activity className="w-5 h-5" />
                    Actividad Reciente
                  </CardTitle>
                  <CardDescription>
                    Tu comportamiento cinematográfico
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4 mb-5">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">
                        Promedio por película
                      </span>
                      <span className="text-sm text-muted-foreground">
                        {(stats.totalMinutes / stats.watchedMovies).toFixed(1)}
                        min
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">
                        Película más larga vista
                      </span>
                      <span className="text-sm text-muted-foreground">
                        {Math.max(
                          ...stats.mostWatchedMovies.map((m) => m.duration / 60)
                        )}
                        min
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">
                        Re-visualizaciones
                      </span>
                      <span className="text-sm text-muted-foreground">
                        {moviesWatchedList.reduce(
                          (acc, m) => acc + Math.max(0, m.watchCount - 1),
                          0
                        )}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">
                        Género favorito
                      </span>
                      <span className="text-sm text-muted-foreground">
                        {stats.topGenres[0]?.[0] || "N/A"}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">
                        Década favorita
                      </span>
                      <span className="text-sm text-muted-foreground">
                        {stats.topDecades[0]?.[0]}s
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Logros */}
              <Card className="lg:col-span-1">
                <CardHeader className="mt-1">
                  <CardTitle className="flex items-center gap-2 pt-2">
                    <Award className="w-5 h-5" />
                    Logros Desbloqueados
                  </CardTitle>
                  <CardDescription>Tus hitos cinematográficos</CardDescription>
                </CardHeader>
                <CardContent className="mb-5">
                  <div className="space-y-3">
                    {stats.watchedMovies >= 5 && (
                      <div className="flex items-center gap-3 p-3 rounded-lg bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800">
                        <div className="text-2xl">🎬</div>
                        <div>
                          <p className="font-medium text-green-800 dark:text-green-200">
                            Cinéfilo Principiante
                          </p>
                          <p className="text-xs text-green-600 dark:text-green-400">
                            5+ películas vistas
                          </p>
                        </div>
                      </div>
                    )}
                    {stats.totalHours >= 10 && (
                      <div className="flex items-center gap-3 p-3 rounded-lg bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800">
                        <div className="text-2xl">⏰</div>
                        <div>
                          <p className="font-medium text-blue-800 dark:text-blue-200">
                            Maratonista
                          </p>
                          <p className="text-xs text-blue-600 dark:text-blue-400">
                            10+ horas de contenido
                          </p>
                        </div>
                      </div>
                    )}
                    {stats.averageRating >= 8.5 && (
                      <div className="flex items-center gap-3 p-3 rounded-lg bg-yellow-50 dark:bg-yellow-950 border border-yellow-200 dark:border-yellow-800">
                        <div className="text-2xl">⭐</div>
                        <div>
                          <p className="font-medium text-yellow-800 dark:text-yellow-200">
                            Buen Gusto
                          </p>
                          <p className="text-xs text-yellow-600 dark:text-yellow-400">
                            Rating promedio 8.5+
                          </p>
                        </div>
                      </div>
                    )}
                    {moviesWatchedList.some((m) => m.watchCount >= 3) && (
                      <div className="flex items-center gap-3 p-3 rounded-lg bg-purple-50 dark:bg-purple-950 border border-purple-200 dark:border-purple-800">
                        <div className="text-2xl">🔄</div>
                        <div>
                          <p className="font-medium text-purple-800 dark:text-purple-200">
                            Fan Dedicado
                          </p>
                          <p className="text-xs text-purple-600 dark:text-purple-400">
                            3+ visualizaciones de una película
                          </p>
                        </div>
                      </div>
                    )}
                    {stats.watchedMovies < 5 &&
                      stats.totalHours < 10 &&
                      stats.averageRating < 8.5 &&
                      !moviesWatchedList.some((m) => m.watchCount >= 3) && (
                        <div className="text-center py-4">
                          <div className="text-4xl mb-2">🎯</div>
                          <p className="text-sm text-muted-foreground">
                            ¡Sigue viendo películas para desbloquear logros!
                          </p>
                        </div>
                      )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
