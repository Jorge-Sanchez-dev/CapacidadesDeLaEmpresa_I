import { Response, NextFunction } from "express";
import { AuthRequest } from "../types";

export function requireAdmin(req: AuthRequest, res: Response, next: NextFunction) {
  if (!req.user) return res.status(401).json({ message: "No autenticado" });
  if ((req.user as any).role !== "ADMIN")
    return res.status(403).json({ message: "Solo admin" });
  next();
}
