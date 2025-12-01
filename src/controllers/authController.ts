// src/controllers/authController.ts
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import User, { IUser } from "../models/User";
import Account from "../models/Account"; // 👈 añade esto
import { Request, Response } from "express";
import Transfer from "../models/Transfer";
import { verifyToken } from "../middleware/verifyToken"; // si usas ese tipo




const JWT_SECRET = process.env.JWT_SECRET as string; // asegúrate de tenerlo en .env

if (!JWT_SECRET) {
  console.warn("⚠️ No se ha definido JWT_SECRET en el .env");
}

// REGISTER
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

    // ... (misma validación y comprobaciones que ya tienes)

    const hashed = await bcrypt.hash(password, 10);

    const user: IUser = await User.create({
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

    // 👉 Crear una cuenta vacía asociada a este usuario
    // Generamos un IBAN y accountNumber "falsos" para el proyecto
    const timestamp = Date.now().toString().slice(-10);
    const fakeAccountNumber = "0000" + timestamp; // 14 dígitos aprox
    const fakeIban = `ES12 1111 2222 ${timestamp.slice(-4)}`;

    await Account.create({
      owner: user._id,
      iban: fakeIban,
      accountNumber: fakeAccountNumber,
      currency: mainCurrency,
      balance: 0,
      alias: "Cuenta nómina",
      status: "active",
      type: "NOMINA",
      isMain: true,
    });

    return res
      .status(201)
      .json({ message: "Usuario y cuenta creados correctamente" });
  } catch (err) {
    console.error("Error en register:", err);
    return res
      .status(500)
      .json({ message: "Error en el servidor" });
  }
};


// LOGIN
export const login = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res
        .status(400)
        .json({ message: "Email y contraseña son obligatorios" });
    }

    const user = await User.findOne({ email });

    if (!user) {
      return res
        .status(400)
        .json({ message: "Usuario no existe" });
    }

    const ok = await bcrypt.compare(password, user.password);
    if (!ok) {
      return res
        .status(400)
        .json({ message: "Contraseña incorrecta" });
    }

    const token = jwt.sign(
      { id: user._id, email: user.email },
      JWT_SECRET,
      { expiresIn: "7d" }
    );

    // devolvemos también datos básicos para el front
    const safeUser = {
      id: user._id,
      name: user.name,
      surname: user.surname,
      email: user.email,
      mainCurrency: user.mainCurrency,
    };

    return res.json({ token, user: safeUser });
  } catch (err) {
    console.error("Error en login:", err);
    return res
      .status(500)
      .json({ message: "Error en el servidor" });
  }
};

// ME (usuario autenticado)
export const me = (req: any, res: Response) => {
  // req.user lo rellenará el middleware verifyToken
  if (!req.user) {
    return res.status(401).json({ message: "No autenticado" });
  }

  return res.json({ user: req.user });
};

// DASHBOARD: cuenta principal + últimos movimientos
export const dashboard = async (req: any, res: Response) => {
  try {
    // req.user lo rellena verifyToken
    const userId = req.user?._id;

    if (!userId) {
      return res.status(401).json({ message: "No autenticado" });
    }

    // 1) Obtenemos la cuenta principal
    const mainAccount = await Account.findOne({
      owner: userId,
      isMain: true,
      status: "active",
    });

    if (!mainAccount) {
      return res.json({
        account: null,
        movements: [],
      });
    }

    // 2) Obtenemos los últimos movimientos de esa cuenta (si existen)
    const transfers = await Transfer.find({
      fromAccount: mainAccount._id,
      status: "completed",
    })
      .sort({ date: -1 })
      .limit(5)
      .lean();

    // 3) Damos forma a lo que queremos enviar al front
    const accountSummary = {
      alias: mainAccount.alias || "Cuenta principal",
      iban: mainAccount.iban,
      balance: mainAccount.balance,
      currency: mainAccount.currency,
    };

    const movements = transfers.map((t) => ({
      id: t._id,
      concept: t.concept,
      date: t.date,
      amount: t.amount,
      direction: t.direction, // "IN" | "OUT"
    }));

    return res.json({
  user: {
    name: req.user.name,
    surname: req.user.surname,
  },
  account: accountSummary,
  movements,
});

  } catch (err) {
    console.error("Error en dashboard:", err);
    return res.status(500).json({ message: "Error en el servidor" });
  }
};
