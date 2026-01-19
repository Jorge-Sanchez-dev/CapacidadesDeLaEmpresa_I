import mongoose, { Schema, model, Types, Document } from "mongoose";

export interface ILoan extends Document {
  user: Types.ObjectId;
  account?: Types.ObjectId;         // a qué cuenta va asociado (opcional)
  amount: number;
  months: number;
  apr: number;                      // TIN %
  concept?: string;

  status: "PENDING" | "APPROVED" | "REJECTED" | "ACTIVE" | "CLOSED";
  monthlyFee: number;
  totalToPay: number;
  remaining: number;

  startDate?: Date;                 // cuando se activa (approve)
  decisionAt?: Date;
  decidedBy?: Types.ObjectId;        // admin que decide
}

export type LoanStatus = "PENDING" | "APPROVED" | "REJECTED" | "CANCELLED";

const LoanSchema = new Schema(
  {
    applicant: { type: Schema.Types.ObjectId, ref: "User", required: true },

    // Datos de solicitud
    amount: { type: Number, required: true, min: 1 },
    months: { type: Number, required: true, min: 1 },
    purpose: { type: String, default: "" },

    // Decisión / estado
    status: { type: String, enum: ["PENDING", "APPROVED", "REJECTED", "CANCELLED"], default: "PENDING" },
    decidedAt: { type: Date },
    decidedBy: { type: Schema.Types.ObjectId, ref: "User" }, // admin que decide
    decisionReason: { type: String, default: "" },

    // Si se aprueba: parámetros del préstamo
    interestAPR: { type: Number, default: 0 }, // % anual
    monthlyPayment: { type: Number, default: 0 },
    totalToPay: { type: Number, default: 0 },

    // Vida del préstamo (simple)
    startedAt: { type: Date },
    nextPaymentAt: { type: Date },
    remainingToPay: { type: Number, default: 0 },
  },
  { timestamps: true }
);

export default mongoose.model("Loan", LoanSchema);