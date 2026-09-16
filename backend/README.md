# Shubh Mangalam - Backend API Service

> **Har Function, Ek App**

Backend API service for the **Shubh Mangalam** marketplace application (currently undergoing architectural transformation from the legacy GoVehicle codebase). Built with Node.js, Express, TypeScript, Prisma, and PostgreSQL, featuring background task queues powered by Redis and BullMQ.

---

## 🚀 Key Production Features
- **Stateless Authentication**: JWT access and refresh token authentication with auto-rotation.
- **Role-Based Access Control (RBAC)**: Secure routes restricted by roles (`CUSTOMER`, `OWNER`, `ADMIN`).
- **Asynchronous Task Queues**: Offloads resource-intensive operations (SMTP Email dispatches and database Notification creation) into BullMQ background workers via Redis.
- **Health Checks**: Specialized `/health` endpoint to monitor status of both PostgreSQL database and Redis connections.
- **Request Tracing**: Traces every incoming request with a unique request UUID (`x-request-id`) in headers and logger outputs.
- **Structured JSON Logging**: Standard human-readable logs in development, and structured JSON logs in production.
- **Docker Ready**: Configured multi-stage builds and Compose orchestration.

---

## 🛠️ Technology Stack
- **Runtime**: Node.js & TypeScript
- **Framework**: Express.js
- **Database ORM**: Prisma Client
- **Databases**: PostgreSQL (Main store) & Redis (Queues)
- **Task Scheduling**: BullMQ
- **Mail Transporter**: Nodemailer
- **Security Headers**: Helmet & CORS & Express Rate Limiter
- **Documentation**: Swagger UI & OpenAPI JSDoc spec annotations

---

## ⚙️ Environment Variables Config (`.env`)

Create a `.env` file in the root of the `backend/` folder:

```ini
PORT=8000
NODE_ENV=development
API_PREFIX=/api/v1

# Postgres Connection URL
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/govehicle?schema=public

# Redis Configuration (Used for BullMQ and Caching)
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=

# JWT Secrets (Ensure they are strong in production)
JWT_SECRET=your-jwt-access-secret-key-at-least-32-chars
JWT_REFRESH_SECRET=your-jwt-refresh-secret-key-at-least-32-chars
JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d

# Nodemailer SMTP Configuration
SMTP_HOST=localhost
SMTP_PORT=25
SMTP_USER=your-smtp-username
SMTP_PASS=your-smtp-password
SMTP_FROM=Shubh Mangalam <no-reply@shubhmangalam.com>

# Cloudinary Setup (Optional - falls back to filesystem if not using)
STORAGE_PROVIDER=local
UPLOAD_DIR=uploads
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=
```

---

## 💻 Local Quickstart Guide

### Prerequisites
1. Install **Node.js** (v20+ recommended)
2. Install and run **PostgreSQL**
3. Install and run **Redis**

### Step-by-Step Installation
1. Install project dependencies:
   ```bash
   npm install
   ```
2. Apply database migrations:
   ```bash
   npx prisma migrate dev
   ```
3. Seed default marketplace data (optional):
   ```bash
   npm run prisma:seed
   ```
4. Start the development server (runs nodemon with hot-reloading):
   ```bash
   npm run dev
   ```
5. View API Swagger documentation:
   Open [http://localhost:8000/api-docs](http://localhost:8000/api-docs) in your web browser.

---

## 🐳 Running with Docker & Compose

Run the entire stack (Express App, PostgreSQL database, and Redis cache) using a single command:

```bash
docker-compose up --build
```

### Verification
- **Express Backend**: [http://localhost:8000](http://localhost:8000)
- **Swagger Documentation**: [http://localhost:8000/api-docs](http://localhost:8000/api-docs)
- **Health Check Status**: [http://localhost:8000/health](http://localhost:8000/health)

---

## 🛟 Health and Monitoring Specs
Send a `GET` request to `/health` (outside version prefixes and bypasses rate limits):

**Request**:
```bash
curl http://localhost:8000/health
```

**Success Response (`200 OK`)**:
```json
{
  "status": "healthy"
}
```

**Failure Response (`503 Service Unavailable`)**:
```json
{
  "status": "unhealthy",
  "error": "Error details..."
}
```
