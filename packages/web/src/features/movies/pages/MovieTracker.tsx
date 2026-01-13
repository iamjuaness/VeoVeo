import { useState, useEffect } from "react";
import { Stats } from "../../stats/components/Stats";
import { MovieSearchBar } from "../components/MovieSearchBar";
import { MovieFilters } from "../components/MovieFilters";
import { MovieCard } from "../components/MovieCard";
import { ModalLogin } from "../../auth/components/ModalLogin";
import { ModalRegister } from "../../auth/components/ModalRegister";
import { UserMenu } from "../../auth/components/UserMenu";
import { Theme } from "../../../shared/components/layout/Theme";
import { Hamburger } from "../../../shared/components/layout/Hamburguer";
import { Slider } from "../../../features/movies/components/Slider";
import { useNavigate } from "react-router-dom";
import { movieGenres, type Genre } from "../../../shared/lib/genres";
import { Button } from "../../../shared/components/ui/button";
import { useFilteredMovies } from "../hooks/useFilteredMovies";
import { useContext } from "react";
import { useAuth } from "../../auth/hooks/useAuth";
import { useMovies } from "../context/MoviesContext";
import { ThemeContext } from "../../../core/providers/ThemeContext";
import {
  Loader2,
  Search,
  Filter,
  Star,
  ArrowUpDown,
  LayoutGrid,
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../../shared/components/ui/select";
import { VirtuosoGrid } from "react-virtuoso";
import { NotificationCenter } from "../../social/components/NotificationCenter";
import { useGenreMovies } from "../hooks/useGenreMovies";

export default function MovieTracker() {
  const {
    movies,
    setMovies,
    setCurrentPage,
    totalResults,
    loading,
    hasMore,
    moviesWatchedList,
    moviesWatchLaterList,
    searchTerm,
    setSearchTerm,
    statsLoading,
    performSearch,
    searchResults,
    searchLoading,
    filterStatus,
    setFilterStatus,
    incrementWatchCount,
    resetWatchCount,
    toggleWatchLater,
  } = useMovies();
  const [selectedGenres, setSelectedGenres] = useState<{
    all: Genre;
    watched: Genre;
    watchLater: Genre;
  }>(() => {
    const saved = localStorage.getItem("moviesSelectedGenres");
    return saved
      ? JSON.parse(saved)
      : {
          all: "All",
          watched: "All",
          watchLater: "All",
        };
  });

  // Tipo para el filtro de rating
  type RatingValue = "All" | 5 | 6 | 7 | 8 | 9 | 10;

  // Estado por pestaña (all / watched / watchLater)
  const [selectedRatings, setSelectedRatings] = useState<{
    all: RatingValue;
    watched: RatingValue;
    watchLater: RatingValue;
  }>(() => {
    const saved = localStorage.getItem("moviesSelectedRatings");
    return saved
      ? JSON.parse(saved)
      : {
          all: "All",
          watched: "All",
          watchLater: "All",
        };
  });

  const [watchedOrder, setWatchedOrder] = useState<"asc" | "desc">("desc");

  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showRegisterModal, setShowRegisterModal] = useState(false);
  const { user, setUser, logout } = useAuth();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const { isDarkMode, toggleTheme } = useContext(ThemeContext);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [currentSlide, setCurrentSlide] = useState(0);
  const navigate = useNavigate();

  useMovies();
  const [showScrollSearch, setShowScrollSearch] = useState(false);
  const [showFloatingSearch, setShowFloatingSearch] = useState(false);

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

  const { genreMovies, isLoadingGenre, errorGenre, loadMoreGenreMovies } =
    useGenreMovies(selectedGenres[filterStatus]);

  // Use the new custom hook for filtered movies
  const displayedMovies = useFilteredMovies({
    movies,
    moviesWatchedList,
    moviesWatchLaterList,
    filterStatus,
    searchTerm,
    selectedGenres,
    selectedRatings,
    watchedOrder,
    genreMovies,
  });

  const featuredMovies = [...movies]
    .sort((a, b) => b.rating - a.rating)
    .slice(0, 6)
    .map((movie) => ({
      ...movie,
      backdrop: `${movie.backdrop}&text=${encodeURIComponent(
        movie.title
      )}+Backdrop`,
    }));

  const moviesToDisplay = searchTerm.trim() ? searchResults : displayedMovies;
  const filteredMoviesToDisplay = moviesToDisplay.filter(
    (movie) =>
      movie.year &&
      movie.year !== 0 &&
      movie.poster &&
      typeof movie.poster === "string" &&
      movie.poster.trim() !== "" &&
      movie.title &&
      typeof movie.title === "string" &&
      movie.title.trim() !== "" &&
      movie.rating &&
      movie.rating !== 0 &&
      movie.type &&
      (movie.type === "movie" ||
        movie.type === "video" ||
        movie.type === "tvMovie")
  );

  useEffect(() => {
    setCurrentPage(1);
  }, [filterStatus, watchedOrder, selectedGenres, selectedRatings, searchTerm]);

  // Auto-play del slider
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % featuredMovies.length);
    }, 6000);
    return () => clearInterval(interval);
  }, [featuredMovies]);

  useEffect(() => {
    localStorage.setItem(
      "moviesSelectedGenres",
      JSON.stringify(selectedGenres)
    );
  }, [selectedGenres]);

  useEffect(() => {
    localStorage.setItem(
      "moviesSelectedRatings",
      JSON.stringify(selectedRatings)
    );
  }, [selectedRatings]);

  useEffect(() => {
    const savedPage = localStorage.getItem("currentPage");
    if (savedPage) setCurrentPage(Number(savedPage));
  }, []);

  const { lastScrollPosition, setLastScrollPosition } = useMovies();

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

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      setShowScrollSearch(currentScrollY > 700);

      // Debounce saving scroll position
      const timer = setTimeout(() => {
        setLastScrollPosition(currentScrollY);
      }, 500);
      return () => clearTimeout(timer);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [setLastScrollPosition]);

  const handleLogout = () => {
    logout();
    setMovies(displayedMovies);
    setFilterStatus("all");
    setSearchTerm("");
  };

  // Funciones del slider
  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % featuredMovies.length);
  };

  const prevSlide = () => {
    setCurrentSlide(
      (prev) => (prev - 1 + featuredMovies.length) % featuredMovies.length
    );
  };

  const goToSlide = (index: number) => {
    setCurrentSlide(index);
  };

  // Estadísticas
  const stats = {
    total: totalResults,
    watched: moviesWatchedList.length,
    watchLater: moviesWatchLaterList.length,
  };

  return (
    <div className="min-h-screen bg-background relative">
      {/* Navbar fijo */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-lg border-b shadow-sm transition-all duration-300 supports-backdrop-filter:bg-background/60">
        <div className="container mx-auto px-4 h-[72px] flex items-center justify-between">
          <div className="flex items-center justify-between w-full">
            {/* Logo/Nombre */}
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
                variant="default"
                size="sm"
                onClick={() => navigate("/home")}
                className="gap-2"
              >
                <LayoutGrid className="w-4 h-4" />
                Películas
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate("/series")}
                className="gap-2"
              >
                <LayoutGrid className="w-4 h-4" />
                Series
              </Button>
            </div>

            {/* Controles de navegación */}
            <div className="fixed right-28 z-50 flex items-center gap-2">
              {/* Lupa flotante (solo visible al hacer scroll) */}
              {showScrollSearch && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setShowFloatingSearch(!showFloatingSearch)}
                  className="bg-background/50 hover:bg-background/80 backdrop-blur-sm border rounded-full w-10 h-10"
                  aria-label="Buscar películas"
                >
                  <Search className="w-5 h-5 text-muted-foreground" />
                </Button>
              )}

              {!user ? (
                <>
                  {/* Botones de desktop (lg y superior) */}
                  <div className="hidden lg:flex items-center gap-3 fixed right-4 top-4 z-50">
                    {/* Modal de Inicio de Sesión */}
                    <ModalLogin
                      open={showLoginModal}
                      setOpen={setShowLoginModal}
                      onLogin={setUser}
                      openRegisterModal={() => setShowRegisterModal(true)}
                    />

                    {/* Modal de Registro */}
                    <ModalRegister
                      open={showRegisterModal}
                      setOpen={setShowRegisterModal}
                    />
                  </div>

                  <div className="fixed right-4 z-50 flex items-center gap-2 lg:hidden">
                    {/* Botón de tema*/}
                    <Theme toggleTheme={toggleTheme} />
                    <div className="h-6 w-px bg-border/50 mx-1" />

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
                /* Avatar de usuario y menú lateral */
                <div className="fixed right-4 z-50 flex items-center gap-2">
                  <NotificationCenter />
                  <UserMenu open={showUserMenu} setOpen={setShowUserMenu} />
                </div>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Barra de búsqueda flotante */}
      {showFloatingSearch && (
        <div className="fixed top-20 left-4 right-4 z-40 max-w-2xl mx-auto animate-in slide-in-from-top-2 duration-300">
          <div className="relative bg-background/95 backdrop-blur-xl rounded-2xl flex items-center px-4 py-3 gap-3 shadow-2xl border border-border/50">
            {/* Barra de búsqueda ocupando todo el espacio posible menos el botón cerrar */}
            <MovieSearchBar
              searchTerm={searchTerm}
              setSearchTerm={setSearchTerm}
              performSearch={performSearch}
              className="grow"
            />

            {/* Botón cerrar sin posicionamiento absoluto */}
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
        {/* Header */}
        <header className="border-b bg-card">
          <div className="container mx-auto px-4 py-6">
            <div className="gap-6 mb-6">
              <div className="gap-2 mt-16">
                <Slider
                  featuredMovies={featuredMovies}
                  currentSlide={currentSlide}
                  prevSlide={prevSlide}
                  nextSlide={nextSlide}
                  goToSlide={goToSlide}
                  toggleWatchLater={() => {}}
                />
              </div>

              {/* Estadísticas - Solo visible cuando el usuario está logueado */}
              {user && (
                <>
                  {/* Estadísticas */}
                  <Stats
                    total={totalResults}
                    watched={stats.watched}
                    watchLater={stats.watchLater}
                    loading={statsLoading}
                  />
                </>
              )}

              <div className="mb-3">
                {/* Barra de búsqueda */}
                <MovieSearchBar
                  searchTerm={searchTerm}
                  setSearchTerm={setSearchTerm}
                  performSearch={performSearch}
                />
              </div>

              {/* Filtros */}
              {user && (
                <MovieFilters
                  filterStatus={filterStatus}
                  setFilterStatus={setFilterStatus}
                  stats={stats}
                  disabled={statsLoading}
                />
              )}
            </div>
          </div>
        </header>

        {/* Grid de películas */}
        <main className="container mx-auto px-4 py-8">
          {/* Selector de género y filtros mejorados */}
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 mb-8 sticky top-[72px] z-30 bg-background/80 backdrop-blur-md p-4 rounded-xl border shadow-sm transition-all duration-300">
            <div className="flex items-center gap-2">
              <LayoutGrid className="w-5 h-5 text-primary" />
              <h2 className="text-xl font-bold tracking-tight">
                {filterStatus === "all" && "Explorar Catálogo"}
                {filterStatus === "watched" && "Mi Historial"}
                {filterStatus === "watchLater" && "Lista de Pendientes"}
              </h2>
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
          {isLoadingGenre &&
            selectedGenres[filterStatus] !== "All" &&
            genreMovies.length === 0 && (
              <div className="flex justify-center items-center py-12">
                <Loader2 className="w-10 h-10 animate-spin text-primary" />
                <p className="ml-3 text-muted-foreground">
                  Cargando películas de {selectedGenres[filterStatus]}...
                </p>
              </div>
            )}

          {/* 🔥 Mostrar error si hay */}
          {errorGenre && (
            <div className="text-center py-8 text-destructive">
              <p>{errorGenre}</p>
            </div>
          )}
          {filteredMoviesToDisplay.length === 0 ? (
            loading || searchLoading ? (
              <div className="flex justify-center py-12">
                <Loader2 className="w-10 h-10 animate-spin text-gray-400" />
              </div>
            ) : (
              <div className="text-center py-12">
                <div className="text-6xl mb-4">🔍</div>
                <h3 className="text-xl font-semibold mb-2">
                  No se encontraron películas
                </h3>
                <p className="text-muted">
                  {searchTerm
                    ? `No hay resultados para "${searchTerm}"`
                    : "No hay películas en esta categoría"}
                </p>
              </div>
            )
          ) : (
            <div className="min-h-screen">
              <VirtuosoGrid
                useWindowScroll
                data={filteredMoviesToDisplay}
                totalCount={filteredMoviesToDisplay.length}
                overscan={1200}
                increaseViewportBy={800}
                endReached={() => {
                  if (selectedGenres[filterStatus] !== "All") {
                    // Si hay género seleccionado, usar loadMoreGenreMovies
                    loadMoreGenreMovies();
                  } else {
                    // Si no hay género, usar paginación normal
                    if (!loading && hasMore) {
                      setCurrentPage((prev) => prev + 1);
                    }
                  }
                }}
                listClassName="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 justify-items-center py-8"
                itemContent={(_index, movie) => (
                  <div
                    key={movie.id}
                    className="cursor-pointer h-full w-full flex justify-center"
                    tabIndex={0}
                    onClick={() => navigate(`/movie/${movie.id}`)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ")
                        navigate(`/movie/${movie.id}`);
                    }}
                    role="button"
                    aria-label={`Ver detalles de ${movie.title}`}
                  >
                    <MovieCard
                      movie={movie}
                      incrementWatchCount={incrementWatchCount}
                      resetWatchCount={resetWatchCount}
                      toggleWatchLater={toggleWatchLater}
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
                          <span className="animate-pulse text-lg">
                            <Loader2 className="w-5 h-5 animate-spin" />
                          </span>
                        </div>
                      )}
                    </>
                  ),
                }}
              />
            </div>
          )}
        </main>

        <footer className="border-t border-gray-200 p-4 text-center">
          <p className="text-sm text-gray-500">
            &copy; {new Date().getFullYear()} CineMate. Todos los derechos
            reservados.
          </p>
        </footer>
      </div>
    </div>
  );
}
