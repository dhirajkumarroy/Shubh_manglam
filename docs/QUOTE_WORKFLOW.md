# Shubh Ausar (शुभ अवसर) — Quotation & Negotiation Engine

## 1. Executive Summary
The Shubh Ausar Quotation Engine is the authoritative transactional bridge connecting celebration clients with verified service providers. It replaces ambiguous chat messages with structured, legally and financially binding proposals featuring dynamic line items, authoritatively computed pricing, multi-version negotiation history, and atomic quote acceptance.

---

## 2. Server-Side State Machine

```text
       [ Customer ]
             │
             ▼
     ( REQUESTED )
             │  Vendor creates Quote (v1)
             ▼
          ( SENT ) ───────────┐
             │                │ Vendor or Customer
             │                ▼
             │          ( REJECTED )
             │
             ├── Customer requests revision
             ▼
  ( REVISION_REQUESTED ) ───► ( REJECTED )
             │
             │ Vendor revises items (v2, v3...)
             ▼
         ( REVISED ) ─────────┐
             │                │
             ├── Revision     ▼
             │   loop   ( REJECTED )
             │
             ▼ Customer accepts
        ( ACCEPTED )
             │
             ▼ (Atomic interactive DB Transaction)
        [ BOOKING CONFIRMED ]
```

### Valid Status Transitions
| From Status | Allowed Target Statuses | Authorized Actor |
| :--- | :--- | :--- |
| `DRAFT` | `SENT`, `CANCELLED` | Vendor |
| `REQUESTED` | `SENT`, `REJECTED`, `CANCELLED` | Vendor / Customer |
| `SENT` | `REVISION_REQUESTED`, `ACCEPTED`, `REJECTED`, `EXPIRED`, `CANCELLED` | Customer / Vendor / System |
| `REVISION_REQUESTED` | `REVISED`, `REJECTED`, `CANCELLED` | Vendor / Customer |
| `REVISED` | `REVISION_REQUESTED`, `ACCEPTED`, `REJECTED`, `EXPIRED`, `CANCELLED` | Customer / Vendor / System |
| `ACCEPTED` | *(Terminal state — locked to Booking)* | — |
| `REJECTED` | *(Terminal state)* | — |
| `EXPIRED` | *(Terminal state)* | System |

---

## 3. Financial Computation & Authorization Rules

1. **Authoritative Backend Totals**:
   - `subtotal = Σ(item.quantity * item.unitPrice)`
   - `total = max(0, subtotal - discount + tax)`
   - Frontend inputs are treated as suggestions only; the backend recalculates all values before saving.
2. **Actor Scoping & Ownership**:
   - Customer cannot quote their own vendor profile.
   - Vendor can only quote their own active services from their catalog.
   - Customer can only request quotes for events they own (`event.customerId === user.id`).
   - Customer can only accept quotes addressed to them.
   - Revisions require a mandatory note (5–1,500 characters).
3. **Expiration Defense**:
   - Acceptance and revision requests are rejected if `now() > quote.validUntil`.

---

## 4. Multi-Version Negotiation Schema

Every quotation preserves its audit history in `quote_versions`:

```text
Quote
 ├── id: UUID
 ├── quoteNumber: String (e.g. SA-Q-2026-4114)
 ├── currentVersion: Int (1, 2, 3...)
 ├── status: QuoteStatus
 ├── subtotal: Decimal
 ├── discount: Decimal
 ├── tax: Decimal
 ├── total: Decimal
 └── versions: QuoteVersion[]
       ├── versionNumber: Int
       ├── subtotal, discount, tax, total: Decimal
       ├── notes: String (Vendor terms)
       ├── revisionNotes: String (Customer requested changes)
       ├── itemsJson: JSONB (Full snapshot of line items at this iteration)
       └── createdAt: Timestamp
```

---

## 5. API Endpoints

| Method | Route | Description | Role |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/v1/quotes/request` | Submit quote request for an event | Customer |
| `POST` | `/api/v1/quotes` | Create formal quote with line items | Vendor |
| `GET` | `/api/v1/quotes` | List quotes scoped by actor role | Customer / Vendor / Admin |
| `GET` | `/api/v1/quotes/:id` | Detailed quote view with version history | Customer / Vendor / Admin |
| `POST` | `/api/v1/quotes/:id/revision-request` | Customer requests changes with notes | Customer |
| `POST` | `/api/v1/quotes/:id/revise` | Vendor issues revised quote (increments version) | Vendor |
| `POST` | `/api/v1/quotes/:id/accept` | Atomically accept quote & create booking | Customer |
| `POST` | `/api/v1/quotes/:id/reject` | Decline quotation | Customer / Vendor |
