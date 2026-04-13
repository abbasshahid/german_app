export function nowIso() {
  return new Date().toISOString();
}

export function addDays(dateLike, days) {
  const date = new Date(dateLike);
  date.setTime(date.getTime() + days * 24 * 60 * 60 * 1000);
  return date.toISOString();
}

export function addHours(dateLike, hours) {
  const date = new Date(dateLike);
  date.setTime(date.getTime() + hours * 60 * 60 * 1000);
  return date.toISOString();
}

export function toDateKey(dateLike = new Date()) {
  return new Date(dateLike).toISOString().slice(0, 10);
}
