import jwt from "jsonwebtoken";
import { env } from "../config/env";
import { Types } from "mongoose";

export interface CustomerTokenPayload {
  customerId: string;
  email: string;
}

export function signCustomerToken(payload: { customerId: Types.ObjectId; email: string }): string {
  return jwt.sign({ customerId: payload.customerId.toString(), email: payload.email }, env.JWT_SECRET, { expiresIn: env.JWT_EXPIRES_IN as jwt.SignOptions["expiresIn"] });
}

export function verifyCustomerToken(token: string): CustomerTokenPayload {
  return jwt.verify(token, env.JWT_SECRET) as CustomerTokenPayload;
}
