import { Schema, model, Document } from "mongoose";

export interface IUser extends Document {
  name: string;
  surname: string;
  birthDate: Date;
  dni: string;
  country: string;
  city: string;
  address: string;
  postalCode: string;
  email: string;
  phone: string;
  password: string;
  mainCurrency: string; 
  monthlySalary?: number;
  payrollDay?: number; 
  role?: "USER" | "ADMIN";
}

const userSchema = new Schema<IUser>(
  {
    name: { type: String, required: true },
    surname: { type: String, required: true },
    birthDate: { type: Date, required: true },
    dni: { type: String, required: true, unique: true },
    country: { type: String, required: true },
    city: { type: String, required: true },
    address: { type: String, required: true },
    postalCode: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    phone: { type: String, required: true },
    password: { type: String, required: true },
    mainCurrency: { type: String, required: true, default: "EUR" },
    monthlySalary: { type: Number },             
    payrollDay: { type: Number, min: 1, max: 31 },
    role: { type: String, enum: ["USER", "ADMIN"], default: "USER" },
  },
  {
    timestamps: true,
  }
);

export default model<IUser>("User", userSchema);
