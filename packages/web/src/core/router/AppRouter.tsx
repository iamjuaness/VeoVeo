// AppRouter.tsx
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import PrivateRoute from "../../shared/components/common/PrivateRoute.tsx";
import StatsPage from "../../features/stats/pages/StatsPage.tsx";
import MovieTracker from "../../features/movies/pages/MovieTracker";
import MovieDetailPage from "../../features/movies/pages/MovieDetailPage.tsx";
import SeriesTracker from "../../features/series/pages/SeriesTracker";
import SeriesDetailPage from "../../features/series/pages/SeriesDetailPage.tsx";

export default function AppRouter() {
  return (
    <BrowserRouter>
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
        <Route path="*" element={<Navigate to="/home" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
