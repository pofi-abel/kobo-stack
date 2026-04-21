import { Request, Response, NextFunction } from "express";
import * as nibss from "../services/nibss/nibssApi";
import { Customer } from "../models/Customer";
import { verifyKycSchema, insertBvnSchema, insertNinSchema } from "../validators/onboarding.schema";
import { BadRequestError, ConflictError } from "../utils/errors";

/** POST /api/admin/insert-bvn */
export async function insertBvn(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const body = insertBvnSchema.parse(req.body);
    const result = await nibss.insertBvn(body);
    res.status(201).json({ status: "success", data: result });
  } catch (err) {
    next(err);
  }
}

/** POST /api/admin/insert-nin */
export async function insertNin(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const body = insertNinSchema.parse(req.body);
    const result = await nibss.insertNin(body);
    res.status(201).json({ status: "success", data: result });
  } catch (err) {
    next(err);
  }
}

/**
 * POST /api/onboarding/verify
 * Validates BVN or NIN against NIBSS, then marks the customer as KYC-verified.
 * Stores kycType, kycID (hashed reference for account creation), and dob.
 */
export async function verifyKyc(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const customer = req.customer;

    if (customer.kycVerified) {
      throw new ConflictError("KYC already verified for this account");
    }

    const body = verifyKycSchema.parse(req.body);

    let identityData: nibss.NibssValidateIdentityResponse;
    try {
      if (body.kycType === "bvn") {
        identityData = await nibss.validateBvn(body.kycID);
      } else {
        identityData = await nibss.validateNin(body.kycID);
      }
    } catch {
      throw new BadRequestError(`${body.kycType.toUpperCase()} validation failed. Please check the details and try again.`);
    }

    if (!identityData.valid) {
      throw new BadRequestError(`${body.kycType.toUpperCase()} is not registered in the NIBSS identity store`);
    }

    // Verify dob matches NIBSS record
    if (identityData.dob !== body.dob) {
      throw new BadRequestError("Date of birth does not match the identity record");
    }

    await Customer.findByIdAndUpdate(customer._id, {
      kycType: body.kycType,
      kycID: body.kycID,
      dob: body.dob,
      kycVerified: true,
      // Update name from NIBSS if not already set
      firstName: customer.firstName || identityData.firstName,
      lastName: customer.lastName || identityData.lastName,
    });

    res.status(200).json({
      status: "success",
      message: "KYC verification successful",
      identity: {
        firstName: identityData.firstName,
        lastName: identityData.lastName,
        dob: identityData.dob,
        kycType: body.kycType,
      },
    });
  } catch (err) {
    next(err);
  }
}
