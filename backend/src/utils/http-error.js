export class HttpError extends Error {
  constructor(statusCode, message, details = null) {
    super(message);
    this.name = "HttpError";
    this.statusCode = statusCode;
    this.details = details;
  }
}

export function badRequest(message, details) {
  return new HttpError(400, message, details);
}

export function unauthorized(message = "Authentication required") {
  return new HttpError(401, message);
}

export function forbidden(message = "You do not have access to this resource") {
  return new HttpError(403, message);
}

export function notFound(message = "Resource not found") {
  return new HttpError(404, message);
}

export function conflict(message, details) {
  return new HttpError(409, message, details);
}
