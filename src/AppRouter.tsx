// AppRouter.tsx
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import PrivateRoute from "./components/PrivateRoute";
import Stats from "./pages/Stats";
import MovieTracker from "./pages/MovieTracker";

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
        <Route path="*" element={<Navigate to="/home" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
