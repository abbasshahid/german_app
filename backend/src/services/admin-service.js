import { createAdminUpload, listAdminUploads } from "../models/admin-model.js";
import { createId } from "../utils/ids.js";
import { nowIso } from "../utils/time.js";
import {
  getDictionaryImportHistory,
  importDictionaryDataset,
  listAvailableDictionaryImportFiles
} from "./dictionary-import-service.js";
import { createStoryDraft } from "./story-service.js";

export function createStoryAsAdmin(userId, payload) {
  const story = createStoryDraft(payload);

  createAdminUpload({
    id: createId("upload"),
    uploaded_by: userId,
    target_type: "story",
    payload_json: JSON.stringify(payload),
    created_at: nowIso()
  });

  return story;
}

export function getAdminUploads() {
  return listAdminUploads();
}

export function getDictionaryImportFiles() {
  return listAvailableDictionaryImportFiles();
}

export function getDictionaryImports() {
  return getDictionaryImportHistory();
}

export async function importDictionaryAsAdmin(userId, payload) {
  return importDictionaryDataset(userId, payload);
}
