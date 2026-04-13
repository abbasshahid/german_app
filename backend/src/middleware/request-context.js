import { createId } from "../utils/ids.js";
import { logger } from "../utils/logger.js";

export function requestContext(req, res, next) {
  req.requestId = createId("req");
  res.setHeader("X-Request-Id", req.requestId);

  const startedAt = Date.now();

  res.on("finish", () => {
    logger.info("request_complete", {
      requestId: req.requestId,
      method: req.method,
      path: req.originalUrl,
      statusCode: res.statusCode,
      durationMs: Date.now() - startedAt
    });
  });

  next();
}
