import { Router } from "express";
import { z } from "zod";

import {
  createDictionaryImportController,
  createStoryAdminController,
  getAdminUploadsController,
  getDictionaryImportFilesController,
  getDictionaryImportsController
} from "../controllers/admin-controller.js";
import { requireAdmin, requireAuth } from "../middleware/auth.js";
import { validate } from "../middleware/validate.js";

const router = Router();

const chapterSchema = z.object({
  chapterNumber: z.coerce.number().int().min(1),
  title: z.string().min(1),
  contentHtml: z.string().min(1),
  imageUrl: z.string().url().optional()
});

router.get("/uploads", requireAuth, requireAdmin, getAdminUploadsController);
router.get("/dictionary/files", requireAuth, requireAdmin, getDictionaryImportFilesController);
router.get("/dictionary/imports", requireAuth, requireAdmin, getDictionaryImportsController);

router.post(
  "/dictionary/imports",
  requireAuth,
  requireAdmin,
  validate({
    body: z.object({
      fileName: z.string().min(1),
      defaultLevel: z.enum(["A1", "A2", "B1", "B2", "C1"]).default("B1"),
      maxEntries: z.coerce.number().int().min(1).max(2000000).optional()
    })
  }),
  createDictionaryImportController
);

router.post(
  "/stories",
  requireAuth,
  requireAdmin,
  validate({
    body: z.object({
      slug: z.string().min(1),
      title: z.string().min(1),
      subtitle: z.string().optional(),
      excerpt: z.string().min(20),
      contentType: z.enum(["story", "dialogue", "essay", "letter"]),
      level: z.enum(["A1", "A2", "B1", "B2", "C1"]),
      genre: z.string().min(1),
      minutes: z.coerce.number().int().min(1),
      wordCount: z.coerce.number().int().min(1),
      coverImageUrl: z.string().url().optional(),
      audioText: z.string().optional(),
      audioUrl: z.string().url().optional(),
      isFeatured: z.boolean().default(false),
      chapters: z.array(chapterSchema).min(1)
    })
  }),
  createStoryAdminController
);

export default router;
