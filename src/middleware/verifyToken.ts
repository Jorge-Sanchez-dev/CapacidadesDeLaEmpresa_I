import { NextFunction, Response } from "express";
import jwt from "jsonwebtoken";
import User from "../models/User";
import { AuthRequest } from "../types";

export async function verifyToken(
  req: AuthRequest,
  res: Response,
  next: NextFunction
) {
  const header = req.headers.authorization;

  if (!header)
    return res.status(401).json({ message: "Token requerido" });

  const token = header.split(" ")[1];

  try {
    // Decodificar token para obtener el ID
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;

    // 🔥 Cargar el usuario completo desde MongoDB
    const user = await User.findById(decoded.id).lean();

    if (!user) {
      return res.status(404).json({ message: "Usuario no encontrado" });
    }

    // Guardar el usuario real en la request
req.user = user as any;   // rápido y efectivo

    next();
  } catch (err) {
    console.error("Error en verifyToken:", err);
    return res.status(403).json({ message: "Token inválido" });
  }
}
