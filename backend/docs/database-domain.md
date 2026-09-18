# Shubh Ausar (शुभ अवसर) — Database Domain Documentation (Phase 2)

## 1. Overview & Core Philosophy

**Shubh Ausar** (*"शुभ अवसर — Celebrate Every Occasion"*) is a hyper-local celebration and event-services marketplace designed for Indian towns, tier-2/tier-3 cities, and metro regions.

The database is built on **generic celebration concepts**, intentionally avoiding wedding-only restrictions. The system dynamically models diverse occasions such as:
- **Weddings & Pre-Wedding Functions:** Wedding, Engagement, Reception, Haldi, Sangeet
- **Regional & Cultural Festivals:** Teej, Karwa Chauth, Navratri, Diwali, Eid
- **Life Milestones & Rituals:** Mundan, Puja, Jagran, Housewarming (Griha Pravesh), Baby Shower (Godh Bharai), Anniversaries, Birthdays
- **Social & Professional Functions:** Corporate Events, College/Office Parties, Concerts

---

## 2. High-Level Entity Relationship Architecture

```text
                               ┌──────────────┐
                               │     User     │ (CUSTOMER | VENDOR | ADMIN)
                               └──────┬───────┘
                                      │
                 ┌────────────────────┴────────────────────┐
                 │                                         │
             CUSTOMER                                   VENDOR
                 │                                         │
                 ▼                                         ▼
              Event                                     Vendor
                 │                               ┌─────────┼─────────┐
                 ▼                               ▼         ▼         ▼
          EventRequirement                   Category   Service   Package
                 │                               │         │         │
                 └─────────────────┐             │         │         │
                                   ▼             │         │         │
                                Booking ◄────────┴─────────┴─────────┘
                                   │
                    ┌──────────────┼──────────────┐
                    ▼              ▼              ▼
                  Quote         Payment         Review
                    │              │
                    ▼              ▼
                QuoteItem        Refund
                                   │
                                   ▼
                             VendorPayout
                             Commission
```

### Dynamic Recommendation Subsystem

```text
EventType (e.g., Wedding, Birthday, Puja)
    │
    ▼ (1:N)
EventTypeCategory (isRecommended, sortOrder)
    ▲
    │ (N:1)
Category (e.g., Decoration, Tent, Halwai, Pandit, DJ)
```

The `EventTypeCategory` join model allows the Admin Web application to dynamically configure which categories are recommended for any event type in real-time without modifying code or redeploying the backend.

---

## 3. Core Domains & Models

### 3.1 User & Address Domain
- **`User`**: Central user account across the entire ecosystem.
  - Role (`UserRole`): `CUSTOMER`, `VENDOR`, `ADMIN`.
  - Status (`UserStatus`): `ACTIVE`, `INACTIVE`, `SUSPENDED`, `DELETED`.
  - Fields: `email`, `phone`, `passwordHash`, `name`, `avatar`, `emailVerified`, `phoneVerified`.
- **`Address`**: Reusable address model tailored for Indian postal semantics (`village`, `locality`, `city`, `district`, `state`, `country`, `pincode`, `latitude`, `longitude`, `isDefault`).

### 3.2 Vendor Domain
- **`Vendor`**: Represents the local business/vendor profile (e.g., *Sharma Tent House*, *Gupta Caterers*).
  - Business profile: `businessName`, `slug`, `description`, `phone`, `email`, `logo`, `coverImage`.
  - Address & Discovery: `addressLine1`, `village`, `locality`, `city`, `district`, `state`, `pincode`, `latitude`, `longitude`, `operatingRadiusKm`.
  - Verification & State: `status` (`VendorStatus`), `isVerified`, `isActive`, `ratingAverage`, `ratingCount`.
- **`VendorDocument`**: Compliance and identity verification records (`documentType`, `documentUrl`, `status`, `rejectionReason`).
- **`VendorCategory`**: Normalized M:N link between `Vendor` and `Category`.

### 3.3 Catalog Domain (Categories, Services, Packages)
- **`Category`**: Dynamic event service categories (`slug`, `name`, `icon`, `image`, `isActive`, `sortOrder`).
- **`Service`**: Individual services offered by a vendor under a category (e.g., *Stage Floral Decoration*, *Live Jalebi Counter*).
  - Pricing: `pricingType` (`PricingType`), `basePrice`, `minPrice`, `maxPrice`, `minQuantity`, `maxQuantity`, `durationMinutes`.
