import swaggerJSDoc from "swagger-jsdoc";
import { Options } from "swagger-jsdoc";

const options: Options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "Kobo Stack — Core Banking API",
      version: "1.0.0",
      description:
        "A core banking backend that integrates with the NibssByPhoenix simulated NIBSS API. " +
        "Supports customer onboarding (BVN/NIN KYC), account creation, intra/inter-bank transfers, " +
        "name enquiry, balance check and transaction history with strict data privacy.\n\n" +
        "**Authentication flow:**\n" +
        "1. `POST /api/auth/register` → get JWT\n" +
        "2. `POST /api/admin/insert-bvn` (X-Admin-Key) → seed test BVN\n" +
        "3. `POST /api/onboarding/verify` → KYC verified\n" +
        "4. `POST /api/account/create` → bank account created with ₦15,000\n\n" +
        "📥 **Download Postman collection:** `GET /api/docs/json`",
    },
    servers: [
      { url: "http://localhost:5000", description: "Local development" },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
          description: "Customer JWT returned by POST /api/auth/login or /api/auth/register",
        },
        adminKey: {
          type: "apiKey",
          in: "header",
          name: "X-Admin-Key",
          description: "Static admin key for BVN/NIN seeding endpoints (set in ADMIN_KEY env var)",
        },
      },
      schemas: {
        // ── Auth ────────────────────────────────────────────────────────────
        RegisterRequest: {
          type: "object",
          required: ["email", "password", "firstName", "lastName", "phone"],
          properties: {
            email: { type: "string", format: "email", example: "ada@example.com" },
            password: {
              type: "string",
              minLength: 8,
              example: "SecurePass1",
              description: "Min 8 chars, at least one uppercase letter and one digit",
            },
            firstName: { type: "string", example: "Ada" },
            lastName: { type: "string", example: "Obi" },
            phone: {
              type: "string",
              example: "08012345678",
              description: "Valid 11-digit Nigerian mobile number",
            },
          },
        },
        LoginRequest: {
          type: "object",
          required: ["email", "password"],
          properties: {
            email: { type: "string", format: "email", example: "ada@example.com" },
            password: { type: "string", example: "SecurePass1" },
          },
        },
        AuthResponse: {
          type: "object",
          properties: {
            status: { type: "string", example: "success" },
            message: { type: "string", example: "Login successful" },
            token: { type: "string", example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." },
            customer: { $ref: "#/components/schemas/Customer" },
          },
        },
        Customer: {
          type: "object",
          properties: {
            _id: { type: "string", example: "661f1a2b3c4d5e6f7a8b9c0d" },
            email: { type: "string", example: "ada@example.com" },
            firstName: { type: "string", example: "Ada" },
            lastName: { type: "string", example: "Obi" },
            phone: { type: "string", example: "08012345678" },
            kycVerified: { type: "boolean", example: false },
            hasAccount: { type: "boolean", example: false },
            createdAt: { type: "string", format: "date-time" },
          },
        },
        // ── Onboarding ──────────────────────────────────────────────────────
        InsertBvnRequest: {
          type: "object",
          required: ["bvn", "firstName", "lastName", "dob", "phone"],
          properties: {
            bvn: { type: "string", example: "12345678901", description: "11-digit BVN" },
            firstName: { type: "string", example: "Ada" },
            lastName: { type: "string", example: "Obi" },
            dob: { type: "string", example: "1995-06-15", description: "YYYY-MM-DD" },
            phone: { type: "string", example: "08012345678" },
          },
        },
        InsertNinRequest: {
          type: "object",
          required: ["nin", "firstName", "lastName", "dob"],
          properties: {
            nin: { type: "string", example: "12345678901", description: "11-digit NIN" },
            firstName: { type: "string", example: "Ada" },
            lastName: { type: "string", example: "Obi" },
            dob: { type: "string", example: "1995-06-15", description: "YYYY-MM-DD" },
          },
        },
        VerifyKycRequest: {
          type: "object",
          required: ["kycType", "kycID", "dob"],
          properties: {
            kycType: { type: "string", enum: ["bvn", "nin"], example: "bvn" },
            kycID: {
              type: "string",
              example: "12345678901",
              description: "11-digit BVN or NIN number",
            },
            dob: { type: "string", example: "1995-06-15", description: "YYYY-MM-DD" },
          },
        },
        // ── Account ─────────────────────────────────────────────────────────
        AccountResponse: {
          type: "object",
          properties: {
            status: { type: "string", example: "success" },
            account: {
              type: "object",
              properties: {
                accountNumber: { type: "string", example: "1234567890" },
                bankCode: { type: "string", example: "108" },
                bankName: { type: "string", example: "KBC Bank" },
                balance: { type: "number", example: 15000 },
              },
            },
          },
        },
        NameEnquiryResponse: {
          type: "object",
          properties: {
            status: { type: "string", example: "success" },
            data: {
              type: "object",
              properties: {
                accountNumber: { type: "string", example: "1234567890" },
                accountName: { type: "string", example: "Ada Obi" },
                bankName: { type: "string", example: "KBC Bank" },
              },
            },
          },
        },
        // ── Transactions ────────────────────────────────────────────────────
        TransferRequest: {
          type: "object",
          required: ["to", "amount"],
          properties: {
            to: {
              type: "string",
              example: "0987654321",
              description: "Recipient 10-digit NUBAN account number",
            },
            amount: {
              type: "integer",
              example: 5000,
              description: "Amount in Naira (positive whole number)",
            },
          },
        },
        TransferResponse: {
          type: "object",
          properties: {
            status: { type: "string", example: "success" },
            message: { type: "string", example: "Transfer successful" },
            transactionId: { type: "string", example: "TX1776340463722" },
            amount: { type: "number", example: 5000 },
            from: { type: "string", example: "1234567890" },
            to: { type: "string", example: "0987654321" },
            recipientName: { type: "string", example: "Chidi Okeke" },
            nibssStatus: { type: "string", enum: ["SUCCESS", "PENDING", "FAILED"], example: "SUCCESS" },
          },
        },
        Transaction: {
          type: "object",
          properties: {
            _id: { type: "string" },
            transactionId: { type: "string", example: "TX1776340463722" },
            type: { type: "string", enum: ["debit", "credit"] },
            from: { type: "string", example: "1234567890" },
            to: { type: "string", example: "0987654321" },
            amount: { type: "number", example: 5000 },
            status: { type: "string", enum: ["SUCCESS", "PENDING", "FAILED"] },
            nibssTimestamp: {
              type: "string",
              nullable: true,
              example: "2026-04-21T10:31:03Z",
            },
            createdAt: { type: "string", format: "date-time" },
          },
        },
        // ── Generic errors ──────────────────────────────────────────────────
        ErrorResponse: {
          type: "object",
          properties: {
            status: { type: "string", example: "error" },
            message: { type: "string", example: "Unauthorized" },
          },
        },
        ValidationErrorResponse: {
          type: "object",
          properties: {
            status: { type: "string", example: "error" },
            message: { type: "string", example: "Validation failed" },
            errors: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  field: { type: "string", example: "email" },
                  message: { type: "string", example: "Invalid email address" },
                },
              },
            },
          },
        },
      },
    },
  },
  // Scan all route files for @swagger JSDoc annotations
  apis: ["./src/routes/*.ts"],
};

export const swaggerSpec = swaggerJSDoc(options);
