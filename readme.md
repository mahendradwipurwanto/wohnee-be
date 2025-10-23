# 🚀 Perspektive Dev Backend Boilerplate

A clean, scalable backend template built by **Perspektive Dev**, powered by  
**TypeScript**, **Express.js**, **PostgreSQL**, and **TypeORM**.  
Designed for reliability, maintainability, and performance in modern backend development.

---

## 🧠 Tech Stack

- **Language:** TypeScript
- **Framework:** Express.js
- **Database:** PostgreSQL
- **ORM:** TypeORM
- **Security:** JWT (RSA-PSS SHA-256), Request Signature Validation
- **Logger:** Winston (Daily Rotate Logs)
- **Validation:** class-validator
- **Rate Limiting:** express-rate-limit
- **Timezone Handling:** dayjs (Asia/Jakarta)

---

## ⚙️ Prerequisites

### 1️⃣ Install Node.js and npm
Ensure Node.js (v18 or newer) and npm are installed.  
👉 [Install Guide](https://www.partitionwizard.com/partitionmanager/install-npm-node-js.html)

Check versions:
```bash
node -v
npm -v
```

### 2️⃣ Install a Code Editor
Recommended editors:
- [Visual Studio Code](https://code.visualstudio.com/) ✅
- [IntelliJ IDEA](https://www.jetbrains.com/idea/)
- [Brackets](https://brackets.io/)
- [WebStorm](https://www.jetbrains.com/webstorm/)

### 3️⃣ Install PostgreSQL
Ensure PostgreSQL is running locally or accessible via network.

---

## 🧭 Getting Started

### 1️⃣ Clone the Repository
```bash
git clone https://github.com/perspektive-dev/wohnee-be-service.git
```

### 2️⃣ Open the Project
```bash
cd wohnee-be-service && code .
```

### 3️⃣ Install Dependencies
```bash
npm install
```

---

## 🧩 Environment Setup

### 1️⃣ Create Your `.env` File
```bash
cp .env.example .env
```

### 2️⃣ Configure `.env`
Adjust values according to your local setup.

> ⚠️ **Important:**  
> JWT tokens use **RSA-PSS (SHA-256)**.  
> You must provide your own RSA key pair:
> - Generate keys at [Crypto Tools RSA Generator](https://cryptotools.net/rsagen)
> - Encode them in **Base64** at [Base64 Encode](https://www.base64encode.org/)
> - Save the paths or Base64 strings in `.env`:  
    >   `JWT_PUBLIC_KEY_FILEPATH` and `JWT_PRIVATE_KEY_FILEPATH`

---

## 🗄️ Database Setup

### 1️⃣ Create Database in PostgreSQL
```sql
CREATE DATABASE wohnee;
```

### 2️⃣ Compile TypeScript
```bash
npm run tsc
```

### 3️⃣ Run Database Migrations
```bash
npm run migrate
```

---

## ▶️ Running the Application

### 🚀 Production Mode
```bash
npm run start
```

### 🧩 Development Mode (with Live Reload)
```bash
npm run start:dev
```

Server will run on:  
👉 **http://localhost:3001**

---

## 📦 Available NPM Scripts

| Command | Description |
|----------|-------------|
| `npm install` | Install project dependencies |
| `npm run tsc` | Compile TypeScript into JavaScript |
| `npm run start` | Start the compiled server (production) |
| `npm run start:dev` | Run development server with hot reload |
| `npm run migrate` | Execute TypeORM migrations |
| `npm run lint` | Run ESLint for code quality checks |

---

## 🧱 Project Structure

```
src/
├── app/
│   ├── middleware/
│   │   ├── auth.middleware.ts
│   │   ├── limiter.middleware.ts
│   │   ├── signature.middleware.ts
│   │   └── validator.middleware.ts
│   ├── module/
│   │   ├── auth/
│   │   ├── organization/
│   │   ├── role/
│   │   └── files/
│   └── index.ts
│
├── config/
│   ├── postgres/
│   └── credentials/
│
├── lib/
│   ├── auth/
│   ├── helper/
│   ├── storage/
│   └── types/
│
└── index.ts
```

---

## 🧾 Core Features

✅ JWT Authentication (Access + Refresh Tokens)  
✅ Role & Permission Management  
✅ Organization-based User System  
✅ Secure File Upload to **Local / S3 / GCS**  
✅ Request Signature Verification via `X-Signature` and `X-Date`  
✅ Global Error Handling  
✅ Rate Limiting & Validation Middleware  
✅ Centralized Logging (Winston)

---

## 🔐 Security Notes

- JWT uses **RSA-PSS (SHA-256)** for digital signing.
- Optional signature verification ensures integrity of API requests.
- CORS and Rate Limiting are configurable via `.env`.
- Sensitive keys and credentials **must never be committed** to the repository.

---

## 🧪 Testing (Optional)

If you have tests configured:
```bash
npm run test
```

For test coverage reports:
```bash
npm run test:coverage
```

---

## 🧰 Logging

- Logging is handled by **Winston**.
- Development logs are printed to the console.
- In production, logs can be rotated daily using `winston-daily-rotate-file`.

Example log output:
```
2025-10-23 15:32:14 [INFO]: Server is running on port 3001 in development mode
```

---

## 🧠 Developer Notes

- Use `ts-node` during development for faster iteration.
- Place secrets (private keys, JSON credentials) outside the repository.
- Always commit a sanitized `.env.example` for reference.
- Recommended Node version: **v18+**
- Recommended PostgreSQL version: **v14+**

---

## 🧾 License

This project is licensed under the **MIT License**.

---

## 💡 Maintained by

**Perspektive Dev Team**  
Crafted with ❤️ by [Perspektive Studio](https://perspektive.id)

---

🎯 **Ready to start building?**
```bash
npm install
npm run start:dev
```
Then visit 👉 **http://localhost:3001/api/v1**