import { all, one, run } from "./base-model.js";

export function getStoryProgress(userId, storyId, chapterId = null) {
  return one(
    `
      SELECT *
      FROM story_progress
      WHERE user_id = @userId AND story_id = @storyId AND (
        (@chapterId IS NULL AND chapter_id IS NULL) OR chapter_id = @chapterId
      )
    `,
    { userId, storyId, chapterId }
  );
}

export function upsertStoryProgress(progress) {
  run(
    `
      INSERT INTO story_progress (
        id, user_id, story_id, chapter_id, progress_percent, last_read_at, completed_at
      ) VALUES (
        @id, @user_id, @story_id, @chapter_id, @progress_percent, @last_read_at, @completed_at
      )
      ON CONFLICT(user_id, story_id, chapter_id)
      DO UPDATE SET
        progress_percent = excluded.progress_percent,
        last_read_at = excluded.last_read_at,
        completed_at = excluded.completed_at
    `,
    progress
  );

  return getStoryProgress(progress.user_id, progress.story_id, progress.chapter_id ?? null);
}

export function upsertDailyActivity(activity) {
  run(
    `
      INSERT INTO daily_activity (
        id, user_id, activity_date, words_saved, minutes_studied, flashcards_reviewed, stories_completed
      ) VALUES (
        @id, @user_id, @activity_date, @words_saved, @minutes_studied, @flashcards_reviewed, @stories_completed
      )
      ON CONFLICT(user_id, activity_date)
      DO UPDATE SET
        words_saved = words_saved + excluded.words_saved,
        minutes_studied = minutes_studied + excluded.minutes_studied,
        flashcards_reviewed = flashcards_reviewed + excluded.flashcards_reviewed,
        stories_completed = stories_completed + excluded.stories_completed
    `,
    activity
  );
}

export function listRecentActivity(userId, fromDate) {
  return all(
    `
      SELECT *
      FROM daily_activity
      WHERE user_id = @userId AND activity_date >= @fromDate
      ORDER BY activity_date ASC
    `,
    { userId, fromDate }
  );
}

export function getDashboardCounts(userId, now) {
  return one(
    `
      SELECT
        (SELECT COUNT(*) FROM saved_words WHERE user_id = @userId) AS words_saved,
        (SELECT COUNT(*) FROM flashcards WHERE user_id = @userId AND review_count >= 4) AS words_mastered,
        (SELECT COUNT(*) FROM story_progress WHERE user_id = @userId AND completed_at IS NOT NULL) AS stories_completed,
        (SELECT COUNT(*) FROM flashcards WHERE user_id = @userId AND due_at <= @now) AS due_reviews
    `,
    { userId, now }
  );
}

export function getTotalMinutesStudied(userId) {
  return one(
    `
      SELECT COALESCE(SUM(minutes_studied), 0) AS total_minutes
      FROM daily_activity
      WHERE user_id = @userId
    `,
    { userId }
  ).total_minutes;
}
