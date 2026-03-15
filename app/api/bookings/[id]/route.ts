import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { z } from "zod";

const updateStatusSchema = z.object({
  status: z.enum(["CONFIRMED", "CHECKED_IN", "CHECKED_OUT", "CANCELLED"]),
  notes: z.string().optional(),
});

// GET /api/bookings/[id]
export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });

    const user = session.user as any;
    const booking = await prisma.booking.findUnique({
      where: { id: params.id },
      include: {
        user: { select: { id: true, name: true, email: true, phone: true } },
        // Only return full room details (including images) for admin/staff viewers.
        room: (session.user as any).role === "ADMIN" || (session.user as any).role === "STAFF"
          ? true
          : { select: { id: true, number: true, type: true, floor: true } },
      },
    });

    if (!booking) return NextResponse.json({ success: false, error: "Booking not found" }, { status: 404 });

    // Guests can only view their own bookings
    if (user.role === "GUEST" && booking.userId !== user.id) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 403 });
    }

    return NextResponse.json({ success: true, data: booking });
  } catch (error) {
    console.error("[BOOKING_GET]", error);
    return NextResponse.json({ success: false, error: "Failed to fetch booking" }, { status: 500 });
  }
}

// PATCH /api/bookings/[id] — update status
export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });

    const user = session.user as any;
    const body = await req.json();
    const parsed = updateStatusSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ success: false, error: parsed.error.errors[0].message }, { status: 400 });
    }

    const booking = await prisma.booking.findUnique({
      where: { id: params.id },
      include: { room: true },
    });

    if (!booking) return NextResponse.json({ success: false, error: "Booking not found" }, { status: 404 });

    const { status } = parsed.data;

    // Permission checks
    if (user.role === "GUEST") {
      // Guests can only cancel their own pending bookings
      if (booking.userId !== user.id) {
        return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 403 });
      }
      if (status !== "CANCELLED") {
        return NextResponse.json({ success: false, error: "Guests can only cancel bookings" }, { status: 403 });
      }
      if (!["PENDING", "CONFIRMED"].includes(booking.status)) {
        return NextResponse.json(
          { success: false, error: "Only pending or confirmed bookings can be cancelled" },
          { status: 400 }
        );
      }
    }

    // Admin/Staff — handle room status changes automatically
    let roomStatusUpdate: any = undefined;

    if (["ADMIN", "STAFF"].includes(user.role)) {
      if (status === "CHECKED_IN") {
        roomStatusUpdate = { status: "OCCUPIED" };
      } else if (status === "CHECKED_OUT") {
        roomStatusUpdate = { status: "CLEANING" }; // Needs cleaning after checkout
      } else if (status === "CANCELLED") {
        roomStatusUpdate = { status: "AVAILABLE" };
      }
    }

    // Run booking update + room status update in a transaction
    const [updatedBooking] = await prisma.$transaction([
      prisma.booking.update({
        where: { id: params.id },
        data: { status },
        include: {
          user: { select: { name: true, email: true } },
          room: { select: { number: true, type: true } },
        },
      }),
      ...(roomStatusUpdate
        ? [
            prisma.room.update({ where: { id: booking.roomId }, data: roomStatusUpdate }),
            prisma.roomStatusLog.create({
              data: {
                roomId: booking.roomId,
                status: roomStatusUpdate.status,
                updatedBy: user.id,
                notes: `Auto-updated on booking ${status.toLowerCase()}`,
              },
            }),
          ]
        : []),
    ]);

    return NextResponse.json({ success: true, data: updatedBooking });
  } catch (error) {
    console.error("[BOOKING_PATCH]", error);
    return NextResponse.json({ success: false, error: "Failed to update booking" }, { status: 500 });
  }
}
