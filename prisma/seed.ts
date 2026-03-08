import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

// Real Unsplash images per room type
const ROOM_IMAGES: Record<string, string[]> = {
  SINGLE_101: [
    "https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=800&q=80",
    "https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?w=800&q=80",
  ],
  DOUBLE_102: [
    "https://images.unsplash.com/photo-1611892440504-42a792e24d32?w=800&q=80",
    "https://images.unsplash.com/photo-1566665797739-1674de7a421a?w=800&q=80",
  ],
  DOUBLE_201: [
    "https://images.unsplash.com/photo-1566665797739-1674de7a421a?w=800&q=80",
    "https://images.unsplash.com/photo-1611892440504-42a792e24d32?w=800&q=80",
  ],
  DELUXE_301: [
    "https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=800&q=80",
    "https://images.unsplash.com/photo-1578683010236-d716f9a3f461?w=800&q=80",
  ],
  SUITE_401: [
    "https://images.unsplash.com/photo-1590490360182-c33d57733427?w=800&q=80",
    "https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=800&q=80",
  ],
  PENTHOUSE_501: [
    "https://images.unsplash.com/photo-1578683010236-d716f9a3f461?w=800&q=80",
    "https://images.unsplash.com/photo-1590490360182-c33d57733427?w=800&q=80",
    "https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=800&q=80",
  ],
  SINGLE_103: [
    "https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?w=800&q=80",
    "https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=800&q=80",
  ],
  DOUBLE_202: [
    "https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=800&q=80",
  ],
};

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

  // ── Rooms (with real images) ───────────────────────────────────────────────
  const rooms = await Promise.all([
    prisma.room.upsert({
      where: { number: "101" },
      update: { images: ROOM_IMAGES.SINGLE_101 },
      create: {
        number: "101", type: "SINGLE", status: "AVAILABLE",
        pricePerNight: 1500, floor: 1, capacity: 1,
        description: "Cozy single room with garden view and modern amenities.",
        amenities: ["WiFi", "AC", "TV"],
        images: ROOM_IMAGES.SINGLE_101,
      },
    }),
    prisma.room.upsert({
      where: { number: "102" },
      update: { images: ROOM_IMAGES.DOUBLE_102 },
      create: {
        number: "102", type: "DOUBLE", status: "AVAILABLE",
        pricePerNight: 2500, floor: 1, capacity: 2,
        description: "Spacious double room perfect for couples.",
        amenities: ["WiFi", "AC", "TV", "Coffee"],
        images: ROOM_IMAGES.DOUBLE_102,
      },
    }),
    prisma.room.upsert({
      where: { number: "201" },
      update: { images: ROOM_IMAGES.DOUBLE_201 },
      create: {
        number: "201", type: "DOUBLE", status: "OCCUPIED",
        pricePerNight: 2800, floor: 2, capacity: 2,
        description: "Premium double room with city view.",
        amenities: ["WiFi", "AC", "TV", "Coffee", "Minibar"],
        images: ROOM_IMAGES.DOUBLE_201,
      },
    }),
    prisma.room.upsert({
      where: { number: "301" },
      update: { images: ROOM_IMAGES.DELUXE_301 },
      create: {
        number: "301", type: "DELUXE", status: "AVAILABLE",
        pricePerNight: 4500, floor: 3, capacity: 3,
        description: "Deluxe room with panoramic mountain views and premium furniture.",
        amenities: ["WiFi", "AC", "TV", "Coffee", "Minibar", "Bathtub"],
        images: ROOM_IMAGES.DELUXE_301,
      },
    }),
    prisma.room.upsert({
      where: { number: "401" },
      update: { images: ROOM_IMAGES.SUITE_401 },
      create: {
        number: "401", type: "SUITE", status: "AVAILABLE",
        pricePerNight: 8000, floor: 4, capacity: 4,
        description: "Luxurious suite with separate living area and king-size bed.",
        amenities: ["WiFi", "AC", "TV", "Coffee", "Minibar", "Bathtub", "Jacuzzi"],
        images: ROOM_IMAGES.SUITE_401,
      },
    }),
    prisma.room.upsert({
      where: { number: "501" },
      update: { images: ROOM_IMAGES.PENTHOUSE_501 },
      create: {
        number: "501", type: "PENTHOUSE", status: "AVAILABLE",
        pricePerNight: 15000, floor: 5, capacity: 6,
        description: "The ultimate penthouse experience with 360° views and private terrace.",
        amenities: ["WiFi", "AC", "TV", "Coffee", "Minibar", "Bathtub", "Jacuzzi", "Private Terrace"],
        images: ROOM_IMAGES.PENTHOUSE_501,
      },
    }),
    prisma.room.upsert({
      where: { number: "103" },
      update: { images: ROOM_IMAGES.SINGLE_103 },
      create: {
        number: "103", type: "SINGLE", status: "CLEANING",
        pricePerNight: 1500, floor: 1, capacity: 1,
        description: "Single room with work desk, ideal for solo business travelers.",
        amenities: ["WiFi", "AC", "TV", "Work Desk"],
        images: ROOM_IMAGES.SINGLE_103,
      },
    }),
    prisma.room.upsert({
      where: { number: "202" },
      update: { images: ROOM_IMAGES.DOUBLE_202 },
      create: {
        number: "202", type: "DOUBLE", status: "MAINTENANCE",
        pricePerNight: 2600, floor: 2, capacity: 2,
        description: "Double room undergoing scheduled maintenance.",
        amenities: ["WiFi", "AC", "TV"],
        images: ROOM_IMAGES.DOUBLE_202,
      },
    }),
  ]);

  console.log(`✅ ${rooms.length} rooms created/updated with images`);

  // ── Sample bookings ─────────────────────────────────────────────────────────
  const today = new Date();
  const tomorrow = new Date(today); tomorrow.setDate(today.getDate() + 1);
  const nextWeek = new Date(today); nextWeek.setDate(today.getDate() + 7);

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
