# SHUBH AUSAR (शुभ अवसर) — REMAINING WORK & IMPLEMENTATION ROADMAP

Based on the comprehensive system audit against the target DFD and product vision, this document details the exact gap closure roadmap required to transition Shubh Ausar to **100% production readiness**.

---

## 🎯 Prioritization Framework

### Priority 0 (P0) — Core Marketplace Transactional Engine (Critical)
*These modules form the backbone of the marketplace transaction: without them, users can discover vendors, but cannot execute a binding quotation, contract, or payment.*

1. **Quote Engine (Customer & Provider)**:
   - Backend `quotes` module (`QuoteController`, `QuoteService`, `QuoteRepository`, `quote.routes.ts`, `quote.validation.ts`).
   - Customer submits formal quote request linking event requirements or services.
   - Provider builds quotation with line items (`QuoteItem`), unit prices, quantities, discounts, GST/tax, notes, and expiration date.
   - Customer & Provider negotiation loop: Customer can request revision with notes; Provider can send revised quote (v1, v2) without destroying history.
   - Customer accepts quote or rejects quote.

2. **Booking Lifecycle & Historic Price Snapshotting**:
   - Accepting a quote triggers automatic booking creation (`Booking`).
   - Deep-snapshot line items (`BookingItem`) locking exact price, description, and quantity at the time of agreement.
   - Booking state machine: `QUOTE_RECEIVED` → `CONFIRMED` → `PAYMENT_PENDING` → `PAID` → `IN_PROGRESS` → `COMPLETED` / `CANCELLED`.
   - Admin booking monitor endpoint.

3. **Payment & Razorpay Webhook Verification**:
   - Backend `payments` module (`PaymentController`, `PaymentService`, `PaymentRepository`, `payment.routes.ts`).
   - `POST /payments/create-order`: Generates Razorpay Order ID for the booking total.
   - `POST /payments/verify`: Server-side HMAC-SHA256 signature verification (`razorpay_order_id`, `razorpay_payment_id`, `razorpay_signature`).
   - `POST /payments/webhook`: Idempotent webhook listener for `payment.captured` and `payment.failed`.
   - `POST /payments/cod`: Cash on delivery / pay at venue option.
   - Booking state transitions automatically upon payment confirmation.

4. **Transaction Event Notifications**:
   - Dispatch real-time in-app and email notifications upon:
     - `QUOTE_REQUESTED` (to Provider)
     - `QUOTE_RECEIVED` (to Customer)
     - `QUOTE_REVISION_REQUESTED` (to Provider)
     - `QUOTE_ACCEPTED` / `BOOKING_CREATED` (to both)
     - `PAYMENT_SUCCESS` (to both)
   - Payloads equipped with deep-linking keys (`quoteId`, `bookingId`, `eventId`).

5. **Customer Mobile App Transaction Screens**:
   - `QuotesListScreen` & `QuoteDetailsScreen` (displays line items, subtotal, discount, tax, validity).
   - "Request Revision" modal with negotiation notes input.
   - "Accept & Proceed to Payment" flow.
   - `BookingPaymentScreen` (Razorpay checkout + COD radio selection).
   - `BookingDetailsScreen` with live status tracking and WhatsApp quick-connect.

6. **Provider Mobile App Transaction Screens**:
   - `QuoteBuilderModal` / `CreateQuoteScreen` to formulate line items, price, discount, tax, and notes for an inquiry lead.
   - `QuoteDetailsScreen` showing negotiation status.
   - Booking order view showing confirmed events and customer notes.

7. **Admin Web Transaction Console**:
   - `QuotesPage` to observe all active and accepted quotes across the platform.
   - `BookingsPage` to audit booking fulfillment and cancellations.
   - `PaymentsPage` to inspect transaction IDs, payment methods, and statuses.

---

### Priority 1 (P1) — Post-Booking & Provider Operations

1. **Reviews & Ratings Engine**:
   - Backend `reviews` module (`ReviewController`, `ReviewService`, `ReviewRepository`, `review.routes.ts`).
   - Only customers with `COMPLETED` bookings can review a vendor (prevent fake reviews).
   - Rating recalculation: automatically computes vendor `ratingAverage` and `ratingCount`.
   - Customer App: `ReviewModal` on completed booking.
   - Provider App: View customer feedback & ratings.
   - Admin Web: `ReviewsPage` to inspect and moderate reviews.

2. **Customer Favorites**:
   - Backend `favorites` module (`POST /favorites/vendor/:id`, `POST /favorites/service/:id`, `GET /favorites`).
   - Customer App: Heart toggle on vendor and service cards + `FavoritesScreen`.

3. **Vendor Availability & Calendar**:
   - Backend `availability` module (`POST /vendor/availability`, `GET /vendor/availability`).
   - Provider App: Simple date picker to mark days as booked or unavailable.

4. **Provider Earnings & Platform Commission**:
   - Automatic `Commission` calculation (e.g. 10% platform fee) on booking payment.
   - Provider App: `EarningsView` displaying total revenue, completed gigs, and pending balance.

---

### Priority 2 (P2) — Growth & Content Features

1. **Coupons & Discount Codes**:
   - Coupon validation and redemption during booking checkout.
2. **Admin Platform Settings**:
   - Dynamic commission rates and platform configuration.
3. **Banners & FAQs**:
   - Promotional carousel on Home screen and Help/FAQ center.

---

## 🛠️ Step-by-Step Implementation Sequence

```text
Phase 1: Backend Quote & Booking Transaction Engine
   ├── Create Quote module (Controller, Service, Repository, Validation, Routes)
   ├── Implement Quote state machine (Draft, Sent, RevisionRequested, Accepted, Rejected)
   ├── Enhance Booking module with BookingItem snapshotting upon Quote acceptance
   ├── Write comprehensive automated tests for Quote and Booking lifecycle
   └── Mount routes in index.routes.ts

Phase 2: Payment & Razorpay Integration
   ├── Implement Payment module with Razorpay order creation
   ├── Implement server-side HMAC signature verification
   ├── Implement Razorpay webhook listener with idempotency
   ├── Implement COD fallback workflow
   ├── Trigger booking state transition to CONFIRMED / PAID
   └── Write Payment and Webhook automated tests

Phase 3: Customer App Transactional UI
   ├── Build Quotes list & Quote details views
   ├── Add "Request Revision" negotiation modal
   ├── Add "Accept Quote" and Payment checkout modal (Razorpay SDK + COD)
   ├── Add My Bookings list & Booking Details tracking screen
   └── Integrate React Query hooks for instant status refresh

Phase 4: Provider App Quote Builder UI
   ├── Build Quote Form modal (add items, quantities, prices, validity, notes)
   ├── Allow Provider to send revised quotes upon customer negotiation request
   ├── Add confirmed Bookings management view
   └── Add Earnings & Payout summary card

Phase 5: Admin Web Governance Extensions
   ├── Add Quotes monitoring page
   ├── Add Bookings monitoring page
   ├── Add Payments & Transactions log page
   └── Add sidebar navigation items

Phase 6: Reviews & Post-Booking Delivery
   ├── Implement Reviews backend module with vendor rating auto-update
   ├── Add Customer App Rate & Review dialog
   └── Add Provider and Admin review views

Phase 7: End-to-End Verification & Production Hardening
   ├── Run full test suites across Backend, Admin Web, Customer App, Provider App
   ├── Verify complete Plan → Discover → Quote → Negotiate → Book → Pay → Review flow
   └── Update documentation and project logs
```
