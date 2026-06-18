import fs from "node:fs";
import path from "node:path";
import readline from "node:readline";
import zlib from "node:zlib";

import { dictionaryImportDirectory, ensureDataDirectories } from "../config/storage-paths.js";
import {
  createDictionaryImportRun,
  listDictionaryImportRuns,
  updateDictionaryImportRun
} from "../models/admin-model.js";
import {
  createImportableAudioAsset,
  createImportableDictionaryEntry,
  findImportableAudioAsset,
  findImportableDictionaryEntry,
  insertImportableDictionaryForm,
  updateImportableAudioAsset,
  updateImportableDictionaryEntry
} from "../models/dictionary-import-model.js";
import { badRequest, conflict } from "../utils/http-error.js";
import { createId } from "../utils/ids.js";
import { logger } from "../utils/logger.js";
import { nowIso } from "../utils/time.js";
import { normalizeWord } from "../utils/strings.js";

const SUPPORTED_FILE_SUFFIXES = [".jsonl", ".jsonl.gz"];
const IMPORT_SOURCE = "kaikki-german-dictionary";
const MAX_RELATED_WORDS = 8;
const DEFAULT_IMPORT_LIMIT = 0;
const VERCEL_IMPORT_DISABLED_MESSAGE =
  "Runtime dictionary imports are disabled on Vercel because free serverless storage is temporary. Add dictionary entries to seed data locally, or run imports outside Vercel before deployment.";

let importInProgress = false;

const POS_LABELS = {
  noun: "Nomen",
  "proper noun": "Eigenname",
  "proper-noun": "Eigenname",
  propernoun: "Eigenname",
  verb: "Verb",
  adjective: "Adjektiv",
  adj: "Adjektiv",
  adverb: "Adverb",
  adv: "Adverb",
  pronoun: "Pronomen",
  pron: "Pronomen",
  determiner: "Determinativ",
  article: "Artikel",
  preposition: "Präposition",
  prep: "Präposition",
  postposition: "Postposition",
  conjunction: "Konjunktion",
  interjection: "Interjektion",
  phrase: "Phrase",
  idiom: "Idiom",
  prefix: "Präfix",
  suffix: "Suffix",
  infix: "Infix",
  particle: "Partikel",
  abbreviation: "Abkürzung",
  abbrev: "Abkürzung",
  numeral: "Numerale",
  number: "Numerale"
};

const GENDER_LABELS = {
  masculine: "Maskulin",
  feminine: "Feminin",
  neuter: "Neutrum"
};

const NOISY_FORM_TAGS = new Set(["table-tags", "inflection-template"]);

function cleanText(value = "") {
  return String(value).replace(/\s+/g, " ").trim();
}

function unique(values) {
  return [...new Set(values.filter(Boolean))];
}

function normalizePos(pos = "") {
  const key = cleanText(pos).toLowerCase().replaceAll("_", " ");
  return POS_LABELS[key] ?? (key ? `${key.charAt(0).toUpperCase()}${key.slice(1)}` : "Wort");
}

function getGenderLabel(tags = []) {
  for (const tag of tags) {
    const normalizedTag = cleanText(tag).toLowerCase();

    if (GENDER_LABELS[normalizedTag]) {
      return GENDER_LABELS[normalizedTag];
    }
  }

  return null;
}

function formatPartOfSpeech(record, senses) {
  const posLabel = normalizePos(record.pos ?? record.pos_title ?? "");
  const genderLabel = getGenderLabel(senses.flatMap((sense) => sense.tags ?? []));

  return genderLabel && posLabel === "Nomen" ? `${posLabel} (${genderLabel})` : posLabel;
}

function isFormOnlySense(sense) {
  if (!sense || typeof sense !== "object") {
    return false;
  }

  if (Array.isArray(sense.form_of) && sense.form_of.length) {
    return true;
  }

  if (Array.isArray(sense.alt_of) && sense.alt_of.length) {
    return true;
  }

  const tags = new Set((sense.tags ?? []).map((tag) => cleanText(tag).toLowerCase()));

  return tags.has("form-of") || tags.has("alt-of");
}

function getMeaningfulSenses(record) {
  const senses = Array.isArray(record.senses) ? record.senses : [];
  const meaningful = senses.filter((sense) => !isFormOnlySense(sense) && Array.isArray(sense.glosses) && sense.glosses.length);

  return meaningful.length ? meaningful : senses.filter((sense) => Array.isArray(sense.glosses) && sense.glosses.length);
}

