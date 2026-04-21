import { z } from "zod";

export const verifyKycSchema = z.object({
  kycType: z.enum(["bvn", "nin"]).refine((v) => !!v, { message: "kycType must be bvn or nin" }),
  kycID: z.string().length(11, "kycID must be exactly 11 digits").regex(/^\d+$/, "kycID must contain only digits"),
  dob: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "dob must be in YYYY-MM-DD format"),
});

export const insertBvnSchema = z.object({
  bvn: z.string().length(11, "BVN must be exactly 11 digits").regex(/^\d+$/, "BVN must contain only digits"),
  firstName: z.string().min(1).trim(),
  lastName: z.string().min(1).trim(),
  dob: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "dob must be in YYYY-MM-DD format"),
  phone: z.string().min(1).trim(),
});

export const insertNinSchema = z.object({
  nin: z.string().length(11, "NIN must be exactly 11 digits").regex(/^\d+$/, "NIN must contain only digits"),
  firstName: z.string().min(1).trim(),
  lastName: z.string().min(1).trim(),
  dob: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "dob must be in YYYY-MM-DD format"),
});

export type VerifyKycInput = z.infer<typeof verifyKycSchema>;
export type InsertBvnInput = z.infer<typeof insertBvnSchema>;
export type InsertNinInput = z.infer<typeof insertNinSchema>;
