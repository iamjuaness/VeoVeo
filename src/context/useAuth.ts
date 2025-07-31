import { useContext } from "react";
import { AuthContext } from "./AuthContext";

// Custom hook para usar el contexto
export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth debe usarse dentro de <AuthProvider>");
  return ctx;
};