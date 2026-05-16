import { useState, useMemo, useEffect, useRef, useContext } from "react";
import { Stats } from "../../stats/components/Stats";
import { SeriesSearchBar } from "../components/SeriesSearchBar";
import { SeriesFilters } from "../components/SeriesFilters";
import { SeriesCard } from "../components/SeriesCard";
import { SeriesSlider } from "../components/SeriesSlider";
import { ModalLogin } from "../../auth/components/ModalLogin";
import { ModalRegister } from "../../auth/components/ModalRegister";
import { UserMenu } from "../../auth/components/UserMenu";
import { Theme } from "../../../shared/components/layout/Theme";
import { Hamburger } from "../../../shared/components/layout/Hamburguer";
import { useNavigate } from "react-router-dom";
import { Button } from "../../../shared/components/ui/button";
import { useFilteredSeries } from "../hooks/useFilteredSeries";
import { useGenreSeries } from "../hooks/useGenreSeries";
import type { Genre } from "../../../shared/lib/genres";
import { movieGenres } from "../../../shared/lib/genres";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../../shared/components/ui/select";
import { Loader2, Search, LayoutGrid, Film, Tv, Filter, Star, ArrowUpDown } from "lucide-react";
import { VirtuosoGrid } from "react-virtuoso";
import { NotificationCenter } from "../../social/components/NotificationCenter";
import { useAuth } from "../../auth/hooks/useAuth";
import { useSeries } from "../context/SeriesContext";
import { ThemeContext } from "../../../core/providers/ThemeContext";
import { SliderSkeleton } from "../../movies/components/SliderSkeleton";
import { SeriesCardSkeleton } from "../components/SeriesCardSkeleton";


