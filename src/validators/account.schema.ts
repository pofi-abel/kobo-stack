import { z } from "zod";

export const accountNumberParamSchema = z.object({
  accountNumber: z.string().length(10, "Account number must be exactly 10 digits").regex(/^\d+$/, "Account number must contain only digits"),
});

export type AccountNumberParam = z.infer<typeof accountNumberParamSchema>;
