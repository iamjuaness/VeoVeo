import "./App.css";
import AppRouter from "./AppRouter";
import { AuthProvider } from "./context/AuthContext";
import { MoviesProvider } from "./context/MoviesContext";
import { ThemeProvider } from "./context/ThemeContext";
import { Analytics } from "@vercel/analytics/next"

function App() {
  return (
    <>
      <ThemeProvider>
        <AuthProvider>
          <MoviesProvider>
            <Analytics/>
            <AppRouter />
          </MoviesProvider>
        </AuthProvider>
      </ThemeProvider>
    </>
  );
}

export default App;
