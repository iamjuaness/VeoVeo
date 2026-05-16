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
  Clock,
  Loader2,
} from "lucide-react";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "../../../shared/components/ui/avatar";
import { Separator } from "../../../shared/components/ui/separator";
import type { MovieDetail } from "../../../interfaces/MovieDetail";
import type { Movie } from "../../../interfaces/Movie";
import { getMovieDetailById } from "../services/imdb";
import { Link, useParams } from "react-router-dom";
import { Theme } from "../../../shared/components/layout/Theme";
import { ModalLogin } from "../../auth/components/ModalLogin";
import { ModalRegister } from "../../auth/components/ModalRegister";
import { Hamburger } from "../../../shared/components/layout/Hamburguer";
import { UserMenu } from "../../auth/components/UserMenu";
import { useAuth } from "../../auth/hooks/useAuth";
import { ThemeContext } from "../../../core/providers/ThemeContext";
import { useMovies } from "../context/MoviesContext";
import { RecommendModal } from "../../social/components/RecommendModal";
import { useSocial } from "../../social/context/SocialContext";
import { DetailSkeleton } from "../../../shared/components/ui/DetailSkeleton";
import { ReviewSection } from "../../social/components/reviews/ReviewSection";
import { AddToListModal } from "../../social/components/lists/AddToListModal";
import { ListPlus as ListPlusIcon } from "lucide-react";

