import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import type { AuthPayload } from "../../interfaces/AuthPayload";
import { jwtDecode } from "jwt-decode";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function isTokenExpired(token: string) {
  if (!token) return true;
  try {
    const decoded = jwtDecode<AuthPayload>(token);
    if (!decoded.exp) return true;
    return decoded.exp < Date.now() / 1000;
  } catch {
    return true;
  }
}