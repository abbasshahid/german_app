import { Router } from "express";

import adminRoutes from "./admin-routes.js";
import audioRoutes from "./audio-routes.js";
import authRoutes from "./auth-routes.js";
import dashboardRoutes from "./dashboard-routes.js";
import dictionaryRoutes from "./dictionary-routes.js";
import flashcardRoutes from "./flashcard-routes.js";
import profileRoutes from "./profile-routes.js";
import progressRoutes from "./progress-routes.js";
import storyRoutes from "./story-routes.js";
import vocabularyRoutes from "./vocabulary-routes.js";

const router = Router();

router.get("/health", (_req, res) => {
  res.json({ ok: true });
});

router.use("/auth", authRoutes);
router.use("/dashboard", dashboardRoutes);
router.use("/stories", storyRoutes);
router.use("/dictionary", dictionaryRoutes);
router.use("/vocabulary", vocabularyRoutes);
router.use("/flashcards", flashcardRoutes);
router.use("/progress", progressRoutes);
router.use("/profile", profileRoutes);
router.use("/admin", adminRoutes);
router.use("/audio", audioRoutes);

export default router;
