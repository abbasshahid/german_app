import { env } from "../config/env.js";
import { deleteExpiredSessions, findSessionByTokenHash, touchSession } from "../models/session-model.js";
import { forbidden, unauthorized } from "../utils/http-error.js";
import { hashToken, parseCookies } from "../utils/security.js";
import { addDays, nowIso } from "../utils/time.js";

export function attachCurrentUser(req, _res, next) {
  const cookies = parseCookies(req.headers.cookie);
  const token = cookies[env.sessionCookieName];

  deleteExpiredSessions(nowIso());

  if (!token) {
    req.currentUser = null;
    req.session = null;
    next();
    return;
  }

  const tokenHash = hashToken(token);
  const session = findSessionByTokenHash(tokenHash);

  if (!session) {
    req.currentUser = null;
    req.session = null;
    next();
    return;
  }

  if (new Date(session.expires_at).getTime() <= Date.now()) {
    req.currentUser = null;
    req.session = null;
    next();
    return;
  }

  const refreshedExpiry = addDays(nowIso(), env.sessionDays);

  touchSession({
    token_hash: tokenHash,
    last_seen_at: nowIso(),
    expires_at: refreshedExpiry
  });

  req.session = { id: session.id, expiresAt: refreshedExpiry, token };
  req.currentUser = {
    id: session.user_id,
    name: session.name,
    email: session.email,
    cefr_level: session.cefr_level,
    role: session.role,
    avatar_url: session.avatar_url,
    daily_goal: session.daily_goal
  };

  next();
}

export function requireAuth(req, _res, next) {
  if (!req.currentUser) {
    next(unauthorized());
    return;
  }

  next();
}

export function requireAdmin(req, _res, next) {
  if (!req.currentUser) {
    next(unauthorized());
    return;
  }

  if (req.currentUser.role !== "admin") {
    next(forbidden("Admin role required."));
    return;
  }

  next();
}
