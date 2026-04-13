import crypto from "node:crypto";

import { env, isProduction } from "../config/env.js";

export function hashToken(value) {
  return crypto.createHash("sha256").update(value).digest("hex");
}

export function createSessionToken() {
  return crypto.randomBytes(32).toString("hex");
}

export function parseCookies(cookieHeader = "") {
  return cookieHeader
    .split(";")
    .map((part) => part.trim())
    .filter(Boolean)
    .reduce((accumulator, pair) => {
      const separatorIndex = pair.indexOf("=");

      if (separatorIndex === -1) {
        return accumulator;
      }

      const key = decodeURIComponent(pair.slice(0, separatorIndex));
      const value = decodeURIComponent(pair.slice(separatorIndex + 1));
      accumulator[key] = value;
      return accumulator;
    }, {});
}

export function serializeSessionCookie(token, expiresAt) {
  const cookieParts = [
    `${env.sessionCookieName}=${encodeURIComponent(token)}`,
    "Path=/",
    "HttpOnly",
    "SameSite=Lax",
    `Expires=${new Date(expiresAt).toUTCString()}`
  ];

  if (isProduction()) {
    cookieParts.push("Secure");
  }

  return cookieParts.join("; ");
}

export function clearSessionCookie() {
  const cookieParts = [
    `${env.sessionCookieName}=`,
    "Path=/",
    "HttpOnly",
    "SameSite=Lax",
    "Expires=Thu, 01 Jan 1970 00:00:00 GMT"
  ];

  if (isProduction()) {
    cookieParts.push("Secure");
  }

  return cookieParts.join("; ");
}
