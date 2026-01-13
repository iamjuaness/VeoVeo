// AppRouter.tsx
import { lazy, Suspense } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { BottomNav } from "../../shared/components/layout/BottomNav";
import PrivateRoute from "../../shared/components/common/PrivateRoute.tsx";
import { Loader2 } from "lucide-react";

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

export default function AppRouter() {
  return (
    <BrowserRouter>
      <Suspense fallback={<PageLoader />}>
        <Routes>
          <Route path="/home" element={<MovieTracker />} />
          <Route
            path="/stats"
            element={
              <PrivateRoute>
                <StatsPage />
              </PrivateRoute>
            }
          />
          <Route path="/movie/:id" element={<MovieDetailPage />} />
          <Route path="/series" element={<SeriesTracker />} />
          <Route path="/series/:id" element={<SeriesDetailPage />} />
          <Route
            path="/social"
            element={
              <PrivateRoute>
                <SocialPage />
              </PrivateRoute>
            }
          />
          <Route
            path="/profile"
            element={
              <PrivateRoute>
                <ProfilePage />
              </PrivateRoute>
            }
          />
          <Route
            path="/profile/:id"
            element={
              <PrivateRoute>
                <ProfilePage />
              </PrivateRoute>
            }
          />

          <Route path="*" element={<Navigate to="/home" replace />} />
        </Routes>
        <BottomNav />
      </Suspense>
    </BrowserRouter>
  );
}
