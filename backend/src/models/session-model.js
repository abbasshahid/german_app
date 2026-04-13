import { all, one, run } from "./base-model.js";

export function createSession(session) {
  run(
    `
      INSERT INTO sessions (
        id, user_id, token_hash, user_agent, ip_address, created_at, last_seen_at, expires_at
      ) VALUES (
        @id, @user_id, @token_hash, @user_agent, @ip_address, @created_at, @last_seen_at, @expires_at
      )
    `,
    session
  );

  return findSessionByTokenHash(session.token_hash);
}

export function findSessionByTokenHash(tokenHash) {
  return one(
    `
      SELECT sessions.*, users.name, users.email, users.cefr_level, users.role, users.avatar_url, users.daily_goal
      FROM sessions
      INNER JOIN users ON users.id = sessions.user_id
      WHERE sessions.token_hash = @tokenHash
    `,
    { tokenHash }
  );
}

export function touchSession({ token_hash, last_seen_at, expires_at }) {
  run(
    `
      UPDATE sessions
      SET last_seen_at = @last_seen_at, expires_at = @expires_at
      WHERE token_hash = @token_hash
    `,
    { token_hash, last_seen_at, expires_at }
  );
}

export function deleteSessionByTokenHash(tokenHash) {
  run("DELETE FROM sessions WHERE token_hash = @tokenHash", { tokenHash });
}

export function deleteExpiredSessions(now) {
  run("DELETE FROM sessions WHERE expires_at <= @now", { now });
}

export function listSessionsForUser(userId) {
  return all(
    `
      SELECT id, created_at, last_seen_at, expires_at, user_agent, ip_address
      FROM sessions
      WHERE user_id = @userId
      ORDER BY last_seen_at DESC
    `,
    { userId }
  );
}
