// AppRouter.tsx
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import PrivateRoute from "./components/PrivateRoute";
import Stats from "./pages/Stats";
import MovieTracker from "./pages/MovieTracker";
import MovieDetailPage from "./pages/MovieDetailPage";

export default function AppRouter() {


  return (
    <BrowserRouter>
      <Routes>
        <Route path="/home" element={<MovieTracker />} />
        <Route
          path="/stats"
          element={
            <PrivateRoute>
              <Stats />
            </PrivateRoute>
          }
        />
        <Route path="/movie/:id" element={<MovieDetailPage />} />
        <Route path="*" element={<Navigate to="/home" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
