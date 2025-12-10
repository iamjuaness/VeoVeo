import { useState, useEffect, useContext } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
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
  Star,
  Plus,
  Check,
  Globe,
  Users,
  Tv,
  Award,
  Eye,
  Loader2,
} from "lucide-react";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "../../../shared/components/ui/avatar";
import type { SeriesDetail } from "../../../interfaces/SeriesDetail";
import { getSeriesDetailById } from "../services/imdb";
import {
  toggleSeriesWatchLaterApi,
  markAllEpisodesWatchedApi,
  toggleSeriesCompletedApi,
  getSeriesProgressApi,
} from "../services/series";
import { useAuth } from "../../auth/hooks/useAuth";
import { useSeries } from "../context/SeriesContext";
import { SeasonAccordion } from "../components/SeasonAccordion";
import { Theme } from "../../../shared/components/layout/Theme";
import { ModalLogin } from "../../auth/components/ModalLogin";
import { ModalRegister } from "../../auth/components/ModalRegister";
import { Hamburger } from "../../../shared/components/layout/Hamburguer";
import { UserMenu } from "../../auth/components/UserMenu";
import { ThemeContext } from "../../../core/providers/ThemeContext";

export default function SeriesDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, setUser, logout } = useAuth();
  const {
    seriesWatchLaterList,
    setSeriesWatchLaterList,
    seriesWatchedList,
    setSeriesWatchedList,
  } = useSeries();
  const { isDarkMode, toggleTheme } = useContext(ThemeContext);

  const [series, setSeries] = useState<SeriesDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showRegisterModal, setShowRegisterModal] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);

  const isWatched = seriesWatchedList.some((s) => s.id === id);
  const watchLater = seriesWatchLaterList.some((s) => s.id === id);

  useEffect(() => {
    if (!id) return;

    const fetchSeries = async () => {
      try {
        const data = await getSeriesDetailById(id);
        setSeries(data);
      } catch (err) {
        console.error("Error fetching series:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchSeries();
  }, [id]);

  const toggleWatchLater = async () => {
    if (!user || !series) return;

    const newWatchLaterState = !watchLater;

    setSeriesWatchLaterList((prev) => {
      if (newWatchLaterState) {
        const newSeries = {
          id: series.id,
          type: series.type,
          title: series.primaryTitle,
          year: series.startYear,
          endYear: series.endYear,
          genres: series.genres,
          rating: series.rating.aggregateRating,
          description: series.plot,
          poster: series.primaryImage.url,
          backdrop: series.primaryImage.url,
          watchLater: true,
        };
        return [...prev, newSeries];
      } else {
        return prev.filter((s) => s.id !== id);
      }
    });

    await toggleSeriesWatchLaterApi({ seriesId: id! });
  };

  const markAsWatched = async () => {
    if (!user || !series) return;

    // Remove from watch later if it was there
    if (watchLater) {
      await toggleWatchLater();
    }

    // Add to watched list
    const seriesForList = {
      id: series.id,
      type: series.type,
      title: series.primaryTitle,
      year: series.startYear,
      endYear: series.endYear,
      genres: series.genres,
      rating: series.rating.aggregateRating,
      description: series.plot,
      poster: series.primaryImage.url,
      backdrop: series.primaryImage.url,
      watchLater: false,
    };

    setSeriesWatchedList((prev) => {
      const exists = prev.some((s) => s.id === id);
      if (exists) return prev;

      const updated = [...prev, seriesForList];
      localStorage.setItem("seriesWatched", JSON.stringify(updated));
      return updated;
    });

    // Mark all episodes as watched
    try {
      const seasons =
        series.seasons?.map((season: any) => ({
          seasonNumber: season.season,
          episodeCount: season.episodeCount || 0,
        })) || [];

      await markAllEpisodesWatchedApi({ seriesId: id!, seasons });
    } catch (err) {
      console.error("Error marking series as watched:", err);
    }
  };

  const handleLogout = () => {
    logout();
  };

  const handleProgressChange = async () => {
    if (!series || !user || !id) return;

    try {
      // 1. Get current progress from backend
      const progressData = await getSeriesProgressApi(id);

      // Check if response has correct structure
      if (!progressData || !progressData.episodes) return;

      const watchedCount =
        progressData.totalWatched || progressData.episodes.length;

      // 2. Calculate total episodes
      const totalEpisodes = (series.seasons || []).reduce(
        (acc, season) => acc + season.episodeCount,
        0
      );

      // 3. Compare and toggle completion status
      const isNowCompleted =
        watchedCount === totalEpisodes && totalEpisodes > 0;

      await toggleSeriesCompletedApi({
        seriesId: id,
        isCompleted: isNowCompleted,
      });
    } catch (error) {
      console.error("Error checking completion status:", error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-primary mx-auto mb-4" />
          <p>Cargando serie...</p>
        </div>
      </div>
    );
  }

  if (!series) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="text-4xl mb-4">😕</div>
          <h2 className="text-2xl font-bold mb-2">Serie no encontrada</h2>
          <p className="text-muted-foreground mb-4">
            La serie que buscas no existe o ha sido eliminada.
          </p>
          <Link to="/series">
            <Button>Volver a Series</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation Controls */}
      <div className="absolute top-6 right-4 z-50 flex items-center gap-2">
        {!user ? (
          <>
            <div className="hidden lg:flex gap-2">
              <Theme toggleTheme={toggleTheme} />
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
            src={series.primaryImage.url || "/placeholder.svg"}
            alt={series.primaryTitle}
            className="w-full h-full object-cover blur-sm scale-110"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-black via-black/80 to-black/40" />
          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent" />
        </div>

        {/* Back Button */}
        <div className="absolute top-6 left-6 z-20">
          <Link to="/series">
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

        {/* Series Info Overlay */}
        <div className="absolute bottom-0 left-0 right-0 p-6 md:p-10 lg:p-12 z-10">
          <div className="container mx-auto">
            <div className="flex flex-col md:flex-row gap-8 items-end">
              {/* Poster */}
              <div className="flex-shrink-0 mx-auto md:mx-0 hidden md:block group">
                <div className="relative">
                  <img
                    src={series.primaryImage.url || "/placeholder.svg"}
                    alt={series.primaryTitle}
                    width={250}
                    height={375}
                    className="rounded-2xl shadow-2xl object-cover border-4 border-white/10 group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute inset-0 rounded-2xl bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
              </div>

              {/* Info */}
              <div className="flex-1 text-white">
                {/* Badges */}
                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 mb-4 pt-10 sm:pt-0">
                  <Badge className="bg-yellow-500/90 hover:bg-yellow-600 text-black font-bold flex items-center gap-1 px-3 py-1.5 text-base backdrop-blur-sm">
                    <Star className="w-5 h-5 fill-current" />
                    {series.rating.aggregateRating.toFixed(1)}
                  </Badge>

                  {series.genres.map((genre) => (
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
                    {series.startYear}
                    {series.endYear && ` - ${series.endYear}`}
                  </Badge>

                  {isWatched && (
                    <Badge className="bg-green-500/90 hover:bg-green-600 text-white backdrop-blur-md shadow-sm border-0">
                      <Eye className="w-3 h-3 mr-1.5" />
                      Vista
                    </Badge>
                  )}
                </div>

                <h1 className="text-3xl md:text-5xl lg:text-6xl font-extrabold mb-3 max-w-3xl leading-tight drop-shadow-2xl">
                  {series.primaryTitle}
                </h1>

                {series.originalTitle !== series.primaryTitle && (
                  <p className="text-lg md:text-xl text-white/80 mb-4 italic max-w-2xl drop-shadow-lg">
                    {series.originalTitle}
                  </p>
                )}

                <p className="text-base md:text-lg mb-8 text-white/90 max-w-3xl leading-relaxed drop-shadow-lg">
                  {series.plot}
                </p>

                {/* Action Buttons */}
                <div className="flex flex-wrap gap-4">
                  <Button
                    variant="default"
                    size="lg"
                    onClick={markAsWatched}
                    disabled={!user || isWatched}
                    className={`gap-2 font-bold shadow-xl hover:scale-105 transition-all px-6 ${
                      isWatched
                        ? "bg-green-600 hover:bg-green-700"
                        : "bg-white text-black hover:bg-white/90"
                    }`}
                  >
                    <Tv className="w-5 h-5" />
                    {isWatched ? "Serie Vista" : "Marcar Vista"}
                  </Button>

                  <Button
                    variant="outline"
                    size="lg"
                    onClick={toggleWatchLater}
                    disabled={!user || isWatched}
                    className={`gap-2 backdrop-blur-md shadow-xl transition-all ${
                      watchLater
                        ? "bg-blue-600 border-blue-600 text-white hover:bg-blue-700"
                        : "bg-black/40 border-white/30 text-white hover:bg-white hover:text-black"
                    }`}
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
            {/* Seasons */}
            {series.seasons && series.seasons.length > 0 && (
              <Card className="py-4 rounded-2xl shadow-lg bg-card/50 backdrop-blur-sm border-border/50 hover:shadow-xl transition-all">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Tv className="w-5 h-5" />
                    Temporadas
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {series.seasons.map((season, index) => (
                    <SeasonAccordion
                      key={season.season}
                      seriesId={series.id}
                      season={season}
                      seasonNumber={index + 1}
                      onProgressChange={handleProgressChange}
                    />
                  ))}
                </CardContent>
              </Card>
            )}

            {/* Cast */}
            {series.stars && series.stars.length > 0 && (
              <Card className="py-4 rounded-2xl shadow-lg bg-card/50 backdrop-blur-sm border-border/50 hover:shadow-xl transition-all">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="w-5 h-5" />
                    Reparto Principal
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {series.stars.slice(0, 6).map((star) => (
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
                        <p className="font-medium text-sm">
                          {star.displayName}
                        </p>
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
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Series Stats */}
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
                      {series.rating.aggregateRating}
                    </span>
                    <span className="text-sm text-muted-foreground">
                      ({series.rating.voteCount.toLocaleString()} votos)
                    </span>
                  </div>
                </div>

                <div className="flex justify-between">
                  <span className="text-sm font-medium">Años</span>
                  <span>
                    {series.startYear}
                    {series.endYear && ` - ${series.endYear}`}
                  </span>
                </div>

                <div className="flex justify-between">
                  <span className="text-sm font-medium">Géneros</span>
                  <div className="flex flex-wrap gap-1 justify-end">
                    {series.genres.map((genre) => (
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

                {series.seasons && (
                  <div className="flex justify-between">
                    <span className="text-sm font-medium">Temporadas</span>
                    <span>{series.seasons.length}</span>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Countries & Languages */}
            <Card className="py-4 rounded-2xl shadow-lg bg-card/50 backdrop-blur-sm border-border/50 hover:shadow-xl transition-all">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Globe className="w-5 h-5" />
                  Origen
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {series.originCountries &&
                  series.originCountries.length > 0 && (
                    <div>
                      <h4 className="text-sm font-medium mb-2">Países</h4>
                      <div className="flex flex-wrap gap-1">
                        {series.originCountries.map((country) => (
                          <Badge key={country.code} variant="outline">
                            {country.name}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                {series.spokenLanguages &&
                  series.spokenLanguages.length > 0 && (
                    <div>
                      <h4 className="text-sm font-medium mb-2">Idiomas</h4>
                      <div className="flex flex-wrap gap-1">
                        {series.spokenLanguages.map((language) => (
                          <Badge key={language.code} variant="outline">
                            {language.name}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
