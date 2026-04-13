import { upsertDailyActivity, upsertStoryProgress } from "../models/progress-model.js";
import { createId } from "../utils/ids.js";
import { nowIso, toDateKey } from "../utils/time.js";

export function updateReadingProgress(userId, payload) {
  const completedAt = payload.progressPercent >= 100 ? nowIso() : null;

  const progress = upsertStoryProgress({
    id: createId("progress"),
    user_id: userId,
    story_id: payload.storyId,
    chapter_id: payload.chapterId ?? null,
    progress_percent: payload.progressPercent,
    last_read_at: nowIso(),
    completed_at: completedAt
  });

  upsertDailyActivity({
    id: createId("activity"),
    user_id: userId,
    activity_date: toDateKey(),
    words_saved: 0,
    minutes_studied: payload.minutesStudied ?? 0,
    flashcards_reviewed: 0,
    stories_completed: payload.progressPercent >= 100 ? 1 : 0
  });

  return {
    progressPercent: progress.progress_percent,
    completedAt: progress.completed_at
  };
}
