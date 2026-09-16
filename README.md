# Shubh Mangalam

> **Har Function, Ek App**

Shubh Mangalam is a local celebration and event-services marketplace designed to help customers discover and book trusted local service providers for life's important occasions and cultural ceremonies.

---

## 🏛️ Platform Architecture

All three client applications communicate with the same central backend API service and PostgreSQL database:

```text
       ┌────────────────────────┐
       │  Customer Mobile App   │  (React Native / Expo)
       └───────────┬────────────┘
                   │
       ┌───────────┴────────────┐
       │  Provider Mobile App   │  (React Native / Expo)
       └───────────┬────────────┘
                   │
                   ▼
       ┌────────────────────────┐
       │      Backend API       │  (Node.js, Express, TypeScript)
       └───────────▲────────────┘
                   │
       ┌───────────┴────────────┐
       │     Admin Web App      │  (React, TypeScript, Vite, Tailwind CSS)
       └────────────────────────┘
                   │
                   ▼
       ┌────────────────────────┐
       │  PostgreSQL Database   │  (Prisma ORM)
       └────────────────────────┘
```

### Applications Overview
1. **Customer Mobile App (`customer-app/`)**: Used by event hosts and families to plan events, discover local services, request quotes, book providers, and make secure payments.
2. **Service Provider Mobile App (`provider-app/`)**: Used by local vendors (decorators, caterers, tent houses, DJs, photographers, makeup artists) to manage service packages, review booking requests, send quotes, and track orders.
3. **Admin Web Application (`admin-web/`)**: Used by platform administrators to govern categories, verify service providers, resolve disputes, monitor marketplace volume, and manage platform configurations.
4. **Backend API Service (`backend/`)**: Single centralized REST API with asynchronous job queues (BullMQ + Redis) and PostgreSQL persistence via Prisma ORM.

---

## 🎪 Occasions & Services (Vision)

### Occasions Supported
- **Weddings & Pre-Wedding** (Shaadi, Sagai, Mehndi, Sangeet, Reception)
- **Birthdays & Anniversaries**
- **Festivals & Rituals** (Teej, Chhath, Diwali, Durga Puja, Ganesh Utsav)
- **Ceremonies & Pujas** (Mundan, Griha Pravesh, Satyanarayan Puja, Jagran)
- **Family & Corporate Functions** (Baby Showers, Housewarming, Community Gatherings)

### Services Offered
- **Decoration & Lighting** (Flower decoration, Stage, Theme lighting)
- **Tent & Furniture** (Pandals, Seating, Crockery, Waterproof setups)
- **Catering & Halwai** (Traditional sweets, Buffet, Live counters)
- **Entertainment** (DJ, Dhol, Brass Band, Sound & Generator systems)
- **Artists & Rituals** (Mehendi artists, Bridal Makeup, Pandits/Pujaris)
- **Photography & Videography** (Cinematic video, Pre-wedding, Drone shoots)
- **Venues & Logistics** (Marriage halls, Resorts, Guest transport)

---

## 🔄 Project Transformation Status

> **Important Notice:** This repository is currently undergoing architectural transformation from the legacy **GoVehicle** mobility platform into the **Shubh Mangalam** event-services marketplace.

- **Current Status (Phase 0 Complete):** Multi-application repository architecture established (`backend/`, `customer-app/`, `provider-app/`, `admin-web/`).
- **Functionality Note:** Core vehicle booking models and APIs remain preserved in the backend to maintain operational stability while the domain schema is systematically upgraded. Event booking, vendor marketplace, quotes, and catalog features are planned for subsequent phases.
- **Roadmap:**
  - **Phase 0:** Multi-app project structure setup (Completed)
  - **Phase 1:** Branding & design tokens (Completed)
  - **Phase 2:** Production Prisma schema & database domain redesign (Vendors, Services, Packages, Occasions, Bookings, Quotes)
  - **Phase 3:** Backend REST APIs & business logic rewrite
  - **Phase 4:** Client applications UI/UX implementation

---

## 📁 Repository Structure

```text
ShubhMangalam/
├── backend/          # Single Express + TypeScript + Prisma + BullMQ API
├── customer-app/     # Customer React Native / Expo application
├── provider-app/     # Service Provider React Native / Expo application
├── admin-web/        # React + Vite + Tailwind CSS admin web console
├── .gitignore        # Unified repository ignore rules
├── .env.example      # Root environment variable documentation
└── README.md         # Project documentation and architecture guide
```

---

## 🛠️ Quick Start Guide

### 1. Backend
```bash
cd backend
npm install
npx prisma generate
npm run dev
```

### 2. Customer Mobile App
```bash
cd customer-app
npm install
npx expo start
```

### 3. Service Provider Mobile App
```bash
cd provider-app
npm install
npx expo start
```

### 4. Admin Web Portal
```bash
cd admin-web
npm install
npm run dev
```
# Shubh_manglam
