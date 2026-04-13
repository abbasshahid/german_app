import { badRequest } from "../utils/http-error.js";

export function validate(schema) {
  return (req, _res, next) => {
    try {
      if (schema.body) {
        req.body = schema.body.parse(req.body ?? {});
      }

      if (schema.query) {
        const parsedQuery = schema.query.parse(req.query ?? {});
        Object.keys(req.query ?? {}).forEach((key) => {
          delete req.query[key];
        });
        Object.assign(req.query, parsedQuery);
      }

      if (schema.params) {
        const parsedParams = schema.params.parse(req.params ?? {});
        Object.keys(req.params ?? {}).forEach((key) => {
          delete req.params[key];
        });
        Object.assign(req.params, parsedParams);
      }

      next();
    } catch (error) {
      next(badRequest("Validation failed", error.issues ?? error.message));
    }
  };
}
