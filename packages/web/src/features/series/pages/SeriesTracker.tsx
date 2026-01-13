import { useState, useMemo, useEffect, useRef } from "react";
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
import { useContext } from "react";
import { useAuth } from "../../auth/hooks/useAuth";
import { useSeries } from "../context/SeriesContext";
import { ThemeContext } from "../../../core/providers/ThemeContext";
import { Loader2, Search, LayoutGrid, Film, Tv } from "lucide-react";
import { VirtuosoGrid } from "react-virtuoso";
import { NotificationCenter } from "../../social/components/NotificationCenter";

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
  } = useSeries();

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
    searchTerm,
  });

  const seriesToDisplay = searchTerm.trim() ? searchResults : displayedSeries;
  const filteredSeriesToDisplay = seriesToDisplay.filter(
    (s) =>
      s.year &&
      s.year !== 0 &&
      s.poster &&
      typeof s.poster === "string" &&
      s.poster.trim() !== "" &&
      s.title &&
      typeof s.title === "string" &&
      s.title.trim() !== "" &&
      s.rating &&
      s.rating !== 0 &&
      s.type &&
      (s.type === "tvSeries" || s.type === "tvMiniSeries")
  );

  useEffect(() => {
    if (isMountedRef.current) {
      setCurrentPage(1);
    } else {
      isMountedRef.current = true;
    }
  }, [filterStatus, searchTerm]);

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
          {featuredSeries.length > 0 &&
            !searchTerm &&
            filterStatus === "all" && (
              <SeriesSlider
                featuredSeries={featuredSeries}
                currentSlide={currentSlide}
                prevSlide={prevSlide}
                nextSlide={nextSlide}
                goToSlide={goToSlide}
              />
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
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 mb-6">
            <div className="flex items-center gap-2">
              <LayoutGrid className="w-5 h-5 text-primary" />
              <h2 className="text-xl font-bold tracking-tight">
                {filterStatus === "all" && "Explorar Series"}
                {filterStatus === "watchLater" && "Lista de Pendientes"}
              </h2>
            </div>
          </div>

          {/* Grid */}
          {filteredSeriesToDisplay.length === 0 ? (
            loading || searchLoading ? (
              <div className="flex justify-center py-12">
                <Loader2 className="w-10 h-10 animate-spin text-gray-400" />
              </div>
            ) : (
              <div className="text-center py-12">
                <div className="text-6xl mb-4">🔍</div>
                <h3 className="text-xl font-semibold mb-2">
                  No se encontraron series
                </h3>
                <p className="text-muted">
                  {searchTerm
                    ? `No hay resultados para "${searchTerm}"`
                    : "No hay series en esta categoría"}
                </p>
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
                      {loading && hasMore && !searchTerm && (
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
