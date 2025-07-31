import React, { createContext, useEffect, useState } from "react";
import {jwtDecode} from "jwt-decode";
import type { User } from "../interfaces/User";

interface AuthContextType {
  user: User | null;
  setUser: (user: User | null) => void;
  token: string | null;
  login: (token: string) => void;
  logout: () => void;
  isLoading: boolean;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Helper para obtener el usuario del token JWT
function getUserFromToken(token: string): User | null {
  try {
    return jwtDecode<User>(token);
  } catch {
    return null;
  }
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Cargar user y token al iniciar la app
  useEffect(() => {
    const storedToken = localStorage.getItem("authToken") || sessionStorage.getItem("authToken");
    if (storedToken) {
      setToken(storedToken);
      setUser(getUserFromToken(storedToken));
    }
    setIsLoading(false);
  }, []);

  // Función para iniciar sesión y guardar token/user
  const login = (jwt: string) => {
    localStorage.setItem("authToken", jwt);
    setToken(jwt);
    setUser(getUserFromToken(jwt));
  };

  // Función para cerrar sesión
  const logout = () => {
    localStorage.removeItem("authToken");
    sessionStorage.removeItem("authToken");
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, setUser, token, login, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
};

