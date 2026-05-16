// AppRouter.tsx
import { lazy, Suspense } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { BottomNav } from "../../shared/components/layout/BottomNav";
import PrivateRoute from "../../shared/components/common/PrivateRoute.tsx";
import { Loader2 } from "lucide-react";

import ErrorBoundary from "../../shared/components/ErrorBoundary";

// Lazy-loaded components
const StatsPage = lazy(() => import("../../features/stats/pages/StatsPage"));
const MovieTracker = lazy(
  () => import("../../features/movies/pages/MovieTracker")
);
const MovieDetailPage = lazy(
  () => import("../../features/movies/pages/MovieDetailPage")
);
const SeriesTracker = lazy(
  () => import("../../features/series/pages/SeriesTracker")
);
const SeriesDetailPage = lazy(
  () => import("../../features/series/pages/SeriesDetailPage")
);
const SocialPage = lazy(() => import("../../features/social/pages/SocialPage"));
const ProfilePage = lazy(() => import("../../features/auth/pages/ProfilePage"));

const PageLoader = () => (
  <div className="flex h-screen w-screen items-center justify-center bg-background">
    <Loader2 className="h-10 w-10 animate-spin text-primary" />
  </div>
);

const withErrorBoundary = (Component: React.ElementType) => (
  <ErrorBoundary>
    <Component />
  </ErrorBoundary>
);

export default function AppRouter() {
  return (
    <BrowserRouter>
      <Suspense fallback={<PageLoader />}>
        <Routes>
          <Route path="/home" element={withErrorBoundary(MovieTracker)} />
          <Route
            path="/stats"
            element={
              <ErrorBoundary>
                <PrivateRoute>
                  <StatsPage />
                </PrivateRoute>
              </ErrorBoundary>
            }
          />
          <Route path="/movie/:id" element={withErrorBoundary(MovieDetailPage)} />
          <Route path="/series" element={withErrorBoundary(SeriesTracker)} />
          <Route path="/series/:id" element={withErrorBoundary(SeriesDetailPage)} />
          <Route
            path="/social"
            element={
              <ErrorBoundary>
                <PrivateRoute>
                  <SocialPage />
                </PrivateRoute>
              </ErrorBoundary>
            }
          />
          <Route
            path="/profile"
            element={
              <ErrorBoundary>
                <PrivateRoute>
                  <ProfilePage />
                </PrivateRoute>
              </ErrorBoundary>
            }
          />
          <Route
            path="/profile/:id"
            element={
              <ErrorBoundary>
                <PrivateRoute>
                  <ProfilePage />
                </PrivateRoute>
              </ErrorBoundary>
            }
          />

          <Route path="*" element={<Navigate to="/home" replace />} />
        </Routes>
        <BottomNav />
      </Suspense>
    </BrowserRouter>
  );
}
