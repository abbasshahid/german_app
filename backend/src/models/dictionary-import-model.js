import { db } from "../database/db.js";

const findEntryByNormalizedLemmaStatement = db.prepare(`
  SELECT *
  FROM dictionary_entries
  WHERE normalized_lemma = @normalized_lemma
  LIMIT 1
`);

const insertEntryStatement = db.prepare(`
  INSERT INTO dictionary_entries (
    id, lemma, normalized_lemma, translation, part_of_speech, grammar_notes, cefr_level, example_de,
    example_en, audio_label, audio_url, related_words_json, created_at, updated_at
  ) VALUES (
    @id, @lemma, @normalized_lemma, @translation, @part_of_speech, @grammar_notes, @cefr_level, @example_de,
    @example_en, @audio_label, @audio_url, @related_words_json, @created_at, @updated_at
  )
`);

const updateEntryStatement = db.prepare(`
  UPDATE dictionary_entries
  SET
    lemma = @lemma,
    normalized_lemma = @normalized_lemma,
    translation = @translation,
    part_of_speech = @part_of_speech,
    grammar_notes = @grammar_notes,
    cefr_level = @cefr_level,
    example_de = @example_de,
    example_en = @example_en,
    audio_label = @audio_label,
    audio_url = @audio_url,
    related_words_json = @related_words_json,
    updated_at = @updated_at
  WHERE id = @id
`);

const insertFormStatement = db.prepare(`
  INSERT OR IGNORE INTO dictionary_forms (
    id, entry_id, surface_form, normalized_form
  ) VALUES (
    @id, @entry_id, @surface_form, @normalized_form
  )
`);

const findAudioAssetStatement = db.prepare(`
  SELECT *
  FROM audio_assets
  WHERE target_type = @target_type AND target_id = @target_id
  ORDER BY created_at DESC
  LIMIT 1
`);

const insertAudioAssetStatement = db.prepare(`
  INSERT INTO audio_assets (
    id, target_type, target_id, provider, locale, speech_text, audio_url, duration_seconds, created_at
  ) VALUES (
    @id, @target_type, @target_id, @provider, @locale, @speech_text, @audio_url, @duration_seconds, @created_at
  )
`);

const updateAudioAssetStatement = db.prepare(`
  UPDATE audio_assets
  SET
    provider = @provider,
    locale = @locale,
    speech_text = @speech_text,
    audio_url = @audio_url,
    duration_seconds = @duration_seconds
  WHERE id = @id
`);

export function findImportableDictionaryEntry(normalizedLemma) {
  return findEntryByNormalizedLemmaStatement.get({ normalized_lemma: normalizedLemma });
}

export function createImportableDictionaryEntry(entry) {
  insertEntryStatement.run(entry);
}

export function updateImportableDictionaryEntry(entry) {
  updateEntryStatement.run(entry);
}

export function insertImportableDictionaryForm(form) {
  return insertFormStatement.run(form);
}

export function findImportableAudioAsset(targetType, targetId) {
  return findAudioAssetStatement.get({
    target_type: targetType,
    target_id: targetId
  });
}

export function createImportableAudioAsset(asset) {
  insertAudioAssetStatement.run(asset);
}

export function updateImportableAudioAsset(asset) {
  updateAudioAssetStatement.run(asset);
}
