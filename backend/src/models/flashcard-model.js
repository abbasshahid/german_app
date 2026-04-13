import { all, one, run } from "./base-model.js";

export function findFlashcardById(id) {
  return one("SELECT * FROM flashcards WHERE id = @id", { id });
}

export function findFlashcardByUserAndEntry(userId, entryId) {
  return one(
    `
      SELECT *
      FROM flashcards
      WHERE user_id = @userId AND entry_id = @entryId
    `,
    { userId, entryId }
  );
}

export function createFlashcard(flashcard) {
  run(
    `
      INSERT INTO flashcards (
        id, user_id, entry_id, state, interval_days, ease_factor, due_at, review_count, lapse_count,
        last_reviewed_at, created_at, updated_at
      ) VALUES (
        @id, @user_id, @entry_id, @state, @interval_days, @ease_factor, @due_at, @review_count, @lapse_count,
        @last_reviewed_at, @created_at, @updated_at
      )
    `,
    flashcard
  );

  return findFlashcardById(flashcard.id);
}

export function updateFlashcard(flashcard) {
  run(
    `
      UPDATE flashcards
      SET
        state = @state,
        interval_days = @interval_days,
        ease_factor = @ease_factor,
        due_at = @due_at,
        review_count = @review_count,
        lapse_count = @lapse_count,
        last_reviewed_at = @last_reviewed_at,
        updated_at = @updated_at
      WHERE id = @id
    `,
    flashcard
  );

  return findFlashcardById(flashcard.id);
}

export function listDueFlashcards(userId, limit = 20, now) {
  return all(
    `
      SELECT
        flashcards.*,
        dictionary_entries.lemma,
        dictionary_entries.translation,
        dictionary_entries.part_of_speech,
        dictionary_entries.example_de,
        dictionary_entries.example_en,
        dictionary_entries.cefr_level
      FROM flashcards
      INNER JOIN dictionary_entries ON dictionary_entries.id = flashcards.entry_id
      WHERE flashcards.user_id = @userId
        AND flashcards.due_at <= @now
      ORDER BY flashcards.due_at ASC, flashcards.review_count ASC
      LIMIT @limit
    `,
    { userId, limit, now }
  );
}

export function countFlashcards(userId) {
  return one("SELECT COUNT(*) AS count FROM flashcards WHERE user_id = @userId", { userId }).count;
}

export function createFlashcardReview(review) {
  run(
    `
      INSERT INTO flashcard_reviews (
        id, flashcard_id, user_id, rating, due_before, next_due_at, interval_days, ease_factor, created_at
      ) VALUES (
        @id, @flashcard_id, @user_id, @rating, @due_before, @next_due_at, @interval_days, @ease_factor, @created_at
      )
    `,
    review
  );
}
