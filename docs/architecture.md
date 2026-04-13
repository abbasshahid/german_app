# Architecture and Screen Analysis

## 1. Screen Inventory

### `frontend/pages/dashboard.html`
- Purpose: learner home screen with greeting, streak, saved-word metrics, weekly activity, recommended stories, and next-module CTA.
- Data needed:
  - current user profile
  - streak and aggregate learning stats
  - weekly activity series
  - recommended stories by CEFR level
- Primary actions:
  - start daily lesson
  - browse recommended stories
  - switch into review flow
- Required endpoints:
  - `GET /api/auth/me`
  - `GET /api/dashboard`
  - `GET /api/stories/recommended`

### `frontend/pages/library.html`
- Purpose: searchable/filterable catalog of stories, essays, and dialogues.
- Data needed:
  - paginated story catalog
  - filters for level, genre, and duration
- Primary actions:
  - search stories
  - filter by level/genre/duration
  - open a story in reading mode
- Required endpoints:
  - `GET /api/stories`
  - `GET /api/stories/:slug`

### `frontend/pages/reading.html`
- Purpose: immersive reading view with word lookup, audio playback, chapter navigation, and progress tracking.
- Data needed:
  - story metadata
  - chapter content
  - story audio metadata
  - progress state for the current user
  - dictionary lookup data for clicked words
- Primary actions:
  - play story audio
  - click any word to translate
  - save vocabulary
  - move between chapters
  - continue reading and sync progress
- Required endpoints:
  - `GET /api/stories/:slug?chapter=1`
  - `GET /api/dictionary/lookup?word=...`
  - `POST /api/vocabulary/save`
  - `POST /api/progress/reading`
  - `GET /api/audio/word/:entryId`
  - `GET /api/audio/story/:storyId`

### `frontend/pages/vocabulary.html`
- Purpose: personal saved-word lexicon and launch point for spaced-repetition review.
- Data needed:
  - saved vocabulary list
  - counts for total saved, due now, mastered
  - search and sort controls
- Primary actions:
  - search saved words
  - sort saved words
  - start flashcard session
- Required endpoints:
  - `GET /api/vocabulary`
  - `GET /api/flashcards/session`

### `frontend/pages/flashcards.html`
- Purpose: active spaced-repetition session for vocabulary recall.
- Data needed:
  - due flashcards
  - flashcard side data: lemma, meaning, part of speech, examples
  - review scheduling results
- Primary actions:
  - play pronunciation
  - rate recall as `again`, `hard`, `good`, or `easy`
- Required endpoints:
  - `GET /api/flashcards/session`
  - `POST /api/flashcards/review`

## 2. Shared Components Identified

- App sidebar
- Top app bar
- Story cards
- Stat cards
- Filter chips
- Audio controls
- Toast/error messaging

The maintainable implementation moves these into reusable frontend modules under `frontend/assets/js/components`.

## 3. Frontend Structure

```text
frontend/
  pages/
    auth.html
    dashboard.html
    library.html
    reading.html
    vocabulary.html
    flashcards.html
    admin.html
  assets/
    js/
      api.js
      audio.js
      auth-page.js
      dashboard-page.js
      library-page.js
      reading-page.js
      session.js
      ui.js
      vocabulary-page.js
      flashcards-page.js
      tailwind-theme.js
      components/
        layout.js
        story-card.js
    styles/
      app.css
```

## 4. Backend Structure

```text
backend/
  src/
    app.js
    server.js
    config/
      env.js
    controllers/
    data/
      seed.js
    database/
      db.js
      schema.js
    middleware/
      auth.js
      error-handler.js
      not-found.js
      rate-limit.js
      request-context.js
      validate.js
    models/
    routes/
    services/
    utils/
```

## 5. Core Backend Modules

- Authentication and sessions
  - signup, login, logout, current session lookup
  - http-only session cookie backed by SQLite session records
- Profiles
  - current profile, daily goal, CEFR level, active sessions
- Story management
  - story library listing
  - story detail and chapters
  - admin story creation
- Dictionary and translation
  - lookup by normalized surface form
  - meaning, part of speech, grammar notes, example, audio metadata
- Vocabulary saving
  - saves clicked words to a personal lexicon
  - auto-creates a flashcard if one does not exist
- Flashcards
  - due-card session retrieval
  - spaced repetition review scheduling
