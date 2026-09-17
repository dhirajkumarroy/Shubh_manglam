# Shubh Mangalam — Authentication, Authorization & Sessions (Phase 3)

## 1. Architectural Philosophy

**Shubh Mangalam** employs a **Single Identity, Multi-Role Architecture**. There is exactly one central user authentication system in the PostgreSQL database (`users` table) accessed by three distinct applications:

```text
Customer App (Mobile)       Provider App (Mobile)       Admin Web (Browser)
   [SecureStore]               [SecureStore]             [Secure / HttpOnly]
         │                           │                            │
         └───────────────────────────┼────────────────────────────┘
                                     │
                             REST API Endpoints
                         /api/v1/auth/{customer,provider,admin}/*
                                     │
                            JWT + Session Layer
                    • Access Token (15m, minimal claims)
                    • Refresh Token (7d, SHA-256 hash in DB)
                    • Session Rotation & Revocation
                                     │
                         Role & Approval Guards
                    • requireRole(CUSTOMER | VENDOR | ADMIN)
                    • requireApprovedVendor (status == APPROVED)
                                     │
                         PostgreSQL Database
```

---

## 2. Authentication vs. Provider Approval

A critical principle of Shubh Mangalam is the separation of **Authentication** and **Business Approval**:

```text
Vendor Registers
       ↓
User created (role = VENDOR, status = ACTIVE)
Vendor profile created (status = PENDING)
       ↓
Vendor can Log In (Authenticated)
       ↓
Protected Provider Operations (List Services, Accept Leads, Receive Bookings)
       ↓
requireApprovedVendor check
       ├── status == PENDING       → 403 Forbidden (Wait for admin approval)
       ├── status == UNDER_REVIEW  → 403 Forbidden (Inspection in progress)
       ├── status == REJECTED      → 403 Forbidden (Application rejected)
       ├── status == SUSPENDED     → 403 Forbidden (Account suspended)
       └── status == APPROVED      → 200 OK (Allowed)
```

- **`User.role`**: Controls system privilege level (`CUSTOMER`, `VENDOR`, `ADMIN`).
- **`User.status`**: Controls account status (`ACTIVE`, `INACTIVE`, `SUSPENDED`, `DELETED`).
- **`Vendor.status`**: Controls marketplace business verification state (`PENDING`, `UNDER_REVIEW`, `APPROVED`, `REJECTED`, `SUSPENDED`).

---

## 3. JWT Lifecycle & Refresh Token Rotation

### 3.1 Token Specs
- **Access Token**: Short-lived (15 minutes), signed with `JWT_SECRET`. Contains minimal identity claims (`sub: userId`, `role`, `sessionId`).
- **Refresh Token**: Long-lived (7 days). Stored on the client in `expo-secure-store` (Mobile) or secure session storage (Admin).
- **Zero Raw Storage**: The database **never stores raw refresh tokens**. It stores `SHA-256(rawToken)` inside the `user_sessions` table.

### 3.2 Rotation & Replay Attack Defense
When a client calls `POST /api/v1/auth/refresh`:
1. The server hashes the submitted token and looks up the session in `user_sessions`.
2. **Replay Detection**: If `session.revokedAt` is set, a stolen or replayed token is detected. The server immediately **revokes all active sessions** for that user to prevent account takeover.
3. If valid, the session is rotated: a new cryptographically secure token is generated, its hash replaces the old hash, the expiration is extended, and a new access token is returned.

---

## 4. API Route Reference

| Method | Endpoint | Access | Description |
| :--- | :--- | :---: | :--- |
| `POST` | `/api/v1/auth/customer/register` | Public | Customer registration with email verification token. |
| `POST` | `/api/v1/auth/customer/login` | Public | Authenticates customer credentials and issues tokens. |
| `POST` | `/api/v1/auth/provider/register` | Public | Registers vendor (`role=VENDOR`) and creates `PENDING` vendor profile. |
| `POST` | `/api/v1/auth/provider/login` | Public | Authenticates provider credentials and returns vendor profile. |
| `POST` | `/api/v1/auth/admin/login` | Public | Authenticates admin credentials. Handles MFA challenge if enabled. |
| `POST` | `/api/v1/auth/refresh` | Public | Rotates refresh token and issues new access token. |
| `POST` | `/api/v1/auth/logout` | Public | Revokes current session token. |
| `POST` | `/api/v1/auth/logout-all` | Authenticated | Revokes all active sessions across all devices for the user. |
| `GET` | `/api/v1/auth/me` | Authenticated | Returns sanitized profile of current user (and vendor if provider). |
| `POST` | `/api/v1/auth/email/verify` | Public | Confirms email verification token and marks user verified. |
| `POST` | `/api/v1/auth/email/resend-verification`| Public | Generates and sends a new email verification token. |
| `POST` | `/api/v1/auth/password/forgot` | Public | Generates single-use password reset token (generic response). |
| `POST` | `/api/v1/auth/password/reset` | Public | Resets password using token and revokes all active sessions. |
| `POST` | `/api/v1/auth/password/change` | Authenticated | Updates password after validating existing password. |
| `POST` | `/api/v1/auth/google` | Public | Google OAuth token verification and account linkage. |
| `POST` | `/api/v1/auth/admin/mfa/setup` | Admin | Generates Base32 TOTP secret and AES-GCM encrypted backup. |
| `POST` | `/api/v1/auth/admin/mfa/verify` | Admin | Verifies 6-digit TOTP code and activates admin MFA. |
| `POST` | `/api/v1/auth/admin/mfa/disable` | Admin | Disables MFA after validating admin password and TOTP code. |

---

## 5. Security Implementations

1. **Password Hashing**: `bcrypt` with 12 salt rounds. Passwords are never logged or returned in responses.
2. **Brute Force Rate Limiting**: `authLimiter` limits authentication endpoints to 30 requests per 15 minutes in production.
3. **CORS Security**: Environment-based whitelist (`ADMIN_WEB_ORIGIN`, `CUSTOMER_APP_ORIGIN`, `PROVIDER_APP_ORIGIN`) with `credentials: true`. Wildcards (`*`) with credentials are prohibited.
4. **Token Storage**:
   - `customer-app`: `expo-secure-store`
   - `provider-app`: `expo-secure-store`
   - `admin-web`: Isolated session storage / HttpOnly
5. **No Public Admin Registration**: Admin accounts can never be registered through a public endpoint; they must be provisioned via database seeds or administrative CLI.

---

## 6. Seed Accounts (Development & Testing)

Default password: `process.env.SEED_DEFAULT_PASSWORD` (defaults to `ShubhMangalam@2026!`).

### 6.1 Customer Demo
- **Email**: `customer.demo@shubhmangalam.local`
- **Phone**: `+919800000001`
- **Role**: `CUSTOMER`
- **Status**: `ACTIVE` (`emailVerified: true`)

### 6.2 Provider Demo
- **Email**: `provider.demo@shubhmangalam.local`
- **Phone**: `+919800000002`
- **Role**: `VENDOR`
- **Status**: `ACTIVE`
- **Vendor Profile**: *Royal Events & Celebrations* (`status = APPROVED`, `isVerified = true`)

### 6.3 Admin Demo
- **Email**: `admin.demo@shubhmangalam.local`
- **Phone**: `+919800000003`
- **Role**: `ADMIN`
- **Status**: `ACTIVE`
