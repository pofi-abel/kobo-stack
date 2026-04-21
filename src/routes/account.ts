import { Router } from "express";
import { createAccount, getMyAccount, getBalance, nameEnquiry, getAllAccounts } from "../controllers/account";
import { authenticate, requireKycVerified } from "../middleware/auth";
import { requireAdminKey } from "../middleware/adminAuth";

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Account
 *   description: Bank account management
 */

// All account routes require customer JWT
router.use(authenticate);

/**
 * @swagger
 * /api/account/create:
 *   post:
 *     summary: Create a bank account for the authenticated customer
 *     description: |
 *       Requires the customer to have completed KYC verification first.
 *       Each customer may only have one account. The account is pre-funded
 *       with ₦15,000 by NIBSS upon creation.
 *     tags: [Account]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       201:
 *         description: Account created successfully with ₦15,000 opening balance
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AccountResponse'
 *       400:
 *         description: KYC not verified, or NIBSS error
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
 *         description: Customer already has an account
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.post("/create", requireKycVerified, createAccount);

/**
 * @swagger
 * /api/account/me:
 *   get:
 *     summary: Get my account details and live balance
 *     tags: [Account]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Account details with current balance from NIBSS
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AccountResponse'
 *       401:
 *         description: Missing or invalid JWT
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       404:
 *         description: No account found — create one first
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.get("/me", getMyAccount);

/**
 * @swagger
 * /api/account/balance:
 *   get:
 *     summary: Check my account balance
 *     tags: [Account]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Current ledger balance
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status: { type: string, example: success }
 *                 accountNumber: { type: string, example: '1234567890' }
 *                 balance: { type: number, example: 15000 }
 *       401:
 *         description: Missing or invalid JWT
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       404:
 *         description: No account found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.get("/balance", getBalance);

/**
 * @swagger
 * /api/account/name-enquiry/{accountNumber}:
 *   get:
 *     summary: Resolve an account number to the account holder's name
 *     description: Standard pre-transfer verification step. Always call this before initiating a transfer.
 *     tags: [Account]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: accountNumber
 *         required: true
 *         schema:
 *           type: string
 *           example: '1234567890'
 *         description: 10-digit NUBAN account number
 *     responses:
 *       200:
 *         description: Account holder name resolved
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/NameEnquiryResponse'
 *       400:
 *         description: Invalid account number format
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
 *       404:
 *         description: Account not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.get("/name-enquiry/:accountNumber", nameEnquiry);

/**
 * @swagger
 * /api/account/all:
 *   get:
 *     summary: List all accounts in this fintech's bank (admin only)
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *       - adminKey: []
 *     responses:
 *       200:
 *         description: List of all accounts
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status: { type: string, example: success }
 *                 data:
 *                   type: object
 *                   properties:
 *                     accounts:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           accountNumber: { type: string }
 *                           accountName: { type: string }
 *                           balance: { type: number }
 *       401:
 *         description: Missing or invalid credentials
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.get("/all", requireAdminKey, getAllAccounts);

export default router;
