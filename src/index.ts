import express from "express";
import dotenv from "dotenv";
import path from "path";
import { connectMongoDB } from "./mongo";

import authRoutes from "./routes/auth";
import bizumRoutes from "./routes/bizum";
import cardRoutes from "./routes/cards";
import loanRoutes from "./routes/loans";
import adminRoutes from "./routes/admin";
import notificationsRoutes from "./routes/Notifications";

dotenv.config();

const app = express();

app.use(express.json());

app.use("/auth", authRoutes);
app.use("/bizum", bizumRoutes);
app.use("/cards", cardRoutes);
app.use("/loans", loanRoutes);
app.use("/api/admin", adminRoutes);
app.use("/notifications", notificationsRoutes);

app.use(express.static(path.join(__dirname, "..", "public")));

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "..", "public", "login.html"));
});


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
