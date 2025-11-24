import { Schema, model, Types } from "mongoose";

const transferSchema = new Schema(
  {
    fromAccount: { type: Types.ObjectId, ref: "Account", required: true },
    toAccount: { type: Types.ObjectId, ref: "Account", required: true },

    amount: { type: Number, required: true },
    currency: { type: String, required: true }, // "EUR", "USD", etc.

    concept: { type: String }, // "Alquiler", "Spotify", etc.
    date: { type: Date, default: Date.now },

    status: {
      type: String,
      enum: ["pending", "completed", "failed"],
      default: "completed",
    },
  },
  { timestamps: true }
);

export default model("Transfer", transferSchema);
