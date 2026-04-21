import { Request, Response, NextFunction } from "express";
import { verifyCustomerToken } from "../utils/jwt";
import { Customer, ICustomer } from "../models/Customer";
import { UnauthorizedError } from "../utils/errors";

// Augment Express Request
declare global {
  namespace Express {
    interface Request {
      customer: ICustomer;
    }
  }
}

export async function authenticate(req: Request, _res: Response, next: NextFunction): Promise<void> {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith("Bearer ")) {
      throw new UnauthorizedError("Missing or malformed Authorization header");
    }
    const token = authHeader.slice(7);
    const payload = verifyCustomerToken(token);

    const customer = await Customer.findById(payload.customerId);
    if (!customer) {
      throw new UnauthorizedError("Customer not found");
    }
    req.customer = customer;
    next();
  } catch (err) {
    next(err);
  }
}

export function requireKycVerified(req: Request, _res: Response, next: NextFunction): void {
  if (!req.customer.kycVerified) {
    next(new UnauthorizedError("KYC verification required before this action"));
    return;
  }
  next();
}
