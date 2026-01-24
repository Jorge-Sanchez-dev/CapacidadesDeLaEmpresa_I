import { Request, Response } from "express";
import mongoose from "mongoose";
import Bizum from "../models/Bizum";
import Account from "../models/Account";
import User from "../models/User";

const normalizePhone = (raw: string) => (raw || "").replace(/[^\d]/g, "");

export const createBizum = async (req: Request, res: Response) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const userId = (req as any).user?.id || (req as any).user?.userId || (req as any).userId;
    const { toPhone, amount, concept } = req.body;

    const phone = normalizePhone(toPhone);
    const amt = Number(amount);

    if (!phone || !amt || amt <= 0) {
      return res.status(400).json({ message: "Datos inválidos" });
    }

    const toUser = await User.findOne({ phone }).session(session);
    if (!toUser) {
      return res.status(404).json({ message: "No existe un usuario con ese teléfono" });
    }

    if (String(toUser._id) === String(userId)) {
      return res.status(400).json({ message: "No puedes enviarte un Bizum a ti mismo" });
    }

   let fromAcc = await Account.findOne({
  owner: userId,
  status: "active",
}).session(session);

let toAcc = await Account.findOne({
  owner: toUser._id,
  status: "active",
}).session(session);


if (!fromAcc || !toAcc) {
  return res.status(404).json({ message: "Cuenta origen o destino no encontrada" });
}


    if (Number((fromAcc as any).balance) < amt) {
      return res.status(400).json({ message: "Saldo insuficiente" });
    }

    (fromAcc as any).balance = Number((fromAcc as any).balance) - amt;
    (toAcc as any).balance = Number((toAcc as any).balance) + amt;

    await fromAcc.save({ session });
    await toAcc.save({ session });

    const bizum = await Bizum.create(
      [{
        fromUser: userId,
        toUser: toUser._id,
        fromAccount: fromAcc._id,
        toAccount: toAcc._id,
        amount: amt,
        concept: concept || "",
        toPhone: phone,
        status: "COMPLETED",
      }],
      { session }
    );

    await session.commitTransaction();
    session.endSession();

    return res.status(201).json({ message: "Bizum enviado ✅", bizum: bizum[0] });
  } catch (err) {
    await session.abortTransaction();
    session.endSession();
    return res.status(500).json({ message: "Error creando Bizum", error: String(err) });
  }
};


export const listMyBizums = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;

    const bizums = await Bizum.find({
      $or: [{ fromUser: userId }, { toUser: userId }],
    })
      .sort({ createdAt: -1 })
      .lean();

    return res.json(bizums);
  } catch (err) {
    return res.status(500).json({ message: "Error listando Bizums", error: String(err) });
  }
};
