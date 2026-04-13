import { listSessionsForUser } from "../models/session-model.js";
import { getDashboardCounts, getTotalMinutesStudied } from "../models/progress-model.js";
import { findUserById, updateUserProfile } from "../models/user-model.js";
import { notFound } from "../utils/http-error.js";
import { nowIso } from "../utils/time.js";

export function getProfile(userId) {
  const user = findUserById(userId);

  if (!user) {
    throw notFound("User not found.");
  }

  const counts = getDashboardCounts(userId, nowIso());

  return {
    id: user.id,
    name: user.name,
    email: user.email,
    cefrLevel: user.cefr_level,
    role: user.role,
    avatarUrl: user.avatar_url,
    dailyGoal: user.daily_goal,
    createdAt: user.created_at,
    stats: {
      wordsSaved: counts.words_saved,
      wordsMastered: counts.words_mastered,
      storiesCompleted: counts.stories_completed,
      totalMinutesStudied: getTotalMinutesStudied(userId)
    },
    sessions: listSessionsForUser(userId)
  };
}

export function updateProfile(userId, payload) {
  return updateUserProfile({
    id: userId,
    name: payload.name,
    cefr_level: payload.cefrLevel,
    daily_goal: payload.dailyGoal,
    avatar_url: payload.avatarUrl ?? null,
    updated_at: nowIso()
  });
}
