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

## Test Flow

```bash
# 1. Seed a test BVN (use your ADMIN_KEY)
POST /api/admin/insert-bvn
X-Admin-Key: <your_admin_key>
{ "bvn": "12345678901", "firstName": "Ada", "lastName": "Obi", "dob": "1995-06-15", "phone": "08012345678" }

# 2. Register customer and get JWT
POST /api/auth/register
{ "email": "ada@example.com", "password": "SecurePass1", "firstName": "Ada", "lastName": "Obi", "phone": "08012345678" }

# 3. Verify KYC
POST /api/onboarding/verify   (Authorization: Bearer <token>)
{ "kycType": "bvn", "kycID": "12345678901", "dob": "1995-06-15" }

# 4. Create account → receive accountNumber + ₦15,000 balance
POST /api/account/create   (Authorization: Bearer <token>)

# 5. Repeat steps 1-4 for a second customer, then transfer
POST /api/transactions/transfer   (Authorization: Bearer <token>)
Idempotency-Key: <uuid>
{ "to": "<recipient_account_number>", "amount": 2000 }

# 6. Check transaction status
GET /api/transactions/<transactionId>   (Authorization: Bearer <token>)
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
