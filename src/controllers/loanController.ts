import { Response } from "express";
import Loan from "../models/Loan";
import Account from "../models/Account";
import Notification from "../models/Notification";
import User from "../models/User";

function monthlyPayment(principal: number, months: number, annualRate: number) {
  const r = (annualRate / 100) / 12;
  if (r === 0) return principal / months;
  return principal * (r * Math.pow(1 + r, months)) / (Math.pow(1 + r, months) - 1);
}

export const requestLoan = async (req: any, res: Response) => {
  try {
    const userId = req.user?._id;
    if (!userId) return res.status(401).json({ message: "No autenticado" });

    const { amount, months, apr, concept } = req.body;

    const A = Number(amount);
    const M = Number(months);
    const R = Number(apr);

    if (!Number.isFinite(A) || A <= 0 || !Number.isFinite(M) || M <= 0 || R < 0) {
      return res.status(400).json({ message: "Datos inválidos" });
    }

    // asociar a cuenta principal
    const mainAcc = await Account.findOne({ owner: userId, isMain: true, status: "active" }).lean();
    const fee = monthlyPayment(A, M, R);
    const total = fee * M;

    const loan = await Loan.create({
      user: userId,
      account: mainAcc?._id,
      amount: A,
      months: M,
      apr: R,
      concept: concept || "",
      status: "PENDING",
      monthlyFee: Math.round(fee * 100) / 100,
      totalToPay: Math.round(total * 100) / 100,
      remaining: Math.round(total * 100) / 100,
    });

    // notificar al admin (por ahora: primer admin que exista)
    const admin = await User.findOne({ role: "ADMIN" }).lean();
    if (admin) {
      await Notification.create({
        toUser: admin._id,
        type: "LOAN_REQUEST",
        title: "Nueva solicitud de préstamo",
        message: `${req.user.name} solicita ${A}€ a ${M} meses (${R}% TIN)`,
        meta: { loanId: loan._id, userId, amount: A, months: M, apr: R },
      });
    }

    return res.status(201).json({ message: "Solicitud enviada ✅", loanId: loan._id });
  } catch (err) {
    return res.status(500).json({ message: "Error solicitando préstamo", error: String(err) });
  }
};

export const myLoans = async (req: any, res: Response) => {
  try {
    const userId = req.user?._id;
    if (!userId) return res.status(401).json({ message: "No autenticado" });

    const loans = await Loan.find({ user: userId, status: { $in: ["ACTIVE", "APPROVED"] } })
      .sort({ createdAt: -1 })
      .lean();

    return res.json({ loans });
  } catch (err) {
    return res.status(500).json({ message: "Error listando préstamos", error: String(err) });
  }
};

// ADMIN: ver solicitudes pendientes
export const listPendingLoans = async (req: any, res: Response) => {
  const loans = await Loan.find({ status: "PENDING" }).sort({ createdAt: -1 }).lean();
  return res.json({ loans });
};

// ADMIN: decidir
export const decideLoan = async (req: any, res: Response) => {
  try {
    const adminId = req.user?._id;
    const { id } = req.params;
    const { action } = req.body; // "APPROVE" o "REJECT"

    const loan = await Loan.findById(id);
    if (!loan) return res.status(404).json({ message: "Préstamo no encontrado" });
    if (loan.status !== "PENDING") return res.status(400).json({ message: "Ya está decidido" });

    if (action === "APPROVE") {
      loan.status = "ACTIVE";
      loan.startDate = new Date();
    } else {
      loan.status = "REJECTED";
    }

    loan.decisionAt = new Date();
    loan.decidedBy = adminId;

    await loan.save();

    // notificar al usuario
    await Notification.create({
      toUser: loan.user,
      type: "LOAN_DECISION",
      title: "Estado de tu préstamo",
      message: action === "APPROVE" ? "Tu préstamo ha sido aprobado ✅" : "Tu préstamo ha sido denegado ❌",
      meta: { loanId: loan._id, status: loan.status },
    });

    return res.json({ message: "Decisión registrada ✅", loan });
  } catch (err) {
    return res.status(500).json({ message: "Error decidiendo préstamo", error: String(err) });
  }
};
