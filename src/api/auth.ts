import { dev_url } from "../utils/urls";

const API_URL = dev_url + "api/auth";

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
  if (result.token) {
    localStorage.setItem("authToken", result.token);
  } else {
    // Manejo de error
  }
  return result;
}
