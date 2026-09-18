# Shubh Ausar (शुभ अवसर) — Customer Event Planning & Marketplace Discovery Documentation

This document describes the Phase 6 architecture, endpoints, database integration, ownership security, and location discovery algorithms for Shubh Ausar.

---

## 1. Architectural Principles

1. **Zero Hardcoded Business Data**:
   - All Event Types, Categories, Services, Packages, and Vendors are strictly fetched from PostgreSQL via Prisma Client.
   - Recommended categories per celebration type are dynamically driven by the `EventTypeCategory` join relation.
2. **Strict Server-Side Customer Resource Ownership**:
   - Customer events (`Event`), event requirements (`EventRequirement`), and saved addresses (`Address`) strictly check `customerId === req.user.id` / `userId === req.user.id`.
   - Any cross-customer access attempt results in a `403 Forbidden` or `404 Not Found`.
3. **Location-Based Haversine Geographic Discovery**:
   - Nearby vendor discovery uses the Haversine formula to compute great-circle distances:
     $$d = 2 R \arcsin\left(\sqrt{\sin^2\left(\frac{\Delta \varphi}{2}\right) + \cos(\varphi_1)\cos(\varphi_2)\sin^2\left(\frac{\Delta \lambda}{2}\right)}\right)$$
     where $R = 6371$ km.
   - Vendors are filtered by `distanceKm <= operatingRadiusKm` (and client-requested `radius` parameter).
   - Only approved, active, and verified providers are exposed.
4. **Historical Price Snapshot Protection**:
   - Catalog service and package updates never mutate historical booking snapshots (`BookingItem`, `QuoteItem`).
5. **Pricing Model Integrity**:
   - Services with `CUSTOM_QUOTE` pricing type display "Request Custom Quote" without fake numerical rates.
   - Per person, per unit, per day, per hour, and fixed pricing units are preserved without assumptions.

---

## 2. API Endpoints

### 2.1 Event Types & Recommendations (Public)
- `GET /api/v1/event-types` — List all active celebration types (Wedding, Birthday, Anniversary, etc.)
- `GET /api/v1/event-types/:id` — Get specific celebration type
- `GET /api/v1/event-types/:eventTypeId/categories` — Get recommended categories dynamically mapped via `EventTypeCategory`

### 2.2 Customer Event Management (Authenticated Customer)
- `POST /api/v1/events` — Create celebration with date, guest count, budget, and venue address
- `GET /api/v1/events` — List customer's own celebrations
- `GET /api/v1/events/:eventId` — Get event details and requirements
- `PATCH /api/v1/events/:eventId` — Update celebration details
- `DELETE /api/v1/events/:eventId` — Cancel and delete celebration
- `GET /api/v1/events/:eventId/requirements` — List celebration requirements
- `POST /api/v1/events/:eventId/requirements` — Add requirement with category ID, quantity, notes, budget
- `PATCH /api/v1/events/:eventId/requirements/:requirementId` — Update requirement
- `DELETE /api/v1/events/:eventId/requirements/:requirementId` — Remove requirement

### 2.3 Customer Addresses (Authenticated Customer)
- `GET /api/v1/addresses` — List saved customer addresses
- `POST /api/v1/addresses` — Add saved address (default address handled atomically)
- `PATCH /api/v1/addresses/:addressId` — Update saved address
- `DELETE /api/v1/addresses/:addressId` — Delete saved address (auto-promotes remaining address to default)

### 2.4 Marketplace Discovery (Public)
- `GET /api/v1/marketplace/vendors` — Location-based provider search with coordinates, radius, category, event type, sorting, and pagination
- `GET /api/v1/marketplace/vendors/:vendorId` — Full public vendor profile with services, packages, reviews, and distance
- `GET /api/v1/marketplace/categories` — Active celebration categories with provider counts
- `GET /api/v1/marketplace/services` — Public catalog service discovery
- `GET /api/v1/marketplace/services/:serviceId` — Service details with pricing model and image gallery
- `GET /api/v1/marketplace/packages` — Public package deals
- `GET /api/v1/marketplace/packages/:packageId` — Package details with included services checklist

### 2.5 Admin Event Types Management (Authenticated Admin)
- `GET /api/v1/admin/event-types` — List all celebration types with stats
- `POST /api/v1/admin/event-types` — Create celebration type
- `PATCH /api/v1/admin/event-types/:id` — Update celebration type
- `DELETE /api/v1/admin/event-types/:id` — Delete celebration type
- `POST /api/v1/admin/event-types/:id/categories` — Map category to celebration type
- `DELETE /api/v1/admin/event-types/:id/categories/:categoryId` — Unmap category

---

## 3. Verification & Test Coverage
- Automated integration test suite `backend/tests/marketplace.test.ts` executes:
  1. Dynamic Data Test (Requirement 33)
  2. Location & Haversine Distance Test (Requirement 34)
  3. Customer Event Planning & Management Lifecycle
  4. Event Requirements CRUD & Ownership Enforcement
  5. Customer Address Management & Default Exclusivity
  6. Marketplace Discovery Filtering, Sorting & Pagination