function pickGlosses(record, senses) {
  const glosses = unique(
    senses
      .flatMap((sense) => sense.glosses ?? [])
      .map(cleanText)
      .filter(Boolean)
  );

  if (glosses.length) {
    return glosses.slice(0, 2);
  }

  const translations = unique(
    (record.translations ?? [])
      .filter((translation) => translation?.lang === "English" || translation?.code === "en")
      .map((translation) => cleanText(translation.word))
  );

  return translations.slice(0, 2);
}

function pickExample(senses, fallbackWord, fallbackTranslation) {
  for (const sense of senses) {
    const example = (sense.examples ?? []).find((candidate) => cleanText(candidate?.text));

    if (example) {
      return {
        german: cleanText(example.text),
        english: cleanText(example.english ?? fallbackTranslation)
      };
    }
  }

  return {
    german: cleanText(fallbackWord),
    english: cleanText(fallbackTranslation)
  };
}

function extractRelatedWords(record) {
  const linkageFields = ["related", "synonyms", "derived", "hypernyms"];
  const relatedWords = [];

  for (const fieldName of linkageFields) {
    for (const item of record[fieldName] ?? []) {
      const word = cleanText(item?.word ?? item?.term ?? item);

      if (word) {
        relatedWords.push(word);
      }
    }
  }

  return unique(relatedWords).slice(0, MAX_RELATED_WORDS);
}

function extractForms(record) {
  const forms = [];

  for (const formEntry of record.forms ?? []) {
    const tags = (formEntry.tags ?? []).map((tag) => cleanText(tag).toLowerCase());

    if (tags.some((tag) => NOISY_FORM_TAGS.has(tag))) {
      continue;
    }

    const surfaceForm = cleanText(formEntry.form ?? formEntry.word);

    if (!surfaceForm || surfaceForm.startsWith("de-")) {
      continue;
    }

    forms.push(surfaceForm);
  }

  return unique([cleanText(record.word), ...forms]);
}

function pickAudio(record) {
  const audioSample = (record.sounds ?? []).find((sound) => sound?.mp3_url || sound?.ogg_url);

  if (!audioSample) {
    return {
      provider: "browser-tts",
      audioUrl: null,
      speechText: cleanText(record.word),
      durationSeconds: 4
    };
  }

  return {
    provider: "wikimedia-commons",
    audioUrl: audioSample.mp3_url ?? audioSample.ogg_url ?? null,
    speechText: cleanText(record.word),
    durationSeconds: 4
  };
}

function buildGrammarNotes(record, senses) {
  const details = [];
  const gender = getGenderLabel(senses.flatMap((sense) => sense.tags ?? []));
  const usageTags = unique(
    senses
      .flatMap((sense) => sense.tags ?? [])
      .map((tag) => cleanText(tag).toLowerCase())
      .filter((tag) => tag && !GENDER_LABELS[tag])
  );
  const ipa = cleanText((record.sounds ?? []).find((sound) => sound?.ipa)?.ipa ?? "");
  const etymology = cleanText(record.etymology_text ?? "");

  if (gender) {
    details.push(`Gender: ${gender}.`);
  }

  if (usageTags.length) {
    details.push(`Usage: ${usageTags.slice(0, 4).join(", ")}.`);
  }

  if (ipa) {
    details.push(`Pronunciation: ${ipa}.`);
  }

  if (etymology) {
    details.push(`Etymology: ${etymology}`);
  }

  return details.join(" ").trim() || null;
}

function isGermanRecord(record) {
  return cleanText(record?.lang_code).toLowerCase() === "de" || cleanText(record?.lang) === "German";
}

function resolveImportFilePath(fileName) {
  if (process.env.VERCEL) {
    throw badRequest(VERCEL_IMPORT_DISABLED_MESSAGE);
  }

  ensureDataDirectories();

  const normalizedName = path.basename(cleanText(fileName));
  const absolutePath = path.join(dictionaryImportDirectory, normalizedName);
  if (!normalizedName) {
    throw badRequest("Choose a dataset file from the import folder.");
  }

  if (!fs.existsSync(absolutePath)) {
    throw badRequest(`The dataset file "${normalizedName}" was not found in backend/data/imports.`);
  }

  if (!SUPPORTED_FILE_SUFFIXES.some((suffix) => normalizedName.toLowerCase().endsWith(suffix))) {
    throw badRequest("Only .jsonl and .jsonl.gz dictionary datasets are supported.");
  }

  return {
    fileName: normalizedName,
    absolutePath
  };
}

