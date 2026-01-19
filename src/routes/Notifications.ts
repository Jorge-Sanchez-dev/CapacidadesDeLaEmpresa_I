import { Router } from "express";
import { verifyToken } from "../middleware/verifyToken";
import Notification from "../models/Notification";

const router = Router();
router.use(verifyToken);

router.get("/mine", async (req, res) => {
  const userId = (req as any).userId;
  const notifications = await Notification.find({ user: userId }).sort({ createdAt: -1 }).limit(50).lean();
  res.json({ notifications });
});

router.post("/:id/read", async (req, res) => {
  const userId = (req as any).userId;
  const { id } = req.params;
  await Notification.updateOne({ _id: id, user: userId }, { $set: { read: true } });
  res.json({ ok: true });
});

export default router;
