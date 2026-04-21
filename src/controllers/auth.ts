import { Request, Response, NextFunction } from "express";
import bcrypt from "bcryptjs";
import { Customer } from "../models/Customer";
import { signCustomerToken } from "../utils/jwt";
import { registerSchema, loginSchema } from "../validators/auth.schema";
import { ConflictError, UnauthorizedError } from "../utils/errors";

export async function register(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const body = registerSchema.parse(req.body);

    const existing = await Customer.findOne({ email: body.email });
    if (existing) {
      throw new ConflictError("Email is already registered");
    }

    const passwordHash = await bcrypt.hash(body.password, 12);
    const customer = await Customer.create({
      email: body.email,
      passwordHash,
      firstName: body.firstName,
      lastName: body.lastName,
      phone: body.phone,
    });

    const token = signCustomerToken({ customerId: customer._id, email: customer.email });

    res.status(201).json({
      status: "success",
      message: "Registration successful",
      token,
      customer,
    });
  } catch (err) {
    next(err);
  }
}

export async function login(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const body = loginSchema.parse(req.body);

    const customer = await Customer.findOne({ email: body.email }).select("+passwordHash");
    if (!customer) {
      throw new UnauthorizedError("Invalid email or password");
    }

    const isMatch = await bcrypt.compare(body.password, customer.passwordHash);
    if (!isMatch) {
      throw new UnauthorizedError("Invalid email or password");
    }

    const token = signCustomerToken({ customerId: customer._id, email: customer.email });

    res.status(200).json({
      status: "success",
      message: "Login successful",
      token,
      customer,
    });
  } catch (err) {
    next(err);
  }
}
