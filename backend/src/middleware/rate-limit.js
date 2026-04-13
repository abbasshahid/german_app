import { HttpError } from "../utils/http-error.js";

export function createRateLimiter({ windowMs, max, keyPrefix }) {
  const hits = new Map();

  setInterval(() => {
    const now = Date.now();

    for (const [key, state] of hits.entries()) {
      if (state.resetAt <= now) {
        hits.delete(key);
      }
    }
  }, windowMs).unref();

  return (req, _res, next) => {
    const identifier = `${keyPrefix}:${req.ip}`;
    const now = Date.now();
    const state = hits.get(identifier) ?? { count: 0, resetAt: now + windowMs };

    if (state.resetAt <= now) {
      state.count = 0;
      state.resetAt = now + windowMs;
    }

    state.count += 1;
    hits.set(identifier, state);

    if (state.count > max) {
      next(new HttpError(429, "Too many requests. Please try again shortly."));
      return;
    }

    next();
  };
}
