// src/controllers/loanController.ts
import { Response } from "express";
import Loan from "../models/Loan";
import Account from "../models/Account";
import Notification from "../models/Notification";
import User from "../models/User";

function monthlyPayment(principal: number, months: number, annualRate: number) {
  const P = Number(principal || 0);
  const M = Number(months || 0);
  const R = Number(annualRate || 0);

  if (M <= 0) return 0;

  const r = R / 100 / 12;
  if (r === 0) return P / M;

  return (P * (r * Math.pow(1 + r, M))) / (Math.pow(1 + r, M) - 1);
}

// Helper: saca userId tanto si guardas req.user como req.userId
function getAuthUserId(req: any) {
  return req?.user?._id || req?.userId || null;
}

/* =========================
   USER: solicitar préstamo
   POST /loans/request
   body: { amount, months, apr, purpose }   (acepta concept también)
   ========================= */
export const requestLoan = async (req: any, res: Response) => {
  try {
    const userId = getAuthUserId(req);
    if (!userId) return res.status(401).json({ message: "No autenticado" });

    const userName = req?.user?.name || "El usuario";

    const { amount, months, apr } = req.body;
    const purposeRaw = req.body?.purpose ?? req.body?.concept ?? "";

    const A = Number(amount);
    const M = Number(months);
    const R = Number(apr);

    if (!Number.isFinite(A) || A <= 0 || !Number.isFinite(M) || M <= 0 || !Number.isFinite(R) || R < 0) {
      return res.status(400).json({ message: "Datos inválidos" });
    }

    const purpose = String(purposeRaw || "").trim();
    if (!purpose) {
      return res.status(400).json({ message: "Introduce un concepto/motivo del préstamo" });
    }

    // cuenta principal activa (si quieres obligar a que exista)
    const mainAcc = await Account.findOne({
      owner: userId,
      isMain: true,
      status: "active",
    }).lean();

    if (!mainAcc) {
      return res.status(400).json({ message: "El usuario no tiene cuenta principal activa" });
    }

    // Pre-cálculo para que el front tenga datos desde el minuto 0
    const fee = monthlyPayment(A, M, R);
    const total = fee * M;

    const loan = await Loan.create({
      applicant: userId,
      amount: A,
      months: M,
      purpose,

      status: "PENDING",

      interestAPR: R,
      monthlyPayment: Math.round(fee * 100) / 100,
      totalToPay: Math.round(total * 100) / 100,
      remainingToPay: Math.round(total * 100) / 100,
    });

    // Notificar admin (primer admin)
    const admin = await User.findOne({ role: "ADMIN" }).lean();
    if (admin) {
      await Notification.create({
        user: admin._id,
        type: "LOAN_REQUEST",
        title: "Nueva solicitud de préstamo",
        message: `${userName} solicita ${A}€ a ${M} meses (${R}% APR)`,
        meta: {
          loanId: loan._id,
          applicant: userId,
          amount: A,
          months: M,
          interestAPR: R,
          purpose,
        },
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
      status: { $in: ["PENDING", "APPROVED"] },
    })
      .sort({ createdAt: -1 })
      .lean();

    // ✅ Parche útil: si hay docs viejos sin remainingToPay pero con totalToPay, lo devolvemos bien
    const fixed = (loans || []).map((l: any) => {
      const total = Number(l.totalToPay ?? 0);
      const remain = Number(l.remainingToPay ?? 0);
      if ((!remain || remain === 0) && total > 0) {
        l.remainingToPay = total;
      }
      return l;
    });

    return res.json({ loans: fixed });
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

    // Cargamos el loan primero para poder recalcular correctamente
    const loan = await Loan.findById(id);
    if (!loan) return res.status(404).json({ message: "Préstamo no encontrado" });

    if ((loan as any).status !== "PENDING") {
      return res.status(400).json({ message: "Préstamo ya decidido" });
    }

    // Campos comunes
    (loan as any).decidedAt = new Date();
    (loan as any).decidedBy = adminId;

    if (action === "APPROVE") {
      (loan as any).status = "APPROVED";
      (loan as any).startedAt = new Date();

      // APR: si admin lo manda, sobrescribe; si no, deja el que venía
      if (apr !== undefined && apr !== null && apr !== "") {
        const newApr = Number(apr);
        if (!Number.isFinite(newApr) || newApr < 0) {
          return res.status(400).json({ message: "APR inválido" });
        }
        (loan as any).interestAPR = newApr;
      }

      // ✅ recalcula cuota/total/remaining (para evitar el “pendiente 0,00€”)
      const A = Number((loan as any).amount || 0);
      const M = Number((loan as any).months || 0);
      const R = Number((loan as any).interestAPR || 0);

      const fee = monthlyPayment(A, M, R);
      const total = fee * M;

      (loan as any).monthlyPayment = Math.round(fee * 100) / 100;
      (loan as any).totalToPay = Math.round(total * 100) / 100;

      // Si ya había remainingToPay por pagos parciales, no lo machacamos.
      // Pero si está a 0, lo inicializamos al total.
      const currentRemaining = Number((loan as any).remainingToPay || 0);
      if (!currentRemaining || currentRemaining === 0) {
        (loan as any).remainingToPay = Math.round(total * 100) / 100;
      }
    } else {
      (loan as any).status = "REJECTED";
      if (reason) (loan as any).decisionReason = String(reason);
    }

    await loan.save();

    // Notificar al usuario (applicant)
    if (!(loan as any).applicant) {
      return res.status(400).json({
        message: "Este préstamo está corrupto: falta applicant. Borra/corrige el documento en la BBDD.",
      });
    }

    await Notification.create({
      user: (loan as any).applicant,
      type: "LOAN_DECISION",
      title: "Estado de tu préstamo",
      message:
        action === "APPROVE"
          ? "Tu préstamo ha sido aprobado ✅"
          : reason
          ? `Tu préstamo ha sido denegado ❌ (${String(reason)})`
          : "Tu préstamo ha sido denegado ❌",
      meta: { loanId: loan._id, status: (loan as any).status },
    });

    return res.json({ message: "Decisión registrada ✅", loan });
  } catch (err) {
    console.error("decideLoan error:", err);
    return res.status(500).json({ message: "Error decidiendo préstamo" });
  }
};
