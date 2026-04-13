import { all, run } from "./base-model.js";

export function createAdminUpload(upload) {
  run(
    `
      INSERT INTO admin_uploads (
        id, uploaded_by, target_type, payload_json, created_at
      ) VALUES (
        @id, @uploaded_by, @target_type, @payload_json, @created_at
      )
    `,
    upload
  );
}

export function listAdminUploads() {
  return all(
    `
      SELECT *
      FROM admin_uploads
      ORDER BY created_at DESC
    `
  );
}

export function createDictionaryImportRun(runRecord) {
  run(
    `
      INSERT INTO dictionary_import_runs (
        id, uploaded_by, source_name, file_name, status, default_cefr_level, processed_rows,
        imported_entries, updated_entries, imported_forms, audio_assets_upserted, skipped_rows,
        summary_json, created_at, completed_at
      ) VALUES (
        @id, @uploaded_by, @source_name, @file_name, @status, @default_cefr_level, @processed_rows,
        @imported_entries, @updated_entries, @imported_forms, @audio_assets_upserted, @skipped_rows,
        @summary_json, @created_at, @completed_at
      )
    `,
    runRecord
  );
}

export function updateDictionaryImportRun(runRecord) {
  run(
    `
      UPDATE dictionary_import_runs
      SET
        status = @status,
        processed_rows = @processed_rows,
        imported_entries = @imported_entries,
        updated_entries = @updated_entries,
        imported_forms = @imported_forms,
        audio_assets_upserted = @audio_assets_upserted,
        skipped_rows = @skipped_rows,
        summary_json = @summary_json,
        completed_at = @completed_at
      WHERE id = @id
    `,
    runRecord
  );
}

export function listDictionaryImportRuns(limit = 6) {
  return all(
    `
      SELECT *
      FROM dictionary_import_runs
      ORDER BY created_at DESC
      LIMIT @limit
    `,
    { limit }
  );
}
