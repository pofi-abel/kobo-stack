import { Router } from "express";
import { insertBvn, insertNin, verifyKyc } from "../controllers/onboarding";
import { authenticate } from "../middleware/auth";
import { requireAdminKey } from "../middleware/adminAuth";

const router = Router();

/**
 * @swagger
 * tags:
 *   - name: Admin
 *     description: Admin-only endpoints for seeding NIBSS identity data
 *   - name: Onboarding
 *     description: Customer KYC verification
 */

/**
 * @swagger
 * /api/admin/insert-bvn:
 *   post:
 *     summary: Seed a BVN record into the NIBSS identity store
 *     tags: [Admin]
 *     security:
 *       - adminKey: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/InsertBvnRequest'
 *     responses:
 *       201:
 *         description: BVN record created
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status: { type: string, example: success }
 *                 data:
 *                   type: object
 *                   properties:
 *                     message: { type: string, example: BVN record created successfully }
 *                     bvn: { type: string, example: '12345678901' }
 *       400:
 *         description: Validation error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ValidationErrorResponse'
 *       401:
 *         description: Missing or invalid X-Admin-Key
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       409:
 *         description: BVN already exists in NIBSS
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.post("/admin/insert-bvn", requireAdminKey, insertBvn);

/**
 * @swagger
 * /api/admin/insert-nin:
 *   post:
 *     summary: Seed a NIN record into the NIBSS identity store
 *     tags: [Admin]
 *     security:
 *       - adminKey: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/InsertNinRequest'
 *     responses:
 *       201:
 *         description: NIN record created
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status: { type: string, example: success }
 *                 data:
 *                   type: object
 *                   properties:
 *                     message: { type: string, example: NIN record created successfully }
 *                     nin: { type: string, example: '12345678901' }
 *       400:
 *         description: Validation error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ValidationErrorResponse'
 *       401:
 *         description: Missing or invalid X-Admin-Key
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.post("/admin/insert-nin", requireAdminKey, insertNin);

/**
 * @swagger
 * /api/onboarding/verify:
 *   post:
 *     summary: Verify customer BVN or NIN to complete KYC
 *     description: |
 *       Validates the supplied BVN or NIN against the NIBSS identity store and checks
 *       that the date of birth matches. On success the customer's `kycVerified` flag is
 *       set to `true`, which is required before an account can be created.
 *     tags: [Onboarding]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/VerifyKycRequest'
 *     responses:
 *       200:
 *         description: KYC verification successful
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status: { type: string, example: success }
 *                 message: { type: string, example: KYC verification successful }
 *                 identity:
 *                   type: object
 *                   properties:
 *                     firstName: { type: string, example: Ada }
 *                     lastName: { type: string, example: Obi }
 *                     dob: { type: string, example: '1995-06-15' }
 *                     kycType: { type: string, example: bvn }
 *       400:
 *         description: BVN/NIN not found or date of birth mismatch
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       401:
 *         description: Missing or invalid JWT
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       409:
 *         description: KYC already verified
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.post("/onboarding/verify", authenticate, verifyKyc);

export default router;
