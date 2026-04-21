import { Schema, model, Document, Types } from "mongoose";

export interface ICustomer extends Document {
  _id: Types.ObjectId;
  email: string;
  passwordHash: string;
  firstName: string;
  lastName: string;
  phone: string;
  kycType: "bvn" | "nin" | null;
  kycID: string | null;
  dob: string | null;
  kycVerified: boolean;
  hasAccount: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const customerSchema = new Schema<ICustomer>(
  {
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true },
    firstName: { type: String, required: true, trim: true },
    lastName: { type: String, required: true, trim: true },
    phone: { type: String, required: true, trim: true },
    kycType: { type: String, enum: ["bvn", "nin"], default: null },
    kycID: { type: String, default: null },
    dob: { type: String, default: null },
    kycVerified: { type: Boolean, default: false },
    hasAccount: { type: Boolean, default: false },
  },
  { timestamps: true },
);

// Never expose passwordHash or kycID in JSON responses
customerSchema.set("toJSON", {
  transform: (_doc, ret) => {
    const obj = ret as unknown as Record<string, unknown>;
    delete obj.passwordHash;
    delete obj.kycID;
    delete obj.__v;
    return obj;
  },
});

export const Customer = model<ICustomer>("Customer", customerSchema);
