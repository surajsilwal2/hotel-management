import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding database...");

  // ── Users ──────────────────────────────────────────────────────────────────
  const [admin, staff, guest] = await Promise.all([
    prisma.user.upsert({
      where: { email: "admin@ihms.com" },
      update: {},
      create: {
        name: "Admin User",
        email: "admin@ihms.com",
        password: await bcrypt.hash("admin123", 12),
        role: "ADMIN",
        phone: "+977-9800000001",
      },
    }),
    prisma.user.upsert({
      where: { email: "staff@ihms.com" },
      update: {},
      create: {
        name: "Staff Member",
        email: "staff@ihms.com",
        password: await bcrypt.hash("staff123", 12),
        role: "STAFF",
        phone: "+977-9800000002",
      },
    }),
    prisma.user.upsert({
      where: { email: "guest@ihms.com" },
      update: {},
      create: {
        name: "John Guest",
        email: "guest@ihms.com",
        password: await bcrypt.hash("guest123", 12),
        role: "GUEST",
        phone: "+977-9800000003",
      },
    }),
  ]);

  console.log("✅ Users created");

  // ── Rooms ──────────────────────────────────────────────────────────────────
  const rooms = await Promise.all([
    prisma.room.upsert({
      where: { number: "101" },
      update: {},
      create: {
        number: "101", type: "SINGLE", status: "AVAILABLE",
        pricePerNight: 1500, floor: 1, capacity: 1,
        description: "Cozy single room with garden view and modern amenities.",
        amenities: ["WiFi", "AC", "TV"],
        images: [
          "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?q=80&w=1200&auto=format&fit=crop&ixlib=rb-4.0.3&s=1a0b9f7f8e7e3c4a1e5b6a8c9d0f1a2b",
        ],
      },
    }),
    prisma.room.upsert({
      where: { number: "102" },
      update: {},
      create: {
        number: "102", type: "DOUBLE", status: "AVAILABLE",
        pricePerNight: 2500, floor: 1, capacity: 2,
        description: "Spacious double room perfect for couples.",
        amenities: ["WiFi", "AC", "TV", "Coffee"],
        images: [
          "https://images.unsplash.com/photo-1501117716987-c8e07f5e5f9b?q=80&w=1200&auto=format&fit=crop&ixlib=rb-4.0.3&s=4b3c2d1f6a7b8c9d0e1f2a3b4c5d6e7f",
        ],
      },
    }),
    prisma.room.upsert({
      where: { number: "201" },
      update: {},
      create: {
        number: "201", type: "DOUBLE", status: "OCCUPIED",
        pricePerNight: 2800, floor: 2, capacity: 2,
        description: "Premium double room with city view.",
        amenities: ["WiFi", "AC", "TV", "Coffee", "Minibar"],
        images: [
          "https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?q=80&w=1200&auto=format&fit=crop&ixlib=rb-4.0.3&s=5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a",
        ],
      },
    }),
    prisma.room.upsert({
      where: { number: "301" },
      update: {},
      create: {
        number: "301", type: "DELUXE", status: "AVAILABLE",
        pricePerNight: 4500, floor: 3, capacity: 3,
        description: "Deluxe room with panoramic mountain views and premium furniture.",
        amenities: ["WiFi", "AC", "TV", "Coffee", "Minibar", "Bathtub"],
        images: [
          "https://images.unsplash.com/photo-1484154218962-a197022b5858?q=80&w=1200&auto=format&fit=crop&ixlib=rb-4.0.3&s=9a0b1c2d3e4f5a6b7c8d9e0f1a2b3c4d",
        ],
      },
    }),
    prisma.room.upsert({
      where: { number: "401" },
      update: {},
      create: {
        number: "401", type: "SUITE", status: "AVAILABLE",
        pricePerNight: 8000, floor: 4, capacity: 4,
        description: "Luxurious suite with separate living area and king-size bed.",
        amenities: ["WiFi", "AC", "TV", "Coffee", "Minibar", "Bathtub", "Jacuzzi"],
        images: [
          "https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?q=80&w=1200&auto=format&fit=crop&ixlib=rb-4.0.3&s=0a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d",
        ],
      },
    }),
    prisma.room.upsert({
      where: { number: "501" },
      update: {},
      create: {
        number: "501", type: "PENTHOUSE", status: "AVAILABLE",
        pricePerNight: 15000, floor: 5, capacity: 6,
        description: "The ultimate penthouse experience with 360° views and private terrace.",
        amenities: ["WiFi", "AC", "TV", "Coffee", "Minibar", "Bathtub", "Jacuzzi", "Private Terrace"],
        images: [
          "https://images.unsplash.com/photo-1505691723518-36a03f3c7f71?q=80&w=1200&auto=format&fit=crop&ixlib=rb-4.0.3&s=abcdef1234567890abcdef1234567890",
        ],
      },
    }),
    prisma.room.upsert({
      where: { number: "103" },
      update: {},
      create: {
        number: "103", type: "SINGLE", status: "CLEANING",
        pricePerNight: 1500, floor: 1, capacity: 1,
        description: "Single room with work desk, ideal for solo business travelers.",
        amenities: ["WiFi", "AC", "TV", "Work Desk"],
        images: [
          "https://images.unsplash.com/photo-1505691723518-36a03f3c7f71?q=80&w=1200&auto=format&fit=crop&ixlib=rb-4.0.3&s=1234567890abcdef1234567890abcdef",
        ],
      },
    }),
    prisma.room.upsert({
      where: { number: "202" },
      update: {},
      create: {
        number: "202", type: "DOUBLE", status: "MAINTENANCE",
        pricePerNight: 2600, floor: 2, capacity: 2,
        description: "Double room undergoing scheduled maintenance.",
        amenities: ["WiFi", "AC", "TV"],
        images: [
          "https://images.unsplash.com/photo-1501117716987-c8e07f5e5f9b?q=80&w=1200&auto=format&fit=crop&ixlib=rb-4.0.3&s=0987654321fedcba0987654321fedcba",
        ],
      },
    }),
  ]);

  console.log(`✅ ${rooms.length} rooms created`);

  // ── Sample bookings ─────────────────────────────────────────────────────────
  const today = new Date();
  const tomorrow = new Date(today); tomorrow.setDate(today.getDate() + 1);
  const nextWeek = new Date(today); nextWeek.setDate(today.getDate() + 7);
  const nextMonth = new Date(today); nextMonth.setDate(today.getDate() + 30);

  await prisma.booking.createMany({
    skipDuplicates: true,
    data: [
      {
        userId: guest.id,
        roomId: rooms[0].id,
        checkIn: tomorrow,
        checkOut: new Date(tomorrow.getTime() + 3 * 24 * 60 * 60 * 1000),
        status: "CONFIRMED",
        totalPrice: 1500 * 3,
        adults: 1, children: 0,
      },
      {
        userId: guest.id,
        roomId: rooms[3].id,
        checkIn: nextWeek,
        checkOut: new Date(nextWeek.getTime() + 2 * 24 * 60 * 60 * 1000),
        status: "PENDING",
        totalPrice: 4500 * 2,
        adults: 2, children: 1,
        notes: "Early check-in requested",
      },
    ],
  });

  console.log("✅ Sample bookings created");
  console.log("\n🎉 Seeding complete!");
  console.log("\n📋 Demo Credentials:");
  console.log("  Admin:  admin@ihms.com  / admin123");
  console.log("  Staff:  staff@ihms.com  / staff123");
  console.log("  Guest:  guest@ihms.com  / guest123");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
