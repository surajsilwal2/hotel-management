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

    const rooms = await prisma.room.findMany({
      where: {
        // Guests only see available rooms; staff/admin see all
        ...(!isAdminOrStaff && { status: "AVAILABLE" }),
        ...(type && { type: type as any }),
        ...(status && isAdminOrStaff && { status: status as any }),
        ...(minPrice && { pricePerNight: { gte: parseFloat(minPrice) } }),
        ...(maxPrice && { pricePerNight: { lte: parseFloat(maxPrice) } }),
      },
      orderBy: [{ floor: "asc" }, { number: "asc" }],
    });

    return NextResponse.json({ success: true, data: rooms });
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
