import { getCurrentUser, getUserSessions, login, logout, signup } from "../services/auth-service.js";
import { clearSessionCookie, serializeSessionCookie } from "../utils/security.js";

function requestContext(req) {
  return {
    userAgent: req.headers["user-agent"] ?? "unknown",
    ipAddress: req.ip
  };
}

export function signupController(req, res) {
  const result = signup(req.body, requestContext(req));

  res.setHeader("Set-Cookie", serializeSessionCookie(result.session.token, result.session.expiresAt));
  res.status(201).json(result);
}

export function loginController(req, res) {
  const result = login(req.body, requestContext(req));

  res.setHeader("Set-Cookie", serializeSessionCookie(result.session.token, result.session.expiresAt));
  res.json(result);
}

export function logoutController(req, res) {
  if (req.session?.token) {
    logout(req.session.token);
  }

  res.setHeader("Set-Cookie", clearSessionCookie());
  res.status(204).send();
}

export function currentUserController(req, res) {
  res.json({
    user: getCurrentUser(req.currentUser.id),
    sessions: getUserSessions(req.currentUser.id)
  });
}
