import { getVocabularyOverview, saveVocabularyWord } from "../services/vocabulary-service.js";

export function saveWordController(req, res) {
  res.status(201).json(saveVocabularyWord(req.currentUser.id, req.body));
}

export function listVocabularyController(req, res) {
  res.json(getVocabularyOverview(req.currentUser.id, req.query));
}
