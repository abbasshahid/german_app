import { Router } from "express";
import { z } from "zod";

import {
  currentUserController,
  loginController,
  logoutController,
  signupController
} from "../controllers/auth-controller.js";
import { requireAuth } from "../middleware/auth.js";
import { createRateLimiter } from "../middleware/rate-limit.js";
import { validate } from "../middleware/validate.js";

const router = Router();
const cefrEnum = z.enum(["A1", "A2", "B1", "B2", "C1"]);

router.post(
  "/signup",
  createRateLimiter({ windowMs: 60_000, max: 10, keyPrefix: "signup" }),
  validate({
    body: z.object({
      name: z.string().min(2).max(80),
      email: z.string().email(),
      password: z.string().min(8).max(72),
      cefrLevel: cefrEnum.default("B1")
    })
  }),
  signupController
);

router.post(
  "/login",
  createRateLimiter({ windowMs: 60_000, max: 10, keyPrefix: "login" }),
  validate({
    body: z.object({
      email: z.string().email(),
      password: z.string().min(8).max(72)
    })
  }),
  loginController
);

router.post("/logout", requireAuth, logoutController);
router.get("/me", requireAuth, currentUserController);

export default router;
