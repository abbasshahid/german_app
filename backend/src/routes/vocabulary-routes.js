import { Router } from "express";
import { z } from "zod";

import { listVocabularyController, saveWordController } from "../controllers/vocabulary-controller.js";
import { requireAuth } from "../middleware/auth.js";
import { validate } from "../middleware/validate.js";

const router = Router();

const saveWordSchema = z
  .object({
    entryId: z.string().optional(),
    word: z.string().optional(),
    sourceWord: z.string().optional(),
    storyId: z.string().optional(),
    chapterId: z.string().optional(),
    contextSentence: z.string().optional()
  })
  .refine((value) => Boolean(value.entryId || value.word), {
    message: "Either entryId or word is required."
  });

router.get(
  "/",
  requireAuth,
  validate({
    query: z.object({
      search: z.string().default(""),
      sort: z.enum(["newest", "oldest", "word"]).default("newest"),
      page: z.coerce.number().int().min(1).default(1),
      pageSize: z.coerce.number().int().min(1).max(100).default(20)
    })
  }),
  listVocabularyController
);

router.post(
  "/save",
  requireAuth,
  validate({
    body: saveWordSchema
  }),
  saveWordController
);

export default router;
