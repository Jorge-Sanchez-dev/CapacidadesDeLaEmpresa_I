import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import User from "../models/User";
import { Request, Response } from "express";


export const register = async (req: Request, res: Response) => {
  try {
    const {
      name,
      surname,
      birthDate,
      dni,
      country,
      city,
      address,
      postalCode,
      email,
      phone,
      password,
      mainCurrency,
    } = req.body;

    // Validación mínima (podrías hacerla más pro)
    if (
      !name ||
      !surname ||
      !birthDate ||
      !dni ||
      !country ||
      !city ||
      !address ||
      !postalCode ||
      !email ||
      !phone ||
      !password ||
      !mainCurrency
    ) {
      return res.status(400).json({ message: "Faltan campos obligatorios" });
    }

    const existing = await User.findOne({ email });
    if (existing) {
      return res.status(400).json({ message: "El email ya está registrado" });
    }

    const hashed = await bcrypt.hash(password, 10);

    const user = await User.create({
      name,
      surname,
      birthDate,
      dni,
      country,
      city,
      address,
      postalCode,
      email,
      phone,
      password: hashed,
      mainCurrency,
    });

    // Si quieres puedes devolver solo un OK sin token:
    return res.status(201).json({ message: "Usuario creado correctamente" });

    // O incluso devolver un token directamente si te apetece.
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Error en el servidor" });
  }
};


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
