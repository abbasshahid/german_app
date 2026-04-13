import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const backendRoot = path.resolve(__dirname, "../..");
export const dataDirectory = path.resolve(backendRoot, "data");
export const databasePath = path.resolve(dataDirectory, "archivist.sqlite");
export const dictionaryImportDirectory = path.resolve(dataDirectory, "imports");

export function ensureDataDirectories() {
  fs.mkdirSync(dataDirectory, { recursive: true });
  fs.mkdirSync(dictionaryImportDirectory, { recursive: true });
}
