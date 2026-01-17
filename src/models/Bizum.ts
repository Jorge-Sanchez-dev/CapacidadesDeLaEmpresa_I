import { Schema, model, Types } from "mongoose";

export interface IBizum {
  fromUser: Types.ObjectId;
  toUser: Types.ObjectId;

  fromAccount: Types.ObjectId;
  toAccount: Types.ObjectId;

  amount: number;
  concept?: string;

  // “Bizum style”: móvil (opcional, por si en tu UI lo metes)
  toPhone?: string;

  status: "PENDING" | "COMPLETED" | "FAILED";
  createdAt: Date;
}

const BizumSchema = new Schema<IBizum>(
  {
    fromUser: { type: Schema.Types.ObjectId, ref: "User", required: true },
    toUser: { type: Schema.Types.ObjectId, ref: "User", required: true },

    fromAccount: { type: Schema.Types.ObjectId, ref: "Account", required: true },
    toAccount: { type: Schema.Types.ObjectId, ref: "Account", required: true },

    amount: { type: Number, required: true, min: 0.01 },
    concept: { type: String, default: "" },
    toPhone: { type: String, default: "" },

    status: { type: String, enum: ["PENDING", "COMPLETED", "FAILED"], default: "COMPLETED" },
  },
  { timestamps: true }
);

export default model<IBizum>("Bizum", BizumSchema);
