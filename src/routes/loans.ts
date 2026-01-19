import { Router } from "express";
import { verifyToken } from "../middleware/verifyToken";
import { requireAdmin } from "../middleware/requireAdmin";
import {
  requestLoan,
  getMyLoans,
  listPendingLoans,
  decideLoan,
} from "../controllers/loanController";

const router = Router();

router.use(verifyToken);

router.post("/request", requestLoan);
router.get("/mine", getMyLoans);

router.get("/pending", requireAdmin, listPendingLoans);
router.post("/:id/decide", requireAdmin, decideLoan);


export default router;
