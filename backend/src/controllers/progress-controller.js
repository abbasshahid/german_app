import { updateReadingProgress } from "../services/progress-service.js";

export function updateReadingProgressController(req, res) {
  res.json(updateReadingProgress(req.currentUser.id, req.body));
}
