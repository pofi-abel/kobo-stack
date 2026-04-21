import { Router } from "express";
import { createAccount, getMyAccount, getBalance, nameEnquiry, getAllAccounts } from "../controllers/account";
import { authenticate, requireKycVerified } from "../middleware/auth";
import { requireAdminKey } from "../middleware/adminAuth";

const router = Router();

// All account routes require customer JWT
router.use(authenticate);

router.post("/create", requireKycVerified, createAccount);
router.get("/me", getMyAccount);
router.get("/balance", getBalance);
router.get("/name-enquiry/:accountNumber", nameEnquiry);

// Admin-only: list all accounts in this fintech's bank
router.get("/all", requireAdminKey, getAllAccounts);

export default router;
