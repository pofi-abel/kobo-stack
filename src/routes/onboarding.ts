import { Router } from "express";
import { insertBvn, insertNin, verifyKyc } from "../controllers/onboarding";
import { authenticate } from "../middleware/auth";
import { requireAdminKey } from "../middleware/adminAuth";

const router = Router();

// Admin-only: seed identity records into NIBSS (protected by X-Admin-Key header)
router.post("/admin/insert-bvn", requireAdminKey, insertBvn);
router.post("/admin/insert-nin", requireAdminKey, insertNin);

// Customer: verify their own BVN/NIN (requires customer JWT)
router.post("/onboarding/verify", authenticate, verifyKyc);

export default router;
