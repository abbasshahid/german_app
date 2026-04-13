import { Router } from "express";
import { z } from "zod";

import {
  getFlashcardSessionController,
  reviewFlashcardController
} from "../controllers/flashcard-controller.js";
import { requireAuth } from "../middleware/auth.js";
import { validate } from "../middleware/validate.js";

const router = Router();

router.get(
  "/session",
  requireAuth,
  validate({
    query: z.object({
      limit: z.coerce.number().int().min(1).max(50).default(20)
    })
  }),
  getFlashcardSessionController
);

router.post(
  "/review",
  requireAuth,
  validate({
    body: z.object({
      flashcardId: z.string().min(1),
      rating: z.enum(["again", "hard", "good", "easy"])
    })
  }),
  reviewFlashcardController
);

export default router;
