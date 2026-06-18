import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const isVercel = Boolean(process.env.VERCEL);

export const backendRoot = path.resolve(__dirname, "../..");
const defaultDataDirectory = isVercel ? path.join(os.tmpdir(), "archivist-data") : path.resolve(backendRoot, "data");

export const dataDirectory = path.resolve(process.env.DATA_DIR ?? defaultDataDirectory);
export const databasePath = path.resolve(dataDirectory, "archivist.sqlite");
export const dictionaryImportDirectory = path.resolve(dataDirectory, "imports");

export function ensureDataDirectories() {
  fs.mkdirSync(dataDirectory, { recursive: true });
  fs.mkdirSync(dictionaryImportDirectory, { recursive: true });
}
