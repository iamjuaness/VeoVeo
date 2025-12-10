import { useState, useMemo, useEffect, useRef, useContext } from "react";
import { Stats } from "../../stats/components/Stats";
import { MovieSearchBar } from "../components/MovieSearchBar";
import { MovieFilters } from "../components/MovieFilters";
import { MovieCard } from "../components/MovieCard";
import { ModalLogin } from "../../auth/components/ModalLogin";
import { ModalRegister } from "../../auth/components/ModalRegister";
import { UserMenu } from "../../auth/components/UserMenu";
import {
  addOrIncrementWatched,
  resetWatched,
  toggleWatchLaterApi,
} from "../../../features/movies/services/movie";
import { Theme } from "../../../shared/components/layout/Theme";
import { Hamburger } from "../../../shared/components/layout/Hamburguer";
import { Slider } from "../../../features/movies/components/Slider";
import { useAuth } from "../../auth/hooks/useAuth";
import { useMovies } from "../context/MoviesContext";
import { getMovieDurationById } from "../services/imdb";
import { ThemeContext } from "../../../core/providers/ThemeContext";
import {
  Loader2,
  Search,
  Filter,
  Star,
  ArrowUpDown,
  LayoutGrid,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { movieGenres, type Genre } from "../../../shared/lib/genres";
import { Button } from "../../../shared/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../../shared/components/ui/select";
import type { Movie } from "../../../interfaces/Movie";

export default function MovieTracker() {
  const {
    movies,
    setMovies,
    moviesPerPage,
    currentPage,
    setCurrentPage,
    totalResults,
    loading,
    hasMore,
    moviesWatchedList,
    moviesWatchLaterList,
    setMoviesWatchedList,
    setMoviesWatchLaterList,
    searchTerm,
    setSearchTerm,
    statsLoading,
    performSearch,
    searchResults,
    setSearchResults,
    searchLoading,
    filterStatus,
    setFilterStatus,
  } = useMovies();
  const [selectedGenres, setSelectedGenres] = useState<{
    all: Genre;
    watched: Genre;
    watchLater: Genre;
  }>({
    all: "All",
    watched: "All",
    watchLater: "All",
  });

  // Tipo para el filtro de rating
  type RatingValue = "All" | 5 | 6 | 7 | 8 | 9 | 10;

  // Estado por pestaña (all / watched / watchLater)
  const [selectedRatings, setSelectedRatings] = useState<{
    all: RatingValue;
    watched: RatingValue;
    watchLater: RatingValue;
  }>({
    all: "All",
    watched: "All",
    watchLater: "All",
  });

  const [watchedOrder, setWatchedOrder] = useState<"asc" | "desc">("desc");

  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showRegisterModal, setShowRegisterModal] = useState(false);
  const { user, setUser, logout } = useAuth();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const { isDarkMode, toggleTheme } = useContext(ThemeContext);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [showScrollSearch, setShowScrollSearch] = useState(false);
  const [showFloatingSearch, setShowFloatingSearch] = useState(false);
  const [scrollY, setScrollY] = useState(0);
  const [orderedWatchedMovies, setOrderedWatchedMovies] = useState<Movie[]>([]);

  // Handler para Select (shadcn/ui Select envía string)
  const handleRatingChange = (value: string) => {
    const parsed = value === "All" ? "All" : (Number(value) as RatingValue);
    setSelectedRatings((prev) => ({
      ...prev,
      [filterStatus]: parsed,
    }));
  };

  // Filtrar películas basado en búsqueda y estado
  const displayedMovies = useMemo(() => {
    let base: Movie[] = [];

    if (filterStatus === "watched") {
      base = [...moviesWatchedList].sort((a, b) => {
        const aArr = Array.isArray(a.watchedAt) ? a.watchedAt : [];
        const bArr = Array.isArray(b.watchedAt) ? b.watchedAt : [];
        const aLast = aArr[aArr.length - 1];
        const bLast = bArr[bArr.length - 1];
        const aDate = aLast ? new Date(aLast).getTime() : 0;
        const bDate = bLast ? new Date(bLast).getTime() : 0;
        return watchedOrder === "asc" ? aDate - bDate : bDate - aDate;
      });
    } else if (filterStatus === "watchLater") {
      base = [...moviesWatchLaterList];
    } else {
      base = movies.filter(
        (movie) =>
          movie.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
          movie.genres.some((genre) =>
            genre.toLowerCase().includes(searchTerm.toLowerCase())
          )
      );
    }

    // Obtener el género para filtrar según estado actual
    const currentGenre = selectedGenres[filterStatus];

    if (currentGenre && currentGenre !== "All") {
      base = base.filter((movie) => {
        // En el primer código movie.genre es string
        // En el segundo movie.genres es array, así que para unificar:
        if (Array.isArray(movie.genres)) {
          return movie.genres.includes(currentGenre);
        }
        if (typeof movie.genres === "string") {
          return movie.genres === currentGenre;
        }
        return false; // si no tiene géneros definidos
      });
    }

    // NUEVO: filtro por rating mínimo
    const currentRating = selectedRatings[filterStatus];
    if (currentRating !== "All") {
      base = base.filter(
        (movie) => (movie.rating ?? 0) >= Number(currentRating)
      );
    }

    return base;
  }, [filterStatus, movies, searchTerm, selectedGenres, selectedRatings]);

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
      movie.poster.trim() !== "" &&
      movie.title &&
      movie.title.trim() !== "" &&
      movie.rating &&
      movie.rating !== 0 &&
      movie.type &&
      (movie.type === "movie" ||
        movie.type === "video" ||
        movie.type === "tvMovie")
  );

  const paginatedMovies = filteredMoviesToDisplay.slice(
    0,
    currentPage * moviesPerPage
  );

  const observerRef = useRef<HTMLDivElement | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    // Incluye aquí rating, géneros (si quieres pre-filtrar antes de ordenar)
    const obj = {} as Record<string, Movie>;
    moviesWatchedList.forEach((m) => {
      obj[m.id] = m;
    });
    let sorted = Object.values(obj);

    // Filtros antes de ordenar (opcional)
    if (selectedGenres.watched && selectedGenres.watched !== "All") {
      sorted = sorted.filter((movie) =>
        Array.isArray(movie.genres)
          ? movie.genres.includes(selectedGenres.watched)
          : movie.genres === selectedGenres.watched
      );
    }
    const rating = selectedRatings.watched;
    if (rating !== "All") {
      sorted = sorted.filter((movie) => (movie.rating ?? 0) >= Number(rating));
    }

    // Ordena globalmente por la última fecha vista
    sorted.sort((a, b) => {
      const aArr = Array.isArray(a.watchedAt) ? a.watchedAt : [];
      const bArr = Array.isArray(b.watchedAt) ? b.watchedAt : [];
      const aLast = aArr[aArr.length - 1];
      const bLast = bArr[bArr.length - 1];
      const aDate = aLast ? new Date(aLast).getTime() : 0;
      const bDate = bLast ? new Date(bLast).getTime() : 0;
      return watchedOrder === "asc" ? aDate - bDate : bDate - aDate;
    });

    setOrderedWatchedMovies(sorted);
  }, [
    moviesWatchedList,
    watchedOrder,
    selectedGenres.watched,
    selectedRatings.watched,
  ]);

  useEffect(() => {
    setCurrentPage(1);
  }, [
    filterStatus,
    watchedOrder,
    selectedGenres.watched,
    selectedRatings.watched,
    searchTerm,
  ]);

  const paginatedWatchedMovies = orderedWatchedMovies.slice(
    0,
    currentPage * moviesPerPage
  );

  // Detectar scroll
  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      setScrollY(currentScrollY);
      // Mostrar lupa cuando haya scrolleado más de 1000px
      setShowScrollSearch(currentScrollY > 700);
      console.log("Scroll en Y:", scrollY);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    setCurrentPage(1);
  }, [filterStatus, watchedOrder, selectedGenres, selectedRatings, searchTerm]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (entry.isIntersecting && !loading && hasMore) {
          setCurrentPage((prev) => prev + 1);
        }
      },
      { rootMargin: "400px" }
    );

    if (observerRef.current) observer.observe(observerRef.current);

    return () => {
      if (observerRef.current) observer.unobserve(observerRef.current);
    };
  }, [loading, hasMore, setCurrentPage, filterStatus]);

  // Auto-play del slider
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % featuredMovies.length);
    }, 6000);
    return () => clearInterval(interval);
  }, [featuredMovies]);

  useEffect(() => {
    const savedPage = localStorage.getItem("currentPage");
    if (savedPage) setCurrentPage(Number(savedPage));
  }, []);

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

  // Función para cambiar género
  const handleGenreChange = (genre: Genre) => {
    setSelectedGenres((prev) => ({
      ...prev,
      [filterStatus]: genre,
    }));
  };

  // Incrementar contador de veces vista
  const incrementWatchCount = async (id: string) => {
    const movieOriginal =
      movies.find((m) => m.id === id) || searchResults.find((m) => m.id === id);

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

    // Sube el contador en los resultados de búsqueda
    setSearchResults((prev) =>
      prev.map((movie) =>
        movie.id === id
          ? {
              ...movie,
              watchCount: (movie.watchCount || 0) + 1,
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
    const userOffset = new Date().getTimezoneOffset();
    const watchedAtNew = new Date(
      new Date().getTime() - userOffset * 60 * 1000
    ).toISOString();

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

    if (movieOriginal?.watchLater) {
      await toggleWatchLaterApi({ movieId: id.toString() });
    }
    await addOrIncrementWatched({
      movieId: id.toString(),
      duration,
      watchedAt: [watchedAtNew],
    });
  };

  // Resetear contador de veces vista
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

    setSearchResults((prev) =>
      prev.map((movie) =>
        movie.id === id ? { ...movie, watchCount: 0 } : movie
      )
    );

    // Llamada al backend para resetear
    resetWatched({ movieId: id.toString() });
  };

  // Toggle watchLater status
  const toggleWatchLater = (id: string) => {
    const movieOriginal =
      movies.find((m) => m.id === id) || searchResults.find((m) => m.id === id);

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

    setSearchResults((prev) =>
      prev.map((movie) =>
        movie.id === id ? { ...movie, watchLater: !movie.watchLater } : movie
      )
    );

    // Actualizar backend
    toggleWatchLaterApi({ movieId: id.toString() });
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
      <nav className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-lg border-b shadow-sm transition-all duration-300 supports-[backdrop-filter]:bg-background/60">
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
                  alt="VeoVeo Logo"
                  className="object-contain w-full h-full drop-shadow-md"
                />
              </div>
              <h1 className="text-2xl font-bold tracking-tight bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent hidden sm:block">
                VeoVeo
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
            <div className="fixed right-20 z-50 flex items-center gap-2">
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
                  <div className="hidden lg:flex items-center gap-3">
                    {/* Botón de tema*/}
                    <Theme toggleTheme={toggleTheme} />
                    <div className="h-6 w-px bg-border/50 mx-1" />
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
                /* Avatar de usuario y menú lateral */
                <div className="fixed right-4 z-50 flex items-center gap-2">
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
          {/* Grid para 'watched' con lista ordenada global */}
          {filterStatus === "watched" ? (
            paginatedWatchedMovies.length === 0 ? (
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
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 justify-items-center min-h-screen py-8">
                {paginatedWatchedMovies.map((movie) => (
                  <div
                    key={movie.id}
                    className="cursor-pointer h-full"
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
                ))}
                {/* Loader pequeño y no invasivo */}
                {loading && hasMore && !searchTerm && (
                  <div className="col-span-full flex justify-center py-6 text-gray-400">
                    <span className="animate-pulse text-lg">
                      <Loader2 className="w-5 h-5 animate-spin" />
                    </span>
                  </div>
                )}
                {/* Elemento sentinel para IntersectionObserver */}
                <div ref={observerRef} className="h-10 col-span-full"></div>
              </div>
            )
          ) : // Otros tabs: usa tu lógica/slice habitual (ejemplo con paginatedMovies)
          paginatedMovies.length === 0 ? (
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
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 justify-items-center min-h-screen py-8">
              {paginatedMovies.map((movie) => (
                <div
                  key={movie.id}
                  className="cursor-pointer h-full"
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
              ))}
              {/* Loader pequeño y no invasivo */}
              {loading && hasMore && !searchTerm && (
                <div className="col-span-full flex justify-center py-6 text-gray-400">
                  <span className="animate-pulse text-lg">
                    <Loader2 className="w-5 h-5 animate-spin" />
                  </span>
                </div>
              )}
              <div ref={observerRef} className="h-10 col-span-full"></div>
            </div>
          )}
        </main>

        <footer className="border-t border-gray-200 p-4 text-center">
          <p className="text-sm text-gray-500">
            &copy; {new Date().getFullYear()} VeoVeo. Todos los derechos
            reservados.
          </p>
        </footer>
      </div>
    </div>
  );
}
