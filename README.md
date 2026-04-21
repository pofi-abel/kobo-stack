# Kobo Stack — Core Banking API

A TypeScript/Express backend that integrates with the [NibssByPhoenix](https://nibssbyphoenix.onrender.com/) simulated NIBSS API to provide core banking operations: customer onboarding, KYC verification, account management, and fund transfers.

---

## Tech Stack

| Layer       | Technology                                      |
| ----------- | ----------------------------------------------- |
| Runtime     | Node.js + TypeScript                            |
| Framework   | Express v5                                      |
| Database    | MongoDB Atlas (Mongoose)                        |
| Validation  | Zod v4                                          |
| Auth        | JWT (jsonwebtoken) + bcryptjs                   |
| HTTP Client | Axios                                           |
| Docs        | Swagger UI (swagger-jsdoc + swagger-ui-express) |

---

## Getting Started

### 1. Clone and install

```bash
git clone https://github.com/pofi-abel/kobo-stack.git
cd kobo-stack
npm install
```

### 2. Configure environment

```bash
cp .env.example .env
```

Edit `.env` with your real values:

```env
PORT=4000
NODE_ENV=development

# MongoDB Atlas connection string
MONGO_URI=mongodb+srv://<user>:<pass>@<cluster>.mongodb.net/kobo-bank?retryWrites=true&w=majority

# JWT secret (min 32 chars — generate with: openssl rand -hex 32)
JWT_SECRET=your_long_random_secret_here
JWT_EXPIRES_IN=24h

# NibssByPhoenix credentials (from POST /api/fintech/onboard response)
NIBSS_API_KEY=your_nibss_api_key
NIBSS_API_SECRET=your_nibss_api_secret

# Admin key for BVN/NIN seeding endpoints (min 16 chars)
ADMIN_KEY=your_admin_key_here
```

### 3. Run in development

```bash
npm run dev
```

You should see:

```
MongoDB Atlas connected
NIBSS token acquired
Server running on port 4000 [development]
```

### 4. Build for production

```bash
npm run build
npm start
```

---

## API Documentation

### Swagger UI (interactive)

```
http://localhost:4000/api/docs
```

### Postman Collection (OpenAPI JSON)

```
http://localhost:4000/api/docs/json
```

In Postman: **Import → Link** → paste the URL above. Postman will generate a complete collection from the OpenAPI spec.

---

## Endpoint Summary

### Auth

| Method | Path                 | Auth | Description             |
| ------ | -------------------- | ---- | ----------------------- |
| POST   | `/api/auth/register` | None | Register a new customer |
| POST   | `/api/auth/login`    | None | Login → receive JWT     |

### Onboarding & KYC

| Method | Path                     | Auth          | Description                               |
| ------ | ------------------------ | ------------- | ----------------------------------------- |
| POST   | `/api/admin/insert-bvn`  | `X-Admin-Key` | Seed test BVN into NIBSS                  |
| POST   | `/api/admin/insert-nin`  | `X-Admin-Key` | Seed test NIN into NIBSS                  |
| POST   | `/api/onboarding/verify` | JWT           | Verify BVN/NIN → set `kycVerified = true` |

### Account Management

| Method | Path                                       | Auth                | Description                                                |
| ------ | ------------------------------------------ | ------------------- | ---------------------------------------------------------- |
| POST   | `/api/account/create`                      | JWT + KYC           | Create bank account (one per customer, pre-funded ₦15,000) |
| GET    | `/api/account/me`                          | JWT                 | My account details + live balance                          |
| GET    | `/api/account/balance`                     | JWT                 | Balance check                                              |
| GET    | `/api/account/name-enquiry/:accountNumber` | JWT                 | Resolve account number to name                             |
| GET    | `/api/account/all`                         | JWT + `X-Admin-Key` | List all accounts in this bank                             |

### Transactions

| Method | Path                               | Auth      | Description                        |
| ------ | ---------------------------------- | --------- | ---------------------------------- |
| POST   | `/api/transactions/transfer`       | JWT + KYC | Intra/inter-bank transfer          |
| GET    | `/api/transactions/history`        | JWT       | My transaction history (paginated) |
| GET    | `/api/transactions/:transactionId` | JWT       | Transaction status (TSQ)           |

### Utility

| Method | Path             | Auth | Description                   |
| ------ | ---------------- | ---- | ----------------------------- |
| GET    | `/health`        | None | Health check                  |
| GET    | `/api/docs`      | None | Swagger UI                    |
| GET    | `/api/docs/json` | None | OpenAPI JSON (Postman import) |

---

## Customer Journey — Full Flow

This section walks through every step from a fresh customer to executing a fund transfer.

---

### Stage 1 — Seed Identity Data into NIBSS (Admin)

Before any customer can be verified, their BVN or NIN must exist in the NIBSS identity store.  
This is an admin operation done once per test identity.

```http
POST /api/admin/insert-bvn
X-Admin-Key: <your_ADMIN_KEY>
Content-Type: application/json

{
  "bvn": "12345678901",
  "firstName": "Ada",
  "lastName": "Obi",
  "dob": "1995-06-15",
  "phone": "08012345678"
}
```

**Expected response (201):**
```json
{
  "status": "success",
  "data": {
    "message": "BVN record created successfully",
    "bvn": "12345678901"
  }
}
```

> Use `POST /api/admin/insert-nin` with the same shape (minus `phone`) to seed a NIN instead.

---

### Stage 2 — Customer Registration

The customer creates an account on **your** banking system and receives a JWT.

```http
POST /api/auth/register
Content-Type: application/json

{
  "email": "ada@example.com",
  "password": "SecurePass1",
  "firstName": "Ada",
  "lastName": "Obi",
  "phone": "08012345678"
}
```

**Expected response (201):**
```json
{
  "status": "success",
  "message": "Registration successful",
  "token": "<jwt>",
  "customer": {
    "_id": "...",
    "email": "ada@example.com",
    "firstName": "Ada",
    "lastName": "Obi",
    "phone": "08012345678",
    "kycVerified": false,
    "hasAccount": false
  }
}
```

> **Save the `token`** — it goes in the `Authorization: Bearer <token>` header for all subsequent requests.  
> The token is valid for 24 hours. Use `POST /api/auth/login` to get a fresh one after it expires.

---

### Stage 3 — KYC Verification

The customer proves their identity by submitting their BVN (or NIN) and date of birth.  
The system validates these against the NIBSS identity store and checks that the date of birth matches.

```http
POST /api/onboarding/verify
Authorization: Bearer <token>
Content-Type: application/json

{
  "kycType": "bvn",
  "kycID": "12345678901",
  "dob": "1995-06-15"
}
```

**Expected response (200):**
```json
{
  "status": "success",
  "message": "KYC verification successful",
  "identity": {
    "firstName": "Ada",
    "lastName": "Obi",
    "dob": "1995-06-15",
    "kycType": "bvn"
  }
}
```

After this call, the customer's `kycVerified` flag is `true`.

**What blocks this from succeeding:**
- BVN/NIN not seeded in NIBSS → `400 Bad Request`
- Date of birth does not match the NIBSS record → `400 Bad Request`
- KYC already verified → `409 Conflict`

---

### Stage 4 — Account Creation

With KYC verified, the customer can create their bank account.  
NIBSS auto-generates a 10-digit NUBAN account number and pre-funds it with ₦15,000.

```http
POST /api/account/create
Authorization: Bearer <token>
```

No request body needed — the KYC details are already stored on the customer record.

**Expected response (201):**
```json
{
  "status": "success",
  "message": "Account created successfully",
  "account": {
    "accountNumber": "1234567890",
    "bankCode": "108",
    "bankName": "KBC Bank",
    "balance": 15000
  }
}
```

> **Save the `accountNumber`** — you'll need it to receive transfers.  
> Attempting to create a second account returns `409 Conflict`.

---

### Stage 5 — Recipient Name Enquiry (Pre-transfer check)

Before transferring, confirm the recipient's name. This is mandatory best practice in Nigerian banking.

```http
GET /api/account/name-enquiry/0987654321
Authorization: Bearer <token>
```

**Expected response (200):**
```json
{
  "status": "success",
  "data": {
    "accountNumber": "0987654321",
    "accountName": "Chidi Okeke",
    "bankName": "PHC Bank"
  }
}
```

Verify the name matches who you intend to send to before proceeding.

---

### Stage 6 — Fund Transfer

Initiate the transfer. Works for both intra-bank (same bank code) and inter-bank (different bank code) — NIBSS handles routing automatically.

```http
POST /api/transactions/transfer
Authorization: Bearer <token>
Content-Type: application/json
Idempotency-Key: 550e8400-e29b-41d4-a716-446655440000

{
  "to": "0987654321",
  "amount": 2000
}
```

> **`Idempotency-Key`** — generate a fresh UUID per transfer (`uuidgen` on macOS).  
> On network failure, retry with the **same key** to get the original result without double-debiting.

**Expected response (200):**
```json
{
  "status": "success",
  "message": "Transfer successful",
  "transactionId": "TX1776340463722",
  "amount": 2000,
  "from": "1234567890",
  "to": "0987654321",
  "recipientName": "Chidi Okeke",
  "nibssStatus": "SUCCESS"
}
```

> **Save the `transactionId`** for the next step.

**What can fail here:**
- Insufficient balance → `400 Bad Request`
- Recipient account not found → `404 Not Found`
- KYC not verified → `401 Unauthorized`
- No sender account → `404 Not Found`

---

### Stage 7 — Transaction Status Check (TSQ)

Query the live status of the transfer from NIBSS. Useful for confirming inter-bank transfers that may take a moment to settle.

```http
GET /api/transactions/TX1776340463722
Authorization: Bearer <token>
```

**Expected response (200):**
```json
{
  "status": "success",
  "data": {
    "transactionId": "TX1776340463722",
    "status": "SUCCESS",
    "amount": 2000,
    "from": "1234567890",
    "to": "0987654321",
    "timestamp": "2026-04-21T10:31:03Z"
  }
}
```

> Only the customer who initiated the transaction can query it. Any other JWT returns `403 Forbidden`.

---

### Stage 8 — Transaction History

View a paginated list of all your own transactions.

```http
GET /api/transactions/history?page=1&limit=20
Authorization: Bearer <token>
```

**Expected response (200):**
```json
{
  "status": "success",
  "data": {
    "transactions": [ ... ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 3,
      "totalPages": 1
    }
  }
}
```

> Transactions are strictly isolated — you will never see another customer's records regardless of what you query.

---

### Stage 9 — Balance Check

Confirm your updated balance after the transfer.

```http
GET /api/account/balance
Authorization: Bearer <token>
```

**Expected response (200):**
```json
{
  "status": "success",
  "accountNumber": "1234567890",
  "balance": 13000
}
```

---

### Flow Diagram

```
Admin                          Customer
  │                               │
  │  POST /api/admin/insert-bvn   │
  │──────────────────────────────▶│ (BVN seeded in NIBSS)
  │                               │
  │                               │  POST /api/auth/register
  │                               │──────────────────────────▶ JWT returned
  │                               │
  │                               │  POST /api/onboarding/verify
  │                               │──────────────────────────▶ kycVerified = true
  │                               │
  │                               │  POST /api/account/create
  │                               │──────────────────────────▶ accountNumber + ₦15,000
  │                               │
  │                               │  GET  /api/account/name-enquiry/:no
  │                               │──────────────────────────▶ confirm recipient name
  │                               │
  │                               │  POST /api/transactions/transfer
  │                               │──────────────────────────▶ transactionId returned
  │                               │
  │                               │  GET  /api/transactions/:id
  │                               │──────────────────────────▶ status: SUCCESS
  │                               │
  │                               │  GET  /api/account/balance
  │                               │──────────────────────────▶ updated balance
```

---

## Security Notes

- Passwords are hashed with **bcrypt** (cost factor 12)
- JWTs expire after **24 hours** by default
- `passwordHash` and `kycID` are never returned in API responses
- Transaction history is **strictly isolated** — customers can only see their own records
- Rate limiting: 10 req/min on auth routes, 15 req/min on transfers
- Transfer idempotency via `Idempotency-Key` header prevents double-debits on network retries

---

## Project Structure

```
src/
├── config/          env.ts, db.ts, swagger.ts
├── middleware/      auth.ts, adminAuth.ts, errorHandler.ts, rateLimiter.ts
├── models/          Customer.ts, Account.ts, Transaction.ts
├── services/
│   └── nibss/       nibssClient.ts, nibssTokenService.ts, nibssApi.ts
├── routes/          auth.ts, onboarding.ts, account.ts, transaction.ts
├── controllers/     auth.ts, onboarding.ts, account.ts, transaction.ts
├── validators/      auth.schema.ts, onboarding.schema.ts, account.schema.ts, transaction.schema.ts
├── utils/           jwt.ts, errors.ts
├── app.ts
└── server.ts
```
