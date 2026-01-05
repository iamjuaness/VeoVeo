// AppRouter.tsx
import { lazy, Suspense } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import PrivateRoute from "../../shared/components/common/PrivateRoute.tsx";
import { Loader2 } from "lucide-react";

// Lazy-loaded components
const StatsPage = lazy(
  () => import("../../features/stats/pages/StatsPage.tsx")
);
const MovieTracker = lazy(
  () => import("../../features/movies/pages/MovieTracker")
);
const MovieDetailPage = lazy(
  () => import("../../features/movies/pages/MovieDetailPage.tsx")
);
const SeriesTracker = lazy(
  () => import("../../features/series/pages/SeriesTracker")
);
const SeriesDetailPage = lazy(
  () => import("../../features/series/pages/SeriesDetailPage.tsx")
);
const SocialPage = lazy(
  () => import("../../features/social/pages/SocialPage.tsx")
);

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
          <Route path="*" element={<Navigate to="/home" replace />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}
