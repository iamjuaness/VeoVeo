import { API_BASE_URL } from "../../shared/utils/urls";

const AUTH_URL = API_BASE_URL + "api/auth";

interface RequestOptions extends RequestInit {
  headers?: Record<string, string>;
}

/**
 * Función interna para refrescar el token de acceso
 */
async function refreshAccessToken() {
  const refreshToken = localStorage.getItem("refreshToken");
  if (!refreshToken) return null;

  try {
    const res = await fetch(`${AUTH_URL}/refresh`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refreshToken }),
    });

    if (!res.ok) {
      // Si el refresh token también expiró o es inválido, limpiamos todo
      localStorage.removeItem("accessToken");
      localStorage.removeItem("refreshToken");
      window.dispatchEvent(new CustomEvent("auth-logout"));
      return null;
    }

    const data = await res.json();
    localStorage.setItem("accessToken", data.accessToken);
    localStorage.setItem("refreshToken", data.refreshToken);
    return data.accessToken;
  } catch (error) {
    console.error("Error refreshing token:", error);
    return null;
  }
}

/**
 * Wrapper de fetch que maneja automáticamente:
 * 1. Cabeceras de autenticación (Bearer Token)
 * 2. Renovación de token en caso de 401 (Unauthorized)
 * 3. Reintento de la petición original tras el refresh
 */
export async function apiClient(url: string, options: RequestOptions = {}) {
  const accessToken = localStorage.getItem("accessToken");

  // Preparar cabeceras iniciales
  const headers = {
    "Content-Type": "application/json",
    ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
    ...options.headers,
  };

  // Primera petición
  let res = await fetch(url, { ...options, headers });

  // Si recibimos 401, intentamos refrescar el token
  if (res.status === 401) {
    const newToken = await refreshAccessToken();
    
    if (newToken) {
      // Reintentar con el nuevo token
      const retryHeaders = {
        ...headers,
        Authorization: `Bearer ${newToken}`,
      };
      res = await fetch(url, { ...options, headers: retryHeaders });
    } else {
      // Si el refresh falló, el usuario debe volver a loguearse
      window.dispatchEvent(new CustomEvent("auth-logout"));
      console.warn("Sesión expirada. Por favor, inicia sesión de nuevo.");
    }
  }

  return res;
}
