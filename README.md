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
NIBSS_BASE_URL=your_nibss_base_url
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