export default function SeriesTracker() {
  const {
    series,
    setSeries,
    setCurrentPage,
    totalResults,
    loading,
    hasMore,
    seriesWatchLaterList,
    seriesWatchedList,
    seriesInProgressList,
    searchTerm,
    setSearchTerm,
    activeSearchTerm,
    clearSearch,
    statsLoading,
    performSearch,
    searchResults,
    searchLoading,
    filterStatus,
    setFilterStatus,
    lastScrollPosition,
    setLastScrollPosition,
    markAsWatched,
    resetWatched,
    toggleWatchLater,
    searchError,
  } = useSeries();

  const [selectedGenres, setSelectedGenres] = useState<{
    all: Genre;
    watched: Genre;
    watchLater: Genre;
    inProgress: Genre;
  }>(() => {
    const saved = localStorage.getItem("seriesSelectedGenres");
    return saved
      ? JSON.parse(saved)
      : {
          all: "All",
          watched: "All",
          watchLater: "All",
          inProgress: "All",
        };
  });

  type RatingValue = "All" | 5 | 6 | 7 | 8 | 9 | 10;

  const [selectedRatings, setSelectedRatings] = useState<{
    all: RatingValue;
    watched: RatingValue;
    watchLater: RatingValue;
    inProgress: RatingValue;
  }>(() => {
    const saved = localStorage.getItem("seriesSelectedRatings");
    return saved
      ? JSON.parse(saved)
      : {
          all: "All",
          watched: "All",
          watchLater: "All",
          inProgress: "All",
        };
  });

  const [watchedOrder, setWatchedOrder] = useState<"asc" | "desc">("desc");

  const handleRatingChange = (value: string) => {
    const parsed = value === "All" ? "All" : (Number(value) as RatingValue);
    setSelectedRatings((prev) => ({
      ...prev,
      [filterStatus]: parsed,
    }));
  };

  const handleGenreChange = (genre: Genre) => {
    setSelectedGenres((prev) => ({
      ...prev,
      [filterStatus]: genre,
    }));

    if (genre === "All" && filterStatus === "all") {
      setCurrentPage(1);
    }
  };

  const { genreSeries, isLoadingGenre, errorGenre } =
    useGenreSeries(filterStatus === "all" ? selectedGenres[filterStatus] : "All");

  useEffect(() => {
    localStorage.setItem(
      "seriesSelectedGenres",
      JSON.stringify(selectedGenres)
    );
  }, [selectedGenres]);

  useEffect(() => {
    localStorage.setItem(
      "seriesSelectedRatings",
      JSON.stringify(selectedRatings)
    );
  }, [selectedRatings]);

  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showRegisterModal, setShowRegisterModal] = useState(false);
  const { user, setUser, logout } = useAuth();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const { isDarkMode, toggleTheme } = useContext(ThemeContext);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [showScrollSearch, setShowScrollSearch] = useState(false);
  const [showFloatingSearch, setShowFloatingSearch] = useState(false);
  const [currentSlide, setCurrentSlide] = useState(0);
  // Prevent Page Reset on Mount (Preserve Context State)
  const isMountedRef = useRef(false);
  const navigate = useNavigate();

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      setShowScrollSearch(currentScrollY > 700);

      const timer = setTimeout(() => {
        setLastScrollPosition(currentScrollY);
      }, 500);
      return () => clearTimeout(timer);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [setLastScrollPosition]);

  useEffect(() => {
    if (lastScrollPosition > 0) {
      setTimeout(() => {
        window.scrollTo({
          top: lastScrollPosition,
          behavior: "instant" as any,
        });
      }, 100);
    }
  }, []);

  // Featured series for slider (top rated)
  const featuredSeries = useMemo(() => {
    return [...series]
      .filter((s) => s.rating >= 7.5 && s.poster && s.poster.trim() !== "")
      .sort((a, b) => b.rating - a.rating)
      .slice(0, 5);
  }, [series]);

  // Slider controls
  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % featuredSeries.length);
  };

  const prevSlide = () => {
    setCurrentSlide(
      (prev) => (prev - 1 + featuredSeries.length) % featuredSeries.length
    );
  };

  const goToSlide = (index: number) => {
    setCurrentSlide(index);
  };

  // Auto-advance slider
  useEffect(() => {
    if (featuredSeries.length === 0) return;
    const interval = setInterval(nextSlide, 5000);
    return () => clearInterval(interval);
  }, [featuredSeries.length]);

  const displayedSeries = useFilteredSeries({
    series,
    seriesWatchedList,
    seriesWatchLaterList,
    seriesInProgressList,
    filterStatus,
    searchTerm: activeSearchTerm,
    selectedGenres,
    selectedRatings,
    watchedOrder,
    genreSeries,
  });

  const seriesToDisplay =
    activeSearchTerm.trim() && filterStatus === "all"
      ? searchResults
      : displayedSeries;
  const filteredSeriesToDisplay = seriesToDisplay.filter(
    (s) =>
      s.title &&
      typeof s.title === "string" &&
      s.title.trim() !== "" &&
      s.type &&
      (s.type === "tvSeries" || s.type === "tvMiniSeries") &&
      (activeSearchTerm.trim() !== "" ||
        (s.year &&
          s.year !== 0 &&
          s.poster &&
          typeof s.poster === "string" &&
          s.poster.trim() !== "" &&
          s.rating &&
          s.rating !== 0))
  );

  useEffect(() => {
    if (isMountedRef.current) {
      setCurrentPage(1);
    } else {
      isMountedRef.current = true;
    }
  }, [filterStatus, activeSearchTerm, selectedGenres, selectedRatings, watchedOrder]);

  useEffect(() => {
    clearSearch();
  }, [filterStatus]);

  useEffect(() => {
    let lastValue = false;
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      const newValue = currentScrollY > 700;
      if (newValue !== lastValue) {
        setShowScrollSearch(newValue);
        lastValue = newValue;
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleLogout = () => {
    logout();
    setSeries(series);
    setFilterStatus("all");
    setSearchTerm("");
    clearSearch();
  };

  const stats = {
    total: totalResults,
    watched: seriesWatchedList.length,
    watchLater: seriesWatchLaterList.length,
    inProgress: seriesInProgressList.length,
  };

  return (
    <div className="min-h-screen bg-background relative">
      {/* Navbar */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-lg border-b shadow-sm transition-all duration-300 supports-backdrop-filter:bg-background/60">
        <div className="container mx-auto px-4 h-[72px] flex items-center justify-between">
          <div className="flex items-center justify-between w-full">
            {/* Logo */}
            <div
              className="flex items-center gap-3 hover:opacity-80 transition-opacity cursor-pointer group"
              onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
            >
              <div className="w-9 h-9 relative group-hover:scale-110 transition-transform duration-300">
                <img
                  src="pelicula-de-video.png"
                  alt="CineMate Logo"
                  className="object-contain w-full h-full drop-shadow-md"
                />
              </div>
              <h1 className="text-2xl font-bold tracking-tight bg-linear-to-r from-primary to-primary/70 bg-clip-text text-transparent hidden sm:block">
                CineMate
              </h1>
            </div>

            {/* Navigation Links */}
            <div className="hidden md:flex items-center gap-2 absolute left-1/2 -translate-x-1/2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate("/home")}
                className="gap-2"
              >
                <Film className="w-4 h-4" />
                Películas
              </Button>
              <Button
                variant="default"
                size="sm"
                onClick={() => navigate("/series")}
                className="gap-2"
              >
                <Tv className="w-4 h-4" />
                Series
              </Button>
            </div>

            {/* Controls */}
            <div className="fixed right-28 z-50 flex items-center gap-2">
              {showScrollSearch && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setShowFloatingSearch(!showFloatingSearch)}
                  className="bg-background/50 hover:bg-background/80 backdrop-blur-sm border rounded-full w-10 h-10"
                  aria-label="Buscar series"
                >
                  <Search className="w-5 h-5 text-muted-foreground" />
                </Button>
              )}

              {!user ? (
                <>
                  <div className="hidden lg:flex items-center gap-3">
                    <Theme toggleTheme={toggleTheme} />
                    <div className="h-6 w-px bg-border/50 mx-1" />
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

                  <div className="fixed right-4 z-50 flex items-center gap-2">
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
                  </div>
                </>
              ) : (
                <div className="fixed right-4 z-50 flex items-center gap-2">
                  <NotificationCenter />
                  <UserMenu open={showUserMenu} setOpen={setShowUserMenu} />
                </div>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Floating search */}
      {showFloatingSearch && (
        <div className="fixed top-20 left-4 right-4 z-40 max-w-2xl mx-auto animate-in slide-in-from-top-2 duration-300">
          <div className="relative bg-background/95 backdrop-blur-xl rounded-2xl flex items-center px-4 py-3 gap-3 shadow-2xl border border-border/50">
            <SeriesSearchBar
              searchTerm={searchTerm}
              setSearchTerm={setSearchTerm}
              performSearch={performSearch}
              className="grow"
            />
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setShowFloatingSearch(false)}
              aria-label="Cerrar búsqueda"
              className="shrink-0 hover:bg-destructive/10 hover:text-destructive rounded-full h-10 w-10"
            >
              <span className="text-lg">✕</span>
            </Button>
          </div>
        </div>
      )}

      <div className="pt-18">
        {/* Main Content */}
        <main className="container mx-auto px-4 py-8 pt-24">
          {/* Featured Slider */}
          {(loading && series.length === 0) ? (
            <SliderSkeleton />
          ) : (
            featuredSeries.length > 0 &&
            !activeSearchTerm &&
            filterStatus === "all" && (
              <SeriesSlider
                featuredSeries={featuredSeries}
                currentSlide={currentSlide}
                prevSlide={prevSlide}
                nextSlide={nextSlide}
                goToSlide={goToSlide}
              />
            )
          )}

          {/* Stats */}
          {user && (
            <Stats
              total={totalResults}
              watched={seriesWatchedList.length}
              watchLater={seriesWatchLaterList.length}
              loading={statsLoading}
            />
          )}

          {/* Search Bar */}
          <div className="mb-6">
            <SeriesSearchBar
              searchTerm={searchTerm}
              setSearchTerm={setSearchTerm}
              performSearch={performSearch}
            />
          </div>

          {/* Filters */}
          {user && (
            <div className="mb-6">
              <SeriesFilters
                filterStatus={filterStatus}
                setFilterStatus={setFilterStatus}
                stats={stats}
                disabled={statsLoading}
              />
            </div>
          )}

          {/* Section Header */}
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 mb-6 sticky top-[72px] z-30 bg-background/80 backdrop-blur-md p-4 rounded-xl border shadow-sm transition-all duration-300">
            <div className="flex items-center gap-2">
              <LayoutGrid className="w-5 h-5 text-primary" />
              <h2 className="text-xl font-bold tracking-tight">
                {activeSearchTerm ? `Resultados para "${activeSearchTerm}"` : (
                  filterStatus === "all" ? "Explorar Series" :
                  filterStatus === "watched" ? "Mi Historial" :
                  filterStatus === "inProgress" ? "En Progreso" :
                  "Lista de Pendientes"
                )}
              </h2>
              {activeSearchTerm && (
                <Button variant="ghost" onClick={clearSearch} size="sm" className="ml-2 h-8 text-muted-foreground hover:text-foreground">
                  Limpiar Búsqueda
                </Button>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
              {/* Género */}
              <div className="flex items-center gap-2 bg-muted/50 p-1 rounded-lg border border-border/50 hover:bg-muted/80 transition-colors min-w-[160px]">
                <Filter className="w-4 h-4 text-muted-foreground ml-2 shrink-0" />
                <Select
                  value={selectedGenres[filterStatus]}
                  onValueChange={handleGenreChange}
                >
                  <SelectTrigger className="w-full min-w-[120px] border-0 bg-transparent focus:ring-0 h-8 text-sm font-medium">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {movieGenres.map((genre) => (
                      <SelectItem key={genre} value={genre}>
                        {genre}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Rating */}
              <div className="flex items-center gap-2 bg-muted/50 p-1 rounded-lg border border-border/50 hover:bg-muted/80 transition-colors min-w-[140px]">
                <Star className="w-4 h-4 text-yellow-500 ml-2 shrink-0" />
                <Select
                  value={String(selectedRatings[filterStatus])}
                  onValueChange={handleRatingChange}
                >
                  <SelectTrigger className="w-full min-w-[100px] border-0 bg-transparent focus:ring-0 h-8 text-sm font-medium whitespace-nowrap">
                    <SelectValue placeholder="All" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="All">Cualquiera</SelectItem>
                    {[5, 6, 7, 8, 9, 10].map((r) => (
                      <SelectItem key={r} value={String(r)}>
                        {r}+ Estrellas
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {filterStatus === "watched" && (
                <div className="flex items-center gap-2 bg-muted/50 p-1 rounded-lg border border-border/50 hover:bg-muted/80 transition-colors min-w-[160px]">
                  <ArrowUpDown className="w-4 h-4 text-primary ml-2 shrink-0" />
                  <Select
                    value={watchedOrder}
                    onValueChange={(value) =>
                      setWatchedOrder(value as "asc" | "desc")
                    }
                  >
                    <SelectTrigger className="w-full min-w-[120px] border-0 bg-transparent focus:ring-0 h-8 text-sm font-medium whitespace-nowrap">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="desc">Más Recientes</SelectItem>
                      <SelectItem value="asc">Más Antiguas</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>
          </div>

          {/* Genre loading indicator */}
          {isLoadingGenre &&
            selectedGenres[filterStatus] !== "All" &&
            filterStatus === "all" &&
            genreSeries.length === 0 && (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 justify-items-center py-8">
                {Array.from({ length: 10 }).map((_, i) => (
                  <SeriesCardSkeleton key={i} />
                ))}
              </div>
            )}

          {errorGenre && (
            <div className="text-center py-8 text-destructive">
              <p>{errorGenre}</p>
            </div>
          )}

          {/* Grid */}
          {filteredSeriesToDisplay.length === 0 ? (
            (loading || searchLoading) ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 justify-items-center py-8">
                {Array.from({ length: 10 }).map((_, i) => (
                  <SeriesCardSkeleton key={i} />
                ))}
              </div>
            ) : searchError ? (
              <div className="text-center py-12 px-4 max-w-md mx-auto">
                <div className="text-destructive mb-4 text-4xl">⚠️</div>
                <h3 className="text-xl font-semibold mb-2 text-destructive">
                  Error en la búsqueda
                </h3>
                <p className="text-muted-foreground mb-6">
                  {searchError}
                </p>
                <Button variant="outline" onClick={clearSearch}>
                  Limpiar y reintentar
                </Button>
              </div>
            ) : (
              <div className="text-center py-12">
                <div className="text-6xl mb-4">🔍</div>
                <h3 className="text-xl font-semibold mb-2">
                  No se encontraron series
                </h3>
                <p className="text-muted-foreground">
                  {activeSearchTerm
                    ? `No hay resultados para "${activeSearchTerm}"`
                    : "No hay series en esta categoría"}
                </p>
                {activeSearchTerm && (
                  <Button variant="outline" onClick={clearSearch} className="mt-4">
                    Ver todas las series
                  </Button>
                )}
              </div>
            )
          ) : (
            <div className="min-h-screen">
              <VirtuosoGrid
                useWindowScroll
                data={filteredSeriesToDisplay}
                totalCount={filteredSeriesToDisplay.length}
                overscan={1200}
                increaseViewportBy={800}
                endReached={() => {
                  if (!loading && hasMore) {
                    setCurrentPage((prev) => prev + 1);
                  }
                }}
                listClassName="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4"
                itemContent={(_index, s) => (
                  <div
                    key={s.id}
                    className="cursor-pointer h-full w-full flex justify-center"
                    tabIndex={0}
                    onClick={() => navigate(`/series/${s.id}`)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ")
                        navigate(`/series/${s.id}`);
                    }}
                    role="button"
                    aria-label={`Ver detalles de ${s.title}`}
                  >
                    <SeriesCard
                      series={s}
                      toggleWatchLater={toggleWatchLater}
                      markAsWatched={markAsWatched}
                      resetWatched={resetWatched}
                      watched={seriesWatchedList.some((ws) => ws.id === s.id)}
                      inProgress={seriesInProgressList.some(
                        (ip) => ip.id === s.id
                      )}
                      user={user}
                      openLoginModal={() => setShowLoginModal(true)}
                    />
                  </div>
                )}
                components={{
                  Footer: () => (
                    <>
                      {loading && hasMore && !activeSearchTerm && (
                        <div className="flex justify-center py-6 text-gray-400">
                          <Loader2 className="w-5 h-5 animate-spin" />
                        </div>
                      )}
                    </>
                  ),
                }}
              />
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
