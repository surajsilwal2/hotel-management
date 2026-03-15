import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { z } from "zod";

const createRoomSchema = z.object({
  number: z.string().min(1),
  type: z.enum(["SINGLE", "DOUBLE", "DELUXE", "SUITE", "PENTHOUSE"]),
  pricePerNight: z.number().positive(),
  floor: z.number().int().positive(),
  capacity: z.number().int().positive().default(2),
  description: z.string().optional(),
  amenities: z.array(z.string()).default([]),
  images: z.array(z.string()).default([]),
});

// GET /api/rooms — public, returns available rooms (or all for admin/staff)
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const { searchParams } = new URL(req.url);

    const type = searchParams.get("type");
    const status = searchParams.get("status");
    const minPrice = searchParams.get("minPrice");
    const maxPrice = searchParams.get("maxPrice");

    const isAdminOrStaff =
      session?.user && ["ADMIN", "STAFF"].includes((session.user as any).role);

    // Only include a status filter when a specific status (not 'all') is requested
    const statusFilter = status && status !== "all" ? status : undefined;

    // Include active upcoming bookings (CONFIRMED / CHECKED_IN) so UI can display booking ranges
    // For guests, only select essential room fields (avoid pulling full images array). Admins/staff get full room rows.
    const rooms = await prisma.room.findMany({
      where: {
        // Guests only see available rooms; staff/admin see all
        ...(!isAdminOrStaff && { status: "AVAILABLE" }),
        ...(type && { type: type as any }),
        ...(statusFilter && isAdminOrStaff && { status: statusFilter as any }),
        ...(minPrice && { pricePerNight: { gte: parseFloat(minPrice) } }),
        ...(maxPrice && { pricePerNight: { lte: parseFloat(maxPrice) } }),
      },
      // Use `select` to avoid fetching heavy fields for guest viewers
      select: isAdminOrStaff
        ? {
            id: true,
            number: true,
            type: true,
            status: true,
            pricePerNight: true,
            floor: true,
            capacity: true,
            description: true,
            amenities: true,
            images: true,
            createdAt: true,
            updatedAt: true,
            bookings: {
              where: {
                status: { in: ["CONFIRMED", "CHECKED_IN"] },
                checkOut: { gte: new Date() },
              },
              select: { checkIn: true, checkOut: true, status: true, user: { select: { id: true, name: true, email: true } } },
              orderBy: { checkIn: "asc" },
            },
          }
        : {
            id: true,
            number: true,
            type: true,
            status: true,
            pricePerNight: true,
            floor: true,
            capacity: true,
            description: true,
            amenities: true,
            // do NOT select images here to avoid transferring large arrays from DB; we'll synthesize a thumbnail from images if needed
            createdAt: true,
            updatedAt: true,
            bookings: {
              where: {
                status: { in: ["CONFIRMED", "CHECKED_IN"] },
                checkOut: { gte: new Date() },
              },
              select: { checkIn: true, checkOut: true, status: true },
              orderBy: { checkIn: "asc" },
            },
          },
      orderBy: [{ floor: "asc" }, { number: "asc" }],
    });

    // For privacy, remove booking user details for non-admin/staff viewers
    const safeRooms = rooms.map((r) => {
      // For guest viewers, hide booking user info and only send the first image as a thumbnail
      if (!isAdminOrStaff) {
        // images may not be selected for guest queries, so guard access and normalize
        const imagesAvailable = "images" in r && Array.isArray((r as any).images) ? (r as any).images : [];
        return {
          ...r,
          bookings: r.bookings?.map((b: any) => ({ checkIn: b.checkIn, checkOut: b.checkOut, status: b.status })) || [],
          images: imagesAvailable.length > 0 ? [imagesAvailable[0]] : [],
        };
      }
      // Admin/Staff get full room object (including all images and booking user details)
      return r;
    });

    return NextResponse.json({ success: true, data: safeRooms });
  } catch (error) {
    console.error("[ROOMS_GET]", error);
    return NextResponse.json({ success: false, error: "Failed to fetch rooms" }, { status: 500 });
  }
}

// POST /api/rooms — admin only
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || (session.user as any).role !== "ADMIN") {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 403 });
    }

    const body = await req.json();
    const parsed = createRoomSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: parsed.error.errors[0].message },
        { status: 400 }
      );
    }

    // Check room number uniqueness
    const existing = await prisma.room.findUnique({ where: { number: parsed.data.number } });
    if (existing) {
      return NextResponse.json(
        { success: false, error: `Room number ${parsed.data.number} already exists` },
        { status: 409 }
      );
    }

    const room = await prisma.room.create({ data: parsed.data });

    return NextResponse.json({ success: true, data: room }, { status: 201 });
  } catch (error) {
    console.error("[ROOMS_POST]", error);
    return NextResponse.json({ success: false, error: "Failed to create room" }, { status: 500 });
  }
}