function createImportReadStream(absolutePath) {
  const fileStream = fs.createReadStream(absolutePath);

  return absolutePath.endsWith(".gz") ? fileStream.pipe(zlib.createGunzip()) : fileStream;
}

function buildDictionaryRow(record) {
  const lemma = cleanText(record.word);
  const normalizedLemma = normalizeWord(lemma);

  if (!lemma || !normalizedLemma) {
    return null;
  }

  const senses = getMeaningfulSenses(record);
  const glosses = pickGlosses(record, senses);

  if (!glosses.length) {
    return null;
  }

  const translation = glosses.join("; ");
  const example = pickExample(senses, lemma, translation);

  return {
    lemma,
    normalizedLemma,
    translation,
    partOfSpeech: formatPartOfSpeech(record, senses),
    grammarNotes: buildGrammarNotes(record, senses),
    example,
    relatedWords: extractRelatedWords(record),
    forms: extractForms(record),
    audio: pickAudio(record)
  };
}

function upsertAudioAssetForEntry(entryId, row, timestamp) {
  const existingAudio = findImportableAudioAsset("word", entryId);
  const nextAudio = {
    provider: row.audio.provider,
    locale: "de-DE",
    speech_text: row.audio.speechText,
    audio_url: row.audio.audioUrl,
    duration_seconds: row.audio.durationSeconds
  };

  if (!existingAudio) {
    createImportableAudioAsset({
      id: createId("audio"),
      target_type: "word",
      target_id: entryId,
      created_at: timestamp,
      ...nextAudio
    });
    return 1;
  }

  const shouldUpdate =
    existingAudio.provider !== nextAudio.provider ||
    existingAudio.audio_url !== nextAudio.audio_url ||
    existingAudio.speech_text !== nextAudio.speech_text;

  if (!shouldUpdate) {
    return 0;
  }

  updateImportableAudioAsset({
    id: existingAudio.id,
    ...nextAudio
  });

  return 1;
}

function upsertDictionaryRow(row, defaultLevel, timestamp, summary) {
  const existingEntry = findImportableDictionaryEntry(row.normalizedLemma);
  const payload = {
    lemma: row.lemma,
    normalized_lemma: row.normalizedLemma,
    translation: row.translation,
    part_of_speech: row.partOfSpeech,
    grammar_notes: row.grammarNotes,
    cefr_level: defaultLevel,
    example_de: row.example.german,
    example_en: row.example.english,
    audio_label: row.audio.speechText,
    audio_url: row.audio.audioUrl,
    related_words_json: JSON.stringify(row.relatedWords),
    updated_at: timestamp
  };

  let entryId = existingEntry?.id;

  if (!existingEntry) {
    entryId = createId("dict");
    createImportableDictionaryEntry({
      id: entryId,
      created_at: timestamp,
      ...payload
    });
    summary.importedEntries += 1;
  } else {
    updateImportableDictionaryEntry({
      id: entryId,
      ...payload
    });
    summary.updatedEntries += 1;
  }

  for (const form of row.forms) {
    const normalizedForm = normalizeWord(form);

    if (!normalizedForm) {
      continue;
    }

    const result = insertImportableDictionaryForm({
      id: createId("form"),
      entry_id: entryId,
      surface_form: form,
      normalized_form: normalizedForm
    });

    summary.importedForms += Number(result.changes ?? 0);
  }

  summary.audioAssetsUpserted += upsertAudioAssetForEntry(entryId, row, timestamp);
}

async function streamDictionaryFile(absolutePath, handleRecord) {
  const input = createImportReadStream(absolutePath);
  const reader = readline.createInterface({
    input,
    crlfDelay: Infinity
  });
  let lineNumber = 0;

  try {
    for await (const line of reader) {
      lineNumber += 1;
      const trimmed = line.trim();

      if (!trimmed) {
        continue;
      }

      let record;

      try {
        record = JSON.parse(trimmed);
      } catch (error) {
        throw new Error(`Invalid JSON on line ${lineNumber}: ${error.message}`);
      }

      const shouldContinue = handleRecord(record);

      if (shouldContinue === false) {
        break;
      }
    }
  } finally {
    reader.close();
  }
}

