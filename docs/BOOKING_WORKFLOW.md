# Shubh Ausar (शुभ अवसर) — Booking & Snapshotting Engine

## 1. Overview
The Booking Engine represents the executed agreement between a customer and a celebration service provider. It ensures that once a quote is accepted, the financial terms and service descriptions are completely decoupled from mutable catalog records through historical snapshots.

---

## 2. Booking Lifecycle (Payment-Ready Architecture)

Because payment gateway integration is deferred to the next milestone, bookings operate on an auspicious, payment-neutral lifecycle:

```text
[ Quote Accepted ]
        │
        ▼
   ( CONFIRMED ) ────────────┐
        │                    │ Customer or Vendor
        │ Vendor starts      ▼
        ▼ service      ( CANCELLED )
  ( IN_PROGRESS )
        │
        │ Vendor marks completion
        ▼
   ( COMPLETED )
```

### Payment State Boundary
- `booking.status`: Operational status (`CONFIRMED` → `IN_PROGRESS` → `COMPLETED`).
- `payment.status`: Financial settlement status (`PENDING`).
- No fake online payment flow is simulated. When payment gateways (Razorpay, UPI) are introduced, they update `Payment.status` from `PENDING` to `SUCCESS` without altering or corrupting the booking operational state machine.

---

## 3. Historical Item Snapshotting Strategy

### The Immutability Principle
Vendors frequently change catalog prices, service descriptions, and package bundles over time.
To guarantee legal and financial integrity:
1. `BookingItem` records copy the exact service name, agreed unit price, agreed quantity, line total, and special instructions directly from the accepted quote into the `booking_items` table.
2. If a vendor later deletes a service or triples its catalog rate, the historical `BookingItem` retains the exact agreement formed at booking time.

### Schema Relationship
```text
Booking
 ├── id: UUID
 ├── bookingNumber: String (e.g. SA-BK-2026-5741)
 ├── status: BookingStatus (CONFIRMED)
 ├── subtotal: Decimal
 ├── discount: Decimal
 ├── tax: Decimal
 ├── total: Decimal
 ├── customerNote, vendorNote: Text
 └── items: BookingItem[]
       ├── name: String (Snapshotted service name)
       ├── quantity: Int
       ├── unitPrice: Decimal (Agreed unit price)
       ├── totalPrice: Decimal
       └── notes: Text
```

---

## 4. Atomic Acceptance & Concurrency Defense

Acceptance of a quotation and creation of the booking occurs inside an interactive database transaction:

```typescript
await prisma.$transaction(async (tx) => {
  // 1. Mark Quote as ACCEPTED
  const quote = await tx.quote.update({
    where: { id: quoteId },
    data: { status: QuoteStatus.ACCEPTED }
  });

  // 2. Insert Confirmed Booking
  const booking = await tx.booking.create({
    data: {
      bookingNumber,
      customerId: quote.customerId,
      vendorId: quote.vendorId,
      eventId: quote.eventId,
      status: BookingStatus.CONFIRMED,
      subtotal: quote.subtotal,
      discount: quote.discount,
      tax: quote.tax,
      total: quote.total,
      items: {
        create: snapshotItems
      }
    }
  });

  // 3. Link Booking back to Quote
  await tx.quote.update({
    where: { id: quote.id },
    data: { bookingId: booking.id }
  });

  return { quote, booking };
});
```

### Race Condition Defenses
- **Double Acceptance Prevention**: If two parallel requests attempt to accept the same quote simultaneously, the second encounters an application-level state machine check (`status !== SENT && status !== REVISED`), throwing a `409 Conflict` error.
- **Transaction Rollback**: If item snapshotting fails for any reason, the quote does not remain in the `ACCEPTED` state, preventing orphaned accepted quotes.

---

## 5. API Endpoints

| Method | Route | Description | Role |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/v1/bookings` | List bookings scoped by actor role | Customer / Vendor / Admin |
| `GET` | `/api/v1/bookings/:id` | Full booking details with historical item snapshots | Customer / Vendor / Admin |
| `PATCH` | `/api/v1/bookings/:id/status` | Advance booking status (`IN_PROGRESS`, `COMPLETED`, `CANCELLED`) | Customer / Vendor / Admin |
