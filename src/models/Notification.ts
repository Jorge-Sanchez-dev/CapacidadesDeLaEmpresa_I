import { Schema, model, Types, Document } from "mongoose";

export interface INotification extends Document {
  toUser: Types.ObjectId;
  type: "LOAN_REQUEST" | "LOAN_DECISION";
  title: string;
  message: string;
  read: boolean;
  meta?: any; // ej: { loanId: "...", userId: "...", amount: ... }
}

const notificationSchema = new Schema<INotification>(
  {
    toUser: { type: Schema.Types.ObjectId, ref: "User", required: true },
    type: { type: String, enum: ["LOAN_REQUEST", "LOAN_DECISION"], required: true },
    title: { type: String, required: true },
    message: { type: String, required: true },
    read: { type: Boolean, default: false },
    meta: { type: Schema.Types.Mixed },
  },
  { timestamps: true }
);

export default model<INotification>("Notification", notificationSchema);
