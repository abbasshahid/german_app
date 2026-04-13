import { Router } from "express";
import { z } from "zod";

import { getStoryAudioController, getWordAudioController } from "../controllers/audio-controller.js";
import { requireAuth } from "../middleware/auth.js";
import { validate } from "../middleware/validate.js";

const router = Router();

router.get(
  "/word/:entryId",
  requireAuth,
  validate({
    params: z.object({
      entryId: z.string().min(1)
    })
  }),
  getWordAudioController
);

router.get(
  "/story/:storyId",
  requireAuth,
  validate({
    params: z.object({
      storyId: z.string().min(1)
    })
  }),
  getStoryAudioController
);

export default router;
