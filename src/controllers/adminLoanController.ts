
import { Request, Response } from "express";
import Loan from "../models/Loan";
import Notification from "../models/Notification";

function calcLoan(amount: number, months: number, aprPercent: number) {
  const r = (aprPercent / 100) / 12;
  if (r === 0) {
    const monthly = amount / months;
    return { monthlyPayment: monthly, totalToPay: amount };
  }
  const monthlyPayment = (amount * r) / (1 - Math.pow(1 + r, -months));
  const totalToPay = monthlyPayment * months;
  return { monthlyPayment, totalToPay };
}

export const adminListLoanRequests = async (req: Request, res: Response) => {
  try {
    const status = String(req.query.status || "PENDING");
    const loans = await Loan.find({ status })
      .populate("applicant", "name surname email")
      .sort({ createdAt: -1 })
      .lean();

    return res.json({ loans });
  } catch (err) {
    console.error("adminListLoanRequests error:", err);
    return res.status(500).json({ message: "Error listando solicitudes" });
  }
};

export const adminApproveLoan = async (req: Request, res: Response) => {
  try {
    const adminId = (req as any).userId;
    const { id } = req.params;

    const { interestAPR = 6 } = req.body;
    const loan = await Loan.findById(id);
    if (!loan) return res.status(404).json({ message: "Préstamo no encontrado" });
    if (loan.status !== "PENDING") return res.status(400).json({ message: "Esta solicitud ya no está pendiente" });

    const { monthlyPayment, totalToPay } = calcLoan(Number(loan.amount), Number(loan.months), Number(interestAPR));

    loan.status = "APPROVED";
    loan.decidedAt = new Date();
    loan.decidedBy = adminId as any;
    loan.interestAPR = Number(interestAPR);
    loan.monthlyPayment = Number(monthlyPayment.toFixed(2));
    loan.totalToPay = Number(totalToPay.toFixed(2));
    loan.startedAt = new Date();
    loan.remainingToPay = Number(totalToPay.toFixed(2));
    await loan.save();

    await Notification.create({
      user: loan.applicant,
      type: "LOAN",
      title: "Préstamo aprobado ✅",
      message: `Tu préstamo de ${loan.amount}€ ha sido aprobado. Cuota: ${loan.monthlyPayment}€ / mes.`,
      meta: { loanId: loan._id, status: "APPROVED" },
    });

    return res.json({ message: "Préstamo aprobado ✅", loan });
  } catch (err) {
    console.error("adminApproveLoan error:", err);
    return res.status(500).json({ message: "Error aprobando préstamo" });
  }
};

export const adminRejectLoan = async (req: Request, res: Response) => {
  try {
    const adminId = (req as any).userId;
    const { id } = req.params;
    const { reason = "" } = req.body;

    const loan = await Loan.findById(id);
    if (!loan) return res.status(404).json({ message: "Préstamo no encontrado" });
    if (loan.status !== "PENDING") return res.status(400).json({ message: "Esta solicitud ya no está pendiente" });

    loan.status = "REJECTED";
    loan.decidedAt = new Date();
    loan.decidedBy = adminId as any;
    loan.decisionReason = String(reason || "");
    await loan.save();

    await Notification.create({
      user: loan.applicant,
      type: "LOAN",
      title: "Préstamo denegado ❌",
      message: reason ? `Tu solicitud fue denegada: ${reason}` : "Tu solicitud fue denegada.",
      meta: { loanId: loan._id, status: "REJECTED" },
    });

    return res.json({ message: "Préstamo denegado ✅", loan });
  } catch (err) {
    console.error("adminRejectLoan error:", err);
    return res.status(500).json({ message: "Error denegando préstamo" });
  }
};
