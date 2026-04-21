import { Router } from "express";
import { transfer, getTransactionStatus, getMyTransactions } from "../controllers/transaction";
import { authenticate, requireKycVerified } from "../middleware/auth";

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Transactions
 *   description: Fund transfers and transaction history
 */

// All transaction routes require customer JWT
router.use(authenticate);

/**
 * @swagger
 * /api/transactions/transfer:
 *   post:
 *     summary: Initiate a fund transfer (intra-bank or inter-bank)
 *     description: |
 *       Performs a name enquiry on the recipient before calling NIBSS transfer.
 *       Saves a debit record locally for history and data privacy.
 *
 *       **Idempotency:** Pass an `Idempotency-Key` header (UUID) to safely retry
 *       on network failure without risk of double-debit. Duplicate keys return
 *       the original response without hitting NIBSS again.
 *     tags: [Transactions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: header
 *         name: Idempotency-Key
 *         required: false
 *         schema:
 *           type: string
 *           format: uuid
 *           example: '550e8400-e29b-41d4-a716-446655440000'
 *         description: Optional UUID to make the request idempotent
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/TransferRequest'
 *     responses:
 *       200:
 *         description: Transfer successful
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/TransferResponse'
 *       400:
 *         description: Insufficient funds, invalid recipient, or validation error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       401:
 *         description: Missing or invalid JWT, or KYC not verified
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       404:
 *         description: Sender account or recipient account not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.post("/transfer", requireKycVerified, transfer);

/**
 * @swagger
 * /api/transactions/history:
 *   get:
 *     summary: Get my transaction history (paginated)
 *     description: Returns only transactions belonging to the authenticated customer. Strictly data-isolated.
 *     tags: [Transactions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *           maximum: 50
 *         description: Results per page (max 50)
 *     responses:
 *       200:
 *         description: Paginated list of the customer's own transactions
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status: { type: string, example: success }
 *                 data:
 *                   type: object
 *                   properties:
 *                     transactions:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Transaction'
 *                     pagination:
 *                       type: object
 *                       properties:
 *                         page: { type: integer, example: 1 }
 *                         limit: { type: integer, example: 20 }
 *                         total: { type: integer, example: 5 }
 *                         totalPages: { type: integer, example: 1 }
 *       401:
 *         description: Missing or invalid JWT
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.get("/history", getMyTransactions);

/**
 * @swagger
 * /api/transactions/{transactionId}:
 *   get:
 *     summary: Query the status of a specific transaction (TSQ)
 *     description: |
 *       Fetches live status from NIBSS and updates the local record if changed.
 *       Only the customer who initiated the transaction can access it.
 *     tags: [Transactions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: transactionId
 *         required: true
 *         schema:
 *           type: string
 *           example: TX1776340463722
 *         description: Transaction ID returned by POST /api/transactions/transfer
 *     responses:
 *       200:
 *         description: Transaction status from NIBSS
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status: { type: string, example: success }
 *                 data:
 *                   $ref: '#/components/schemas/Transaction'
 *       401:
 *         description: Missing or invalid JWT
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       403:
 *         description: Transaction belongs to another customer
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       404:
 *         description: Transaction not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.get("/:transactionId", getTransactionStatus);

export default router;
