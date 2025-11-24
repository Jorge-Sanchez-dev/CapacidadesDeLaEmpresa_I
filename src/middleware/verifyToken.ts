import { NextFunction, Response } from "express";
import jwt from "jsonwebtoken";
import { AuthRequest } from "../types";

export function verifyToken(req: AuthRequest, res: Response, next: NextFunction) {
  const header = req.headers.authorization;

  if (!header) return res.status(401).json({ message: "Token requerido" });

  const token = header.split(" ")[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
    req.user = { id: decoded.id, email: decoded.email };
    next();
  } catch {
    return res.status(403).json({ message: "Token inválido" });
  }
}