- **`ServiceImage`**: Normalized gallery for services (`url`, `publicId`, `sortOrder`, `isPrimary`).
- **`Package` & `PackageService`**: Bundled offerings by a vendor (e.g., *Complete Haldi Ceremony Package*) containing specific quantities of services with bundle pricing.

### 3.4 Customer Event & Requirement Domain
- **`EventType`**: Master list of event types (`Wedding`, `Birthday`, `Puja`, etc.).
- **`EventTypeCategory`**: Curated category recommendations per event type.
- **`Event`**: Customer-created celebration planner (`title`, `eventDate`, `startTime`, `endTime`, `guestCount`, `budgetMin`, `budgetMax`, `city`, `latitude`, `longitude`, `status`).
- **`EventRequirement`**: Granular customer requirements attached to an event (`categoryId`, `quantity`, `budgetMin`, `budgetMax`, `notes`, `status`).

### 3.5 Quotation & Negotiation Domain
- **`Quote`**: Custom quotation generated by a vendor for an event requirement or direct inquiry (`subtotal`, `discount`, `tax`, `total`, `validUntil`, `status`, `notes`).
- **`QuoteItem`**: Line items within a quotation with snapshot pricing (`description`, `quantity`, `unitPrice`, `totalPrice`, `notes`).

### 3.6 Booking Domain
- **`Booking`**: Central transaction binding `Customer`, `Event`, `Vendor`, and contracted services/packages.
  - Financial snapshots: `subtotal`, `discount`, `tax`, `platformFee`, `total`.
  - Status lifecycle: `BookingStatus`.
  - Milestones: `confirmedAt`, `completedAt`, `cancelledAt`.
- **`BookingItem`**: Immutable snapshot of the service/package contracted at the time of booking (`name`, `quantity`, `unitPrice`, `totalPrice`, `notes`).

### 3.7 Payment, Refund & Payout Domain
- **`Payment`**: Multi-gateway payment records (`bookingId`, `provider`, `providerOrderId`, `providerPaymentId`, `amount`, `currency`, `status`, `method`, `paidAt`).
- **`Refund`**: Tracking payment reversals and refund requests (`paymentId`, `amount`, `reason`, `status`, `providerRefundId`, `processedAt`).
- **`Commission`**: Platform marketplace fees deducted from vendor bookings (`bookingId`, `vendorId`, `amount`, `percentage`, `status`).
- **`VendorPayout`**: Disbursements made to vendor bank accounts (`vendorId`, `amount`, `status`, `reference`, `paidAt`).

### 3.8 Customer Feedback & Engagement
- **`Review`**: Customer rating (1-5) and feedback on completed bookings (`bookingId`, `customerId`, `vendorId`, `rating`, `comment`, `isPublished`). Composite unique key ensures one review per booking.
- **`Favorite`**: Saved vendors or services by customers (`customerId`, `vendorId`, `serviceId`).
- **`Notification`**: In-app notifications with JSON metadata for deep-linking.
- **`Coupon` & `CouponUsage`**: Discount promotion codes with usage tracking.

### 3.9 Platform Operations & Governance
- **`AdminSetting`**: Key-value marketplace configuration.
- **`Banner`**: Promotional sliders for mobile apps.
- **`FAQ`**: Help center content.
- **`AuditLog`**: Security and change tracking for administrative and critical domain actions.

---

## 4. Key Enums & Finite State Machines

### 4.1 User & Vendor Enums
```prisma
enum UserRole {
  CUSTOMER
  VENDOR
  ADMIN
}

enum UserStatus {
  ACTIVE
  INACTIVE
  SUSPENDED
  DELETED
}

enum VendorStatus {
  PENDING
  UNDER_REVIEW
  APPROVED
  REJECTED
  SUSPENDED
}
```

### 4.2 Pricing Models
```prisma
enum PricingType {
  FIXED         // Flat rate for service
  PER_PERSON    // e.g., Catering / Buffet per plate
  PER_UNIT      // e.g., Per sound box / light piece / chair
  PER_DAY       // e.g., Generator / Hall / Photography per day
  PER_HOUR      // e.g., DJ / Choreographer per hour
  CUSTOM_QUOTE  // Requirement-based quote
}
```

### 4.3 Booking Lifecycle
```text
               [PENDING]
                  │
     ┌────────────┼────────────┐
     ▼            ▼            ▼
[QUOTE_REQUIRED] [REJECTED] [CANCELLED]
     │
     ▼
[QUOTE_RECEIVED]
     │
     ▼
[CONFIRMED] ──► [PAYMENT_PENDING] ──► [PAID]
                                         │
                                         ▼
                                   [IN_PROGRESS]
                                         │
                                         ▼
                                    [COMPLETED]
                                         │
                                         ▼
                           [REFUND_PENDING] ──► [REFUNDED]
```

