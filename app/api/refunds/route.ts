import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

// POST /api/refunds — create a refund request (guest or staff can create)
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });

    const { bookingId, reason } = await req.json();
    if (!bookingId) return NextResponse.json({ success: false, error: "bookingId is required" }, { status: 400 });

    const booking = await prisma.booking.findUnique({ where: { id: bookingId } });
    if (!booking) return NextResponse.json({ success: false, error: "Booking not found" }, { status: 404 });

    // Only booking owner or staff can create a refund request
    const user = session.user as any;
    if (user.role === "GUEST" && booking.userId !== user.id) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 403 });
    }

    // Create refund request
    const fr = await prisma.refundRequest.create({
      data: {
        bookingId,
        requestedBy: user.id,
        reason,
        status: "PENDING",
      },
    });

    return NextResponse.json({ success: true, data: fr, message: "Refund request submitted" });
  } catch (error) {
    console.error("[REFUNDS_POST]", error);
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}

// GET /api/refunds — list refund requests (admin/staff sees all, guest sees own)
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });

    const user = session.user as any;
    const isAdmin = ["ADMIN", "STAFF"].includes(user.role);

    const refunds = await prisma.refundRequest.findMany({
      where: isAdmin ? {} : { requestedBy: user.id },
      orderBy: { createdAt: "desc" },
      include: { booking: { include: { user: { select: { name: true, email: true } }, room: { select: { number: true } } } } },
    });

    return NextResponse.json({ success: true, data: refunds });
  } catch (error) {
    console.error("[REFUNDS_GET]", error);
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}

// PATCH /api/refunds — admin can update refund request status (APPROVED, REJECTED, PROCESSED)
export async function PATCH(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !["ADMIN", "STAFF"].includes((session.user as any).role)) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 403 });
    }

    const { id, status } = await req.json();
    if (!id || !status) return NextResponse.json({ success: false, error: "id and status are required" }, { status: 400 });

    const allowed = ["APPROVED", "REJECTED", "PROCESSED"];
    if (!allowed.includes(status)) return NextResponse.json({ success: false, error: "Invalid status" }, { status: 400 });

    const rr = await prisma.refundRequest.update({ where: { id }, data: { status } });

    return NextResponse.json({ success: true, data: rr });
  } catch (error) {
    console.error("[REFUNDS_PATCH]", error);
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}
