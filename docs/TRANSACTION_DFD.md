# Shubh Ausar (शुभ अवसर) — Transaction Data Flow Diagrams (DFD)

## 1. Level 0 Context Diagram (Marketplace Transactions)

```text
               Quote Requests, Revisions, Acceptance
       ┌─────────────────────────────────────────────────────┐
       │                                                     │
       ▼                                                     │
┌──────────────┐          Quote / Booking Data         ┌──────────────┐
│   Customer   │ ◄──────────────────────────────────── │ Shubh Ausar  │
└──────────────┘                                       │ Transaction  │
       ▲                                               │    System    │
       │                                               └──────────────┘
       │                                                     ▲
       │        Formal Quotes, Revisions, Status Updates     │
       └─────────────────────────────────────────────────────┘
                                  │
                                  ▼
                           ┌──────────────┐
                           │   Provider   │
                           └──────────────┘
```

---

## 2. Level 1 Data Flow Diagram (Quotation → Negotiation → Booking)

```text
[CUSTOMER]                    [TRANSACTION ENGINE]                   [DATABASE]
    │                                   │                                │
    ├─── 1. POST /quotes/request ──────►│ Verify Vendor & Event          │
    │    (vendorId, eventId, notes)     ├─── INSERT Quote (REQUESTED) ──►│ (quotes)
    │                                   ├─── Notify Vendor ─────────────►│ (notifications)
    │                                   │                                │
    │                                   │                                │
[PROVIDER]                              │                                │
    │                                   │                                │
    ├─── 2. POST /quotes ──────────────►│ Validate Service Ownership     │
    │    (quoteId, items, discount)     │ Compute Authoritative Totals   │
    │                                   ├─── UPDATE Quote (SENT) ───────►│ (quotes)
    │                                   ├─── INSERT QuoteVersion (v1) ──►│ (quote_versions)
    │                                   ├─── Notify Customer ───────────►│ (notifications)
    │                                   │                                │
    │                                   │                                │
[CUSTOMER]                              │                                │
    │                                   │                                │
    ├─── 3. POST /quotes/:id/revision ─►│ Validate State (SENT/REVISED)  │
    │    (revisionNotes)                ├─── UPDATE Quote (REVISION_REQ)►│ (quotes)
    │                                   ├─── Notify Vendor ─────────────►│ (notifications)
    │                                   │                                │
    │                                   │                                │
[PROVIDER]                              │                                │
    │                                   │                                │
    ├─── 4. POST /quotes/:id/revise ───►│ Increment currentVersion (v2)  │
    │    (revised items, discount)      │ Compute Authoritative Totals   │
    │                                   ├─── UPDATE Quote (REVISED) ────►│ (quotes)
    │                                   ├─── INSERT QuoteVersion (v2) ──►│ (quote_versions)
    │                                   ├─── Notify Customer ───────────►│ (notifications)
    │                                   │                                │
    │                                   │                                │
[CUSTOMER]                              │                                │
    │                                   │                                │
    ├─── 5. POST /quotes/:id/accept ───►│ START DB TRANSACTION           │
    │                                   ├─── UPDATE Quote (ACCEPTED) ───►│ (quotes)
    │                                   ├─── INSERT Booking (CONFIRMED) ─►│ (bookings)
    │                                   ├─── SNAPSHOT Items ────────────►│ (booking_items)
    │                                   ├─── LINK bookingId on Quote ───►│ (quotes)
    │                                   │ COMMIT DB TRANSACTION          │
    │                                   ├─── Notify Customer & Provider ─►│ (notifications)
    │                                   │                                │
    ▼                                   ▼                                ▼
```

---

## 3. Transaction Notification Payloads

Every state transition produces structured in-app and email notifications:

```json
{
  "type": "QUOTE_RECEIVED",
  "title": "Formal Quote Received!",
  "message": "Royal Celebrations sent you a quote for ₹28,000. Quote #SA-Q-2026-4114",
  "data": {
    "quoteId": "ee3cda49-11d3-4fc5-88fd-f9463a0ffb8f",
    "quoteNumber": "SA-Q-2026-4114",
    "vendorId": "f3a2cd5e-02d3-4252-964c-be069ca3f05a",
    "total": 28000
  }
}
```

```json
{
  "type": "BOOKING_CREATED",
  "title": "Booking Confirmed!",
  "message": "Your celebration booking #SA-BK-2026-5741 has been confirmed. Payment status is Pending.",
  "data": {
    "bookingId": "1ef63e52-b59a-455e-ad62-5d39148b1551",
    "bookingNumber": "SA-BK-2026-5741",
    "quoteId": "ee3cda49-11d3-4fc5-88fd-f9463a0ffb8f"
  }
}
```
