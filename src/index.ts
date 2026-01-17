import express from "express";
import dotenv from "dotenv";
import path from "path";
import { connectMongoDB } from "./mongo";
import authRoutes from "./routes/auth";
import bizumRoutes from "./routes/bizum";
import cardRoutes from "./routes/cards";


dotenv.config();

const app = express();
app.use(express.json());

app.use(express.static(path.join(process.cwd(), "public")));
app.use("/auth", authRoutes);
app.use("/bizum", bizumRoutes);
app.use("/cards", cardRoutes);

const PORT = process.env.PORT || 3000;

(async () => {
  try {
    await connectMongoDB();

    app.listen(PORT, () => {
      console.log(`Servidor listo en http://localhost:${PORT}`);
    });

  } catch (err) {
    console.error("Error al iniciar la app:", err);
  }
})();
