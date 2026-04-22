import { Request, Response, NextFunction } from "express";
import * as nibss from "../services/nibss/nibssApi";
import { Account } from "../models/Account";
import { Transaction } from "../models/Transaction";
import { transferSchema } from "../validators/transaction.schema";
import { BadRequestError, NotFoundError, ForbiddenError } from "../utils/errors";

/** POST /api/transactions/transfer */
export async function transfer(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const body = transferSchema.parse(req.body);
    const customer = req.customer;

    // ── Idempotency check ──────────────────────────────────────────────────
    const idempotencyKey = (req.headers["idempotency-key"] as string | undefined)?.trim() || null;

    if (idempotencyKey) {
      const existing = await Transaction.findOne({
        customerId: customer._id,
        idempotencyKey,
      });
      if (existing) {
        // Return the original response — do NOT hit NIBSS again
        res.status(200).json({
          status: "success",
          message: "Transfer already processed (idempotent replay)",
          transactionId: existing.transactionId,
          amount: existing.amount,
          from: existing.from,
          to: existing.to,
          nibssStatus: existing.status,
        });
        return;
      }
    }

    // Get sender's account
    const senderAccount = await Account.findOne({ customerId: customer._id });
    if (!senderAccount) {
      throw new NotFoundError("You do not have an account to transfer from");
    }

    if (senderAccount.accountNumber === body.to) {
      throw new BadRequestError("You cannot transfer to your own account");
    }

    // Verify recipient exists via name enquiry
    let recipientInfo: nibss.NibssNameEnquiryResponse;
    try {
      recipientInfo = await nibss.nameEnquiry(body.to);
    } catch {
      throw new NotFoundError(`Recipient account ${body.to} not found`);
    }

    // Initiate transfer on NIBSS
    let nibssResult: nibss.NibssTransferResponse;
    try {
      nibssResult = await nibss.initiateTransfer({
        from: senderAccount.accountNumber,
        to: body.to,
        amount: body.amount.toString(),
      });
    } catch (err) {
      const msg = nibss.nibssErrorMessage(err);
      throw new BadRequestError(msg);
    }

    // Persist debit transaction locally for history & privacy
    const txn = await Transaction.create({
      customerId: customer._id,
      transactionId: nibssResult.reference,
      type: "debit",
      from: senderAccount.accountNumber,
      to: body.to,
      amount: body.amount,
      status: nibssResult.status as "SUCCESS" | "PENDING" | "FAILED",
      nibssTimestamp: nibssResult.createdAt,
      idempotencyKey,
    });

    res.status(200).json({
      status: "success",
      message: "Transfer successful",
      transactionId: txn.transactionId,
      amount: txn.amount,
      from: txn.from,
      to: txn.to,
      recipientName: recipientInfo.accountName,
      nibssStatus: nibssResult.status,
    });
  } catch (err) {
    next(err);
  }
}

/** GET /api/transactions/:transactionId — check status, ownership-gated */
export async function getTransactionStatus(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const transactionId = req.params.transactionId as string;

    // Verify ownership before making external call
    const txn = await Transaction.findOne({ transactionId });
    if (!txn) {
      throw new NotFoundError("Transaction not found");
    }
    if (!txn.customerId.equals(req.customer._id)) {
      throw new ForbiddenError("You do not have access to this transaction");
    }

    let nibssData: nibss.NibssTransactionResponse;
    try {
      nibssData = await nibss.getTransactionStatus(transactionId);
    } catch (err) {
      const msg = nibss.nibssErrorMessage(err);
      throw new BadRequestError(msg);
    }

    // Update local status if changed
    if (nibssData.status !== txn.status) {
      await Transaction.findByIdAndUpdate(txn._id, {
        status: nibssData.status as "SUCCESS" | "PENDING" | "FAILED",
        nibssTimestamp: nibssData.createdAt,
      });
    }

    res.status(200).json({
      status: "success",
      data: {
        transactionId: nibssData.reference,
        status: nibssData.status,
        amount: nibssData.amount,
        from: nibssData.senderAccount,
        to: nibssData.receiverAccount,
        timestamp: nibssData.createdAt,
      },
    });
  } catch (err) {
    next(err);
  }
}

/** GET /api/transactions — customer's own transaction history */
export async function getMyTransactions(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const page = Math.max(1, parseInt((req.query.page as string) ?? "1", 10));
    const limit = Math.min(50, Math.max(1, parseInt((req.query.limit as string) ?? "20", 10)));
    const skip = (page - 1) * limit;

    // Always filter by customerId — enforces data isolation
    const [transactions, total] = await Promise.all([Transaction.find({ customerId: req.customer._id }).sort({ createdAt: -1 }).skip(skip).limit(limit), Transaction.countDocuments({ customerId: req.customer._id })]);

    res.status(200).json({
      status: "success",
      data: {
        transactions,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      },
    });
  } catch (err) {
    next(err);
  }
}
