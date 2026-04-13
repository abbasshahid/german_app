import { Router } from "express";

import { getDashboardController } from "../controllers/dashboard-controller.js";
import { requireAuth } from "../middleware/auth.js";

const router = Router();

router.get("/", requireAuth, getDashboardController);

export default router;
