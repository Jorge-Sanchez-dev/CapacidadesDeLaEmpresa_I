import mongoose,  {Schema, model, Types, Document } from "mongoose";


export interface INotification extends Document {
  toUser: Types.ObjectId;
  type: "LOAN_REQUEST" | "LOAN_DECISION";
  title: string;
  message: string;
  read: boolean;
  meta?: any;
}

const NotificationSchema = new Schema(
  {
    user: { type: Schema.Types.ObjectId, ref: "User", required: true },
    title: { type: String, required: true },
    message: { type: String, required: true },
    type: { type: String, default: "INFO" },
    read: { type: Boolean, default: false },
    meta: { type: Schema.Types.Mixed, default: {} },
  },
  { timestamps: true }
);

export default mongoose.model("Notification", NotificationSchema);