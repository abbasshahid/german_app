import { logger } from "../utils/logger.js";

export function errorHandler(error, req, res, _next) {
  const statusCode = error.statusCode ?? 500;

  logger.error("request_failed", {
    requestId: req.requestId,
    method: req.method,
    path: req.originalUrl,
    statusCode,
    message: error.message
  });

  res.status(statusCode).json({
    error: {
      message: statusCode >= 500 ? "Internal server error" : error.message,
      details: statusCode >= 500 ? null : (error.details ?? null),
      requestId: req.requestId
    }
  });
}
