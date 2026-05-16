import { API_BASE_URL } from "../../../shared/utils/urls";

const API_URL = API_BASE_URL + "api/auth";

export async function register(data: {
  name: string;
  email: string;
  password: string;
  passwordConfirm: string;
  selectedAvatar: string;
}) {
  const res = await fetch(`${API_URL}/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  const result = await res.json();

  if (!res.ok) {
    throw new Error(result.message || "Error en el registro");
  }

  if (result.accessToken && result.refreshToken) {
    localStorage.setItem("accessToken", result.accessToken);
    localStorage.setItem("refreshToken", result.refreshToken);
  }

  return result;
}

export async function login(data: { email: string; password: string }) {
  const res = await fetch(`${API_URL}/login`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });
  
  const result = await res.json();
  
  if (!res.ok) {
    throw new Error(result.message || "Error en la petición");
  }

  if (result.accessToken && result.refreshToken) {
    localStorage.setItem("accessToken", result.accessToken);
    localStorage.setItem("refreshToken", result.refreshToken);
  }
  
  return result;
}
