import "./App.css";
import AppRouter from "./core/router/AppRouter";
import { AuthProvider } from "./features/auth/context/AuthContext";
import { MoviesProvider } from "./features/movies/context/MoviesContext";
import { ThemeProvider } from "./core/providers/ThemeContext";

function App() {
  return (
    <>
      <ThemeProvider>
        <AuthProvider>
          <MoviesProvider>
            <AppRouter />
          </MoviesProvider>
        </AuthProvider>
      </ThemeProvider>
    </>
  );
}

export default App;
