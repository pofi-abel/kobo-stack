import { Schema, model, Document, Types } from "mongoose";

export type TransactionType = "debit" | "credit";
export type TransactionStatus = "SUCCESS" | "PENDING" | "FAILED";

export interface ITransaction extends Document {
  _id: Types.ObjectId;
  customerId: Types.ObjectId;
  transactionId: string;
  type: TransactionType;
  from: string;
  to: string;
  amount: number;
  status: TransactionStatus;
  nibssTimestamp: string | null;
  idempotencyKey: string | null;
  createdAt: Date;
  updatedAt: Date;
}

const transactionSchema = new Schema<ITransaction>(
  {
    customerId: {
      type: Schema.Types.ObjectId,
      ref: "Customer",
      required: true,
      index: true, // fast lookup per customer — enforces data isolation in queries
    },
    transactionId: { type: String, required: true, unique: true },
    type: { type: String, enum: ["debit", "credit"], required: true },
    from: { type: String, required: true },
    to: { type: String, required: true },
    amount: { type: Number, required: true },
    status: {
      type: String,
      enum: ["SUCCESS", "PENDING", "FAILED"],
      default: "PENDING",
    },
    nibssTimestamp: { type: String, default: null },
    idempotencyKey: { type: String, default: null },
  },
  { timestamps: true },
);

// Compound unique index: same key from same customer = same operation
// sparse: true so null values don't collide
transactionSchema.index({ customerId: 1, idempotencyKey: 1 }, { unique: true, sparse: true });

transactionSchema.set("toJSON", {
  transform: (_doc, ret) => {
    const obj = ret as unknown as Record<string, unknown>;
    delete obj.__v;
    return obj;
  },
});

export const Transaction = model<ITransaction>("Transaction", transactionSchema);
