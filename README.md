# 🏨 IHMS — Integrated Hotel Management System

> BSc CSIT 7th Semester Project  
> Tribhuvan University · Bhairahawa Multiple Campus  
> **Authors:** Pratik Shrestha · Dip Kumar Singh · Suraj Silwal

---

## 🚀 Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 14 (App Router), React 18, Tailwind CSS |
| Backend | Next.js API Routes (full-stack) |
| Database | PostgreSQL via Prisma ORM |
| Auth | NextAuth.js v4 — JWT + Role-Based Access Control |
| Charts | Recharts |
| Validation | Zod |

---

## ✨ Features

### 🔐 Role-Based Access Control (RBAC)
- **Admin** — Full access: dashboard, room management, booking management, user management
- **Staff** — Operational access: room status updates, check-in/check-out management
- **Guest** — Self-service: browse rooms, create bookings, manage own reservations

### 🛡️ Conflict-Free Booking Engine
Mathematical interval overlap algorithm that **prevents overbooking** at the database level.

### 📊 Admin Dashboard
Real-time analytics: occupancy rates, monthly revenue charts, booking trends.

### 🏠 Room Management
Full CRUD with status tracking: Available → Occupied → Cleaning → Maintenance.

---

## ⚙️ Setup & Installation

### 1. Clone the Repository
```bash
git clone https://github.com/surajsilwal2/RentRoom.git
cd RentRoom
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Configure Environment
```bash
cp .env.example .env
# Edit .env with your PostgreSQL credentials and a secret key
```

### 4. Set Up Database
```bash
# Create tables
npx prisma db push

# (Optional) Seed with demo data
npm run db:seed
```

### 5. Run Development Server
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

---

## 🔑 Demo Credentials (after seeding)

| Role  | Email             | Password  |
|-------|-------------------|-----------|
| Admin | admin@ihms.com    | admin123  |
| Staff | staff@ihms.com    | staff123  |
| Guest | guest@ihms.com    | guest123  |

---

## 📁 Project Structure

```
├── app/
│   ├── (auth)/login         # Login & Register pages
│   ├── (admin)/admin        # Admin dashboard, rooms, bookings
│   ├── (staff)/staff        # Staff operations panel
│   ├── (guest)/             # Guest room browsing & bookings
│   └── api/                 # All REST API endpoints
│       ├── auth/            # NextAuth + Register
│       ├── rooms/           # Room CRUD
│       ├── bookings/        # Booking CRUD + conflict detection
│       ├── admin/stats      # Dashboard analytics
│       └── staff/rooms/     # Room status updates
├── components/              # Shared UI components
├── lib/
│   ├── auth.ts             # NextAuth configuration
│   ├── prisma.ts           # Prisma client singleton
│   └── booking.ts          # Conflict algorithm + utilities
├── prisma/
│   ├── schema.prisma       # Database schema
│   └── seed.ts             # Demo data seeder
├── types/                  # TypeScript types
└── middleware.ts           # Route protection
```

---

## 🔒 Booking Conflict Algorithm

```
Overlap exists when:
  requestedCheckIn  < existingCheckOut
  AND
  requestedCheckOut > existingCheckIn
```

This catches all overlap scenarios — partial overlaps, complete containment, and exact matches.

---

## 📜 License

For academic purposes only — BSc CSIT Project, Tribhuvan University.
