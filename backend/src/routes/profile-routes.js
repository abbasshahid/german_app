import { Router } from "express";
import { z } from "zod";

import { getProfileController, updateProfileController } from "../controllers/profile-controller.js";
import { requireAuth } from "../middleware/auth.js";
import { validate } from "../middleware/validate.js";

const router = Router();

router.get("/", requireAuth, getProfileController);

router.patch(
  "/",
  requireAuth,
  validate({
    body: z.object({
      name: z.string().min(2).max(80),
      cefrLevel: z.enum(["A1", "A2", "B1", "B2", "C1"]),
      dailyGoal: z.coerce.number().int().min(1).max(200),
      avatarUrl: z.string().url().optional().or(z.literal(""))
    })
  }),
  updateProfileController
);

export default router;
