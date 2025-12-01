// mongo.ts
import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config();

export const connectMongoDB = async () => {
  try {
    const mongoUrl =
      process.env.URL_MONGO!;

    await mongoose.connect(mongoUrl);

    console.log("MongoDB conectado");
  } catch (error) {
    console.error("Error conectando a MongoDB:", error);
    throw error;
  }
};
