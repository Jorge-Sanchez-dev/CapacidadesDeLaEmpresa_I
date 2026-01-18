import { Schema, model, Types, Document } from "mongoose";

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

const loanSchema = new Schema<ILoan>(
  {
    user: { type: Schema.Types.ObjectId, ref: "User", required: true },
    account: { type: Schema.Types.ObjectId, ref: "Account" },

    amount: { type: Number, required: true, min: 1 },
    months: { type: Number, required: true, min: 1 },
    apr: { type: Number, required: true, min: 0 },

    concept: { type: String, default: "" },

    status: {
      type: String,
      enum: ["PENDING", "APPROVED", "REJECTED", "ACTIVE", "CLOSED"],
      default: "PENDING",
    },

    monthlyFee: { type: Number, required: true },
    totalToPay: { type: Number, required: true },
    remaining: { type: Number, required: true },

    startDate: { type: Date },
    decisionAt: { type: Date },
    decidedBy: { type: Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true }
);

export default model<ILoan>("Loan", loanSchema);
