import { all, one } from "./base-model.js";

export function findDictionaryEntryByLookup(lookup) {
  return one(
    `
      SELECT dictionary_entries.*
      FROM dictionary_forms
      INNER JOIN dictionary_entries ON dictionary_entries.id = dictionary_forms.entry_id
      WHERE dictionary_forms.normalized_form = @lookup
      LIMIT 1
    `,
    { lookup }
  );
}

export function findDictionaryEntryById(id) {
  return one("SELECT * FROM dictionary_entries WHERE id = @id", { id });
}

export function findDictionaryEntryByLemma(lemma) {
  return one(
    `
      SELECT *
      FROM dictionary_entries
      WHERE normalized_lemma = @lemma
    `,
    { lemma }
  );
}

export function listDictionaryForms(entryId) {
  return all(
    `
      SELECT surface_form, normalized_form
      FROM dictionary_forms
      WHERE entry_id = @entryId
      ORDER BY surface_form ASC
    `,
    { entryId }
  );
}
