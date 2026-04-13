import { api, ApiError } from "./api.js";

let cachedSession = null;

export async function getSession(force = false) {
  if (!force && cachedSession) {
    return cachedSession;
  }

  cachedSession = await api.get("/api/auth/me");
  return cachedSession;
}

export async function ensureAuthenticated() {
  try {
    return await getSession();
  } catch (error) {
    if (error instanceof ApiError && error.status === 401) {
      window.location.href = "/auth";
      return null;
    }

    throw error;
  }
}

export async function logout() {
  try {
    await api.post("/api/auth/logout");
  } finally {
    cachedSession = null;
    window.location.href = "/auth";
  }
}
