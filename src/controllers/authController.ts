import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import User from "../models/User";
import { Request, Response } from "express";

export async function register(req: Request, res: Response) {
  const { email, password } = req.body;

  const exists = await User.findOne({ email });
  if (exists) return res.status(400).json({ message: "Usuario ya existe" });

  const hash = await bcrypt.hash(password, 10);

  const user = new User({ email, password: hash });
  await user.save();

  res.json({ message: "Usuario registrado" });
}

export async function login(req: Request, res: Response) {
  const { email, password } = req.body;

  const user = await User.findOne({ email });
  if (!user) return res.status(400).json({ message: "Usuario no existe" });

  const ok = await bcrypt.compare(password, user.password);
  if (!ok) return res.status(400).json({ message: "Contraseña incorrecta" });

  const token = jwt.sign(
    { id: user._id, email: user.email },
    process.env.JWT_SECRET!,
    { expiresIn: "7d" }
  );

  res.json({ token });
}

export function me(req: any, res: Response) {
  res.json({ usuario: req.user });
}