- Progress tracking
  - reading progress sync
  - dashboard aggregates and streaks
- Audio metadata
  - word-level and story-level audio payloads
  - browser TTS fallback ready for provider replacement

## 6. Database Schema

### `users`
- `id`
- `name`
- `email`
- `password_hash`
- `cefr_level`
- `role`
- `avatar_url`
- `daily_goal`
- timestamps

### `sessions`
- `id`
- `user_id`
- `token_hash`
- `user_agent`
- `ip_address`
- `expires_at`
- timestamps

### `stories`
- `id`
- `slug`
- `title`
- `subtitle`
- `excerpt`
- `content_type`
- `cefr_level`
- `genre`
- `read_minutes`
- `word_count`
- `cover_image_url`
- `audio_text`
- `audio_url`
- feature/publish flags
- timestamps

### `story_chapters`
- `id`
- `story_id`
- `chapter_number`
- `title`
- `content_html`
- `image_url`

### `dictionary_entries`
- `id`
- `lemma`
- `normalized_lemma`
- `translation`
- `part_of_speech`
- `grammar_notes`
- `cefr_level`
- `example_de`
- `example_en`
- `audio_label`
- `audio_url`
- `related_words_json`

### `dictionary_forms`
- `id`
- `entry_id`
- `surface_form`
- `normalized_form`

### `saved_words`
- `id`
- `user_id`
- `entry_id`
- `story_id`
- `chapter_id`
- `source_word`
- `context_sentence`
- `created_at`

### `flashcards`
- `id`
- `user_id`
- `entry_id`
- `state`
- `interval_days`
- `ease_factor`
- `due_at`
- `review_count`
- `lapse_count`
- `last_reviewed_at`
- timestamps

### `flashcard_reviews`
- `id`
- `flashcard_id`
- `user_id`
- `rating`
- `due_before`
- `next_due_at`
- `interval_days`
- `ease_factor`
- `created_at`

### `story_progress`
- `id`
- `user_id`
- `story_id`
- `chapter_id`
- `progress_percent`
- `last_read_at`
- `completed_at`

### `daily_activity`
- `id`
- `user_id`
- `activity_date`
- `words_saved`
- `minutes_studied`
- `flashcards_reviewed`
- `stories_completed`

### `audio_assets`
- `id`
- `target_type`
- `target_id`
- `provider`
- `locale`
- `speech_text`
- `audio_url`
- `duration_seconds`

## 7. API Specification

### Auth
- `POST /api/auth/signup`
- `POST /api/auth/login`
- `POST /api/auth/logout`
- `GET /api/auth/me`

### Dashboard
- `GET /api/dashboard`

### Stories
- `GET /api/stories`
- `GET /api/stories/recommended`
- `GET /api/stories/:slug`

### Dictionary
- `GET /api/dictionary/lookup?word=alten`

### Vocabulary
- `GET /api/vocabulary`
- `POST /api/vocabulary/save`

### Flashcards
- `GET /api/flashcards/session`
- `POST /api/flashcards/review`

### Progress
- `POST /api/progress/reading`

### Profile
- `GET /api/profile`
- `PATCH /api/profile`

### Audio
- `GET /api/audio/word/:entryId`
- `GET /api/audio/story/:storyId`

### Admin
- `GET /api/admin/uploads`
- `POST /api/admin/stories`

## 8. Improvements Added Beyond the Raw Screens

- Added a real auth entry screen because the supplied Stitch screens assume a logged-in user state.
- Added an admin content studio page so new stories, essays, letters, and dialogues can be created from the browser.
- Turned the repeated shell elements into reusable frontend modules.
- Made the reading text fully clickable word-by-word instead of only partially annotated.
- Added session-backed auth rather than local-only dummy state.
- Added database seed data so the UI is immediately explorable.
- Consolidated the app into the `frontend/` pages and shared component modules instead of keeping duplicate root-level screen exports.

## 9. Remaining Production Follow-Ups

- Replace browser TTS fallback with a persistent audio provider such as Polly, Azure Speech, or OpenAI TTS.
- Add automated API and browser tests.
- Add CSRF protection if the app will be served cross-origin.
- Move SQLite to PostgreSQL for multi-instance deployments.
- Add file upload handling for covers and narrated audio assets.
