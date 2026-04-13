import { Router } from "express";
import { z } from "zod";

import { updateReadingProgressController } from "../controllers/progress-controller.js";
import { requireAuth } from "../middleware/auth.js";
import { validate } from "../middleware/validate.js";

const router = Router();

router.post(
  "/reading",
  requireAuth,
  validate({
    body: z.object({
      storyId: z.string().min(1),
      chapterId: z.string().optional(),
      progressPercent: z.coerce.number().min(0).max(100),
      minutesStudied: z.coerce.number().min(0).default(0)
    })
  }),
  updateReadingProgressController
);

export default router;
