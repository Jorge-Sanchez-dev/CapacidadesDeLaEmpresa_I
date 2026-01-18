// src/controllers/authController.ts
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import User, { IUser } from "../models/User";
import Account from "../models/Account";
import { Request, Response } from "express";
import Transfer from "../models/Transfer";
import Bizum from "../models/Bizum";

const JWT_SECRET = process.env.JWT_SECRET as string;

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

    // ✅ ejemplo mínimo de validación (ajusta a lo tuyo)
    if (!email || !password || !name) {
      return res.status(400).json({ message: "Datos incompletos" });
    }

    // ✅ evitar email duplicado
    const exists = await User.findOne({ email }).lean();
    if (exists) {
      return res.status(400).json({ message: "El email ya está registrado" });
    }

    const hashed = await bcrypt.hash(password, 10);

    // ✅ PRIMER USER = ADMIN, resto = USER
    const existingAdmin = await User.findOne({ role: "ADMIN" }).lean();
    const roleToAssign = existingAdmin ? "USER" : "ADMIN";

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
      role: roleToAssign, // ✅ AÑADIDO
    });

    // 👉 Crear una cuenta vacía asociada a este usuario
    const timestamp = Date.now().toString().slice(-10);
    const fakeAccountNumber = "0000" + timestamp;
    const fakeIban = `ES12 1111 2222 ${timestamp.slice(-4)}`;
    const normalizedIban = fakeIban.replace(/\s+/g, "");

    await Account.create({
      owner: user._id,
      iban: normalizedIban,
      accountNumber: fakeAccountNumber,
      currency: mainCurrency,
      balance: 0,
      alias: "Cuenta nómina",
      status: "active",
      type: "NOMINA",
      isMain: true,
    });

    return res.status(201).json({
      message: "Usuario y cuenta creados correctamente",
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: (user as any).role,
      },
    });
  } catch (err) {
    console.error("Error en register:", err);
    return res.status(500).json({ message: "Error en el servidor" });
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
      return res.status(400).json({ message: "Usuario no existe" });
    }

    const ok = await bcrypt.compare(password, user.password);
    if (!ok) {
      return res.status(400).json({ message: "Contraseña incorrecta" });
    }

    const token = jwt.sign({ id: user._id, email: user.email }, JWT_SECRET, {
      expiresIn: "7d",
    });

    const safeUser = {
      id: user._id,
      name: user.name,
      surname: user.surname,
      email: user.email,
      mainCurrency: user.mainCurrency,
      role: (user as any).role, // ✅
    };

    return res.json({ token, user: safeUser });
  } catch (err) {
    console.error("Error en login:", err);
    return res.status(500).json({ message: "Error en el servidor" });
  }
};

// ME
export const me = (req: any, res: Response) => {
  if (!req.user) return res.status(401).json({ message: "No autenticado" });
  return res.json({ user: req.user });
};

