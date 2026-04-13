import { findDictionaryEntryById } from "../models/dictionary-model.js";
import { createFlashcard, findFlashcardByUserAndEntry } from "../models/flashcard-model.js";
import {
  createSavedWord,
  countSavedWords,
  findSavedWordByUserAndEntry,
  getVocabularyStats,
  listSavedWords
} from "../models/vocabulary-model.js";
import { createId } from "../utils/ids.js";
import { notFound } from "../utils/http-error.js";
import { nowIso, toDateKey } from "../utils/time.js";
import { upsertDailyActivity } from "../models/progress-model.js";
import { lookupWord } from "./dictionary-service.js";

function ensureFlashcard(userId, entryId) {
  const existingCard = findFlashcardByUserAndEntry(userId, entryId);

  if (existingCard) {
    return existingCard;
  }

  return createFlashcard({
    id: createId("card"),
    user_id: userId,
    entry_id: entryId,
    state: "learning",
    interval_days: 0,
    ease_factor: 2.5,
    due_at: nowIso(),
    review_count: 0,
    lapse_count: 0,
    last_reviewed_at: null,
    created_at: nowIso(),
    updated_at: nowIso()
  });
}

export function saveVocabularyWord(userId, payload) {
  const dictionaryEntry = payload.entryId
    ? findDictionaryEntryById(payload.entryId)
    : payload.word
      ? { id: lookupWord(payload.word).id }
      : null;

  if (!dictionaryEntry) {
    throw notFound("Dictionary entry not found.");
  }

  const existingSavedWord = findSavedWordByUserAndEntry(userId, dictionaryEntry.id);

  const savedWord = createSavedWord({
    id: createId("saved"),
    user_id: userId,
    entry_id: dictionaryEntry.id,
    story_id: payload.storyId ?? null,
    chapter_id: payload.chapterId ?? null,
    source_word: payload.sourceWord ?? payload.word,
    context_sentence: payload.contextSentence ?? null,
    created_at: nowIso()
  });

  const flashcard = ensureFlashcard(userId, dictionaryEntry.id);

  if (!existingSavedWord) {
    upsertDailyActivity({
      id: createId("activity"),
      user_id: userId,
      activity_date: toDateKey(),
      words_saved: 1,
      minutes_studied: 0,
      flashcards_reviewed: 0,
      stories_completed: 0
    });
  }

  return {
    savedWord,
    flashcard
  };
}

export function getVocabularyOverview(userId, filters) {
  const page = Number(filters.page);
  const pageSize = Number(filters.pageSize);
  const items = listSavedWords({
    userId,
    search: filters.search,
    sort: filters.sort,
    limit: pageSize,
    offset: (page - 1) * pageSize
  });

  const stats = getVocabularyStats(userId, nowIso());
  const total = countSavedWords({ userId, search: filters.search });

  return {
    stats: {
      totalSaved: stats.total_saved ?? 0,
      dueNow: stats.due_now ?? 0,
      mastered: stats.mastered ?? 0
    },
    items: items.map((item) => ({
      id: item.id,
      sourceWord: item.source_word,
      lemma: item.lemma,
      translation: item.translation,
      partOfSpeech: item.part_of_speech,
      level: item.cefr_level,
      createdAt: item.created_at,
      dueAt: item.due_at,
      flashcardState: item.state,
      reviewCount: item.review_count
    })),
    pagination: {
      page,
      pageSize,
      total,
      totalPages: Math.max(1, Math.ceil(total / pageSize))
    }
  };
}
