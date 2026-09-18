# Shubh Ausar (शुभ अवसर) — Dynamic Catalog Management (Phase 5)

## 1. Overview & Architecture

The Shubh Ausar Catalog is a dynamic, database-driven marketplace hierarchy designed for wedding, celebration, and event planning services across India.

### Catalog Hierarchy

```text
                  Platform Category (Admin Managed)
                                  │
                                  ▼
                     Service (Vendor-Owned & Managed)
                                  │
                 ┌────────────────┴────────────────┐
                 ▼                                 ▼
           ServiceImage                         Package
     (Gallery & 1 Primary)              (Bundled Services)
                                                   │
                                                   ▼
                                            PackageService
                                         (Service + Quantity)
```

### Core Tenets

1. **Zero Hardcoded Data**: Categories, services, packages, and pricing structures are 100% database-driven. Neither mobile apps nor admin web consoles contain hardcoded mock categories or service lists.
2. **Strict Category vs Service Ownership**:
   - **Category**: Managed exclusively by Platform Admins (`Catering`, `Photography`, `Decoration`, `Music / DJ`, `Venue`, etc.).
   - **Service**: Created and owned by verified, `APPROVED` vendors under a chosen platform category.
3. **Cross-Vendor Bundle Prevention**: A vendor cannot include another vendor's services inside their package. All bundled services must belong to the package creator.
4. **Primary Image Atomicity**: When an image is flagged as primary (`isPrimary: true`), all previously primary images for that service are atomically demoted to secondary in a single Prisma transaction.
5. **Historical Integrity**: Changes to catalog pricing do not mutate or overwrite previously confirmed bookings or quotations.

---

## 2. Supported Pricing Types

| Pricing Type | Description | Required / Allowed Fields | Example |
|---|---|---|---|
| `FIXED` | Standard one-time lump-sum price | `basePrice > 0` | Wedding Photography: ₹45,000 |
| `PER_PERSON` | Per-plate or per-head pricing | `basePrice > 0`, optional `minQuantity` | Catering / Buffet: ₹850 / plate (Min 100 guests) |
| `PER_UNIT` | Per piece or item pricing | `basePrice > 0`, optional `minQuantity` | Welcome Gift Boxes: ₹150 / box |
| `PER_DAY` | Daily rate pricing | `basePrice > 0`, optional `durationMinutes` | Vintage Bridal Car: ₹12,000 / day |
| `PER_HOUR` | Hourly billing | `basePrice > 0` | DJ & Sound setup: ₹3,500 / hour |
| `CUSTOM_QUOTE` | Bespoke pricing requiring estimation | `minPrice`, `maxPrice` (`minPrice <= maxPrice`), `basePrice = null` | Bespoke Floral Mandap: ₹50,000 – ₹2,00,000 |

---

## 3. Security & Access Control

- **Vendor Catalog Management**: Protected by `authenticateRequest`, `requireVendor`, and `requireApprovedVendor`. Vendors with `PENDING`, `UNDER_REVIEW`, `REJECTED`, or `SUSPENDED` status cannot create or modify catalog items.
- **Public Discovery**: Unauthenticated or authenticated users can browse and search approved services and packages. Only items belonging to `APPROVED` and `isActive: true` vendors under active categories are returned.
- **Admin Moderation**: Platform admins can search all services and packages across vendors and toggle `isActive` status for moderation/compliance.

---

## 4. API Reference

### Vendor Catalog Endpoints

- `POST /api/v1/vendor/services`: Create a new service under an active category.
- `GET /api/v1/vendor/services`: List own services with pagination, category, and pricing filters.
- `GET /api/v1/vendor/services/:id`: Fetch details of a specific owned service.
- `PUT /api/v1/vendor/services/:id`: Update an owned service.
- `DELETE /api/v1/vendor/services/:id`: Soft-delete/deactivate an owned service.
- `POST /api/v1/vendor/services/:serviceId/images`: Add an image to a service gallery.
- `GET /api/v1/vendor/services/:serviceId/images`: List gallery images for a service.
- `PATCH /api/v1/vendor/services/:serviceId/images/:imageId`: Update image metadata.
- `DELETE /api/v1/vendor/services/:serviceId/images/:imageId`: Delete a gallery image.
- `PATCH /api/v1/vendor/services/:serviceId/images/:imageId/primary`: Set an image as primary (atomically demotes prior primary).
- `POST /api/v1/vendor/packages`: Create a package bundling owned services.
- `GET /api/v1/vendor/packages`: List own packages.
- `GET /api/v1/vendor/packages/:id`: Fetch details of an owned package.
- `PUT /api/v1/vendor/packages/:id`: Update package details and bundled service list.
- `DELETE /api/v1/vendor/packages/:id`: Soft-delete/deactivate a package.
- `POST /api/v1/vendor/packages/:packageId/services`: Add a service to a package.
- `DELETE /api/v1/vendor/packages/:packageId/services/:serviceId`: Remove a service from a package.
- `PATCH /api/v1/vendor/packages/:packageId/services/:serviceId`: Update service quantity in a package.

### Public Marketplace Endpoints

- `GET /api/v1/services`: Search and filter published services (`categoryId`, `search`, `city`, `pricingType`, `minPrice`, `maxPrice`, `sortBy`).
- `GET /api/v1/services/:id`: Get public service details including gallery and vendor info.
- `GET /api/v1/packages`: Search and filter published packages.
- `GET /api/v1/packages/:id`: Get public package details including bundled service breakdown.

### Admin Moderation Endpoints

- `GET /api/v1/admin/services`: List services across all vendors with search and vendor filter.
- `PATCH /api/v1/admin/services/:id/status`: Moderate service status (`isActive: boolean`).
- `GET /api/v1/admin/packages`: List packages across all vendors.
- `PATCH /api/v1/admin/packages/:id/status`: Moderate package status (`isActive: boolean`).
