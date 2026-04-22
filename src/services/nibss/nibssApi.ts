import nibssClient from "./nibssClient";
import axios from "axios";

// ─── Types ──────────────────────────────────────────────────────────────────

export interface NibssCreateAccountPayload {
  kycType: "bvn" | "nin";
  kycID: string;
  dob: string;
}

export interface NibssCreateAccountResponse {
  message: string;
  accountNumber: string;
  bankCode: string;
  bankName: string;
  balance: number;
}

export interface NibssNameEnquiryResponse {
  accountNumber: string;
  accountName: string;
  bankName: string;
}

export interface NibssBalanceResponse {
  accountNumber: string;
  balance: number;
}

export interface NibssTransferPayload {
  from: string;
  to: string;
  amount: string;
}

export interface NibssTransferResponse {
  message: string;
  transactionId: string;
  amount: number;
  from: string;
  to: string;
  status: string;
}

export interface NibssTransactionResponse {
  transactionId: string;
  status: string;
  amount: number;
  from: string;
  to: string;
  timestamp: string;
}

export interface NibssValidateIdentityResponse {
  success: boolean;
  message: string;
  data: {
    bvn?: string;
    nin?: string;
    firstName: string;
    lastName: string;
    dob: string;
    phone?: string;
  };
}

export interface NibssInsertBvnPayload {
  bvn: string;
  firstName: string;
  lastName: string;
  dob: string;
  phone: string;
}

export interface NibssInsertNinPayload {
  nin: string;
  firstName: string;
  lastName: string;
  dob: string;
}

// ─── API Wrappers ────────────────────────────────────────────────────────────

/** POST /api/account/create */
export async function createAccount(payload: NibssCreateAccountPayload): Promise<NibssCreateAccountResponse> {
  const res = await nibssClient.post<NibssCreateAccountResponse>("/api/account/create", payload);
  return res.data;
}

/** GET /api/account/name-enquiry/:accountNumber */
export async function nameEnquiry(accountNumber: string): Promise<NibssNameEnquiryResponse> {
  const res = await nibssClient.get<NibssNameEnquiryResponse>(`/api/account/name-enquiry/${accountNumber}`);
  return res.data;
}

/** GET /api/account/balance/:accountNumber */
export async function getAccountBalance(accountNumber: string): Promise<NibssBalanceResponse> {
  const res = await nibssClient.get<NibssBalanceResponse>(`/api/account/balance/${accountNumber}`);
  return res.data;
}

/** GET /api/accounts */
export async function getAllAccounts(): Promise<{ accounts: NibssNameEnquiryResponse[] }> {
  const res = await nibssClient.get<{ accounts: NibssNameEnquiryResponse[] }>("/api/accounts");
  return res.data;
}

/** POST /api/transfer */
export async function initiateTransfer(payload: NibssTransferPayload): Promise<NibssTransferResponse> {
  const res = await nibssClient.post<NibssTransferResponse>("/api/transfer", payload);
  return res.data;
}

/** GET /api/transaction/:transactionId */
export async function getTransactionStatus(transactionId: string): Promise<NibssTransactionResponse> {
  const res = await nibssClient.get<NibssTransactionResponse>(`/api/transaction/${transactionId}`);
  return res.data;
}

/** POST /api/validateBvn — no auth required on NIBSS side but we send token anyway */
export async function validateBvn(bvn: string): Promise<NibssValidateIdentityResponse> {
  const res = await nibssClient.post<NibssValidateIdentityResponse>("/api/validateBvn", { bvn });
  return res.data;
}

/** POST /api/validateNin — no auth required on NIBSS side but we send token anyway */
export async function validateNin(nin: string): Promise<NibssValidateIdentityResponse> {
  const res = await nibssClient.post<NibssValidateIdentityResponse>("/api/validateNin", { nin });
  return res.data;
}

/** POST /api/insertBvn — admin / seeding */
export async function insertBvn(payload: NibssInsertBvnPayload): Promise<{ message: string; bvn: string }> {
  const res = await nibssClient.post<{ message: string; bvn: string }>("/api/insertBvn", payload);
  return res.data;
}

/** POST /api/insertNin — admin / seeding */
export async function insertNin(payload: NibssInsertNinPayload): Promise<{ message: string; nin: string }> {
  const res = await nibssClient.post<{ message: string; nin: string }>("/api/insertNin", payload);
  return res.data;
}

/** Extract a clean error message from an axios error */
export function nibssErrorMessage(err: unknown): string {
  if (axios.isAxiosError(err) && err.response?.data) {
    const data = err.response.data as Record<string, unknown>;
    if (typeof data.message === "string") return data.message;
  }
  return "NIBSS request failed";
}
