// mongo.ts
import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config();

export const connectMongoDB = async () => {
  try {
    const mongoUrl =
      "mongodb+srv://jsanchezl5:125343Jj@jorge-nebrija.jwrpu.mongodb.net/bancoSanchez?appName=Jorge-Nebrija";

    await mongoose.connect(mongoUrl);

    console.log("MongoDB conectado");
  } catch (error) {
    console.error("Error conectando a MongoDB:", error);
    throw error;
  }
};