### 4.4 Quotation Lifecycle
```text
[DRAFT] ──► [SENT] ──► [VIEWED] ──► [ACCEPTED] ──► [Booking Created]
              │           │
              ▼           ▼
         [REJECTED]  [EXPIRED] / [CANCELLED]
```

---

## 5. Financial & Data Integrity Rules

1. **High-Precision Money:**
   All monetary fields (`Decimal(12, 2)`) prevent IEEE 754 floating-point rounding errors on Indian Rupee amounts.
2. **Snapshot Pricing:**
   `BookingItem` and `QuoteItem` store snapshot values (`name`, `unitPrice`, `totalPrice`) rather than querying current `Service` or `Package` rows, ensuring historical contracts remain intact when vendor prices update.
3. **Data Protection & Foreign Keys:**
   - Critical commercial tables (`bookings`, `payments`, `quotes`, `reviews`, `vendor_payouts`) use `onDelete: Restrict` to protect audit trails and accounting records.
   - Transient/child entities (`service_images`, `vendor_categories`, `package_services`, `event_type_categories`) use `onDelete: Cascade`.

---

## 6. Location Strategy

Local discovery is fundamental to Shubh Ausar:
- Both `Address`, `Vendor`, and `Event` maintain decimal latitude (`Decimal(10, 8)`) and longitude (`Decimal(11, 8)`).
- Vendors maintain `operatingRadiusKm` (e.g., 25.0 km).
- Fast spatial queries utilize standard bounding box indexing (`@@index([latitude, longitude])`) combined with the Haversine formula at the application/query level.
- The schema is designed for seamless zero-downtime migration to PostgreSQL PostGIS (`GEOMETRY(Point, 4326)`) when spatial indexing is needed at scale.

---

## 7. Legacy GoVehicle Model Strategy

To prevent accidental data loss and maintain backward compatibility during development, legacy transport models are isolated in a dedicated section of `schema.prisma`:
- `Vehicle`
- `VehicleImage`
- `TransportRequest`
- `FareRule`
- `Role`, `FuelType`, `Transmission`, `VehicleCategory`, `VehicleStatus`, `BookingStatusLegacy`, `PaymentStatusLegacy`, `PaymentMethodLegacy`

### Migration Roadmap to Shubh Ausar:
In future phases, **Transportation** is treated as a standard event service category (already seeded under `Category: Transportation`). Event-related vehicle bookings (e.g., Doli cars, vintage groom cars, guest transit buses) will be integrated directly into the `Service` and `Booking` models, deprecating the standalone GoVehicle transport tables.

---

## 8. Critical Architectural Rule — Everything Must Be Dynamic

### 8.1 Zero Static Business Data
Business, catalog, and platform configuration data must **never** be hard-coded in:
- Backend controllers or services
- TypeScript constants or mock files
- React / React Native components or screens
- Navigation configurations
- Frontend UI state fallbacks

### 8.2 Single Source of Truth
The **PostgreSQL Database** is the sole source of truth:
```text
                  ┌──────────────────┐
                  │    PostgreSQL    │
                  │  Source of Truth │
                  └────────┬─────────┘
                           │
                     Backend API
                           │
          ┌────────────────┼────────────────┐
          │                │                │
          ▼                ▼                ▼
     Customer App     Provider App      Admin Web
```

### 8.3 Dynamic Entities Matrix
| Business Entity | Database Model | Admin Control / Dynamic Mechanism |
| :--- | :--- | :--- |
| **Event Types** | `EventType` | Add/rename/deactivate any event (e.g., Retirement Party) via Admin Web. |
| **Categories** | `Category` | Create, edit, reorder, iconize, activate/deactivate without deployments. |
| **Services** | `Service` | Vendors create and maintain their own services per category dynamically. |
| **Packages** | `Package`, `PackageService` | Providers bundle services dynamically with custom pricing and items. |
| **Recommendations** | `EventTypeCategory` | Admin defines which categories map to which event types dynamically. |
| **Pricing** | `Service`, `Quote`, `BookingItem` | Calculated dynamically per pricing type (`FIXED`, `PER_PERSON`, `CUSTOM_QUOTE`). |
| **Vendors & Locations** | `Vendor`, `Address` | Discovered dynamically based on customer coordinates and Haversine distance. |
| **Platform Settings** | `AdminSetting` | Commission rates, booking limits, and thresholds stored in database. |
| **Seed Scripts** | `seed.ts` | Treated strictly as **initial database bootstrap**, never application constants. |

