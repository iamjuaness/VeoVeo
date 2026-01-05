import "./App.css";
import AppRouter from "./core/router/AppRouter";
import { AuthProvider } from "./features/auth/context/AuthContext";
import { MoviesProvider } from "./features/movies/context/MoviesContext";
import { SeriesProvider } from "./features/series/context/SeriesContext";
import { SocialProvider } from "./features/social/context/SocialContext";
import { ThemeProvider } from "./core/providers/ThemeContext";

function App() {
  return (
    <>
      <ThemeProvider>
        <AuthProvider>
          <MoviesProvider>
            <SeriesProvider>
              <SocialProvider>
                <AppRouter />
              </SocialProvider>
            </SeriesProvider>
          </MoviesProvider>
        </AuthProvider>
      </ThemeProvider>
    </>
  );
}

export default App;
