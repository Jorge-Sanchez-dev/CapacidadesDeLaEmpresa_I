// src/controllers/loanController.ts
import { Response } from "express";
import Loan from "../models/Loan";
import Account from "../models/Account";
import Notification from "../models/Notification";
import User from "../models/User";

function monthlyPayment(principal: number, months: number, annualRate: number) {
  const r = annualRate / 100 / 12;
  if (r === 0) return principal / months;
  return (principal * (r * Math.pow(1 + r, months))) / (Math.pow(1 + r, months) - 1);
}

// Helper: saca userId tanto si guardas req.user como req.userId
function getAuthUserId(req: any) {
  return req?.user?._id || req?.userId || null;
}

/* =========================
   USER: solicitar préstamo
   POST /loans/request
   body: { amount, months, apr, concept }
   ========================= */
export const requestLoan = async (req: any, res: Response) => {
  try {
    const userId = getAuthUserId(req);
    if (!userId) return res.status(401).json({ message: "No autenticado" });

    const userName = req?.user?.name || "El usuario";

    const { amount, months, apr, concept } = req.body;

    const A = Number(amount);
    const M = Number(months);
    const R = Number(apr);

    if (!Number.isFinite(A) || A <= 0 || !Number.isFinite(M) || M <= 0 || !Number.isFinite(R) || R < 0) {
      return res.status(400).json({ message: "Datos inválidos" });
    }

    // cuenta principal activa (obligatoria)
    const mainAcc = await Account.findOne({
      owner: userId,
      isMain: true,
      status: "active",
    }).lean();

    if (!mainAcc) {
      return res.status(400).json({ message: "El usuario no tiene cuenta principal activa" });
    }

    const fee = monthlyPayment(A, M, R);
    const total = fee * M;

    // ✅ CLAVE: tu schema pide applicant (required)
    const loan = await Loan.create({
      applicant: userId,
      account: mainAcc._id,
      amount: A,
      months: M,
      apr: R,
      concept: concept || "",
      status: "PENDING",
      monthlyFee: Math.round(fee * 100) / 100,
      totalToPay: Math.round(total * 100) / 100,
      remaining: Math.round(total * 100) / 100,
    });

    // notificar admin (primer admin)
    const admin = await User.findOne({ role: "ADMIN" }).lean();
    if (admin) {
      await Notification.create({
        toUser: admin._id,
        type: "LOAN_REQUEST",
        title: "Nueva solicitud de préstamo",
        message: `${userName} solicita ${A}€ a ${M} meses (${R}% APR)`,
        meta: { loanId: loan._id, applicant: userId, amount: A, months: M, apr: R, concept: concept || "" },
      });
    }

    return res.status(201).json({ message: "Solicitud enviada ✅", loanId: loan._id });
  } catch (err) {
    console.error("requestLoan error:", err);
    return res.status(500).json({ message: "Error solicitando préstamo" });
  }
};

/* =========================
   USER: ver mis préstamos
   GET /loans/mine
   ========================= */
export const getMyLoans = async (req: any, res: Response) => {
  try {
    const userId = getAuthUserId(req);
    if (!userId) return res.status(401).json({ message: "No autenticado" });

    const loans = await Loan.find({
      applicant: userId,
      status: { $in: ["PENDING", "APPROVED"] }, // ✅ sin ACTIVE
    })
      .sort({ createdAt: -1 })
      .lean();

    return res.json({ loans });
  } catch (err) {
    console.error("getMyLoans error:", err);
    return res.status(500).json({ message: "Error listando préstamos" });
  }
};

/* =========================
   ADMIN: ver pendientes
   GET /loans/pending
   ========================= */
export const listPendingLoans = async (req: any, res: Response) => {
  try {
    const loans = await Loan.find({ status: "PENDING" })
      .populate("applicant", "name surname email")
      .sort({ createdAt: -1 })
      .lean();

    return res.json({ loans });
  } catch (err) {
    console.error("listPendingLoans error:", err);
    return res.status(500).json({ message: "Error listando solicitudes" });
  }
};

/* =========================
   ADMIN: decidir
   POST /loans/:id/decide
   body: { action: "APPROVE" | "REJECT", apr?, reason? }
   ========================= */
export const decideLoan = async (req: any, res: Response) => {
  try {
    const adminId = getAuthUserId(req);
    if (!adminId) return res.status(401).json({ message: "No autenticado" });

    const { id } = req.params;
    const { action, apr, reason } = req.body;

    if (action !== "APPROVE" && action !== "REJECT") {
      return res.status(400).json({ message: "Acción inválida (APPROVE/REJECT)" });
    }

    const loan = await Loan.findById(id);
    if (!loan) return res.status(404).json({ message: "Préstamo no encontrado" });
    if ((loan as any).status !== "PENDING") return res.status(400).json({ message: "Ya está decidido" });

    if (action === "APPROVE") {
      (loan as any).status = "APPROVED";
      // Guarda APR si tu modelo lo tiene (si no, no pasa nada)
      if (apr !== undefined && apr !== null && apr !== "") {
        (loan as any).apr = Number(apr);
      }
    } else {
      (loan as any).status = "REJECTED";
      if (reason) (loan as any).decisionReason = String(reason);
    }

    (loan as any).decidedAt = new Date();
    (loan as any).decidedBy = adminId;

    await loan.save();

    // notificar al usuario (applicant)
    await Notification.create({
      toUser: (loan as any).applicant,
      type: "LOAN_DECISION",
      title: "Estado de tu préstamo",
      message:
        action === "APPROVE"
          ? "Tu préstamo ha sido aprobado ✅"
          : (reason ? `Tu préstamo ha sido denegado ❌ (${String(reason)})` : "Tu préstamo ha sido denegado ❌"),
      meta: { loanId: loan._id, status: (loan as any).status },
    });

    return res.json({ message: "Decisión registrada ✅", loan });
  } catch (err) {
    console.error("decideLoan error:", err);
    return res.status(500).json({ message: "Error decidiendo préstamo" });
  }
};
