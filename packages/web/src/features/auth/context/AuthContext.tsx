import React, { createContext, useEffect, useState, useMemo } from "react";
import { jwtDecode } from "jwt-decode";
import type { User } from "../../../interfaces/User";

interface AuthContextType {
  user: User | null;
  setUser: (user: User | null) => void;
  accessToken: string | null;
  refreshToken: string | null;
  login: (accessToken: string, refreshToken: string) => void;
  logout: () => void;
  isLoading: boolean;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

function getUserFromToken(token: string): User | null {
  try {
    return jwtDecode<User>(token);
  } catch {
    return null;
  }
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [refreshToken, setRefreshToken] = useState<string | null>(null);
  const [rawUser, setRawUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Memoiza user para mantener referencia estable
  const user = useMemo(() => rawUser, [rawUser]);

  // Carga inicial de tokens y user desde almacenamiento
  useEffect(() => {
    const storedAccessToken = localStorage.getItem("accessToken");
    const storedRefreshToken = localStorage.getItem("refreshToken");
    
    if (storedAccessToken && storedRefreshToken) {
      setAccessToken(storedAccessToken);
      setRefreshToken(storedRefreshToken);
      setRawUser(getUserFromToken(storedAccessToken));
    }
    setIsLoading(false);
  }, []);

  // Función para iniciar sesión
  const login = (access: string, refresh: string) => {
    localStorage.setItem("accessToken", access);
    localStorage.setItem("refreshToken", refresh);
    setAccessToken(access);
    setRefreshToken(refresh);
    setRawUser(getUserFromToken(access));
  };

  // Función para cerrar sesión
  const logout = () => {
    localStorage.removeItem("accessToken");
    localStorage.removeItem("refreshToken");
    setAccessToken(null);
    setRefreshToken(null);
    setRawUser(null);
  };

  // Escuchar evento de cierre de sesión global (p.ej. desde apiClient)
  useEffect(() => {
    const handleLogout = () => logout();
    window.addEventListener("auth-logout", handleLogout);
    return () => window.removeEventListener("auth-logout", handleLogout);
  }, []);

  return (
    <AuthContext.Provider
      value={{ 
        user, 
        setUser: setRawUser, 
        accessToken, 
        refreshToken, 
        login, 
        logout, 
        isLoading 
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
