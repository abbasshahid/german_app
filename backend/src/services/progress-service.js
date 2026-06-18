import { getStoryProgress, upsertDailyActivity, upsertStoryProgress } from "../models/progress-model.js";
import { createId } from "../utils/ids.js";
import { nowIso, toDateKey } from "../utils/time.js";

export function updateReadingProgress(userId, payload) {
  const previousProgress = getStoryProgress(userId, payload.storyId, payload.chapterId ?? null);
  const progressPercent = Math.max(previousProgress?.progress_percent ?? 0, payload.progressPercent);
  const completedAt = previousProgress?.completed_at ?? (progressPercent >= 100 ? nowIso() : null);
  const newlyCompleted = !previousProgress?.completed_at && progressPercent >= 100;

  const progress = upsertStoryProgress({
    id: createId("progress"),
    user_id: userId,
    story_id: payload.storyId,
    chapter_id: payload.chapterId ?? null,
    progress_percent: progressPercent,
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
    stories_completed: newlyCompleted ? 1 : 0
  });

  return {
    progressPercent: progress.progress_percent,
    completedAt: progress.completed_at
  };
}
