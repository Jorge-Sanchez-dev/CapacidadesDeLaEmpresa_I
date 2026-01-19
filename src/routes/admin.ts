// src/routes/admin.ts
import { Router } from "express";
import { verifyToken } from "../middleware/verifyToken";
import { requireAdmin } from "../middleware/requireAdmin";
import {
  adminDashboard,
  adminListUsers,
  adminUpdateUser,
  adminUserSummary,
} from "../controllers/adminController";


const router = Router();

router.use(verifyToken, requireAdmin);

// Usuarios
router.get("/users", adminListUsers);
router.get("/users/:id/summary", adminUserSummary);

router.get("/dashboard", adminDashboard);

// ✅ Actualización usuario (acepta PUT y PATCH)
router.put("/users/:id", adminUpdateUser);
router.patch("/users/:id", adminUpdateUser);


export default router;
