import { notFound } from "../utils/http-error.js";

export function notFoundHandler(_req, _res, next) {
  next(notFound("Route not found"));
}
