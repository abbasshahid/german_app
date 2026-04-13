export const schemaSql = `
  PRAGMA foreign_keys = ON;

  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    cefr_level TEXT NOT NULL DEFAULT 'B1',
    role TEXT NOT NULL DEFAULT 'learner',
    avatar_url TEXT,
    daily_goal INTEGER NOT NULL DEFAULT 15,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS sessions (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    token_hash TEXT NOT NULL UNIQUE,
    user_agent TEXT,
    ip_address TEXT,
    created_at TEXT NOT NULL,
    last_seen_at TEXT NOT NULL,
    expires_at TEXT NOT NULL,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS stories (
    id TEXT PRIMARY KEY,
    slug TEXT NOT NULL UNIQUE,
    title TEXT NOT NULL,
    subtitle TEXT,
    excerpt TEXT NOT NULL,
    content_type TEXT NOT NULL,
    cefr_level TEXT NOT NULL,
    genre TEXT NOT NULL,
    read_minutes INTEGER NOT NULL,
    word_count INTEGER NOT NULL,
    cover_image_url TEXT,
    audio_text TEXT,
    audio_url TEXT,
    is_featured INTEGER NOT NULL DEFAULT 0,
    is_published INTEGER NOT NULL DEFAULT 1,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS story_chapters (
    id TEXT PRIMARY KEY,
    story_id TEXT NOT NULL,
    chapter_number INTEGER NOT NULL,
    title TEXT NOT NULL,
    content_html TEXT NOT NULL,
    image_url TEXT,
    created_at TEXT NOT NULL,
    UNIQUE (story_id, chapter_number),
    FOREIGN KEY (story_id) REFERENCES stories(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS dictionary_entries (
    id TEXT PRIMARY KEY,
    lemma TEXT NOT NULL UNIQUE,
    normalized_lemma TEXT NOT NULL UNIQUE,
    translation TEXT NOT NULL,
    part_of_speech TEXT NOT NULL,
    grammar_notes TEXT,
    cefr_level TEXT NOT NULL,
    example_de TEXT NOT NULL,
    example_en TEXT NOT NULL,
    audio_label TEXT,
    audio_url TEXT,
    related_words_json TEXT NOT NULL DEFAULT '[]',
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS dictionary_forms (
    id TEXT PRIMARY KEY,
    entry_id TEXT NOT NULL,
    surface_form TEXT NOT NULL,
    normalized_form TEXT NOT NULL,
    UNIQUE (entry_id, normalized_form),
    FOREIGN KEY (entry_id) REFERENCES dictionary_entries(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS saved_words (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    entry_id TEXT NOT NULL,
    story_id TEXT,
    chapter_id TEXT,
    source_word TEXT NOT NULL,
    context_sentence TEXT,
    created_at TEXT NOT NULL,
    UNIQUE (user_id, entry_id, source_word),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (entry_id) REFERENCES dictionary_entries(id) ON DELETE CASCADE,
    FOREIGN KEY (story_id) REFERENCES stories(id) ON DELETE SET NULL,
    FOREIGN KEY (chapter_id) REFERENCES story_chapters(id) ON DELETE SET NULL
  );

  CREATE TABLE IF NOT EXISTS flashcards (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    entry_id TEXT NOT NULL,
    state TEXT NOT NULL DEFAULT 'learning',
    interval_days REAL NOT NULL DEFAULT 0,
    ease_factor REAL NOT NULL DEFAULT 2.5,
    due_at TEXT NOT NULL,
    review_count INTEGER NOT NULL DEFAULT 0,
    lapse_count INTEGER NOT NULL DEFAULT 0,
    last_reviewed_at TEXT,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    UNIQUE (user_id, entry_id),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (entry_id) REFERENCES dictionary_entries(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS flashcard_reviews (
    id TEXT PRIMARY KEY,
    flashcard_id TEXT NOT NULL,
    user_id TEXT NOT NULL,
    rating TEXT NOT NULL,
    due_before TEXT NOT NULL,
    next_due_at TEXT NOT NULL,
    interval_days REAL NOT NULL,
    ease_factor REAL NOT NULL,
    created_at TEXT NOT NULL,
    FOREIGN KEY (flashcard_id) REFERENCES flashcards(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS story_progress (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    story_id TEXT NOT NULL,
    chapter_id TEXT,
    progress_percent INTEGER NOT NULL DEFAULT 0,
    last_read_at TEXT NOT NULL,
    completed_at TEXT,
    UNIQUE (user_id, story_id, chapter_id),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (story_id) REFERENCES stories(id) ON DELETE CASCADE,
    FOREIGN KEY (chapter_id) REFERENCES story_chapters(id) ON DELETE SET NULL
  );

  CREATE TABLE IF NOT EXISTS daily_activity (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    activity_date TEXT NOT NULL,
    words_saved INTEGER NOT NULL DEFAULT 0,
    minutes_studied INTEGER NOT NULL DEFAULT 0,
    flashcards_reviewed INTEGER NOT NULL DEFAULT 0,
    stories_completed INTEGER NOT NULL DEFAULT 0,
    UNIQUE (user_id, activity_date),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS audio_assets (
    id TEXT PRIMARY KEY,
    target_type TEXT NOT NULL,
    target_id TEXT NOT NULL,
    provider TEXT NOT NULL DEFAULT 'browser-tts',
    locale TEXT NOT NULL DEFAULT 'de-DE',
    speech_text TEXT NOT NULL,
    audio_url TEXT,
    duration_seconds INTEGER,
    created_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS admin_uploads (
    id TEXT PRIMARY KEY,
    uploaded_by TEXT NOT NULL,
    target_type TEXT NOT NULL,
    payload_json TEXT NOT NULL,
    created_at TEXT NOT NULL,
    FOREIGN KEY (uploaded_by) REFERENCES users(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS dictionary_import_runs (
    id TEXT PRIMARY KEY,
    uploaded_by TEXT NOT NULL,
    source_name TEXT NOT NULL,
    file_name TEXT NOT NULL,
    status TEXT NOT NULL,
    default_cefr_level TEXT NOT NULL,
    processed_rows INTEGER NOT NULL DEFAULT 0,
    imported_entries INTEGER NOT NULL DEFAULT 0,
    updated_entries INTEGER NOT NULL DEFAULT 0,
    imported_forms INTEGER NOT NULL DEFAULT 0,
    audio_assets_upserted INTEGER NOT NULL DEFAULT 0,
    skipped_rows INTEGER NOT NULL DEFAULT 0,
    summary_json TEXT NOT NULL DEFAULT '{}',
    created_at TEXT NOT NULL,
    completed_at TEXT,
    FOREIGN KEY (uploaded_by) REFERENCES users(id) ON DELETE CASCADE
  );

  CREATE INDEX IF NOT EXISTS idx_sessions_token_hash ON sessions (token_hash);
  CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON sessions (user_id);
  CREATE INDEX IF NOT EXISTS idx_stories_cefr ON stories (cefr_level);
  CREATE INDEX IF NOT EXISTS idx_dictionary_forms_normalized ON dictionary_forms (normalized_form);
  CREATE INDEX IF NOT EXISTS idx_saved_words_user_id ON saved_words (user_id);
  CREATE INDEX IF NOT EXISTS idx_flashcards_due_at ON flashcards (user_id, due_at);
  CREATE INDEX IF NOT EXISTS idx_story_progress_user_story ON story_progress (user_id, story_id);
  CREATE INDEX IF NOT EXISTS idx_daily_activity_user_date ON daily_activity (user_id, activity_date);
  CREATE INDEX IF NOT EXISTS idx_dictionary_import_runs_created_at ON dictionary_import_runs (created_at);
`;
