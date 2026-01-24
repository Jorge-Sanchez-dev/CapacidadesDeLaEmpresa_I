import mongoose, { Schema, model, Types, Document } from "mongoose";

export interface ILoan extends Document {
  user: Types.ObjectId;
  account?: Types.ObjectId;
  amount: number;
  months: number;
  apr: number;   
  concept?: string;

  status: "PENDING" | "APPROVED" | "REJECTED" | "ACTIVE" | "CLOSED";
  monthlyFee: number;
  totalToPay: number;
  remaining: number;

  startDate?: Date;    
  decisionAt?: Date;
  decidedBy?: Types.ObjectId; 
}

export type LoanStatus = "PENDING" | "APPROVED" | "REJECTED" | "CANCELLED";

const LoanSchema = new Schema(
  {
    applicant: { type: Schema.Types.ObjectId, ref: "User", required: true },

    amount: { type: Number, required: true, min: 1 },
    months: { type: Number, required: true, min: 1 },
    purpose: { type: String, default: "" },

    status: { type: String, enum: ["PENDING", "APPROVED", "REJECTED", "CANCELLED"], default: "PENDING" },
    decidedAt: { type: Date },
    decidedBy: { type: Schema.Types.ObjectId, ref: "User" },
    decisionReason: { type: String, default: "" },

    interestAPR: { type: Number, default: 0 },
    monthlyPayment: { type: Number, default: 0 },
    totalToPay: { type: Number, default: 0 },

    startedAt: { type: Date },
    nextPaymentAt: { type: Date },
    remainingToPay: { type: Number, default: 0 },
  },
  { timestamps: true }
);

export default mongoose.model("Loan", LoanSchema);