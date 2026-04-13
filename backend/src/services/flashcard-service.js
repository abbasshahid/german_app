import {
  countFlashcards,
  createFlashcardReview,
  findFlashcardById,
  updateFlashcard,
  listDueFlashcards
} from "../models/flashcard-model.js";
import { upsertDailyActivity } from "../models/progress-model.js";
import { createId } from "../utils/ids.js";
import { badRequest, notFound } from "../utils/http-error.js";
import { addDays, addHours, nowIso, toDateKey } from "../utils/time.js";

function ratingToSchedule(card, rating) {
  const reviewCount = card.review_count;
  const currentEase = card.ease_factor;

  if (rating === "again") {
    return {
      state: "learning",
      intervalDays: 0.04,
      easeFactor: Math.max(1.3, currentEase - 0.2),
      dueAt: addHours(nowIso(), 1),
      lapseCount: card.lapse_count + 1
    };
  }

  if (rating === "hard") {
    const intervalDays = reviewCount === 0 ? 2 : Math.max(2, Math.round(card.interval_days * 1.2));
    return {
      state: "review",
      intervalDays,
      easeFactor: Math.max(1.3, currentEase - 0.15),
      dueAt: addDays(nowIso(), intervalDays),
      lapseCount: card.lapse_count
    };
  }

  if (rating === "good") {
    const intervalDays = reviewCount === 0 ? 4 : Math.max(3, Math.round(card.interval_days * currentEase));
    return {
      state: "review",
      intervalDays,
      easeFactor: currentEase,
      dueAt: addDays(nowIso(), intervalDays),
      lapseCount: card.lapse_count
    };
  }

  if (rating === "easy") {
    const intervalDays = reviewCount === 0 ? 7 : Math.max(5, Math.round(card.interval_days * (currentEase + 0.3)));
    return {
      state: "review",
      intervalDays,
      easeFactor: currentEase + 0.15,
      dueAt: addDays(nowIso(), intervalDays),
      lapseCount: card.lapse_count
    };
  }

  throw badRequest("Unsupported flashcard rating.");
}

export function getFlashcardSession(userId, limit) {
  const parsedLimit = Number(limit);
  const cards = listDueFlashcards(userId, parsedLimit, nowIso());
  const totalCards = countFlashcards(userId);

  return {
    summary: {
      totalCards,
      sessionSize: cards.length
    },
    cards: cards.map((card, index) => ({
      id: card.id,
      position: index + 1,
      word: card.lemma,
      meaning: card.translation,
      partOfSpeech: card.part_of_speech,
      exampleGerman: card.example_de,
      exampleEnglish: card.example_en,
      level: card.cefr_level,
      dueAt: card.due_at,
      reviewCount: card.review_count
    }))
  };
}

export function reviewFlashcard(userId, flashcardId, rating) {
  const card = findFlashcardById(flashcardId);

  if (!card || card.user_id !== userId) {
    throw notFound("Flashcard not found.");
  }

  const schedule = ratingToSchedule(card, rating);
  const updatedCard = updateFlashcard({
    id: card.id,
    state: schedule.state,
    interval_days: schedule.intervalDays,
    ease_factor: schedule.easeFactor,
    due_at: schedule.dueAt,
    review_count: card.review_count + 1,
    lapse_count: schedule.lapseCount,
    last_reviewed_at: nowIso(),
    updated_at: nowIso()
  });

  createFlashcardReview({
    id: createId("review"),
    flashcard_id: updatedCard.id,
    user_id: userId,
    rating,
    due_before: card.due_at,
    next_due_at: updatedCard.due_at,
    interval_days: updatedCard.interval_days,
    ease_factor: updatedCard.ease_factor,
    created_at: nowIso()
  });

  upsertDailyActivity({
    id: createId("activity"),
    user_id: userId,
    activity_date: toDateKey(),
    words_saved: 0,
    minutes_studied: 0,
    flashcards_reviewed: 1,
    stories_completed: 0
  });

  return {
    flashcardId: updatedCard.id,
    rating,
    nextDueAt: updatedCard.due_at,
    intervalDays: updatedCard.interval_days,
    easeFactor: updatedCard.ease_factor,
    reviewCount: updatedCard.review_count
  };
}
