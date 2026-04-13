import { lookupWord } from "../services/dictionary-service.js";

export function lookupWordController(req, res) {
  res.json(lookupWord(req.query.word));
}
