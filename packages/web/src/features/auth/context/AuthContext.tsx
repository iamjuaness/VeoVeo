import React, { createContext, useEffect, useState, useMemo } from "react";
import { jwtDecode } from "jwt-decode";
import type { User } from "../../../interfaces/User";

interface AuthContextType {
  user: User | null;
  setUser: (user: User | null) => void;
  token: string | null;
  login: (token: string) => void;
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
  const [token, setToken] = useState<string | null>(null);
  const [rawUser, setRawUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Memoiza user para mantener referencia estable
  const user = useMemo(() => rawUser, [rawUser]);

  // Carga inicial de token y user desde almacenamiento
  useEffect(() => {
    const storedToken =
      localStorage.getItem("authToken") || sessionStorage.getItem("authToken");
    if (storedToken) {
      setToken(storedToken);
      setRawUser(getUserFromToken(storedToken));
    }
    setIsLoading(false);
  }, []);

  // Función para iniciar sesión
  const login = (jwt: string) => {
    localStorage.setItem("authToken", jwt);
    setToken(jwt);
    setRawUser(getUserFromToken(jwt));
  };

  // Función para cerrar sesión
  const logout = () => {
    localStorage.removeItem("authToken");
    sessionStorage.removeItem("authToken");
    setToken(null);
    setRawUser(null);
  };

  return (
    <AuthContext.Provider
      value={{ user, setUser: setRawUser, token, login, logout, isLoading }}
    >
      {children}
    </AuthContext.Provider>
  );
};
