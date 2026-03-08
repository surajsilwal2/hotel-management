import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { z } from "zod";

const updateStatusSchema = z.object({
  status: z.enum(["AVAILABLE", "OCCUPIED", "CLEANING", "MAINTENANCE"]),
  notes: z.string().optional(),
});

// PATCH /api/staff/rooms/[id]/status — staff + admin
export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !["ADMIN", "STAFF"].includes((session.user as any).role)) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 403 });
    }

    const body = await req.json();
    const parsed = updateStatusSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ success: false, error: parsed.error.errors[0].message }, { status: 400 });
    }

    const { status, notes } = parsed.data;
    const userId = (session.user as any).id;

    // Update room + create audit log in a transaction
    const [room] = await prisma.$transaction([
      prisma.room.update({
        where: { id: params.id },
        data: { status },
      }),
      prisma.roomStatusLog.create({
        data: {
          roomId: params.id,
          status,
          updatedBy: userId,
          notes: notes || `Status manually updated to ${status}`,
        },
      }),
    ]);

    return NextResponse.json({
      success: true,
      data: room,
      message: `Room status updated to ${status}`,
    });
  } catch (error) {
    console.error("[STAFF_ROOM_STATUS_PATCH]", error);
    return NextResponse.json({ success: false, error: "Failed to update room status" }, { status: 500 });
  }
}
