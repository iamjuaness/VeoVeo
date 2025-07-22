import React, { createContext, useContext, useEffect, useState } from "react";
import {jwtDecode} from "jwt-decode";

interface UserPayload {
  id: string;
  name: string;
  email: string;
  avatar: string;
}

interface AuthContextType {
  user: UserPayload | null;
  token: string | null;
  login: (token: string) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Helper para obtener el usuario del token JWT
function getUserFromToken(token: string): UserPayload | null {
  try {
    return jwtDecode<UserPayload>(token);
  } catch {
    return null;
  }
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<UserPayload | null>(null);

  // Cargar user y token al iniciar la app
  useEffect(() => {
    const storedToken = localStorage.getItem("authToken") || sessionStorage.getItem("authToken");
    if (storedToken) {
      setToken(storedToken);
      setUser(getUserFromToken(storedToken));
    }
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
    <AuthContext.Provider value={{ user, token, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

// Custom hook para usar el contexto
export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth debe usarse dentro de <AuthProvider>");
  return ctx;
};
