import { Router } from "express";
import { verifyToken } from "../middleware/verifyToken";
import { requireAdmin } from "../middleware/requireAdmin";
import { requestLoan, myLoans, listPendingLoans, decideLoan } from "../controllers/loanController";

const router = Router();

router.post("/request", verifyToken, requestLoan);
router.get("/my", verifyToken, myLoans);

// admin
router.get("/pending", verifyToken, requireAdmin, listPendingLoans);
router.post("/:id/decide", verifyToken, requireAdmin, decideLoan);

export default router;
