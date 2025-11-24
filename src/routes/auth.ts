//routes/auth.ts
import { Router } from "express";
import { register, login, me } from "../controllers/authController";
import { verifyToken } from "../middleware/verifyToken";

const router = Router();

router.post("/register", register);
router.post("/login", login);
router.get("/me", verifyToken, me);

export default router;
