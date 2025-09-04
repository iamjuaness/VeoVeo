import { useState, useMemo, useEffect, useRef, useContext } from "react";
import { Stats } from "../components/Stats";
import { MovieSearchBar } from "../components/MovieSearchBar";
import { MovieFilters } from "../components/MovieFilters";
import { MovieCard } from "../components/MovieCard";
import { ModalLogin } from "../components/ModalLogin";
import { ModalRegister } from "../components/ModalRegister";
import { UserMenu } from "../components/UserMenu";
import {
  addOrIncrementWatched,
  resetWatched,
  toggleWatchLaterApi,
} from "../api/movie";
import { Theme } from "../components/Theme";
import { Hamburger } from "../components/Hamburguer";
import { Slider } from "../components/Slider";
import { useAuth } from "../context/useAuth";
import { useMovies } from "../context/MoviesContext";
import { getMovieDurationById } from "../api/imbd";
import { ThemeContext } from "../context/ThemeContext";
import { Loader2, Search } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { movieGenres, type Genre } from "../lib/genres";
import { Button } from "../components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";
import type { Movie } from "../interfaces/Movie";

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
    setMoviesWatchedList,
    setMoviesWatchLaterList,
    searchTerm,
    setSearchTerm,
    statsLoading,
    performSearch,
    searchResults,
    setSearchResults,
    searchLoading,
  } = useMovies();
  const [filterStatus, setFilterStatus] = useState<
    "all" | "watched" | "watchLater"
  >("all");
  const [selectedGenres, setSelectedGenres] = useState<{
    all: Genre;
    watched: Genre;
    watchLater: Genre;
  }>({
    all: "All",
    watched: "All",
    watchLater: "All",
  });
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

  // Filtrar películas basado en búsqueda y estado
  const displayedMovies = useMemo(() => {
    let filtered: Movie[] = [];

    if (filterStatus === "watched") {
      filtered = movies.filter((movie) => movie.watchCount > 0);
    } else if (filterStatus === "watchLater") {
      filtered = movies.filter((movie) => movie.watchLater);
    } else {
      filtered = movies.filter(
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
      filtered = filtered.filter((movie) => {
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

    return filtered;
  }, [filterStatus, movies, searchTerm, selectedGenres]);

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
      (movie.type === "movie" || movie.type === "video")
  );

  const observerRef = useRef<HTMLDivElement | null>(null);
  const navigate = useNavigate();

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
    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (entry.isIntersecting && !loading && hasMore) {
          setCurrentPage((prev) => prev + 1); // dispara el efecto en provider
        }
      },
      { rootMargin: "400px" }
    );

    if (observerRef.current) observer.observe(observerRef.current);

    return () => {
      if (observerRef.current) observer.unobserve(observerRef.current);
    };
  }, [loading, hasMore, setCurrentPage]);

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
  const incrementWatchCount = async (id: number) => {
    const movieOriginal = movies.find((m) => m.id === id);
    setMovies((movies) =>
      movies.map((movie) =>
        movie.id === id
          ? { ...movie, watchCount: movie.watchCount + 1, watchLater: false }
          : movie
      )
    );

    setMoviesWatchedList((prev) => {
      if (!movieOriginal) return prev;

      const exists = prev.find((m) => m.id === id);
      let updated;
      if (exists) {
        updated = prev.map((movie) =>
          movie.id === id
            ? {
                ...movieOriginal,
                watchCount: movie.watchCount + 1,
                watchLater: false,
              }
            : movie
        );
      } else {
        updated = [
          ...prev,
          { ...movieOriginal, watchCount: 1, watchLater: false },
        ];
      }
      localStorage.setItem("moviesWatched", JSON.stringify(updated));
      return updated;
    });

    // Quitar de por ver
    setMoviesWatchLaterList((prev) => {
      const filtered = prev.filter((movie) => movie.id !== id);
      localStorage.setItem("moviesWatchLater", JSON.stringify(filtered));
      return filtered;
    });

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

    // Usa la variable declarada arriba

    if (movieOriginal?.watchLater) {
      await toggleWatchLaterApi({ movieId: id.toString() });
    }
    const duration = await getMovieDurationById(id.toString()).then(
      (res) => res.duration
    );
    await addOrIncrementWatched({ movieId: id.toString(), duration });
  };

  // Resetear contador de veces vista
  const resetWatchCount = (id: number) => {
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
  const toggleWatchLater = (id: number) => {
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
        const movieOriginal = movies.find((m) => m.id === id);
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
      <nav className="fixed top-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-sm border-b">
        <div className="container mx-auto px-4 py-5">
          <div className="flex items-center justify-between">
            {/* Logo/Nombre */}
            <div className="flex items-center gap-2">
              <div className="w-10 h-10">
                <img src="pelicula-de-video.png" alt="logo" typeof="icon" />
              </div>
              <h1 className="text-xl font-bold">VeoVeo</h1>
            </div>

            {/* Controles de navegación */}
            <div className="flex items-center gap-2">
              {/* Lupa flotante (solo visible al hacer scroll) */}
              {showScrollSearch && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowFloatingSearch(!showFloatingSearch)}
                  className="gap-2 bg-transparent fixed right-18 z-50"
                  aria-label="Buscar películas"
                >
                  <Search className="w-4 h-4" />
                </Button>
              )}

              {!user ? (
                <>
                  {/* Botón de tema*/}
                  <Theme toggleTheme={toggleTheme} />
                  {/* Botones de desktop (lg y superior) */}
                  <div className="hidden lg:flex gap-2">
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
                <div className="fixed right-4 z-50">
                  <UserMenu open={showUserMenu} setOpen={setShowUserMenu} />
                </div>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Barra de búsqueda flotante */}
      {showFloatingSearch && (
        <div className="fixed top-22 left-4 right-4 z-40 max-w-md mx-auto">
          <div className="relative max-w-md mx-auto bg-background/95 rounded-sm flex items-center px-3 py-2 gap-2">
            {/* Barra de búsqueda ocupando todo el espacio posible menos el botón cerrar */}
            <MovieSearchBar
              searchTerm={searchTerm}
              setSearchTerm={setSearchTerm}
              performSearch={performSearch}
              className="flex-grow"
            />

            {/* Botón cerrar sin posicionamiento absoluto */}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowFloatingSearch(false)}
              aria-label="Cerrar búsqueda"
              className="p-1 flex-shrink-0"
            >
              ✕
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
                  <h1 className="text-3xl font-bold text-center mb-6 leading-tight">
                    🎬 Mi Colección de Películas
                  </h1>

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
          {/* Selector de género */}
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold">
              {filterStatus === "all" && "Todas las Películas"}
              {filterStatus === "watched" && "Películas Vistas"}
              {filterStatus === "watchLater" && "Ver Después"}
            </h2>
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">Género:</span>
              <Select
                value={selectedGenres[filterStatus]}
                onValueChange={handleGenreChange}
              >
                <SelectTrigger className="w-40">
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
          </div>
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
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 justify-items-center min-h-screen py-8">
              {filteredMoviesToDisplay.map((movie) => (
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
