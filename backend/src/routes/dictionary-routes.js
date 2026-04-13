import { Router } from "express";
import { z } from "zod";

import { lookupWordController } from "../controllers/dictionary-controller.js";
import { requireAuth } from "../middleware/auth.js";
import { validate } from "../middleware/validate.js";

const router = Router();

router.get(
  "/lookup",
  requireAuth,
  validate({
    query: z.object({
      word: z.string().min(1)
    })
  }),
  lookupWordController
);

export default router;