export default function MovieDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showRegisterModal, setShowRegisterModal] = useState(false);
  const { user, setUser, logout, accessToken } = useAuth();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const { isDarkMode, toggleTheme } = useContext(ThemeContext);
  const [showMobileMenu, setShowMobileMenu] = useState(false);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const {
    movies,
    moviesWatchedList,
    moviesWatchLaterList,
    searchResults,
    genreMovies,
    incrementWatchCount: incrementWatchCountContext,
    resetWatchCount: resetWatchCountContext,
    toggleWatchLater: toggleWatchLaterContext,
    processingMovies,
  } = useMovies();

  const movieFromContext =
    movies.find((m: Movie) => m.id === id) ||
    moviesWatchedList.find((m: Movie) => m.id === id) ||
    moviesWatchLaterList.find((m: Movie) => m.id === id) ||
    searchResults.find((m: Movie) => m.id === id) ||
    genreMovies.find((m: Movie) => m.id === id);

  const watchCount = movieFromContext?.watchCount ?? 0;
  const watchLater = movieFromContext?.watchLater ?? false;

  const [movie, setMovie] = useState<MovieDetail | null>(() => {
    if (!movieFromContext) return null;
    return {
      id: movieFromContext.id,
      type: movieFromContext.type || "movie",
      primaryTitle: movieFromContext.title,
      originalTitle: movieFromContext.title,
      primaryImage: {
        url: movieFromContext.poster || movieFromContext.backdrop || "",
        width: 0,
        height: 0,
      },
      startYear: movieFromContext.year,
      runtimeSeconds: movieFromContext.duration,
      genres: Array.isArray(movieFromContext.genres)
        ? movieFromContext.genres
        : [movieFromContext.genres],
      rating: {
        aggregateRating: movieFromContext.rating,
        voteCount: 0,
      },
      plot: movieFromContext.description,
      directors: [],
      writers: [],
      stars: [],
      originCountries: [],
      spokenLanguages: [],
      watchCount: movieFromContext.watchCount,
      watchLater: movieFromContext.watchLater,
    } as MovieDetail;
  });
  const [loading, setLoading] = useState(!movie);

  const [isRecommendModalOpen, setIsRecommendModalOpen] = useState(false);
  const [isAddToListModalOpen, setIsAddToListModalOpen] = useState(false);
  const { friends } = useSocial();

  useEffect(() => {
    async function fetchMovie() {
      if (!id || !accessToken) return;

      // Si no tenemos datos en el contexto, mostramos loading.
      // Si ya tenemos datos (movieFromContext), mantenemos la vista optimista mientras carga el detalle completo.
      if (!movieFromContext) {
        setLoading(true);
      }

      try {
        const data = await getMovieDetailById(id);
        setMovie(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    if (id) fetchMovie();
  }, [id, accessToken, movieFromContext]); // Dependencias actualizadas

  const incrementWatchCount = async (id: string) => {
    await incrementWatchCountContext(id);
    // Update local state for immediate feedback
    setMovie((prev) => {
      if (!prev) return null;
      return {
        ...prev,
        watchCount: (prev.watchCount || 0) + 1,
        watchLater: false,
      };
    });
  };

  const resetWatchCount = async (id: string) => {
    await resetWatchCountContext(id);
    setMovie((prev) => {
      if (!prev) return null;
      return { ...prev, watchCount: 0 };
    });
  };

  const toggleWatchLater = async (id: string) => {
    await toggleWatchLaterContext(id);
    setMovie((prev) => {
      if (!prev) return null;
      return {
        ...prev,
        watchLater: !prev.watchLater,
      };
    });
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
    return <DetailSkeleton />;
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
      <div className="relative h-[500px] md:h-[600px] lg:h-[700px] overflow-hidden">
        {/* Backdrop Image */}
        <div className="absolute inset-0">
          <img
            src={movie.primaryImage.url || "/placeholder.svg"}
            alt={movie.primaryTitle}
            className="w-full h-full object-cover blur-sm scale-110"
          />
          <div className="absolute inset-0 bg-linear-to-r from-black via-black/80 to-black/40" />
          <div className="absolute inset-0 bg-linear-to-t from-black via-black/50 to-transparent" />
        </div>

        {/* Botón Volver */}
        <div className="absolute top-6 left-6 z-20">
          <Link to="/">
            <Button
              variant="outline"
              size="lg"
              className="gap-2 bg-black/60 backdrop-blur-md border-white/30 text-white hover:bg-white hover:text-black transition-all hover:scale-105 shadow-xl"
            >
              <ArrowLeft className="w-5 h-5" />
              <span className="hidden sm:inline font-semibold">Volver</span>
            </Button>
          </Link>
        </div>
        {/* Movie Info Overlay */}
        <div className="absolute bottom-0 left-0 right-0 p-6 md:p-10 lg:p-12 z-10">
          <div className="container mx-auto">
            <div className="flex flex-col md:flex-row gap-8 items-end">
              {/* Poster */}
              <div className="shrink-0 mx-auto md:mx-0 hidden md:block group">
                <div className="relative">
                  <img
                    src={movie.primaryImage.url || "/placeholder.svg"}
                    alt={movie.primaryTitle}
                    width={250}
                    height={375}
                    className="rounded-2xl shadow-2xl object-cover border-4 border-white/10 group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute inset-0 rounded-2xl bg-linear-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
              </div>

              {/* Info */}
              <div className="flex-1 text-white">
                {/* Badges arriba con espaciado suficiente (y padding para móvil) */}
                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 mb-4 pt-10 sm:pt-0">
                  <Badge className="bg-yellow-500/90 hover:bg-yellow-600 text-black font-bold flex items-center gap-1 px-3 py-1.5 text-base backdrop-blur-sm">
                    <Star className="w-5 h-5 fill-current" />
                    {movie.rating.aggregateRating.toFixed(1)}
                  </Badge>

                  {movie.genres.map((genre) => (
                    <Badge
                      key={genre}
                      className="bg-white/20 hover:bg-white/30 text-white border-0 backdrop-blur-sm px-3 py-1"
                    >
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

                  {watchCount > 0 && (
                    <Badge className="bg-green-500/90 hover:bg-green-600 text-black backdrop-blur-md shadow-sm border-0 font-bold px-3 py-1">
                      <Eye className="w-4 h-4 mr-1.5" />
                      Vista {watchCount > 1 ? `(${watchCount}x)` : ""}
                    </Badge>
                  )}

                  {watchLater && (
                    <Badge className="bg-blue-500/90 hover:bg-blue-600 text-white backdrop-blur-md shadow-sm border-0 font-bold px-3 py-1">
                      <Clock className="w-4 h-4 mr-1.5" />
                      Pendiente
                    </Badge>
                  )}
                </div>

                <h1 className="text-3xl md:text-5xl lg:text-6xl font-extrabold mb-3 max-w-3xl leading-tight drop-shadow-2xl">
                  {movie.primaryTitle}
                </h1>

                {movie.originalTitle !== movie.primaryTitle && (
                  <p className="text-lg md:text-xl text-white/80 mb-4 italic max-w-2xl drop-shadow-lg">
                    {movie.originalTitle}
                  </p>
                )}

                <p className="text-base md:text-lg mb-8 text-white/90 max-w-3xl leading-relaxed drop-shadow-lg">
                  {movie.plot}
                </p>

                {/* Action Buttons */}
                <div className="flex flex-wrap gap-4">
                  <Button
                    variant="default"
                    size="lg"
                    onClick={() => incrementWatchCount(movie.id)}
                    disabled={processingMovies[movie.id]}
                    className={`gap-2 font-bold shadow-xl hover:scale-105 transition-all px-6 ${
                      watchCount && watchCount > 0
                        ? "bg-green-600 hover:bg-green-700"
                        : "bg-white text-black hover:bg-white/90"
                    }`}
                  >
                    {processingMovies[movie.id] ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      <Eye className="w-5 h-5" />
                    )}
                    {watchCount && watchCount > 0
                      ? `Vista (${watchCount})`
                      : "Marcar Vista"}
                  </Button>
                  {watchCount > 0 && watchLater !== true && (
                    <Button
                      variant="outline"
                      size="lg"
                      onClick={() => resetWatchCount(movie.id)}
                      disabled={processingMovies[movie.id]}
                      className="gap-2 bg-black/40 backdrop-blur-md border-white/30 text-white hover:bg-red-600 hover:border-red-600 transition-all shadow-xl"
                    >
                      {processingMovies[movie.id] ? (
                        <Loader2 className="w-5 h-5 animate-spin" />
                      ) : (
                        <EyeOff className="w-5 h-5" />
                      )}
                      Resetear
                    </Button>
                  )}
                  <Button
                    variant="outline"
                    size="lg"
                    onClick={() => toggleWatchLater(movie.id)}
                    className={`gap-2 backdrop-blur-md shadow-xl transition-all ${
                      watchLater
                        ? "bg-blue-600 border-blue-600 text-white hover:bg-blue-700"
                        : "bg-black/40 border-white/30 text-white hover:bg-white hover:text-black"
                    }`}
                    disabled={processingMovies[movie.id] || (watchCount ?? 0) > 0}
                  >
                    {processingMovies[movie.id] ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : watchLater ? (
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

                  {user && (
                    <Button
                      variant="outline"
                      size="lg"
                      onClick={() => setIsRecommendModalOpen(true)}
                      disabled={friends.length === 0}
                      className="gap-2 bg-primary/10 border-primary/20 text-primary hover:bg-primary hover:text-white transition-all shadow-xl font-bold"
                    >
                      <Star className="w-5 h-5" />
                      Recomendar
                    </Button>
                  )}

                  {user && (
                    <Button
                      variant="outline"
                      size="lg"
                      onClick={() => setIsAddToListModalOpen(true)}
                      className="gap-2 bg-purple-500/10 border-purple-500/20 text-purple-400 hover:bg-purple-500 hover:text-white transition-all shadow-xl font-bold"
                    >
                      <ListPlusIcon className="w-5 h-5" />
                      Listas
                    </Button>
                  )}
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
            <Card className="py-4 rounded-2xl shadow-lg bg-card/50 backdrop-blur-sm border-border/50 hover:shadow-xl transition-all">
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
            <Card className="py-4 rounded-2xl shadow-lg bg-card/50 backdrop-blur-sm border-border/50 hover:shadow-xl transition-all">
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

            {/* User Review Section */}
            <ReviewSection mediaId={movie.id} mediaType="movie" />
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Movie Stats */}
            <Card className="py-4 rounded-2xl shadow-lg bg-card/50 backdrop-blur-sm border-border/50 hover:shadow-xl transition-all">
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
            <Card className="py-4 rounded-2xl shadow-lg bg-card/50 backdrop-blur-sm border-border/50 hover:shadow-xl transition-all">
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

      <RecommendModal
        open={isRecommendModalOpen}
        onOpenChange={setIsRecommendModalOpen}
        mediaId={movie.id}
        mediaType="movie"
        mediaTitle={movie.primaryTitle}
        mediaPoster={movie.primaryImage?.url || ""}
      />

      <AddToListModal
        open={isAddToListModalOpen}
        onOpenChange={setIsAddToListModalOpen}
        mediaId={movie.id}
        mediaType="movie"
        mediaTitle={movie.primaryTitle}
        mediaPoster={movie.primaryImage?.url || ""}
      />
    </div>
  );
}
