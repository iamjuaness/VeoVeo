// components/PrivateRoute.tsx
import { Navigate } from "react-router-dom";
import { isTokenExpired } from "../../lib/utils";
import type { ReactNode } from "react";
import { useAuth } from "../../../features/auth/hooks/useAuth";

export default function PrivateRoute({ children }: { children: ReactNode }) {
  const { accessToken, isLoading } = useAuth();

  if (isLoading) return null;

  if (!accessToken || isTokenExpired(accessToken)) {
    return <Navigate to="/" replace />;
  }
  return children;
}
