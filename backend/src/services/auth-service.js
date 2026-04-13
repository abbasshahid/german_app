import bcrypt from "bcryptjs";

import { env } from "../config/env.js";
import { createSession, deleteSessionByTokenHash, listSessionsForUser } from "../models/session-model.js";
import { createUser, findUserAuthByEmail, findUserById } from "../models/user-model.js";
import { conflict, notFound, unauthorized } from "../utils/http-error.js";
import { createId } from "../utils/ids.js";
import { createSessionToken, hashToken } from "../utils/security.js";
import { addDays, nowIso } from "../utils/time.js";

function sanitizeUser(user) {
  if (!user) {
    return null;
  }

  return {
    id: user.id,
    name: user.name,
    email: user.email,
    cefrLevel: user.cefr_level,
    role: user.role,
    avatarUrl: user.avatar_url,
    dailyGoal: user.daily_goal,
    createdAt: user.created_at,
    updatedAt: user.updated_at
  };
}

function createUserSession(userId, context) {
  const token = createSessionToken();
  const expiresAt = addDays(nowIso(), env.sessionDays);

  createSession({
    id: createId("session"),
    user_id: userId,
    token_hash: hashToken(token),
    user_agent: context.userAgent,
    ip_address: context.ipAddress,
    created_at: nowIso(),
    last_seen_at: nowIso(),
    expires_at: expiresAt
  });

  return { token, expiresAt };
}

export function signup(payload, context) {
  const existingUser = findUserAuthByEmail(payload.email);

  if (existingUser) {
    throw conflict("An account with that email already exists.");
  }

  const timestamp = nowIso();
  const user = createUser({
    id: createId("usr"),
    name: payload.name,
    email: payload.email,
    password_hash: bcrypt.hashSync(payload.password, 10),
    cefr_level: payload.cefrLevel,
    role: "learner",
    avatar_url: null,
    daily_goal: 15,
    created_at: timestamp,
    updated_at: timestamp
  });

  const session = createUserSession(user.id, context);

  return {
    user: sanitizeUser(user),
    session
  };
}

export function login(payload, context) {
  const user = findUserAuthByEmail(payload.email);

  if (!user || !bcrypt.compareSync(payload.password, user.password_hash)) {
    throw unauthorized("Incorrect email or password.");
  }

  const session = createUserSession(user.id, context);

  return {
    user: sanitizeUser(user),
    session
  };
}

export function logout(token) {
  deleteSessionByTokenHash(hashToken(token));
}

export function getCurrentUser(userId) {
  const user = findUserById(userId);

  if (!user) {
    throw notFound("User not found.");
  }

  return sanitizeUser(user);
}

export function getUserSessions(userId) {
  return listSessionsForUser(userId);
}