// DASHBOARD: cuenta principal + últimos movimientos (transfers + bizums)
export const dashboard = async (req: any, res: Response) => {
  try {
    const userId = req.user?._id;
    if (!userId) return res.status(401).json({ message: "No autenticado" });

    // 1) Cuenta principal
    const mainAccount = await Account.findOne({
      owner: userId,
      isMain: true,
      status: "active",
    }).lean();

    if (!mainAccount) {
      return res.json({ user: req.user, account: null, movements: [] });
    }

    // 2) Últimas transferencias
    const transfers = await Transfer.find({
      status: "completed",
      $or: [{ fromAccount: mainAccount._id }, { toAccount: mainAccount._id }],
    })
      .sort({ date: -1 })
      .limit(10)
      .lean();

    // 3) Últimos bizums
    const bizums = await Bizum.find({
      status: "COMPLETED",
      $or: [{ fromUser: userId }, { toUser: userId }],
    })
      .sort({ createdAt: -1 })
      .limit(10)
      .lean();

    // 4) Resumen cuenta
    const accountSummary = {
      alias: mainAccount.alias || "Cuenta principal",
      iban: mainAccount.iban,
      balance: mainAccount.balance,
      currency: mainAccount.currency,
    };

    // helper fecha segura
    const toMillis = (d: any) => {
      const t = new Date(d).getTime();
      return Number.isFinite(t) ? t : 0;
    };

    // 5) Transfers -> movements
    const transferMovements = transfers.map((t: any) => {
      const isOutgoing = String(t.fromAccount) === String(mainAccount._id);
      return {
        id: t._id,
        concept: t.concept ? `Transferencia · ${t.concept}` : "Transferencia",
        date: t.date,
        amount: Number(t.amount || 0),
        direction: isOutgoing ? "OUT" : "IN",
      };
    });

    // 6) Bizums -> movements
    const bizumMovements = bizums.map((b: any) => {
      const isOutgoing = String(b.fromUser) === String(userId);
      return {
        id: b._id,
        concept: b.concept ? `Bizum · ${b.concept}` : "Bizum",
        date: b.createdAt,
        amount: Number(b.amount || 0),
        direction: isOutgoing ? "OUT" : "IN",
      };
    });

    // 7) Mezclar + ordenar + top 10
    const allMovements = [...bizumMovements, ...transferMovements]
      .sort((a, c) => toMillis(c.date) - toMillis(a.date))
      .slice(0, 10);

    return res.json({
      user: req.user,
      account: accountSummary,
      movements: allMovements,
    });
  } catch (err) {
    console.error("Error en dashboard:", err);
    return res.status(500).json({ message: "Error en el servidor" });
  }
};

// TRANSFERENCIA por IBAN (tuya, sin cambios relevantes)
export const transfer = async (req: any, res: Response) => {
  try {
    const user = req.user;
    if (!user) return res.status(401).json({ message: "No autenticado" });

    const { toIban, amount, concept } = req.body;

    if (!toIban || !amount) {
      return res
        .status(400)
        .json({ message: "IBAN destino y cantidad son obligatorios" });
    }

    const numericAmount = Number(amount);
    if (!Number.isFinite(numericAmount) || numericAmount <= 0) {
      return res
        .status(400)
        .json({ message: "La cantidad debe ser un número positivo" });
    }

    const fromAccount = await Account.findOne({
      owner: user._id,
      isMain: true,
      status: "active",
    });

    if (!fromAccount) {
      return res
        .status(400)
        .json({ message: "No se ha encontrado la cuenta de origen" });
    }

    if (fromAccount.balance < numericAmount) {
      return res
        .status(400)
        .json({ message: "Saldo insuficiente en la cuenta de origen" });
    }

    const toAccount = await Account.findOne({
      iban: toIban.replace(/\s+/g, ""),
      status: "active",
    });

    if (!toAccount) {
      return res
        .status(404)
        .json({ message: "No se ha encontrado la cuenta destino" });
    }

    if (toAccount._id.toString() === fromAccount._id.toString()) {
      return res
        .status(400)
        .json({ message: "La cuenta destino no puede ser la misma" });
    }

    fromAccount.balance -= numericAmount;
    toAccount.balance += numericAmount;

    await fromAccount.save();
    await toAccount.save();

    const destUser = await User.findById(toAccount.owner).lean();
    const counterpartName = destUser
      ? `${destUser.name} ${destUser.surname}`.trim()
      : undefined;

    const transfer = await Transfer.create({
      fromAccount: fromAccount._id,
      toAccount: toAccount._id,
      amount: numericAmount,
      currency: fromAccount.currency,
      concept: concept || "Transferencia bancaria",
      date: new Date(),
      status: "completed",
      direction: "OUT",
      counterpartName,
      counterpartIban: toAccount.iban,
    });

    return res.json({
      message: "Transferencia realizada correctamente",
      transfer,
    });
  } catch (err) {
    console.error("Error en transfer:", err);
    return res.status(500).json({ message: "Error en el servidor" });
  }
};
