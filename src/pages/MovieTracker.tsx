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
import { Loader2 } from "lucide-react";

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
    searchLoading
  } = useMovies();
  const [filterStatus, setFilterStatus] = useState<
    "all" | "watched" | "watchLater"
  >("all");
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showRegisterModal, setShowRegisterModal] = useState(false);
  const { user, setUser, logout } = useAuth();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const { isDarkMode, toggleTheme } = useContext(ThemeContext);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [currentSlide, setCurrentSlide] = useState(0);

  // Filtrar películas basado en búsqueda y estado
  const displayedMovies = useMemo(() => {
    if (filterStatus === "watched") {
      return moviesWatchedList;
    }
    if (filterStatus === "watchLater") {
      return moviesWatchLaterList;
    }
    return movies.filter(
      (movie) =>
        movie.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        movie.genres.some((genre) =>
          genre.toLowerCase().includes(searchTerm.toLowerCase())
        )
    );
  }, [
    filterStatus,
    movies,
    moviesWatchedList,
    moviesWatchLaterList,
    searchTerm,
  ]);

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
  movie => movie.year && movie.year !== 0 && movie.poster && movie.poster.trim() !== ""
);

  const observerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (entry.isIntersecting && !loading && hasMore) {
          setCurrentPage((prev) => prev + 1); // dispara el efecto en provider
        }
      },
      { rootMargin: "200px" }
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

  // Incrementar contador de veces vista
  const incrementWatchCount = async (id: number) => {
    setMovies((movies) =>
      movies.map((movie) =>
        movie.id === id
          ? { ...movie, watchCount: movie.watchCount + 1, watchLater: false }
          : movie
      )
    );
    // Actualizar la lista local de vistas
    setMoviesWatchedList((prev) => {
      const exists = prev.find((m) => m.id === id);
      if (exists) {
        return prev.map((movie) =>
          movie.id === id
            ? { ...movie, watchCount: movie.watchCount + 1, watchLater: false }
            : movie
        );
      } else {
        const movie = movies.find((m) => m.id === id);
        if (!movie) return prev;
        return [...prev, { ...movie, watchCount: 1, watchLater: false }];
      }
    });
    // Quitar de por ver, si aplica
    setMoviesWatchLaterList((prev) => prev.filter((movie) => movie.id !== id));

    // **Actualiza searchResults**
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

    // Actualizar backend aquí...
    const duration = await getMovieDurationById(id).then((res) => res.duration);
    const movieData = movies.find((m) => m.id === id);
    if (movieData?.watchLater) {
      await toggleWatchLaterApi({ movieId: id.toString() });
    }
    await addOrIncrementWatched({ movieId: id.toString(), duration });
  };

  // Resetear contador de veces vista
  const resetWatchCount = (id: number) => {
    setMovies((movies) =>
      movies.map((movie) =>
        movie.id === id ? { ...movie, watchCount: 0 } : movie
      )
    );
    setMoviesWatchedList((prev) => prev.filter((movie) => movie.id !== id));

    // **Actualiza searchResults visualmente**
    setSearchResults((prev) =>
      prev.map((movie) =>
        movie.id === id ? { ...movie, watchCount: 0 } : movie
      )
    );
    // reset api call
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
      if (exists) {
        return prev.filter((movie) => movie.id !== id);
      } else {
        const movie = movies.find((m) => m.id === id);
        if (!movie) return prev;
        return [...prev, { ...movie, watchLater: true }];
      }
    });

    // **Actualiza searchResults visualmente**
    setSearchResults((prev) =>
      prev.map((movie) =>
        movie.id === id ? { ...movie, watchLater: !movie.watchLater } : movie
      )
    );
    // Actualizar en backend
    toggleWatchLaterApi({ movieId: id.toString() });
  };

  // Estadísticas
  const stats = {
    total: totalResults,
    watched: moviesWatchedList.length,
    watchLater: moviesWatchLaterList.length,
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-6">
          {/* Controles de navegación */}
          <div className="absolute top-6 right-4 z-50 flex items-center gap-2">
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
              <UserMenu open={showUserMenu} setOpen={setShowUserMenu} />
            )}
          </div>
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

            {/* Barra de búsqueda */}
            <MovieSearchBar
              searchTerm={searchTerm}
              setSearchTerm={setSearchTerm}
              performSearch={performSearch}
            />

            {/* Filtros */}
            {user && (
              <>
                <MovieFilters
                  filterStatus={filterStatus}
                  setFilterStatus={setFilterStatus}
                  stats={stats}
                  disabled={statsLoading}
                />
              </>
            )}
          </div>
        </div>
      </header>

      {/* Grid de películas */}
      <main className="container mx-auto px-4 py-8">
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
              <MovieCard
                key={movie.id}
                movie={movie}
                incrementWatchCount={incrementWatchCount}
                resetWatchCount={resetWatchCount}
                toggleWatchLater={toggleWatchLater}
                user={user}
                openLoginModal={() => setShowLoginModal(true)}
              />
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
  );
}
