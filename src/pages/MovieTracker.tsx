import { useState, useMemo, useEffect } from "react";
import type { Movie } from "../interfaces/Movie";
import { initialMovies } from "../components/initialMovies";
import { Stats } from "../components/Stats";
import { MovieSearchBar } from "../components/MovieSearchBar";
import { MovieFilters } from "../components/MovieFilters";
import { MovieCard } from "../components/MovieCard";
import { Pagination } from "../components/Pagination";
import { ModalLogin } from "../components/ModalLogin";
import { ModalRegister } from "../components/ModalRegister";
import type { User } from "../interfaces/User";
import { UserMenu } from "../components/UserMenu";
import {
  addOrIncrementWatched,
  getUserMovieStatus,
  resetWatched,
  toggleWatchLaterApi,
} from "../api/movie";
import { jwtDecode } from "jwt-decode";
import type { AuthPayload } from "../interfaces/AuthPayload";
import { Theme } from "../components/Theme";
import { Hamburger } from "../components/Hamburguer";
import { Slider } from "../components/Slider";
import { isTokenExpired } from "../lib/utils";

export default function MovieTracker() {
  const [movies, setMovies] = useState<Movie[]>(initialMovies);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState<
    "all" | "watched" | "watchLater"
  >("all");
  const [currentPage, setCurrentPage] = useState(1);
  const moviesPerPage = 25;
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showRegisterModal, setShowRegisterModal] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [currentSlide, setCurrentSlide] = useState(0);

  // Filtrar películas basado en búsqueda y estado
  const filteredMovies = useMemo(() => {
    let filtered = movies.filter(
      (movie) =>
        movie.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        movie.genre.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (filterStatus === "watched") {
      filtered = filtered.filter((movie) => movie.watchCount > 0);
    } else if (filterStatus === "watchLater") {
      filtered = filtered.filter((movie) => movie.watchLater);
    }

    return filtered;
  }, [movies, searchTerm, filterStatus]);

  const featuredMovies = initialMovies
    .sort((a, b) => b.rating - a.rating)
    .slice(0, 6)
    .map((movie) => ({
      ...movie,
      backdrop: `${movie.backdrop}&text=${encodeURIComponent(
        movie.title
      )}+Backdrop`,
    }));

  // Calcular paginación
  const totalPages = Math.ceil(filteredMovies.length / moviesPerPage);
  const startIndex = (currentPage - 1) * moviesPerPage;
  const endIndex = startIndex + moviesPerPage;
  const currentMovies = filteredMovies.slice(startIndex, endIndex);

  useEffect(() => {
    const token = localStorage.getItem("authToken");
    if (token && isTokenExpired(token)) {
      localStorage.removeItem("authToken");
      setUser(null);
      setShowLoginModal(true);
    }
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      // Llama a tu función para obtener el status de películas del usuario
      getUserMovieStatus();
    }, 1000); 
    return () => clearInterval(interval);
  }, []);

  // Auto-play del slider
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % featuredMovies.length);
    }, 6000);
    return () => clearInterval(interval);
  }, [featuredMovies]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, filterStatus]);

  useEffect(() => {
    const token = localStorage.getItem("authToken");
    if (token) {
      try {
        const decoded = jwtDecode<AuthPayload>(token);
        const user = {
          id: decoded.id,
          name: decoded.name,
          email: decoded.email,
          avatar: decoded.avatar,
        };
        setUser(user);
      } catch (e) {
        console.log(e);
        setUser(null);
      }
    }
  }, []);

  useEffect(() => {
    const token = localStorage.getItem("authToken");
    if (user && token) {
      getUserMovieStatus()
        .then((data) => {
          setMovies((prev) =>
            prev.map((movie) => ({
              ...movie,
              watchCount:
                data.moviesWatched.find(
                  (m: any) => String(m.movieId) === String(movie.id)
                )?.count || 0,
              watchLater: data.watchLater.includes(String(movie.id)),
            }))
          );
        })
        .catch((err) => {
          console.error("Error cargando estado de películas:", err);
        });
    }
  }, [user]);

  useEffect(() => {
    const savedTheme = localStorage.getItem("theme");
    if (
      savedTheme === "dark" ||
      (!savedTheme && window.matchMedia("(prefers-color-scheme: dark)").matches)
    ) {
      setIsDarkMode(true);
      document.documentElement.classList.add("dark");
    } else {
      setIsDarkMode(false);
      document.documentElement.classList.remove("dark");
    }
  }, []);

  const toggleTheme = () => {
    setIsDarkMode((prev) => {
      const next = !prev;
      if (next) {
        document.documentElement.classList.add("dark");
        localStorage.setItem("theme", "dark");
      } else {
        document.documentElement.classList.remove("dark");
        localStorage.setItem("theme", "light");
      }
      return next;
    });
  };

  const handleLogout = () => {
    // Limpiar usuario
    setUser(null);
    // Ocultar menú de usuario
    setShowUserMenu(false);
    // Eliminar token de sesión (token JWT)
    localStorage.removeItem("authToken");
    sessionStorage.removeItem("authToken");
    setMovies(initialMovies);
    setFilterStatus("all");
    setSearchTerm("");
    setCurrentPage(1);
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
  const incrementWatchCount = (id: number) => {
    setMovies(
      movies.map((movie) =>
        movie.id === id ? { ...movie, watchCount: movie.watchCount + 1 } : movie
      )
    );
    addOrIncrementWatched({ movieId: id.toString() });
  };

  // Resetear contador de veces vista
  const resetWatchCount = (id: number) => {
    setMovies(
      movies.map((movie) =>
        movie.id === id ? { ...movie, watchCount: 0 } : movie
      )
    );
    resetWatched({ movieId: id.toString() });
  };

  // Toggle watchLater status
  const toggleWatchLater = (id: number) => {
    setMovies(
      movies.map((movie) =>
        movie.id === id ? { ...movie, watchLater: !movie.watchLater } : movie
      )
    );
    toggleWatchLaterApi({ movieId: id.toString() });
  };

  // Estadísticas
  const stats = {
    total: movies.length,
    watched: movies.filter((m) => m.watchCount > 0).length, // Cambiar m.watched por m.watchCount > 0
    watchLater: movies.filter((m) => m.watchLater).length,
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-6">
          {/* Controles de navegación */}
          <div className="absolute top-4 right-4 flex items-center gap-2">
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
              <UserMenu
                user={user}
                logout={handleLogout}
                open={showUserMenu}
                setOpen={setShowUserMenu}
                isDarkMode={isDarkMode}
                setIsDarkMode={toggleTheme}
              />
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
                  total={stats.total}
                  watched={stats.watched}
                  watchLater={stats.watchLater}
                />
              </>
            )}

            {/* Barra de búsqueda */}
            <MovieSearchBar
              searchTerm={searchTerm}
              setSearchTerm={setSearchTerm}
            />

            {/* Filtros */}
            {user && (
              <>
                <MovieFilters
                  filterStatus={filterStatus}
                  setFilterStatus={setFilterStatus}
                  stats={stats}
                />
              </>
            )}
          </div>
        </div>
      </header>

      {/* Grid de películas */}
      <main className="container mx-auto px-4 py-8">
        {currentMovies.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">🔍</div>
            <h3 className="text-xl font-semibold mb-2">
              No se encontraron películas
            </h3>
            <p className="text-muted-foreground">
              {searchTerm
                ? `No hay resultados para "${searchTerm}"`
                : "No hay películas en esta categoría"}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 justify-items-center min-h-screen py-8">
            {currentMovies.map((movie) => (
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
          </div>
        )}
        {/* Paginación */}
        <Pagination
          totalPages={totalPages}
          currentPage={currentPage}
          setCurrentPage={setCurrentPage}
          filteredCount={filteredMovies.length}
        />
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
