import { Request, Response, NextFunction } from "express";
import * as nibss from "../services/nibss/nibssApi";
import { Account } from "../models/Account";
import { Customer } from "../models/Customer";
import { BadRequestError, ConflictError, NotFoundError } from "../utils/errors";
import { accountNumberParamSchema } from "../validators/account.schema";

/** POST /api/account/create */
export async function createAccount(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const customer = req.customer;

    if (!customer.kycVerified) {
      throw new BadRequestError("KYC verification required before creating an account");
    }

    if (customer.hasAccount) {
      throw new ConflictError("You already have an account. Only one account is allowed per customer.");
    }

    if (!customer.kycType || !customer.kycID || !customer.dob) {
      throw new BadRequestError("KYC details are incomplete. Please complete verification first.");
    }

    let nibssAccount: nibss.NibssCreateAccountResponse;
    try {
      nibssAccount = await nibss.createAccount({
        kycType: customer.kycType,
        kycID: customer.kycID,
        dob: customer.dob,
      });
    } catch (err) {
      const msg = nibss.nibssErrorMessage(err);
      throw new BadRequestError(msg);
    }

    const account = await Account.create({
      customerId: customer._id,
      accountNumber: nibssAccount.account.accountNumber,
      bankCode: nibssAccount.account.bankCode,
      accountName: nibssAccount.account.accountName,
    });

    await Customer.findByIdAndUpdate(customer._id, { hasAccount: true });

    res.status(201).json({
      status: "success",
      message: "Account created successfully",
      account: {
        accountNumber: account.accountNumber,
        bankCode: account.bankCode,
        accountName: account.accountName,
        balance: nibssAccount.account.balance,
      },
    });
  } catch (err) {
    next(err);
  }
}

/** GET /api/account/me */
export async function getMyAccount(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const account = await Account.findOne({ customerId: req.customer._id });
    if (!account) {
      throw new NotFoundError("No account found. Please create an account first.");
    }

    let balance = 0;
    try {
      const balanceData = await nibss.getAccountBalance(account.accountNumber);
      balance = balanceData.balance;
    } catch {
      // Return account info even if balance fetch fails
    }

    res.status(200).json({
      status: "success",
      account: {
        accountNumber: account.accountNumber,
        bankCode: account.bankCode,
        accountName: account.accountName,
        balance,
      },
    });
  } catch (err) {
    next(err);
  }
}

/** GET /api/account/balance */
export async function getBalance(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const account = await Account.findOne({ customerId: req.customer._id });
    if (!account) {
      throw new NotFoundError("No account found");
    }

    let balanceData: nibss.NibssBalanceResponse;
    try {
      balanceData = await nibss.getAccountBalance(account.accountNumber);
    } catch (err) {
      const msg = nibss.nibssErrorMessage(err);
      throw new BadRequestError(msg);
    }

    res.status(200).json({
      status: "success",
      accountNumber: balanceData.accountNumber,
      balance: balanceData.balance,
    });
  } catch (err) {
    next(err);
  }
}

/** GET /api/account/name-enquiry/:accountNumber */
export async function nameEnquiry(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { accountNumber } = accountNumberParamSchema.parse(req.params);

    let data: nibss.NibssNameEnquiryResponse;
    try {
      data = await nibss.nameEnquiry(accountNumber);
    } catch (err) {
      const msg = nibss.nibssErrorMessage(err);
      throw new NotFoundError(msg);
    }

    res.status(200).json({ status: "success", data });
  } catch (err) {
    next(err);
  }
}

/** GET /api/account/all  — admin view of all accounts under this fintech */
export async function getAllAccounts(_req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    let data: Awaited<ReturnType<typeof nibss.getAllAccounts>>;
    try {
      data = await nibss.getAllAccounts();
    } catch (err) {
      const msg = nibss.nibssErrorMessage(err);
      throw new BadRequestError(msg);
    }
    res.status(200).json({ status: "success", data });
  } catch (err) {
    next(err);
  }
}
