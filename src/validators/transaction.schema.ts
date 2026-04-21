import { z } from "zod";

export const transferSchema = z.object({
  to: z.string().length(10, "Recipient account number must be 10 digits").regex(/^\d+$/, "Account number must contain only digits"),
  amount: z.number({ error: "amount must be a positive whole number" }).positive("amount must be greater than 0").int("amount must be a whole number"),
});

export type TransferInput = z.infer<typeof transferSchema>;
