import {
  createStoryAsAdmin,
  getAdminUploads,
  getDictionaryImportFiles,
  getDictionaryImports,
  importDictionaryAsAdmin
} from "../services/admin-service.js";

export function createStoryAdminController(req, res) {
  res.status(201).json(createStoryAsAdmin(req.currentUser.id, req.body));
}

export function getAdminUploadsController(_req, res) {
  res.json({ items: getAdminUploads() });
}

export function getDictionaryImportFilesController(_req, res) {
  res.json({ items: getDictionaryImportFiles() });
}

export function getDictionaryImportsController(_req, res) {
  res.json({ items: getDictionaryImports() });
}

export async function createDictionaryImportController(req, res) {
  res.status(201).json(await importDictionaryAsAdmin(req.currentUser.id, req.body));
}
