import { Router } from "express";
import { z } from "zod";

import {
  getStoryController,
  listStoriesController,
  recommendedStoriesController
} from "../controllers/story-controller.js";
import { requireAuth } from "../middleware/auth.js";
import { validate } from "../middleware/validate.js";

const router = Router();

router.get(
  "/",
  requireAuth,
  validate({
    query: z.object({
      search: z.string().default(""),
      level: z.string().default(""),
      genre: z.string().default(""),
      duration: z.enum(["", "short", "medium", "long"]).default(""),
      page: z.coerce.number().int().min(1).default(1),
      pageSize: z.coerce.number().int().min(1).max(50).default(12)
    })
  }),
  listStoriesController
);

router.get(
  "/recommended",
  requireAuth,
  validate({
    query: z.object({
      level: z.string().default("")
    })
  }),
  recommendedStoriesController
);

router.get(
  "/:slug",
  requireAuth,
  validate({
    params: z.object({
      slug: z.string().min(1)
    }),
    query: z.object({
      chapter: z.coerce.number().int().min(1).default(1)
    })
  }),
  getStoryController
);

export default router;
