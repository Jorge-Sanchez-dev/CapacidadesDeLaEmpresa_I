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
router.patch("/users/:id", adminUpdateUser);
router.get("/dashboard", adminDashboard);


// Resumen usuario (cuenta + movimientos)
router.get("/users/:id/summary", adminUserSummary);

export default router;
