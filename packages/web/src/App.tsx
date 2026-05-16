import "./App.css";
import AppRouter from "./core/router/AppRouter";
import { AuthProvider } from "./features/auth/context/AuthContext";
import { MoviesProvider } from "./features/movies/context/MoviesContext";
import { SeriesProvider } from "./features/series/context/SeriesContext";
import { SocialProvider } from "./features/social/context/SocialContext";
import { ThemeProvider } from "./core/providers/ThemeContext";
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import ErrorBoundary from "./shared/components/ErrorBoundary";
import { Toaster } from 'sonner';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
      staleTime: 5 * 60 * 1000, // 5 minutes
    },
  },
});

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ErrorBoundary>
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
      </ErrorBoundary>
      <Toaster position="top-right" richColors closeButton />
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  );
}

export default App;
