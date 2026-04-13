import { DatabaseSync } from "node:sqlite";

import bcrypt from "bcryptjs";

import { databasePath, ensureDataDirectories } from "../config/storage-paths.js";
import { env } from "../config/env.js";
import { seedData } from "../data/seed.js";
import { logger } from "../utils/logger.js";
import { nowIso } from "../utils/time.js";
import { normalizeWord } from "../utils/strings.js";
import { schemaSql } from "./schema.js";

ensureDataDirectories();

export const db = new DatabaseSync(databasePath);

db.exec("PRAGMA journal_mode = WAL; PRAGMA foreign_keys = ON;");

function seedKey(value) {
  return normalizeWord(value)
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .replaceAll("ß", "ss")
    .replace(/[^\p{L}\p{N}]+/gu, "_");
}

export function initDatabase() {
  db.exec(schemaSql);
  ensureSeedData();
  logger.info("database_ready", { databasePath });
}

function ensureSeedData() {
  const timestamp = nowIso();
  const passwordHash = bcrypt.hashSync(env.demoUserPassword, 10);

  const userByEmail = db.prepare("SELECT id FROM users WHERE email = @email");
  const storyBySlug = db.prepare("SELECT id FROM stories WHERE slug = @slug");
  const chapterByStoryAndNumber = db.prepare(
    "SELECT id FROM story_chapters WHERE story_id = @story_id AND chapter_number = @chapter_number"
  );
  const dictionaryByLemma = db.prepare("SELECT id FROM dictionary_entries WHERE lemma = @lemma");
  const hasAudioAsset = db.prepare(
    "SELECT id FROM audio_assets WHERE target_type = @target_type AND target_id = @target_id LIMIT 1"
  );

  db.prepare(`
    INSERT OR IGNORE INTO users (
      id, name, email, password_hash, cefr_level, role, avatar_url, daily_goal, created_at, updated_at
    ) VALUES (
      @id, @name, @email, @password_hash, @cefr_level, @role, @avatar_url, @daily_goal, @created_at, @updated_at
    )
  `).run({
    id: "usr_demo",
    name: "Julian Barnes",
    email: env.demoUserEmail,
    password_hash: passwordHash,
    cefr_level: "B2",
    role: "admin",
    avatar_url:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuCSl-t4u4DBWEc6iwUS1MyCLU4JGtgeTIF2YLdb5XxVOm23UmwPp_v1f3CJU3ta1uKPViKBM4eWbyLW-puv9EjZoKoWzfjVcMF8rV4LDWq6asX-XRM1CzpPFb-NRnI6W--rcBL43alkYdV6iVGcanXSYnmSnqFdDH3hi9LI1BqR2G0mjqUQ-Czo0UvrP7SJEULwAU-im4eDjoFWyFLx9c32Kb22YVtLj_2hpamBdJusKpis__ECcIg9bghYiwVWW5GqKc-s7fHdBfo",
    daily_goal: 20,
    created_at: timestamp,
    updated_at: timestamp
  });

  const demoUserId = userByEmail.get({ email: env.demoUserEmail }).id;

  const insertStory = db.prepare(`
    INSERT OR IGNORE INTO stories (
      id, slug, title, subtitle, excerpt, content_type, cefr_level, genre, read_minutes, word_count,
      cover_image_url, audio_text, audio_url, is_featured, is_published, created_at, updated_at
    ) VALUES (
      @id, @slug, @title, @subtitle, @excerpt, @content_type, @cefr_level, @genre, @read_minutes, @word_count,
      @cover_image_url, @audio_text, @audio_url, @is_featured, @is_published, @created_at, @updated_at
    )
  `);

  const insertChapter = db.prepare(`
    INSERT OR IGNORE INTO story_chapters (
      id, story_id, chapter_number, title, content_html, image_url, created_at
    ) VALUES (
      @id, @story_id, @chapter_number, @title, @content_html, @image_url, @created_at
    )
  `);

  const insertDictionaryEntry = db.prepare(`
    INSERT OR IGNORE INTO dictionary_entries (
      id, lemma, normalized_lemma, translation, part_of_speech, grammar_notes, cefr_level, example_de,
      example_en, audio_label, audio_url, related_words_json, created_at, updated_at
    ) VALUES (
      @id, @lemma, @normalized_lemma, @translation, @part_of_speech, @grammar_notes, @cefr_level, @example_de,
      @example_en, @audio_label, @audio_url, @related_words_json, @created_at, @updated_at
    )
  `);

  const insertDictionaryForm = db.prepare(`
    INSERT OR IGNORE INTO dictionary_forms (
      id, entry_id, surface_form, normalized_form
    ) VALUES (
      @id, @entry_id, @surface_form, @normalized_form
    )
  `);

  const insertAudioAsset = db.prepare(`
    INSERT INTO audio_assets (
      id, target_type, target_id, provider, locale, speech_text, audio_url, duration_seconds, created_at
    ) VALUES (
      @id, @target_type, @target_id, @provider, @locale, @speech_text, @audio_url, @duration_seconds, @created_at
    )
  `);

  const insertSavedWord = db.prepare(`
    INSERT OR IGNORE INTO saved_words (
      id, user_id, entry_id, story_id, chapter_id, source_word, context_sentence, created_at
    ) VALUES (
      @id, @user_id, @entry_id, @story_id, @chapter_id, @source_word, @context_sentence, @created_at
    )
  `);

  const insertFlashcard = db.prepare(`
    INSERT OR IGNORE INTO flashcards (
      id, user_id, entry_id, state, interval_days, ease_factor, due_at, review_count, lapse_count,
      last_reviewed_at, created_at, updated_at
    ) VALUES (
      @id, @user_id, @entry_id, @state, @interval_days, @ease_factor, @due_at, @review_count, @lapse_count,
      @last_reviewed_at, @created_at, @updated_at
    )
  `);

  const insertProgress = db.prepare(`
    INSERT OR IGNORE INTO story_progress (
      id, user_id, story_id, chapter_id, progress_percent, last_read_at, completed_at
    ) VALUES (
      @id, @user_id, @story_id, @chapter_id, @progress_percent, @last_read_at, @completed_at
    )
  `);

  const insertActivity = db.prepare(`
    INSERT OR IGNORE INTO daily_activity (
      id, user_id, activity_date, words_saved, minutes_studied, flashcards_reviewed, stories_completed
    ) VALUES (
      @id, @user_id, @activity_date, @words_saved, @minutes_studied, @flashcards_reviewed, @stories_completed
    )
  `);

  const storyLookup = {};
  const chapterLookup = {};
  const dictionaryLookup = {};

  for (const story of seedData.stories) {
    insertStory.run({
      id: `story_${story.slug}`,
      slug: story.slug,
      title: story.title,
      subtitle: story.subtitle,
      excerpt: story.excerpt,
      content_type: story.content_type,
      cefr_level: story.cefr_level,
      genre: story.genre,
      read_minutes: story.read_minutes,
      word_count: story.word_count,
      cover_image_url: story.cover_image_url,
      audio_text: story.audio_text,
      audio_url: story.audio_url,
      is_featured: story.is_featured,
      is_published: story.is_published,
      created_at: timestamp,
      updated_at: timestamp
    });

    const storyId = storyBySlug.get({ slug: story.slug }).id;
    storyLookup[story.slug] = storyId;

    if (story.audio_text && !hasAudioAsset.get({ target_type: "story", target_id: storyId })) {
      insertAudioAsset.run({
        id: `audio_story_${story.slug}`,
        target_type: "story",
        target_id: storyId,
        provider: "browser-tts",
        locale: "de-DE",
        speech_text: story.audio_text,
        audio_url: null,
        duration_seconds: story.read_minutes * 60,
        created_at: timestamp
      });
    }

    for (const chapter of story.chapters) {
      insertChapter.run({
        id: `chapter_${story.slug}_${chapter.chapter_number}`,
        story_id: storyId,
        chapter_number: chapter.chapter_number,
        title: chapter.title,
        content_html: chapter.content_html,
        image_url: chapter.image_url ?? null,
        created_at: timestamp
      });

      const chapterId = chapterByStoryAndNumber.get({
        story_id: storyId,
        chapter_number: chapter.chapter_number
      }).id;
      chapterLookup[`${story.slug}:${chapter.chapter_number}`] = chapterId;

      if (story.slug === "der-schatten-des-archivars" && chapter.chapter_number === 1) {
        insertProgress.run({
          id: `progress_${story.slug}_${chapter.chapter_number}_${demoUserId}`,
          user_id: demoUserId,
          story_id: storyId,
          chapter_id: chapterId,
          progress_percent: 25,
          last_read_at: timestamp,
          completed_at: null
        });
      }
    }
  }

  for (const entry of seedData.dictionaryEntries) {
    insertDictionaryEntry.run({
      id: `dict_${seedKey(entry.lemma)}`,
      lemma: entry.lemma,
      normalized_lemma: normalizeWord(entry.lemma),
      translation: entry.translation,
      part_of_speech: entry.part_of_speech,
      grammar_notes: entry.grammar_notes,
      cefr_level: entry.cefr_level,
      example_de: entry.example_de,
      example_en: entry.example_en,
      audio_label: entry.audio_label ?? entry.lemma,
      audio_url: null,
      related_words_json: JSON.stringify(entry.related_words ?? []),
      created_at: timestamp,
      updated_at: timestamp
    });

    const entryId = dictionaryByLemma.get({ lemma: entry.lemma }).id;
    dictionaryLookup[entry.lemma] = entryId;

    if (!hasAudioAsset.get({ target_type: "word", target_id: entryId })) {
      insertAudioAsset.run({
        id: `audio_word_${seedKey(entry.lemma)}`,
        target_type: "word",
        target_id: entryId,
        provider: "browser-tts",
        locale: "de-DE",
        speech_text: entry.audio_label ?? entry.lemma,
        audio_url: null,
        duration_seconds: 4,
        created_at: timestamp
      });
    }

    for (const form of [entry.lemma, ...(entry.forms ?? [])]) {
      insertDictionaryForm.run({
        id: `form_${seedKey(entry.lemma)}_${seedKey(form)}`,
        entry_id: entryId,
        surface_form: form,
        normalized_form: normalizeWord(form)
      });
    }
  }

  for (const savedWord of seedData.savedWords) {
    insertSavedWord.run({
      id: `saved_${demoUserId}_${seedKey(savedWord.source_word)}`,
      user_id: demoUserId,
      entry_id: dictionaryLookup[savedWord.lemma],
      story_id: storyLookup[savedWord.story_slug],
      chapter_id: chapterLookup[`${savedWord.story_slug}:${savedWord.chapter_number}`],
      source_word: savedWord.source_word,
      context_sentence: savedWord.context_sentence,
      created_at: savedWord.created_at
    });
  }

  for (const flashcard of seedData.flashcards) {
    insertFlashcard.run({
      id: `card_${demoUserId}_${seedKey(flashcard.lemma)}`,
      user_id: demoUserId,
      entry_id: dictionaryLookup[flashcard.lemma],
      state: flashcard.state,
      interval_days: flashcard.interval_days,
      ease_factor: flashcard.ease_factor,
      due_at: flashcard.due_at,
      review_count: flashcard.review_count,
      lapse_count: flashcard.lapse_count,
      last_reviewed_at: flashcard.last_reviewed_at,
      created_at: timestamp,
      updated_at: timestamp
    });
  }

  for (const activity of seedData.dailyActivity) {
    insertActivity.run({
      id: `activity_${demoUserId}_${activity.activity_date}`,
      user_id: demoUserId,
      activity_date: activity.activity_date,
      words_saved: activity.words_saved,
      minutes_studied: activity.minutes_studied,
      flashcards_reviewed: activity.flashcards_reviewed,
      stories_completed: activity.stories_completed
    });
  }
}
