import { findDictionaryEntryById, findDictionaryEntryByLookup, listDictionaryForms } from "../models/dictionary-model.js";
import { notFound } from "../utils/http-error.js";
import { normalizeWord } from "../utils/strings.js";
import { getWordAudio } from "./audio-service.js";

function formatEntry(entry) {
  return {
    id: entry.id,
    lemma: entry.lemma,
    translation: entry.translation,
    partOfSpeech: entry.part_of_speech,
    grammarNotes: entry.grammar_notes,
    level: entry.cefr_level,
    example: {
      german: entry.example_de,
      english: entry.example_en
    },
    relatedWords: JSON.parse(entry.related_words_json ?? "[]"),
    audio: getWordAudio(entry)
  };
}

export function lookupWord(word) {
  const normalized = normalizeWord(word);
  const entry = findDictionaryEntryByLookup(normalized);

  if (!entry) {
    throw notFound(`No dictionary entry was found for "${word}".`);
  }

  return {
    lookup: word,
    normalized,
    ...formatEntry(entry),
    forms: listDictionaryForms(entry.id).map((form) => form.surface_form)
  };
}

export function getDictionaryEntry(entryId) {
  const entry = findDictionaryEntryById(entryId);

  if (!entry) {
    throw notFound("Dictionary entry not found.");
  }

  return formatEntry(entry);
}
