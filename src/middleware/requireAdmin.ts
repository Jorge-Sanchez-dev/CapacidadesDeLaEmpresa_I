
import { Response, NextFunction } from "express";
import { AuthRequest } from "../types";

export function requireAdmin(req: AuthRequest, res: Response, next: NextFunction) {
  const role = (req.user as any)?.role;
  if (role !== "ADMIN") {
    return res.status(403).json({ message: "Acceso solo para administradores" });
  }
  next();
}
