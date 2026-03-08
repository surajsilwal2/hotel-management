import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { z } from "zod";

const updateRoomSchema = z.object({
  type: z.enum(["SINGLE", "DOUBLE", "DELUXE", "SUITE", "PENTHOUSE"]).optional(),
  pricePerNight: z.number().positive().optional(),
  floor: z.number().int().positive().optional(),
  capacity: z.number().int().positive().optional(),
  description: z.string().optional(),
  amenities: z.array(z.string()).optional(),
  images: z.array(z.string()).optional(),
  status: z.enum(["AVAILABLE", "OCCUPIED", "CLEANING", "MAINTENANCE"]).optional(),
});

// GET /api/rooms/[id]
export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const room = await prisma.room.findUnique({
      where: { id: params.id },
      include: {
        bookings: {
          where: {
            status: { in: ["CONFIRMED", "CHECKED_IN"] },
            checkOut: { gte: new Date() },
          },
          select: { checkIn: true, checkOut: true, status: true },
        },
      },
    });

    if (!room) {
      return NextResponse.json({ success: false, error: "Room not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: room });
  } catch (error) {
    console.error("[ROOM_GET]", error);
    return NextResponse.json({ success: false, error: "Failed to fetch room" }, { status: 500 });
  }
}

// PUT /api/rooms/[id] — admin only
export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || (session.user as any).role !== "ADMIN") {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 403 });
    }

    const body = await req.json();
    const parsed = updateRoomSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: parsed.error.errors[0].message },
        { status: 400 }
      );
    }

    const room = await prisma.room.update({
      where: { id: params.id },
      data: parsed.data,
    });

    return NextResponse.json({ success: true, data: room });
  } catch (error) {
    console.error("[ROOM_PUT]", error);
    return NextResponse.json({ success: false, error: "Failed to update room" }, { status: 500 });
  }
}

// DELETE /api/rooms/[id] — admin only
export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || (session.user as any).role !== "ADMIN") {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 403 });
    }

    // Check for active bookings
    const activeBooking = await prisma.booking.findFirst({
      where: {
        roomId: params.id,
        status: { in: ["CONFIRMED", "CHECKED_IN"] },
      },
    });

    if (activeBooking) {
      return NextResponse.json(
        { success: false, error: "Cannot delete room with active bookings" },
        { status: 409 }
      );
    }

    await prisma.room.delete({ where: { id: params.id } });

    return NextResponse.json({ success: true, message: "Room deleted successfully" });
  } catch (error) {
    console.error("[ROOM_DELETE]", error);
    return NextResponse.json({ success: false, error: "Failed to delete room" }, { status: 500 });
  }
}
