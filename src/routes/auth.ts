// src/routes/auth.ts
import { Router } from "express";
import {
  register,
  login,
  me,
  dashboard,
  transfer,
} from "../controllers/authController";

import { verifyToken } from "../middleware/verifyToken";

const router = Router();

router.post("/register", register);
router.post("/login", login);
router.get("/me", verifyToken, me);
router.get("/dashboard", verifyToken, dashboard);
router.post("/transfer", verifyToken, transfer);

export default router;
