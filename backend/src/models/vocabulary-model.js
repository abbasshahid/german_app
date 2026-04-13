import { all, one, run } from "./base-model.js";

export function createSavedWord(savedWord) {
  run(
    `
      INSERT OR IGNORE INTO saved_words (
        id, user_id, entry_id, story_id, chapter_id, source_word, context_sentence, created_at
      ) VALUES (
        @id, @user_id, @entry_id, @story_id, @chapter_id, @source_word, @context_sentence, @created_at
      )
    `,
    savedWord
  );

  return findSavedWordByUserAndEntry(savedWord.user_id, savedWord.entry_id);
}

export function findSavedWordByUserAndEntry(userId, entryId) {
  return one(
    `
      SELECT saved_words.*, dictionary_entries.lemma, dictionary_entries.translation, dictionary_entries.part_of_speech,
             dictionary_entries.cefr_level
      FROM saved_words
      INNER JOIN dictionary_entries ON dictionary_entries.id = saved_words.entry_id
      WHERE saved_words.user_id = @userId AND saved_words.entry_id = @entryId
      ORDER BY saved_words.created_at DESC
      LIMIT 1
    `,
    { userId, entryId }
  );
}

export function listSavedWords({
  userId,
  search = "",
  sort = "newest",
  limit = 20,
  offset = 0
}) {
  const orderClause =
    sort === "oldest"
      ? "saved_words.created_at ASC"
      : sort === "word"
        ? "dictionary_entries.lemma ASC"
        : "saved_words.created_at DESC";

  return all(
    `
      SELECT
        saved_words.id,
        saved_words.source_word,
        saved_words.context_sentence,
        saved_words.created_at,
        dictionary_entries.id AS entry_id,
        dictionary_entries.lemma,
        dictionary_entries.translation,
        dictionary_entries.part_of_speech,
        dictionary_entries.cefr_level,
        flashcards.due_at,
        flashcards.state,
        flashcards.review_count
      FROM saved_words
      INNER JOIN dictionary_entries ON dictionary_entries.id = saved_words.entry_id
      LEFT JOIN flashcards ON flashcards.entry_id = dictionary_entries.id AND flashcards.user_id = saved_words.user_id
      WHERE saved_words.user_id = @userId
        AND (
          @search = ''
          OR dictionary_entries.lemma LIKE '%' || @search || '%'
          OR dictionary_entries.translation LIKE '%' || @search || '%'
          OR saved_words.source_word LIKE '%' || @search || '%'
        )
      ORDER BY ${orderClause}
      LIMIT @limit OFFSET @offset
    `,
    { userId, search, limit, offset }
  );
}

export function countSavedWords({ userId, search = "" }) {
  return one(
    `
      SELECT COUNT(*) AS count
      FROM saved_words
      INNER JOIN dictionary_entries ON dictionary_entries.id = saved_words.entry_id
      WHERE saved_words.user_id = @userId
        AND (
          @search = ''
          OR dictionary_entries.lemma LIKE '%' || @search || '%'
          OR dictionary_entries.translation LIKE '%' || @search || '%'
          OR saved_words.source_word LIKE '%' || @search || '%'
        )
    `,
    { userId, search }
  ).count;
}

export function getVocabularyStats(userId, now) {
  return one(
    `
      SELECT
        COUNT(*) AS total_saved,
        SUM(CASE WHEN flashcards.due_at <= @now THEN 1 ELSE 0 END) AS due_now,
        SUM(CASE WHEN flashcards.review_count >= 4 THEN 1 ELSE 0 END) AS mastered
      FROM saved_words
      LEFT JOIN flashcards
        ON flashcards.entry_id = saved_words.entry_id
       AND flashcards.user_id = saved_words.user_id
      WHERE saved_words.user_id = @userId
    `,
    { userId, now }
  );
}
