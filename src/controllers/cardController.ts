import { Request, Response } from "express";
import Card from "../models/Card";
import Account from "../models/Account";

function randomInt(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}
function genLast4() {
  return String(randomInt(0, 9999)).padStart(4, "0");
}
function genCvv() {
  return String(randomInt(0, 999)).padStart(3, "0");
}

export const listMyCards = async (req: any, res: Response) => {
  try {
    const userId = req.user?._id;
    if (!userId) return res.status(401).json({ message: "No autenticado" });

    const cards = await Card.find({ owner: userId })
      .sort({ createdAt: -1 })
      .lean();
    return res.json({ cards });
  } catch (err) {
    return res
      .status(500)
      .json({ message: "Error listando tarjetas", error: String(err) });
  }
};

export const createCard = async (req: any, res: Response) => {
  try {
    const userId = req.user?._id;
    if (!userId) return res.status(401).json({ message: "No autenticado" });

    const { alias, cardType, brand, creditLimit } = req.body;

    if (cardType === "CREDIT") {
      const creditCount = await Card.countDocuments({
        owner: userId,
        cardType: "CREDIT",
        status: "active",
      });

      if (creditCount >= 3) {
        return res.status(400).json({
          message: "Has alcanzado el máximo de tarjetas de crédito permitidas",
        });
      }
    }

    if (cardType === "DEBIT") {
      const existingDebit = await Card.findOne({
        owner: userId,
        cardType: "DEBIT",
        status: "active",
      });

      if (existingDebit) {
        return res.status(400).json({
          message: "Ya tienes una tarjeta de débito asociada a tu cuenta",
        });
      }
    }

    if (!alias || !cardType || !brand) {
      return res.status(400).json({ message: "Datos inválidos" });
    }

    let parsedCreditLimit: number | undefined = undefined;
    if (cardType === "CREDIT") {
      const lim = Number(creditLimit);
      if (!Number.isFinite(lim) || lim <= 0) {
        return res.status(400).json({ message: "Introduce un límite de crédito válido" });
      }
      parsedCreditLimit = lim;
    }

    let accountId = undefined;
    if (cardType === "DEBIT") {
      const mainAcc = await Account.findOne({
        owner: userId,
        isMain: true,
        status: "active",
      }).lean();
      if (mainAcc) accountId = mainAcc._id;
    }

    const month = randomInt(1, 12);
    const year = (new Date().getFullYear() + randomInt(2, 6)) % 100;

    const card = await Card.create({
      owner: userId,
      account: accountId,
      alias,
      cardType,
      brand,
      numberLast4: genLast4(),
      expiryMonth: month,
      expiryYear: year,
      cvv: genCvv(),
      status: "active",
      creditLimit: cardType === "CREDIT" ? parsedCreditLimit : undefined,
    });

    return res.status(201).json({ message: "Tarjeta creada ✅", card });
  } catch (err) {
    return res.status(500).json({ message: "Error creando tarjeta", error: String(err) });
  }
};

export const deleteCard = async (req: any, res: Response) => {
  try {
    const userId = req.user?._id;
    if (!userId) return res.status(401).json({ message: "No autenticado" });

    const { id } = req.params;
    if (!id) return res.status(400).json({ message: "ID requerido" });

    const card = await Card.findOneAndDelete({ _id: id, owner: userId });
    if (!card) {
      return res.status(404).json({ message: "Tarjeta no encontrada" });
    }

    return res.json({ message: "Tarjeta eliminada 🗑️" });
  } catch (err) {
    return res
      .status(500)
      .json({ message: "Error eliminando tarjeta", error: String(err) });
  }
};
