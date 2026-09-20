import { auth } from "./firebase";

export const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ?? "http://localhost:5000";

export function buildApiUrl(path) {
  if (!path.startsWith("/")) {
    return `${API_BASE_URL}/${path}`;
  }

  return `${API_BASE_URL}${path}`;
}

export async function getAuthToken(forceRefresh = false) {
  const currentUser = auth.currentUser;

  if (!currentUser) {
    throw new Error("User is not authenticated");
  }

  return currentUser.getIdToken(forceRefresh);
}

export async function getAuthHeaders(extraHeaders = {}) {
  const token = await getAuthToken();

  return {
    Authorization: `Bearer ${token}`,
    ...extraHeaders,
  };
}

export function buildAssetUrl(path) {
  if (!path) {
    return "";
  }

  return `${API_BASE_URL}${path}`;
}