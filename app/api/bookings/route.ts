import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { checkBookingConflict, calculateTotalPrice } from "@/lib/booking";
import { z } from "zod";

const createBookingSchema = z.object({
  roomId: z.string(),
  checkIn: z.string().datetime(),
  checkOut: z.string().datetime(),
  adults: z.number().int().min(1).default(1),
  children: z.number().int().min(0).default(0),
  notes: z.string().optional().nullable(),
  // FNMIS fields
  guestNationality: z.string().optional().nullable(),
  passportNumber:   z.string().optional().nullable(),
  purposeOfVisit:   z.string().optional().nullable(),
}).refine(
  (data) => new Date(data.checkOut) > new Date(data.checkIn),
  { message: "Check-out must be after check-in" }
);

// GET /api/bookings — fetch bookings (guests see own, admin/staff see all)
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const user = session.user as any;
    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status");
  const page = Math.max(1, parseInt(searchParams.get("page") || "1"));
  let limit = Math.max(1, parseInt(searchParams.get("limit") || "10"));
  // enforce an upper cap to avoid huge responses
  const MAX_LIMIT = 100;
  if (limit > MAX_LIMIT) limit = MAX_LIMIT;

    const isAdminOrStaff = ["ADMIN", "STAFF"].includes(user.role);

    const bookings = await prisma.booking.findMany({
      where: {
        // Guests only see their own bookings
        ...(!isAdminOrStaff && { userId: user.id }),
        ...(status && { status: status as any }),
      },
      include: {
        user: { select: { id: true, name: true, email: true, phone: true } },
        // avoid sending room images in listing to keep payload small
        room: { select: { id: true, number: true, type: true, floor: true } },
      },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    });

    const total = await prisma.booking.count({
      where: {
        ...(!isAdminOrStaff && { userId: user.id }),
        ...(status && { status: status as any }),
      },
    });

    return NextResponse.json({
      success: true,
      data: bookings,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  } catch (error) {
    console.error("[BOOKINGS_GET]", error);
    return NextResponse.json({ success: false, error: "Failed to fetch bookings" }, { status: 500 });
  }
}

// POST /api/bookings — authenticated users can create bookings
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ success: false, error: "Login required to make a booking" }, { status: 401 });
    }

    const body = await req.json();
    const parsed = createBookingSchema.safeParse(body);

    if (!parsed.success) {
      // Return structured zod error details (path + message) to help debugging client input
      const zodErrors = parsed.error.errors.map((e) => ({ path: e.path, message: e.message }));
      return NextResponse.json(
        { success: false, error: "Validation failed", details: zodErrors },
        { status: 400 }
      );
    }

    const { roomId, checkIn, checkOut, adults, children, notes } = parsed.data;
    const checkInDate = new Date(checkIn);
    const checkOutDate = new Date(checkOut);

    // Validate check-in is not in the past
    if (checkInDate < new Date()) {
      return NextResponse.json(
        { success: false, error: "Check-in date cannot be in the past" },
        { status: 400 }
      );
    }

    // Verify room exists and is available
    const room = await prisma.room.findUnique({ where: { id: roomId } });
    if (!room) {
      return NextResponse.json({ success: false, error: "Room not found" }, { status: 404 });
    }
    if (room.status !== "AVAILABLE") {
      return NextResponse.json(
        { success: false, error: `Room ${room.number} is currently ${room.status.toLowerCase()}` },
        { status: 409 }
      );
    }

    // ── BOOKING CONFLICT ALGORITHM ─────────────────────────────────────────────
    const hasConflict = await checkBookingConflict(roomId, checkInDate, checkOutDate);
    if (hasConflict) {
      return NextResponse.json(
        {
          success: false,
          error: `Room ${room.number} is already booked for the selected dates. Please choose different dates or a different room.`,
        },
        { status: 409 }
      );
    }
    // ──────────────────────────────────────────────────────────────────────────

    const totalPrice = calculateTotalPrice(room.pricePerNight, checkInDate, checkOutDate);
    const userId = (session.user as any).id;

    const booking = await prisma.booking.create({
      data: {
        userId,
        roomId,
        checkIn: checkInDate,
        checkOut: checkOutDate,
        status: "PENDING",
        totalPrice,
        adults,
        children,
        notes,
        guestNationality: parsed.data.guestNationality,
        passportNumber:   parsed.data.passportNumber,
        purposeOfVisit:   parsed.data.purposeOfVisit,
      },
      include: {
        room: { select: { number: true, type: true, floor: true } },
        user: { select: { name: true, email: true } },
      },
    });

    return NextResponse.json(
      { success: true, data: booking, message: "Booking created successfully! Awaiting confirmation." },
      { status: 201 }
    );
  } catch (error) {
    console.error("[BOOKINGS_POST]", error);
    return NextResponse.json({ success: false, error: "Failed to create booking" }, { status: 500 });
  }
}
