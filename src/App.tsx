import "./App.css";
import AppRouter from "./AppRouter";
import { AuthProvider } from "./context/AuthContext";
import { MoviesProvider } from "./context/MoviesContext";
import { ThemeProvider } from "./context/ThemeContext";

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
