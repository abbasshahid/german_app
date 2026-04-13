export function normalizeWord(word = "") {
  return word
    .trim()
    .toLowerCase()
    .normalize("NFC")
    .replace(/^[^\p{L}\p{N}]+|[^\p{L}\p{N}]+$/gu, "");
}

export function stripHtml(input = "") {
  return input.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
}