export function listAvailableDictionaryImportFiles() {
  if (process.env.VERCEL) {
    return [];
  }

  ensureDataDirectories();

  return fs
    .readdirSync(dictionaryImportDirectory, { withFileTypes: true })
    .filter((entry) => entry.isFile())
    .map((entry) => {
      const absolutePath = path.join(dictionaryImportDirectory, entry.name);
      const stats = fs.statSync(absolutePath);

      return {
        fileName: entry.name,
        sizeBytes: stats.size,
        modifiedAt: stats.mtime.toISOString()
      };
    })
    .filter((item) => item.fileName.endsWith(".jsonl") || item.fileName.endsWith(".jsonl.gz"))
    .sort((left, right) => right.modifiedAt.localeCompare(left.modifiedAt));
}

export function getDictionaryImportAvailability() {
  return {
    disabled: Boolean(process.env.VERCEL),
    message: process.env.VERCEL ? VERCEL_IMPORT_DISABLED_MESSAGE : null
  };
}

export function getDictionaryImportHistory() {
  return listDictionaryImportRuns(6);
}

export async function importDictionaryDataset(userId, payload) {
  if (process.env.VERCEL) {
    throw badRequest(VERCEL_IMPORT_DISABLED_MESSAGE);
  }

  if (importInProgress) {
    throw conflict("A dictionary import is already running. Wait for it to finish before starting another one.");
  }

  importInProgress = true;

  const timestamp = nowIso();
  const { fileName, absolutePath } = resolveImportFilePath(payload.fileName);
  const importRunId = createId("import");
  const maxEntries = Number(payload.maxEntries ?? DEFAULT_IMPORT_LIMIT);
  const summary = {
    fileName,
    sourceName: IMPORT_SOURCE,
    processedRows: 0,
    importedEntries: 0,
    updatedEntries: 0,
    importedForms: 0,
    audioAssetsUpserted: 0,
    skippedRows: 0,
    limited: maxEntries > 0
  };

  createDictionaryImportRun({
    id: importRunId,
    uploaded_by: userId,
    source_name: IMPORT_SOURCE,
    file_name: fileName,
    status: "running",
    default_cefr_level: payload.defaultLevel,
    processed_rows: 0,
    imported_entries: 0,
    updated_entries: 0,
    imported_forms: 0,
    audio_assets_upserted: 0,
    skipped_rows: 0,
    summary_json: JSON.stringify({ fileName }),
    created_at: timestamp,
    completed_at: null
  });

  logger.info("dictionary_import_started", {
    importRunId,
    fileName
  });

  try {
    await streamDictionaryFile(absolutePath, (record) => {
      if (maxEntries > 0 && summary.processedRows >= maxEntries) {
        return false;
      }

      if (!isGermanRecord(record)) {
        summary.skippedRows += 1;
        return true;
      }

      const row = buildDictionaryRow(record);
      summary.processedRows += 1;

      if (!row) {
        summary.skippedRows += 1;
        return true;
      }

      upsertDictionaryRow(row, payload.defaultLevel, nowIso(), summary);
      return true;
    });

    const completedAt = nowIso();
    const finalSummary = {
      ...summary,
      importRunId,
      importDirectory: "backend/data/imports",
      completedAt
    };

    updateDictionaryImportRun({
      id: importRunId,
      status: "completed",
      processed_rows: summary.processedRows,
      imported_entries: summary.importedEntries,
      updated_entries: summary.updatedEntries,
      imported_forms: summary.importedForms,
      audio_assets_upserted: summary.audioAssetsUpserted,
      skipped_rows: summary.skippedRows,
      summary_json: JSON.stringify(finalSummary),
      completed_at: completedAt
    });

    logger.info("dictionary_import_completed", finalSummary);

    return finalSummary;
  } catch (error) {
    const completedAt = nowIso();
    const failedSummary = {
      ...summary,
      importRunId,
      error: error.message
    };

    updateDictionaryImportRun({
      id: importRunId,
      status: "failed",
      processed_rows: summary.processedRows,
      imported_entries: summary.importedEntries,
      updated_entries: summary.updatedEntries,
      imported_forms: summary.importedForms,
      audio_assets_upserted: summary.audioAssetsUpserted,
      skipped_rows: summary.skippedRows,
      summary_json: JSON.stringify(failedSummary),
      completed_at: completedAt
    });

    logger.error("dictionary_import_failed", {
      importRunId,
      fileName,
      message: error.message
    });

    throw badRequest(`Dictionary import failed: ${error.message}`);
  } finally {
    importInProgress = false;
  }
}
