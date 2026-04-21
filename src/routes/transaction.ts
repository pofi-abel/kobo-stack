import { Router } from "express";
import { transfer, getTransactionStatus, getMyTransactions } from "../controllers/transaction";
import { authenticate, requireKycVerified } from "../middleware/auth";

const router = Router();

// All transaction routes require customer JWT
router.use(authenticate);

router.post("/transfer", requireKycVerified, transfer);
router.get("/history", getMyTransactions);
router.get("/:transactionId", getTransactionStatus);

export default router;
