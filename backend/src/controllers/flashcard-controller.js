import { getFlashcardSession, reviewFlashcard } from "../services/flashcard-service.js";

export function getFlashcardSessionController(req, res) {
  res.json(getFlashcardSession(req.currentUser.id, req.query.limit));
}

export function reviewFlashcardController(req, res) {
  res.json(reviewFlashcard(req.currentUser.id, req.body.flashcardId, req.body.rating));
}
