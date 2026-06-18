import dotenv from "dotenv";

dotenv.config();

const DEFAULT_PORT = 3000;
const vercelUrl = process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : null;

export const env = {
  appName: process.env.APP_NAME ?? "The Archivist",
  nodeEnv: process.env.NODE_ENV ?? "development",
  port: Number(process.env.PORT ?? DEFAULT_PORT),
  sessionCookieName: process.env.SESSION_COOKIE_NAME ?? "archivist_session",
  sessionDays: Number(process.env.SESSION_DAYS ?? 14),
  demoUserEmail: process.env.DEMO_USER_EMAIL ?? "julian@archivist.app",
  demoUserPassword: process.env.DEMO_USER_PASSWORD ?? "Archivist123!",
  appBaseUrl: process.env.APP_BASE_URL ?? vercelUrl ?? `http://localhost:${process.env.PORT ?? DEFAULT_PORT}`
};

export function isProduction() {
  return env.nodeEnv === "production";
}
