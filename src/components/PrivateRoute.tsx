// components/PrivateRoute.tsx
import { Navigate } from "react-router-dom";
import { isTokenExpired } from "../lib/utils";
import type { ReactNode } from "react";
import { useAuth } from "../context/useAuth";

export default function PrivateRoute({ children }: { children: ReactNode }) {
  const { token, isLoading } = useAuth();

  if (isLoading) return null;

  if (!token || isTokenExpired(token)) {
    return <Navigate to="/" replace />;
  }
  return children;
}
