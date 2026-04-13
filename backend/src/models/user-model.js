import { all, one, run } from "./base-model.js";

export function createUser(user) {
  run(
    `
      INSERT INTO users (
        id, name, email, password_hash, cefr_level, role, avatar_url, daily_goal, created_at, updated_at
      ) VALUES (
        @id, @name, @email, @password_hash, @cefr_level, @role, @avatar_url, @daily_goal, @created_at, @updated_at
      )
    `,
    user
  );

  return findUserById(user.id);
}

export function findUserById(id) {
  return one(
    `
      SELECT id, name, email, cefr_level, role, avatar_url, daily_goal, created_at, updated_at
      FROM users
      WHERE id = @id
    `,
    { id }
  );
}

export function findUserAuthByEmail(email) {
  return one(
    `
      SELECT *
      FROM users
      WHERE lower(email) = lower(@email)
    `,
    { email }
  );
}

export function updateUserProfile({ id, name, cefr_level, daily_goal, avatar_url, updated_at }) {
  run(
    `
      UPDATE users
      SET
        name = @name,
        cefr_level = @cefr_level,
        daily_goal = @daily_goal,
        avatar_url = @avatar_url,
        updated_at = @updated_at
      WHERE id = @id
    `,
    { id, name, cefr_level, daily_goal, avatar_url, updated_at }
  );

  return findUserById(id);
}

export function listAdminUsers() {
  return all(
    `
      SELECT id, name, email
      FROM users
      WHERE role = 'admin'
      ORDER BY created_at ASC
    `
  );
}
