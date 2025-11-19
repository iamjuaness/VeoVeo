import { useState, useEffect, useContext } from "react";
import { Button } from "../../../shared/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../../../shared/components/ui/card";
import { Badge } from "../../../shared/components/ui/badge";
import {
  ArrowLeft,
  Eye,
  EyeOff,
  Star,
  Plus,
  Check,
  Globe,
  Users,
  Film,
  Award,
  Timer,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "../../../shared/components/ui/avatar";
import { Separator } from "../../../shared/components/ui/separator";
import type { MovieDetail } from "../../../interfaces/MovieDetail";
import { getMovieDetailById, getMovieDurationById } from "../services/imdb";
import { Link, useParams } from "react-router-dom";
import { Theme } from "../../../shared/components/layout/Theme";
import { ModalLogin } from "../../auth/components/ModalLogin";
import { ModalRegister } from "../../auth/components/ModalRegister";
import { Hamburger } from "../../../shared/components/layout/Hamburguer";
import { UserMenu } from "../../auth/components/UserMenu";
import { useAuth } from "../../auth/hooks/useAuth";
import { ThemeContext } from "../../../core/providers/ThemeContext";
import { useMovies } from "../context/MoviesContext";
import {
  addOrIncrementWatched,
  resetWatched,
  toggleWatchLaterApi,
} from "../../../features/movies/services/movie";

export default function MovieDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [movie, setMovie] = useState<MovieDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showRegisterModal, setShowRegisterModal] = useState(false);
  const { user, setUser, logout, token } = useAuth();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const { isDarkMode, toggleTheme } = useContext(ThemeContext);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const { movies, setMovies, setMoviesWatchedList, setMoviesWatchLaterList } =
    useMovies();

  const movieFromContext = movies.find((m) => m.id === id);
  const watchCount = movieFromContext?.watchCount ?? 0;
  const watchLater = movieFromContext?.watchLater ?? false;

  useEffect(() => {
    async function fetchMovie() {
      if (!id || !token) return;
      setLoading(true);
      try {
        const data = await getMovieDetailById(id, token);
        setMovie(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    if (id) fetchMovie();
  }, [id, token]); // sólo cambia si cambia id o token

  const incrementWatchCount = async (id: string) => {
    const movieOriginal = movies.find((m) => m.id === id);

    // Sube el contador en la lista principal
    setMovies((movies) =>
      movies.map((movie) =>
        movie.id === id
          ? {
            ...movie,
            watchCount: (movie.watchCount ?? 0) + 1,
            watchLater: false,
          }
          : movie
      )
    );

    // Quita de por ver
    setMoviesWatchLaterList((prev) => {
      const filtered = prev.filter((movie) => movie.id !== id);
      localStorage.setItem("moviesWatchLater", JSON.stringify(filtered));
      return filtered;
    });

    // Información para la visualización
    const duration = await getMovieDurationById(id.toString()).then(
      (res) => res.duration
    );
    const watchedAtNew = new Date().toISOString();

    setMoviesWatchedList((prev) => {
      let found = false;
      const updated = prev.map((movie) => {
        if (movie.id === id) {
          found = true;
          return {
            ...movie,
            ...(movieOriginal || {}),
            watchCount: (movie.watchCount ?? 0) + 1,
            watchLater: false,
            duration,
            watchedAt: Array.isArray(movie.watchedAt)
              ? [...movie.watchedAt, watchedAtNew]
              : [watchedAtNew],
          };
        }
        return movie;
      });
      if (!found && movieOriginal) {
        updated.push({
          ...movieOriginal,
          watchCount: 1,
          watchLater: false,
          duration,
          watchedAt: [watchedAtNew],
        });
      }
      localStorage.setItem("moviesWatched", JSON.stringify(updated));
      return updated;
    });

    // Backend
    if (movieOriginal?.watchLater) {
      await toggleWatchLaterApi({ movieId: id.toString() });
    }
    await addOrIncrementWatched({
      movieId: id.toString(),
      duration,
      watchedAt: [watchedAtNew],
    });
  };

  const resetWatchCount = (id: string) => {
    setMovies((movies) =>
      movies.map((movie) =>
        movie.id === id ? { ...movie, watchCount: 0 } : movie
      )
    );

    setMoviesWatchedList((prev) => {
      const updated = prev.filter((movie) => movie.id !== id);
      localStorage.setItem("moviesWatched", JSON.stringify(updated)); // Guarda la lista actualizada
      return updated;
    });

    // Llamada al backend para resetear
    resetWatched({ movieId: id.toString() });
  };

  const toggleWatchLater = (id: string) => {
    const movieOriginal = movies.find((m) => m.id === id);

    setMovies((movies) =>
      movies.map((movie) =>
        movie.id === id ? { ...movie, watchLater: !movie.watchLater } : movie
      )
    );

    setMoviesWatchLaterList((prev) => {
      const exists = prev.some((m) => m.id === id);
      let updated;
      if (exists) {
        updated = prev.filter((movie) => movie.id !== id);
      } else {
        if (!movieOriginal) return prev;
        updated = [...prev, { ...movieOriginal, watchLater: true }];
      }
      localStorage.setItem("moviesWatchLater", JSON.stringify(updated)); // Guarda aquí
      return updated;
    });
    // Actualizar backend
    toggleWatchLaterApi({ movieId: id.toString() });
  };

  const formatRuntime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;
  };

  const handleLogout = () => {
    logout();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="text-4xl mb-4">🎬</div>
          <p>Cargando película...</p>
        </div>
      </div>
    );
  }

  if (!movie) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="text-4xl mb-4">😕</div>
          <h2 className="text-2xl font-bold mb-2">Película no encontrada</h2>
          <p className="text-muted-foreground mb-4">
            La película que buscas no existe o ha sido eliminada.
          </p>
          <Link to="/">
            <Button>Volver al inicio</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Controles de navegación */}
      <div className="absolute top-6 right-4 z-50 flex items-center gap-2">
        {/* Avatar/menú usuario */}
        {!user ? (
          <>
            {/* Botones de desktop (lg y superior) */}
            <div className="hidden lg:flex gap-2">
              <Theme toggleTheme={toggleTheme} />
              {/* Modal de Inicio de Sesión */}
              <ModalLogin
                open={showLoginModal}
                setOpen={setShowLoginModal}
                onLogin={setUser}
                openRegisterModal={() => setShowRegisterModal(true)}
              />
              <ModalRegister
                open={showRegisterModal}
                setOpen={setShowRegisterModal}
              />
            </div>

            {/* Menú hamburguesa para móviles (menor a lg) */}
            <Hamburger
              showLoginModal={showLoginModal}
              setShowLoginModal={setShowLoginModal}
              showRegisterModal={showRegisterModal}
              setShowRegisterModal={setShowRegisterModal}
              showMobileMenu={showMobileMenu}
              setShowMobileMenu={setShowMobileMenu}
              setUser={setUser}
              toggleTheme={toggleTheme}
              isDarkMode={isDarkMode}
              handleLogout={handleLogout}
            />
          </>
        ) : (
          <div className="fixed top-6 right-4 z-50 flex items-center gap-2">
            <UserMenu open={showUserMenu} setOpen={setShowUserMenu} />
          </div>
        )}
      </div>
      {/* Hero Section */}
      <div className="relative h-96 md:h-[500px] bg-gray-900">
        {/* Fondo sólido en lugar de imagen grande para poster */}
        <div className="absolute inset-0 bg-gradient-to-t from-gray-900 via-gray-900/80 to-transparent" />

        {/* Botón Volver */}
        <div className="absolute top-4 left-4 z-20">
          <Link to="/">
            <Button
              variant="outline"
              size="sm"
              className="gap-2 bg-black/50 border-white/30 text-white hover:bg-black/70 flex items-center"
            >
              <ArrowLeft className="w-4 h-4" />
              <span className="hidden sm:inline">Volver</span>
            </Button>
          </Link>
        </div>
        {/* Movie Info Overlay */}
        <div className="absolute bottom-0 left-0 right-0 p-6 md:p-8 bg-gradient-to-t from-black/90 via-black/70 to-transparent z-10">
          <div className="container mx-auto">
            <div className="flex flex-col md:flex-row gap-6">
              {/* Poster */}
              <div className="flex-shrink-0 mx-auto md:mx-0 hidden md:block">
                <img
                  src={movie.primaryImage.url || "/placeholder.svg"}
                  alt={movie.primaryTitle}
                  width={200}
                  height={300}
                  className="rounded-lg shadow-2xl object-cover"
                />
              </div>

              {/* Info */}
              <div className="flex-1 text-white p-4">
                {/* Badges arriba con espaciado suficiente (y padding para móvil) */}
                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 mb-3 pt-10 sm:pt-0">
                  <Badge className="bg-yellow-600 hover:bg-yellow-700 flex items-center gap-1">
                    <Star className="w-4 h-4 fill-current" />
                    {movie.rating.aggregateRating.toFixed(1)}
                  </Badge>

                  {movie.genres.map((genre) => (
                    <Badge key={genre} variant="secondary" className="text-xs">
                      {genre}
                    </Badge>
                  ))}

                  <Badge
                    variant="outline"
                    className="text-white border-white/50 text-xs flex items-center gap-1"
                  >
                    {movie.startYear}
                  </Badge>

                  <Badge
                    variant="outline"
                    className="text-white border-white/50 text-xs flex items-center gap-1"
                  >
                    <Timer className="w-4 h-4" />
                    {formatRuntime(movie.runtimeSeconds)}
                  </Badge>
                </div>

                <h1 className="text-xl md:text-5xl font-bold mb-2 max-w-xl leading-tight">
                  {movie.primaryTitle}
                </h1>

                {movie.originalTitle !== movie.primaryTitle && (
                  <p className="text-xl text-gray-300 mb-4 italic max-w-xl">
                    ({movie.originalTitle})
                  </p>
                )}

                <p className="text-sm md:text-xl mb-6 text-gray-200 max-w-3xl leading-relaxed">
                  {movie.plot}
                </p>

                {/* Action Buttons */}
                <div className="flex flex-wrap gap-3">
                  <Button
                    variant={
                      watchCount && watchCount > 0
                        ? "default"
                        : "outline"
                    }
                    size="lg"
                    onClick={() => incrementWatchCount(movie.id)}
                    className="gap-2 bg-white/10 border-white/30 text-white hover:bg-white/20"
                  >
                    <Eye className="w-5 h-5" />
                    {watchCount && watchCount > 0
                      ? `Vista (${watchCount})`
                      : "Marcar Vista"}
                  </Button>

                  {watchCount &&
                    watchCount > 0 &&
                    watchLater !== true && (
                      <Button
                        variant="outline"
                        size="lg"
                        onClick={() => resetWatchCount(movie.id)}
                        className="gap-2 bg-white/10 border-white/30 text-white hover:bg-white/20"
                      >
                        <EyeOff className="w-5 h-5" />
                        Reset
                      </Button>
                    )}
                  <Button
                    variant={watchLater ? "default" : "outline"}
                    size="lg"
                    onClick={() => toggleWatchLater(movie.id)}
                    className="gap-2 bg-white/10 border-white/30 text-white hover:bg-white/20"
                    disabled={(watchCount ?? 0) > 0}
                  >
                    {watchLater ? (
                      <>
                        <Check className="w-5 h-5" />
                        En Lista
                      </>
                    ) : (
                      <>
                        <Plus className="w-5 h-5" />
                        Ver Después
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Cast */}
            <Card className="py-4 rounded-lg shadow bg-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="w-5 h-5" />
                  Main Cast
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {movie.stars.slice(0, 6).map((star) => (
                    <div key={star.id} className="text-center">
                      <Avatar className="w-20 h-20 mx-auto mb-2">
                        <AvatarImage
                          src={star.primaryImage?.url || "/placeholder.svg"}
                          alt={star.displayName}
                          className="object-cover"
                        />
                        <AvatarFallback>
                          {star.displayName
                            .split(" ")
                            .map((n) => n[0])
                            .join("")}
                        </AvatarFallback>
                      </Avatar>
                      <p className="font-medium text-sm">{star.displayName}</p>
                      {star.primaryProfessions && (
                        <p className="text-xs text-muted-foreground capitalize">
                          {star.primaryProfessions[0]}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Crew */}
            <Card className="py-4 rounded-lg shadow bg-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Film className="w-5 h-5" />
                  Production team
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Directors */}
                <div>
                  <h4 className="font-semibold mb-3">Direction</h4>
                  <div className="flex flex-wrap gap-4">
                    {movie.directors.map((director) => (
                      <div
                        key={director.id}
                        className="flex items-center gap-3"
                      >
                        <Avatar className="w-12 h-12">
                          <AvatarImage
                            src={
                              director.primaryImage?.url || "/placeholder.svg"
                            }
                            alt={director.displayName}
                            className="object-cover"
                          />
                          <AvatarFallback>
                            {director.displayName
                              .split(" ")
                              .map((n) => n[0])
                              .join("")}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium">{director.displayName}</p>
                          <p className="text-sm text-muted-foreground">
                            Director
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <Separator />

                {/* Writers */}
                <div>
                  <h4 className="font-semibold mb-3">Script</h4>
                  <div className="flex flex-wrap gap-4">
                    {movie.writers.map((writer) => (
                      <div key={writer.id} className="flex items-center gap-3">
                        <Avatar className="w-12 h-12">
                          <AvatarImage
                            src={writer.primaryImage?.url || "/placeholder.svg"}
                            alt={writer.displayName}
                            className="object-cover"
                          />
                          <AvatarFallback>
                            {writer.displayName
                              .split(" ")
                              .map((n) => n[0])
                              .join("")}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium">{writer.displayName}</p>
                          <p className="text-sm text-muted-foreground">
                            Writer
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Movie Stats */}
            <Card className="py-4 rounded-lg shadow bg-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Award className="w-5 h-5" />
                  Información
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between">
                  <span className="text-sm font-medium">Rating</span>
                  <div className="flex items-center gap-1">
                    <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                    <span className="font-medium">
                      {movie.rating.aggregateRating}
                    </span>
                    <span className="text-sm text-muted-foreground">
                      ({movie.rating.voteCount.toLocaleString()} votos)
                    </span>
                  </div>
                </div>

                <div className="flex justify-between">
                  <span className="text-sm font-medium">Año</span>
                  <span>{movie.startYear}</span>
                </div>

                <div className="flex justify-between">
                  <span className="text-sm font-medium">Duración</span>
                  <span>{formatRuntime(movie.runtimeSeconds)}</span>
                </div>

                <div className="flex justify-between">
                  <span className="text-sm font-medium">Géneros</span>
                  <div className="flex flex-wrap gap-1 justify-end">
                    {movie.genres.map((genre) => (
                      <Badge
                        key={genre}
                        variant="secondary"
                        className="text-xs"
                      >
                        {genre}
                      </Badge>
                    ))}
                  </div>
                </div>

                {movie.watchCount !== undefined && movie.watchCount > 0 && (
                  <div className="flex justify-between">
                    <span className="text-sm font-medium">Veces vista</span>
                    <Badge className="bg-green-600">
                      <Eye className="w-3 h-3 mr-1" />
                      {movie.watchCount}x
                    </Badge>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Countries & Languages */}
            <Card className="py-4 rounded-lg shadow bg-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Globe className="w-5 h-5" />
                  Origin
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h4 className="text-sm font-medium mb-2">Países</h4>
                  <div className="flex flex-wrap gap-1">
                    {movie.originCountries.map((country) => (
                      <Badge key={country.code} variant="outline">
                        {country.name}
                      </Badge>
                    ))}
                  </div>
                </div>

                <div>
                  <h4 className="text-sm font-medium mb-2">Idiomas</h4>
                  <div className="flex flex-wrap gap-1">
                    {movie.spokenLanguages.map((language) => (
                      <Badge key={language.code} variant="outline">
                        {language.name}
                      </Badge>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
