import nibssClient from "./nibssClient";
import axios from "axios";

// ─── Types ──────────────────────────────────────────────────────────────────

export interface NibssCreateAccountPayload {
  kycType: "bvn" | "nin";
  kycID: string;
  dob: string;
}

/**
 * Actual NIBSS response: { message, account: { accountNumber, accountName, bankCode, ... } }
 */
export interface NibssCreateAccountResponse {
  message: string;
  account: {
    accountNumber: string;
    accountName: string;
    bankCode: string;
    fintechId: string;
    kycType: string;
    kycID: string;
    balance: number;
    _id: string;
    createdAt: string;
    updatedAt: string;
  };
}

/**
 * Actual NIBSS response: { accountName, accountNumber, bankCode }
 */
export interface NibssNameEnquiryResponse {
  accountName: string;
  accountNumber: string;
  bankCode: string;
}

/**
 * Account entry shape as returned by GET /api/accounts
 */
export interface NibssAccountEntry {
  _id: string;
  accountNumber: string;
  accountName: string;
  bankCode: string;
  fintechId: string;
  kycType: string;
  kycID: string;
  balance: number;
  createdAt: string;
  updatedAt: string;
}

/**
 * Actual NIBSS response: { accountName, accountNumber, balance }
 */
export interface NibssBalanceResponse {
  accountName: string;
  accountNumber: string;
  balance: number;
}

export interface NibssTransferPayload {
  from: string;
  to: string;
  amount: string;
}

/**
 * Actual NIBSS response: { reference, senderAccount, receiverAccount, amount, status, _id, createdAt, updatedAt }
 */
export interface NibssTransferResponse {
  reference: string;
  senderAccount: string;
  receiverAccount: string;
  amount: number;
  status: string;
  _id: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * Actual NIBSS response: { _id, reference, senderAccount, receiverAccount, amount, status, createdAt, updatedAt }
 */
export interface NibssTransactionResponse {
  _id: string;
  reference: string;
  senderAccount: string;
  receiverAccount: string;
  amount: number;
  status: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * Unified identity response — our code normalizes both BVN and NIN shapes into this.
 * BVN raw: { success, message, data: { bvn, firstName, lastName, dob, phone } }
 * NIN raw: { message, response: { nin, firstName, lastName, dob } }
 */
export interface NibssValidateIdentityResponse {
  success: boolean;
  message: string;
  data: {
    bvn?: string;
    nin?: string;
    firstName: string;
    lastName: string;
    dob: string; // ISO timestamp e.g. "1990-01-15T00:00:00.000Z"
    phone?: string;
  };
}

// Raw NIN validation shape from NIBSS (different from BVN — uses 'response' wrapper, no 'success' field)
interface NibssValidateNinRaw {
  message: string;
  response: {
    _id: string;
    nin: string;
    firstName: string;
    lastName: string;
    dob: string;
    createdAt: string;
    updatedAt: string;
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

/**
 * Actual NIBSS insertBvn response: { success, message, data: { bvn, firstName, lastName, dob, phone, createdAt } }
 */
export interface NibssInsertBvnResponse {
  success: boolean;
  message: string;
  data: {
    bvn: string;
    firstName: string;
    lastName: string;
    dob: string;
    phone: string;
    createdAt: string;
  };
}

/**
 * Actual NIBSS insertNin response: { message, response: { nin, firstName, lastName, dob, _id, createdAt, updatedAt } }
 */
export interface NibssInsertNinResponse {
  message: string;
  response: {
    nin: string;
    firstName: string;
    lastName: string;
    dob: string;
    _id: string;
    createdAt: string;
    updatedAt: string;
  };
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
export async function getAllAccounts(): Promise<{ count: number; accounts: NibssAccountEntry[] }> {
  const res = await nibssClient.get<{ count: number; accounts: NibssAccountEntry[] }>("/api/accounts");
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

/** POST /api/validateBvn */
export async function validateBvn(bvn: string): Promise<NibssValidateIdentityResponse> {
  const res = await nibssClient.post<NibssValidateIdentityResponse>("/api/validateBvn", { bvn });
  return res.data;
}

/**
 * POST /api/validateNin
 * NIBSS returns a different shape for NIN vs BVN; we normalize to NibssValidateIdentityResponse.
 */
export async function validateNin(nin: string): Promise<NibssValidateIdentityResponse> {
  const res = await nibssClient.post<NibssValidateNinRaw>("/api/validateNin", { nin });
  const raw = res.data;
  // Normalize to unified shape
  return {
    success: true, // presence of 'response' object indicates success
    message: raw.message,
    data: {
      nin: raw.response.nin,
      firstName: raw.response.firstName,
      lastName: raw.response.lastName,
      dob: raw.response.dob,
    },
  };
}

/** POST /api/insertBvn — admin / seeding */
export async function insertBvn(payload: NibssInsertBvnPayload): Promise<NibssInsertBvnResponse> {
  const res = await nibssClient.post<NibssInsertBvnResponse>("/api/insertBvn", payload);
  return res.data;
}

/** POST /api/insertNin — admin / seeding */
export async function insertNin(payload: NibssInsertNinPayload): Promise<NibssInsertNinResponse> {
  const res = await nibssClient.post<NibssInsertNinResponse>("/api/insertNin", payload);
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
