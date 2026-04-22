import { Schema, model, Document, Types } from "mongoose";

export interface IAccount extends Document {
  _id: Types.ObjectId;
  customerId: Types.ObjectId;
  accountNumber: string;
  bankCode: string;
  accountName: string;
  createdAt: Date;
  updatedAt: Date;
}

const accountSchema = new Schema<IAccount>(
  {
    customerId: {
      type: Schema.Types.ObjectId,
      ref: "Customer",
      required: true,
      unique: true, // enforces 1 account per customer at DB level
    },
    accountNumber: { type: String, required: true, unique: true },
    bankCode: { type: String, required: true },
    accountName: { type: String, required: true },
  },
  { timestamps: true },
);

accountSchema.set("toJSON", {
  transform: (_doc, ret) => {
    const obj = ret as unknown as Record<string, unknown>;
    delete obj.__v;
    return obj;
  },
});

export const Account = model<IAccount>("Account", accountSchema);
